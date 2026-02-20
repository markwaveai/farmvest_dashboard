import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Search,
    ChevronRight,
    ChevronDown,
    Activity,
    Heart,
    Baby,
    TrendingUp,
    Milk,
    Plus,
    X,
    Info,
    Loader2,
    AlertTriangle,
    Users,
    Tag,
    MapPin,
    Building2,
    LayoutGrid,
    Filter
} from 'lucide-react';
import './Buffalo.css';
import { farmvestService } from '../services/farmvest_api';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';
import CustomDropdown from '../components/common/CustomDropdown';

interface Buffalo {
    animalId: string;
    tagNo: string;
    breed: string;
    age: number;
    age_months: number;
    gender: string;
    location: string;
    farm: string;
    shed: string;
    position: string;
    status: string;
    type: 'BUFFALO' | 'CALF' | string;
    lactationStage: string;
    healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor' | string;
    pregnancyStatus: 'Pregnant' | 'Not Pregnant' | 'N/A' | string;
    milkYield: number;
    lastVetVisit: string;
    associated_calves?: any[];
}

const BuffaloManagement: React.FC = () => {
    const [selectedBuffalo, setSelectedBuffalo] = useState<Buffalo | null>(null);
    const [calves, setCalves] = useState<any[]>([]);
    const [isCalvesLoading, setIsCalvesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'pregnant' | 'sick' | 'high_yield' | 'buffalo' | 'calf'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rawBuffaloData, setRawBuffaloData] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [locations, setLocations] = useState<string[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [shedsList, setShedsList] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('All');
    const [selectedFarm, setSelectedFarm] = useState<string>('All');
    const [selectedShed, setSelectedShed] = useState<string>('All');
    const [allocationStatus, setAllocationStatus] = useState<'All' | 'Allocated' | 'Unallocated'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    // Additional Data for Stats
    const [milkEntries, setMilkEntries] = useState<any[]>([]);

    // Lookup Maps
    const [allFarmsMap, setAllFarmsMap] = useState<Record<string, any>>({});
    const [allShedsMap, setAllShedsMap] = useState<Record<string, any>>({});

    const isInitialMount = useRef(true);
    const hasInitialFetched = useRef(false);

    // 0. Transform Raw API Data to UI Model (Buffalo Interface)
    // This is a MEMO, not a state-setter effect, to prevent re-fetching when mapping dependencies change
    const buffaloList = useMemo(() => {
        const seenIds = new Set();
        const mappedData: Buffalo[] = [];

        rawBuffaloData.forEach((a: any, index: number) => {
            // Extract unique Tag ID with extensive fallbacks
            let tagId = a.rfid_tag || a.rfid_tag_number || a.rfid_no || a.rfidTag || a.rfid ||
                a.tag || a.tag_no || a.tagNo || a.tag_id || a.TagId || a.tag_number ||
                a.animal_tag || a.animal_id || a.id;

            // Auto-detect if still missing
            if (!tagId || tagId === 'N/A' || tagId === undefined) {
                const autoKey = Object.keys(a).find(k => {
                    const lowerK = k.toLowerCase();
                    return (lowerK.includes('tag') || lowerK.includes('rfid')) &&
                        a[k] && (typeof a[k] === 'string' || typeof a[k] === 'number');
                });
                if (autoKey) tagId = a[autoKey];
            }

            if ((!tagId || tagId === 'N/A') && a.animal_id) tagId = a.animal_id;

            if ((!tagId || tagId === 'N/A') && searchQuery.trim() !== '') {
                const q = searchQuery.trim().toLowerCase();
                const matchingValue = Object.values(a).find(val =>
                    typeof val === 'string' && val.toLowerCase() === q
                );
                if (matchingValue) tagId = String(matchingValue);
                else tagId = searchQuery.trim();
            }

            tagId = tagId || 'N/A';
            const animalId = String(a.animal_id || a.id || (tagId !== 'N/A' ? tagId : `ANIMAL-${index}`));

            if (seenIds.has(animalId)) return;
            seenIds.add(animalId);

            const months = Number(a.age_months || a.age_in_months || a.animal_age_months || 0);
            const years = Number(a.age || a.animal_age || 0);

            const safeStr = (val: any) => {
                if (!val) return null;
                if (typeof val === 'string') return val;
                return val.name || val.location_name || val.farm_name || val.shed_name || val.id || '-';
            };

            const resolveFarmName = (fId: any) => {
                if (!fId) return null;
                const f = allFarmsMap[String(fId)];
                return f ? f.farm_name : null;
            };

            const resolveLocationName = (fId: any) => {
                if (!fId) return null;
                const f = allFarmsMap[String(fId)];
                return f ? (f.location || f.location_name) : null;
            };

            let loc = a.location_name || (typeof a.location === 'string' && a.location !== '-' ? a.location : (a.location?.location_name || a.location?.name || a.location?.location));
            if (loc && /^\d+$/.test(String(loc))) loc = null;

            if (!loc) {
                loc = a.farm_details?.location || a.farm_details?.location_name || a.location_details?.location || a.location_details?.location_name;
            }

            if ((!loc || loc === '-' || loc === 'N/A') && (a.farm_id || a.farmId || a.farm)) {
                const fId = (typeof a.farm === 'object') ? (a.farm.id || a.farm.farm_id) : (a.farm_id || a.farmId || a.farm);
                const resolvedLoc = resolveLocationName(fId);
                if (resolvedLoc) loc = resolvedLoc;
            }
            if (!loc) loc = '-';

            let farmInfo = a.farm_name || a.FarmName || (typeof a.farm === 'string' ? a.farm : safeStr(a.farm)) ||
                (a.farm_details && safeStr(a.farm_details.farm_name)) ||
                (a.Farm && safeStr(a.Farm.farm_name));

            if ((!farmInfo || farmInfo === '-') && (a.farm_id || a.farmId)) {
                const resolvedFarm = resolveFarmName(a.farm_id || a.farmId);
                if (resolvedFarm) farmInfo = resolvedFarm;
            }
            if (!farmInfo) farmInfo = '-';

            let shedInfo = a.shed_name || a.ShedNo || (typeof a.shed === 'string' ? a.shed : safeStr(a.shed)) ||
                (a.shed_details && safeStr(a.shed_details.shed_name));

            if (shedsList.length > 0 && (a.shed_id || a.shedId)) {
                const foundShed = shedsList.find(s => String(s.id || s.shed_id || s.shedId) === String(a.shed_id || a.shedId));
                if (foundShed) shedInfo = foundShed.shed_name || foundShed.shed_id;
            }

            if (!shedInfo || shedInfo === '-' || shedInfo === 'N/A') {
                const sId = a.shed_id || a.shedId;
                shedInfo = (sId && sId !== 0 && sId !== '0') ? `Shed #${sId}` : '-';
            }

            const normalizePregnancy = (val: any, isPreg: any) => {
                const v = String(val || '').toLowerCase();
                if (isPreg === true || isPreg === 1 || String(isPreg) === '1' || String(isPreg).toLowerCase() === 'true') return 'Pregnant';
                if (v.includes('preg') || v === '1' || v === 'true' || v === 'yes' || v === 'positive' || v === 'confirmed') return 'Pregnant';
                return 'Not Pregnant';
            };

            const normalizeHealth = (val: any) => {
                const v = String(val || '').toUpperCase();
                if (['HEALTHY', 'EXCELLENT', 'GOOD', 'NORMAL', 'OK'].includes(v)) return 'Excellent';
                if (['SICK', 'POOR', 'FAIR', 'CRITICAL', 'INJURED', 'UNDER TREATMENT', 'BAD', 'WEAK'].includes(v)) return 'Poor';
                return 'Good';
            };

            const pStatus = normalizePregnancy(a.pregnancy_status || a.pregnancyStatus || a.reproduction_status, a.is_pregnant);
            const hStatus = normalizeHealth(a.health_status || a.healthStatus || a.health);

            let mYield = Number(a.milk_yield || a.average_yield || a.last_yield || a.yield || a.current_yield || a.total_milk || 0);

            if (mYield === 0 && milkEntries.length > 0) {
                const entry = milkEntries.find((m: any) =>
                    String(m.animal_id) === String(animalId) ||
                    String(m.tag_number || m.tag_no) === String(tagId)
                );
                if (entry) mYield = Number(entry.milk_yield || entry.yield || entry.quantity || 0);
            }

            mappedData.push({
                animalId,
                tagNo: tagId,
                breed: a.breed_name || a.breed || a.breed_id || a.animal_breed || 'Murrah',
                age: Math.floor(months / 12) || years || 1,
                age_months: months || (years * 12) || 0,
                gender: a.gender || a.sex || a.animal_gender || 'Female',
                location: loc,
                farm: farmInfo,
                shed: shedInfo,
                position: a.position || a.parking_id || a.parking_tag || '-',
                status: (() => {
                    const s = String(a.active_status || a.status || a.animal_status || a.animal_active_status || '').toLowerCase();
                    if (s === 'active' || s === 'true' || s === '1' || s.includes('excel')) return 'Active';
                    if (s === 'inactive' || s === 'false' || s === '0' || s.includes('sick') || s.includes('poor')) return 'Poor';
                    return 'Active';
                })(),
                type: (() => {
                    const rawType = String(a.animal_type || a.type || a.role || a.category || '').toUpperCase();
                    if (rawType.includes('CALF') || a.is_calf === true || a.is_calf === 1 || String(a.is_calf).toLowerCase() === 'true') return 'CALF';
                    return 'BUFFALO';
                })(),
                lactationStage: a.lactation_stage || a.lactation || a.lactationStage || '-',
                healthStatus: hStatus,
                pregnancyStatus: pStatus,
                milkYield: mYield,
                lastVetVisit: a.last_vet_check || a.last_vet_visit || a.last_visit || '-',
                associated_calves: a.associated_calves || a.calves || a.calf_list || []
            });
        });

        return mappedData;
    }, [rawBuffaloData, allFarmsMap, milkEntries, shedsList, searchQuery]);

    // 1. Base Filtered List: Applies primary filters (Search, Location, Farm, Shed)
    // This list is the source of truth for both the Stats and the Final Filtered View
    const baseFilteredList = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return buffaloList.filter(b => {
            // Priority 1: Search Query Match (Global Search)
            // If the user is searching, prioritize matches in multiple fields
            if (query.length >= 1) {
                const tagNo = String(b.tagNo || '').toLowerCase();
                const animalId = String(b.animalId || '').toLowerCase();
                const breed = String(b.breed || '').toLowerCase();
                const loc = String(b.location || '').toLowerCase();
                const farm = String(b.farm || '').toLowerCase();

                if (tagNo.includes(query) ||
                    animalId.includes(query) ||
                    breed.includes(query) ||
                    loc.includes(query) ||
                    farm.includes(query)) return true;
            }

            // Priority 2: Location/Farm/Shed Filters (Only if searching is not active or match not found in Priority 1)
            // This allows the table to still strictly show farm data when not searching

            // Location Filter (Case Insensitive)
            if (selectedLocation !== 'All' && !(b.location || '').toLowerCase().trim().includes(selectedLocation.toLowerCase().trim()) && b.location !== selectedLocation) return false;

            // Farm Filter (Case Insensitive)
            if (selectedFarm !== 'All' && !(b.farm || '').toLowerCase().includes(selectedFarm.toLowerCase()) && b.farm !== selectedFarm) return false;

            // Priority 3: Shed Filter
            if (selectedShed !== 'All') {
                const bShed = String(b.shed || '').trim().toLowerCase();
                if (!bShed.includes(selectedShed.toLowerCase())) {
                    return false;
                }
            }

            // Priority 4: Allocation Status Filter
            if (allocationStatus !== 'All') {
                const hasShed = b.shed;
                const isAllocated = hasShed && String(hasShed).trim() !== '' && String(hasShed) !== '-';

                if (allocationStatus === 'Allocated' && !isAllocated) {
                    return false;
                }
                if (allocationStatus === 'Unallocated' && isAllocated) {
                    return false;
                }
            }

            return true;
        });
    }, [buffaloList, searchQuery, selectedLocation, selectedFarm, selectedShed, allocationStatus]);

    // 2. Final Filtered List: Applies secondary filters (Specific Status/Type from grid boxes)
    const filteredBuffaloes = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return baseFilteredList.filter(b => {
            // Global Search Bypass: If the animal directly matches the search query, 
            // we show it regardless of the active categorical filter (Buffalo/Calf/etc.)
            if (query.length >= 1) {
                const tagNo = String(b.tagNo || b.animalId || '').toLowerCase();
                if (tagNo.includes(query)) return true;

                // Also check other fields for bypass if they match search exactly
                if (String(b.breed || '').toLowerCase().includes(query)) return true;
            }

            // Apply activeFilter (Secondary filtering on top of base list)
            if (activeFilter === 'all') return true;

            // Type filters
            if (activeFilter === 'buffalo' && b.type !== 'BUFFALO') return false;
            if (activeFilter === 'calf' && b.type !== 'CALF') return false;

            // Special status filters
            if (activeFilter === 'pregnant' && b.pregnancyStatus !== 'Pregnant') return false;
            if (activeFilter === 'sick') {
                const v = (b.healthStatus || '').toUpperCase();
                if (!['POOR', 'SICK', 'FAIR', 'CRITICAL', 'UNDERCARE'].includes(v)) return false;
            }
            if (activeFilter === 'high_yield' && b.milkYield <= 15) return false;

            return true;
        });
    }, [baseFilteredList, activeFilter, searchQuery]);

    // 3. Paginated List: Slice the filtered results for the current page
    const paginatedBuffaloes = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredBuffaloes.slice(startIndex, startIndex + pageSize);
    }, [filteredBuffaloes, currentPage, pageSize]);

    // Reset page to 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter, selectedLocation, selectedFarm, selectedShed]);


    // Live Search Effect - Handles fetching raw data
    useEffect(() => {
        const fetchBuffalo = async () => {
            // Protect against redundant initial mounts in StrictMode
            if (hasInitialFetched.current && isInitialMount.current) return;
            if (isInitialMount.current) hasInitialFetched.current = true;

            setError(null);
            setIsLoading(true);
            try {
                let response;
                if (searchQuery.trim() === '') {
                    const farmId = selectedFarm !== 'All' ? farms.find(f => (f.farm_name || f.name) === selectedFarm)?.id : undefined;
                    const shedId = selectedShed !== 'All' ? shedsList.find(s => (s.shed_name || s.shed_id) === selectedShed)?.id : undefined;

                    response = await farmvestService.getTotalAnimals(farmId, shedId, 1, 15);
                } else {
                    response = await farmvestService.searchAnimal(searchQuery.trim());
                }

                if (response) {
                    let rawData: any[] = [];
                    if (Array.isArray(response)) {
                        rawData = response;
                    } else if (response.data && Array.isArray(response.data)) {
                        rawData = response.data;
                    } else if (response.animals && Array.isArray(response.animals)) {
                        rawData = response.animals;
                    } else if (response.data && response.data.animals && Array.isArray(response.data.animals)) {
                        rawData = response.data.animals;
                    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                        rawData = response.data.data;
                    } else if (response.data && Array.isArray(response.data.unallocated_animals)) {
                        rawData = response.data.unallocated_animals;
                    } else if (response.animal_id || response.rfid_tag || response.tag_no || response.rfid_tag_number || response.rfid || response.tag_id || response.TagNo) {
                        rawData = [response];
                    } else if (response.data && (response.data.animal_id || response.data.rfid_tag || response.data.tag_no || response.data.rfid_tag_number || response.data.rfid)) {
                        rawData = [response.data];
                    } else if (response.animal && (typeof response.animal === 'object')) {
                        rawData = [response.animal];
                    } else if (response.animal_details && (typeof response.animal_details === 'object')) {
                        rawData = [response.animal_details];
                    } else {
                        const possibleArray = Object.values(response).find(val => Array.isArray(val));
                        if (possibleArray) rawData = possibleArray as any[];
                    }

                    setRawBuffaloData(rawData);
                    const apiCount = response.animals_count ?? (response.data && !Array.isArray(response.data) ? response.data.animals_count : (response.count ?? rawData.length));
                    setTotalCount(Number(apiCount));

                    // Auto-open if exact match
                    if (searchQuery.trim().length >= 4) {
                        const exactMatch = buffaloList.find((b: Buffalo) =>
                            b.tagNo.toLowerCase() === searchQuery.trim().toLowerCase()
                        );
                        if (exactMatch) {
                            setSelectedBuffalo(exactMatch);
                        }
                    }
                } else {
                    setRawBuffaloData([]);
                    setTotalCount(0);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch buffalo data');
            } finally {
                setIsLoading(false);
                if (isInitialMount.current) {
                    setTimeout(() => { isInitialMount.current = false; }, 100);
                }
            }
        };

        const debounce = setTimeout(fetchBuffalo, searchQuery.trim() === '' ? 0 : 500);
        return () => clearTimeout(debounce);
    }, [searchQuery, selectedFarm, selectedShed, selectedLocation]);

    // 4. Transform Raw API Data to UI Model (Buffalo Interface)
    // Combined Metadata Fetch (Farms, Locations, Milk Entries)
    useEffect(() => {
        const fetchInitialMetadata = async () => {
            // Already handled by component closure or refs if needed, but this only runs once on []
            try {
                // Fetch Locations
                const locResponse = await farmvestService.getLocations();
                if (locResponse && locResponse.data) {
                    const lArray = Array.isArray(locResponse.data) ? locResponse.data : Object.values(locResponse.data).filter(v => typeof v === 'string');
                    setLocations(lArray as string[]);
                }

                // Fetch All Farms (Lookup + Filter list)
                const farmsResponse = await farmvestService.getAllFarms({ size: 1000 });
                let allFarms: any[] = [];
                if (farmsResponse) {
                    allFarms = Array.isArray(farmsResponse) ? farmsResponse : (farmsResponse.farms || farmsResponse.data?.farms || farmsResponse.data || []);
                }
                setFarms(allFarms);

                const map: Record<string, any> = {};
                allFarms.forEach(f => {
                    const fid = String(f.id || f.farm_id);
                    if (fid) map[fid] = f;
                });
                setAllFarmsMap(map);

                // Fetch Milk Entries
                const milkResponse = await farmvestService.getMilkEntries({ page: 1, size: 1000 });
                setMilkEntries(Array.isArray(milkResponse) ? milkResponse : (milkResponse.data || []));

            } catch (err) {}
        };
        fetchInitialMetadata();
    }, []);


    // Fetch Sheds when farm changes
    useEffect(() => {
        const fetchSheds = async () => {
            if (selectedFarm === 'All') {
                setShedsList([]);
                setSelectedShed('All');
                return;
            }
            try {
                const farmId = farms.find(f => f.farm_name === selectedFarm)?.id || farms.find(f => f.farm_name === selectedFarm)?.farm_id;
                if (farmId) {
                    const shedResponse = await farmvestService.getShedsByFarm(farmId);
                    if (shedResponse) {
                        let shedData: any[] = [];
                        if (shedResponse.data && Array.isArray(shedResponse.data.sheds)) {
                            shedData = shedResponse.data.sheds;
                        } else if (Array.isArray(shedResponse.sheds)) {
                            shedData = shedResponse.sheds;
                        } else if (Array.isArray(shedResponse.data)) {
                            shedData = shedResponse.data;
                        } else if (Array.isArray(shedResponse)) {
                            shedData = shedResponse;
                        }
                        setShedsList(shedData);
                    }
                }
            } catch (err) {
                // Silent fail
            }
        };
        fetchSheds();
    }, [selectedFarm, farms]);

    // Fetch Calves Effect
    useEffect(() => {
        const fetchCalves = async () => {
            if (selectedBuffalo && selectedBuffalo.animalId !== 'N/A') {
                setIsCalvesLoading(true);
                try {
                    const response = await farmvestService.getCalves(selectedBuffalo.animalId);
                    setCalves(Array.isArray(response) ? response : (response.data || []));
                } catch (err) {
                    setCalves([]);
                } finally {
                    setIsCalvesLoading(false);
                }
            } else {
                setCalves([]);
            }
        };
        fetchCalves();
    }, [selectedBuffalo]);

    // Verify Global Counts from API
    const [globalStats, setGlobalStats] = useState<{
        buffaloes: number;
        calves: number;
        total: number;
        pregnant: number;
        sick: number;
        avgYield: string;
    } | null>(null);

    const [unallocatedStats, setUnallocatedStats] = useState<{
        buffaloes: number;
        calves: number;
        sick: number;
        pregnant: number;
    } | null>(null);

    // Fetch Global Stats Effect
    useEffect(() => {
        const fetchGlobalStats = async () => {
            // Protect against double mount in StrictMode
            const hasFetched = document.body.getAttribute('data-global-stats-fetched');
            if (hasFetched) return;
            document.body.setAttribute('data-global-stats-fetched', 'true');

            try {
                // ... rest of logic
                // FIXED: Request a large page size to calculate accurate global stats
                const response = await farmvestService.getTotalAnimals(undefined, undefined, 1, 2500);

                // PRIORITY 1: Explicit Summary Counts in Response Object
                if (response && typeof response === 'object' && (response.calves !== undefined || response.calves_count !== undefined)) {
                    setGlobalStats({
                        buffaloes: response.buffaloes || response.buffalo_count || 0,
                        calves: response.calves || response.calves_count || 0,
                        total: (response.buffaloes || 0) + (response.calves || 0),
                        pregnant: response.pregnant || response.pregnant_count || 0,
                        sick: response.sick || response.sick_count || response.undercare || 0,
                        avgYield: String(response.avg_yield || response.average_yield || '0.0')
                    });
                }
                // PRIORITY 2: Manual Calculation from Full Array
                else {
                    let allAnimals: any[] = [];
                    // Robust extraction logic similar to main fetch
                    if (Array.isArray(response)) {
                        allAnimals = response;
                    } else if (response.data && Array.isArray(response.data)) {
                        allAnimals = response.data;
                    } else if (response.animals && Array.isArray(response.animals)) {
                        allAnimals = response.animals;
                    } else if (response.data && response.data.animals && Array.isArray(response.data.animals)) {
                        allAnimals = response.data.animals;
                    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                        allAnimals = response.data.data;
                    } else {
                        const possibleArray = Object.values(response).find(val => Array.isArray(val));
                        if (possibleArray) allAnimals = possibleArray as any[];
                    }

                    if (allAnimals.length > 0) {
                        const buffaloes = allAnimals.filter((a: any) =>
                            (a.animal_type || a.role || '').toLowerCase().includes('buffalo') &&
                            !(a.animal_type || a.role || '').toLowerCase().includes('calf')
                        );

                        const calves = allAnimals.filter((a: any) =>
                            (a.animal_type || a.role || '').toLowerCase().includes('calf')
                        );

                        // Calculate detailed stats from the full list
                        const pregCount = allAnimals.filter((a: any) => {
                            const v = String(a.pregnancy_status || a.pregnancyStatus || '').toLowerCase();
                            return v.includes('preg') || v === '1' || v === 'true';
                        }).length;

                        const sickCount = allAnimals.filter((a: any) => {
                            const v = String(a.health_status || a.healthStatus || '').toUpperCase();
                            return ['POOR', 'SICK', 'FAIR', 'CRITICAL', 'UNDERCARE'].includes(v);
                        }).length;

                        const totalMilk = buffaloes.reduce((sum: number, b: any) => {
                            return sum + Number(b.milk_yield || b.average_yield || b.yield || 0);
                        }, 0);
                        const avg = buffaloes.length > 0 ? (totalMilk / buffaloes.length).toFixed(1) : '0.0';

                        setGlobalStats({
                            buffaloes: buffaloes.length,
                            calves: calves.length,
                            total: allAnimals.length,
                            pregnant: pregCount,
                            sick: sickCount,
                            avgYield: avg
                        });
                    }
                }
            } catch (e) {

            }
        };

        const fetchUnallocatedStats = async () => {
            // Fetch unallocated animals from all farms to get a complete count
            if (farms.length === 0) return;

            try {
                let unallocatedCalves = 0;
                let unallocatedBuffaloes = 0;
                let unallocatedSick = 0;
                let unallocatedPreg = 0;

                // We iterate valid farms. Limit to 10 to avoid too many requests if many farms exist.
                // In a real app we'd want a dedicated endpoint for "all unallocated".
                const farmIds = farms.map(f => f.farm_id || f.id).slice(0, 10);

                for (const fid of farmIds) {
                    if (!fid) continue;
                    const response = await farmvestService.getUnallocatedAnimals(fid);
                    const animals = Array.isArray(response) ? response : (response.data?.unallocated_animals || response.data || []);

                    if (Array.isArray(animals)) {
                        // Sum up stats
                        unallocatedCalves += animals.filter((a: any) =>
                            (a.animal_type || '').toLowerCase().includes('calf') ||
                            (a.role || '').toLowerCase().includes('calf')
                        ).length;

                        unallocatedBuffaloes += animals.filter((a: any) =>
                            (a.animal_type || '').toLowerCase().includes('buffalo') &&
                            !(a.animal_type || '').toLowerCase().includes('calf')
                        ).length;

                        unallocatedSick += animals.filter((a: any) => {
                            const v = String(a.health_status || a.health || '').toUpperCase();
                            return ['POOR', 'SICK', 'FAIR', 'CRITICAL', 'UNDERCARE'].includes(v);
                        }).length;

                        unallocatedPreg += animals.filter((a: any) => {
                            const v = String(a.pregnancy_status || '').toLowerCase();
                            return v.includes('preg') || v === '1' || v === 'true';
                        }).length;
                    }
                }

                setUnallocatedStats({
                    buffaloes: unallocatedBuffaloes,
                    calves: unallocatedCalves,
                    sick: unallocatedSick,
                    pregnant: unallocatedPreg
                });
            } catch (e) {

            }
        };

        fetchGlobalStats();
        if (farms.length > 0) fetchUnallocatedStats();
    }, [farms]); // Re-run if farms list changes (initially loads)

    const getStatusStyles = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'ACTIVE' || s === 'HEALTHY' || s === 'EXCELLENT' || s === 'HIGH_YIELD') return 'bg-green-50 text-green-700';
        if (s === 'SICK' || s === 'POOR' || s === 'INACTIVE') return 'bg-red-50 text-red-700';
        if (s === 'PREGNANT' || s === 'DRY') return 'bg-purple-50 text-purple-700';
        if (s === 'FAIR' || s === 'GOOD') return 'bg-amber-50 text-amber-700';
        return 'bg-gray-50 text-gray-500';
    };

    const formatStatus = (status: string) => {
        if (!status) return '-';
        if (status === 'HIGH_YIELD') return 'High Yield';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
    };

    // Statistics derived from API data or Farm/Location Filtered Base List
    const stats = useMemo(() => {
        // Determine if any global filter is active (excluding activeFilter pill)
        const isLocFiltered = selectedLocation !== 'All' || selectedFarm !== 'All' || selectedShed !== 'All';
        const isSearching = searchQuery.trim().length > 0;

        // Base list to use for calculation: Global (if no filter & available) or Filtered
        if (!isLocFiltered && !isSearching && globalStats) {
            const totalB = globalStats.buffaloes + (unallocatedStats?.buffaloes || 0);
            const totalC = globalStats.calves + (unallocatedStats?.calves || 0);

            // Calculate allocation counts from baseFilteredList even when using global stats
            const allocatedCount = baseFilteredList.filter(b => {
                const hasShed = b.shed;
                return hasShed && String(hasShed).trim() !== '' && String(hasShed) !== '-';
            }).length;
            const unallocatedCount = baseFilteredList.length - allocatedCount;

            return {
                totalAnimals: totalB + totalC,
                totalBuffaloes: totalB,
                totalCalves: totalC,
                pregnant: globalStats.pregnant + (unallocatedStats?.pregnant || 0),
                sick: globalStats.sick + (unallocatedStats?.sick || 0),
                avgYield: globalStats.avgYield,
                allocated: allocatedCount,
                unallocated: unallocatedCount
            };
        }

        // Fallback or Farm-Filtered Calculation
        const sourceList = baseFilteredList;

        const buffaloes = sourceList.filter(b => b.type === 'BUFFALO');
        const calvesInList = sourceList.filter(b => b.type === 'CALF');

        // Detect if we should use the flat list count or the nested count
        const linkedCalvesCount = buffaloes.reduce((sum, b) => sum + (b.associated_calves?.length || 0), 0);

        const totalCalfCount = Math.max(calvesInList.length, linkedCalvesCount);
        const totalBuffaloCount = buffaloes.length;

        const pregCount = sourceList.filter(b => (b.pregnancyStatus || '').toLowerCase().startsWith('preg')).length;
        const sickCount = sourceList.filter(b => {
            const v = (b.healthStatus || '').toUpperCase();
            return ['POOR', 'SICK', 'FAIR', 'CRITICAL', 'UNDERCARE'].includes(v);
        }).length;

        const avgYield = buffaloes.length > 0
            ? (buffaloes.reduce((sum, b) => sum + b.milkYield, 0) / buffaloes.length).toFixed(1)
            : '0.0';

        // Calculate allocation counts
        const allocatedCount = sourceList.filter(b => {
            const hasShed = b.shed;
            return hasShed && String(hasShed).trim() !== '' && String(hasShed) !== '-';
        }).length;
        const unallocatedCount = sourceList.length - allocatedCount;

        return {
            totalAnimals: totalBuffaloCount + totalCalfCount,
            totalBuffaloes: totalBuffaloCount,
            totalCalves: totalCalfCount,
            pregnant: pregCount,
            sick: sickCount,
            avgYield: avgYield,
            allocated: allocatedCount,
            unallocated: unallocatedCount
        };
    }, [baseFilteredList, globalStats, unallocatedStats, selectedLocation, selectedFarm, selectedShed, searchQuery]);


    return (
        <div className="buffalo-page animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <Users className="text-[#113025]" size={25} /> Buffalo Registry
                    </h1>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                        Individual Asset Management & Life-cycle Tracking
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {isLoading ? (
                            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#113025] animate-spin" size={16} />
                        ) : (
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        )}
                        <input
                            type="text"
                            placeholder="Find by Tag ID or RFID..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#113025] outline-none w-64 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-1">
                <div
                    onClick={() => setActiveFilter('all')}
                    className={`bg-white p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${activeFilter === 'all' ? 'border-[#113025] shadow-md ring-1 ring-[#113025]/5' : 'border-gray-100 shadow-sm hover:border-[#113025]/30 hover:shadow-md'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'all' ? 'bg-[#113025] text-white' : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'}`}>
                        <LayoutGrid size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">TOTAL ASSETS</p>
                        <p className="text-lg font-black text-gray-900">{stats.totalAnimals}</p>
                    </div>
                </div>
                <div
                    onClick={() => setActiveFilter('buffalo')}
                    className={`bg-white p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${activeFilter === 'buffalo' ? 'border-[#113025] shadow-md ring-1 ring-[#113025]/5' : 'border-gray-100 shadow-sm hover:border-[#113025]/30 hover:shadow-md'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'buffalo' ? 'bg-[#113025] text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">BUFFALOES</p>
                        <p className="text-lg font-black text-gray-900">{stats.totalBuffaloes}</p>
                    </div>
                </div>
                <div
                    onClick={() => setActiveFilter('calf')}
                    className={`bg-white p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${activeFilter === 'calf' ? 'border-[#113025] shadow-md ring-1 ring-[#113025]/5' : 'border-gray-100 shadow-sm hover:border-[#113025]/30 hover:shadow-md'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'calf' ? 'bg-[#113025] text-white' : 'bg-green-50 text-green-600 group-hover:bg-green-100'}`}>
                        <Baby size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">TOTAL CALVES</p>
                        <p className="text-lg font-black text-gray-900">{stats.totalCalves}</p>
                    </div>
                </div>
                <div
                    onClick={() => setActiveFilter('pregnant')}
                    className={`bg-white p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${activeFilter === 'pregnant' ? 'border-[#113025] shadow-md ring-1 ring-[#113025]/5' : 'border-gray-100 shadow-sm hover:border-[#113025]/30 hover:shadow-md'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'pregnant' ? 'bg-[#113025] text-white' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'}`}>
                        <Heart size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">PREGNANT</p>
                        <p className="text-lg font-black text-gray-900">{stats.pregnant}</p>
                    </div>
                </div>
                <div
                    onClick={() => setActiveFilter('sick')}
                    className={`bg-white p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${activeFilter === 'sick' ? 'border-[#113025] shadow-md ring-1 ring-[#113025]/5' : 'border-gray-100 shadow-sm hover:border-[#113025]/30 hover:shadow-md'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'sick' ? 'bg-[#113025] text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-100'}`}>
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">UNDER CARE</p>
                        <p className="text-lg font-black text-gray-900">{stats.sick}</p>
                    </div>
                </div>
                <div
                    onClick={() => setActiveFilter('high_yield')}
                    className={`bg-white p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${activeFilter === 'high_yield' ? 'border-[#113025] shadow-md ring-1 ring-[#113025]/5' : 'border-gray-100 shadow-sm hover:border-[#113025]/30 hover:shadow-md'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeFilter === 'high_yield' ? 'bg-[#113025] text-white' : 'bg-green-50 text-green-600 group-hover:bg-green-100'}`}>
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">AVG YIELD</p>
                        <p className="text-lg font-black text-gray-900">{stats.avgYield} L</p>
                    </div>
                </div>
            </div>

            {/* Filter Dropdowns Bar */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm mb-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {/* Animal Type Filter */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer min-w-[90px] appearance-none"
                            value={activeFilter}
                            onChange={(e) => setActiveFilter(e.target.value as any)}
                        >
                            <option value="all">Total Assets ({stats.totalAnimals})</option>
                            <option value="buffalo">Buffaloes ({stats.totalBuffaloes})</option>
                            <option value="calf">Calves ({stats.totalCalves})</option>
                            <option value="pregnant">Pregnant ({stats.pregnant})</option>
                            <option value="sick">Attention Needed ({stats.sick})</option>
                            <option value="high_yield">High Performers</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer min-w-[80px] appearance-none"
                            value={selectedLocation}
                            onChange={(e) => {
                                setSelectedLocation(e.target.value);
                                setSelectedFarm('All');
                                setSelectedShed('All');
                            }}
                        >
                            <option value="All">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                        <CustomDropdown
                            options={[
                                { value: 'All', label: 'All Farms' },
                                ...farms.map(farm => ({
                                    value: farm.farm_name,
                                    label: farm.farm_name
                                }))
                            ]}
                            value={selectedFarm}
                            onChange={(value) => {
                                setSelectedFarm(value);
                                setSelectedShed('All');
                            }}
                            placeholder="All Farms"
                            className="min-w-[140px]"
                            hideIcon={true}
                        />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer min-w-[80px] appearance-none"
                            value={selectedShed}
                            onChange={(e) => setSelectedShed(e.target.value)}
                            disabled={selectedFarm === 'All'}
                        >
                            <option value="All">All Sheds</option>
                            {shedsList.map(shed => (
                                <option key={shed.shed_id || shed.id} value={shed.shed_name || shed.shed_id}>{shed.shed_name || shed.shed_id}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer min-w-[120px] appearance-none"
                            value={allocationStatus}
                            onChange={(e) => setAllocationStatus(e.target.value as 'All' | 'Allocated' | 'Unallocated')}
                        >
                            <option value="All">All Animals ({(stats.allocated || 0) + (stats.unallocated || 0)})</option>
                            <option value="Allocated">Allocated ({stats.allocated || 0})</option>
                            <option value="Unallocated">Unallocated ({stats.unallocated || 0})</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4 pr-4">
                    <div className="h-8 w-px bg-gray-100 hidden md:block" />
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        {stats.totalBuffaloes} Buffalo Assets
                    </span>
                </div>
            </div>


            {/* Registry Table */}
            {/* Registry Table */}
            <div className="registry-container">
                <div className="table-scroll-wrapper">
                    <table className="registry-table">
                        <thead className="bg-[#f1f5f9] border-b border-gray-200">
                            <tr>
                                <th className="w-12 py-3 pl-6 text-left text-xs font-bold text-[#94a3b8] uppercase tracking-widest">S.No</th>
                                <th className="py-3 text-left text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Tag ID</th>
                                <th className="py-3 text-left text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Farm</th>
                                <th className="py-3 !text-center text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Shed</th>
                                <th className="py-3 !text-center text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Position</th>
                                <th className="py-3 text-left text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Breed</th>
                                <th className="py-3 text-left text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Gender</th>
                                <th className="py-3 !text-center text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Age (M)</th>
                                <th className="py-3 !text-center text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Location</th>
                                <th className="py-3 !text-center text-xs font-bold text-[#94a3b8] uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && buffaloList.length === 0 ? (
                                <TableSkeleton cols={10} rows={10} />
                            ) : error ? (
                                <tr>
                                    <td colSpan={10} className="p-20 text-center">
                                        <div className="bg-red-50 mx-auto w-fit p-4 rounded-xl mb-4 border border-red-100">
                                            <AlertTriangle className="text-red-500" size={32} />
                                        </div>
                                        <p className="font-bold text-red-500">{error}</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="mt-6 px-6 py-2 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-colors"
                                        >
                                            RETRY FETCH
                                        </button>
                                    </td>
                                </tr>
                            ) : filteredBuffaloes.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-20 text-center">
                                        <div className="bg-gray-50 mx-auto w-fit p-4 rounded-xl mb-4 border border-gray-100">
                                            <Tag className="text-gray-300" size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-400">No Asset Data Available</h3>
                                        <p className="text-sm text-gray-400">The search or filters returned no buffalo records from the live server.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedBuffaloes.map((b, index) => {
                                    const globalIndex = (currentPage - 1) * pageSize + index + 1;

                                    // Determine Status Badge Color and Text
                                    let statusColor = 'bg-[#ecfdf5] text-[#10b981]';
                                    let statusText = 'Active';

                                    const statusLower = (b.healthStatus || '').toLowerCase();
                                    const pregLower = (b.pregnancyStatus || '').toLowerCase();
                                    const milkYield = typeof b.milkYield === 'number' ? b.milkYield : parseFloat(b.milkYield || '0');

                                    if (statusLower.includes('sick') || statusLower.includes('poor') || statusLower.includes('critical')) {
                                        statusColor = 'bg-red-50 text-red-600 border border-red-100';
                                        statusText = 'Inactive';
                                    } else if (pregLower.includes('preg') && !pregLower.includes('not')) {
                                        statusColor = 'bg-purple-50 text-purple-600 border border-purple-100';
                                        statusText = 'Pregnant';
                                    } else if (milkYield > 12) {
                                        statusColor = 'bg-[#ecfdf5] text-[#10b981]';
                                        statusText = 'Active';
                                    }

                                    // Determine Role Badge Color
                                    const isCalf = b.type === 'CALF';
                                    const roleColor = isCalf
                                        ? 'bg-[#fff7ed] text-[#ea580c] border border-orange-100' // Orange pill for Calf
                                        : 'bg-blue-50 text-blue-600 border border-blue-100';

                                    return (
                                        <tr
                                            key={b.animalId}
                                            className="hover:bg-gray-50/50 transition-colors group cursor-pointer border-b border-gray-50"
                                            onClick={() => setSelectedBuffalo(b)}
                                        >
                                            <td className="w-12 py-2 pl-6 text-xs font-medium text-gray-500">
                                                {globalIndex}
                                            </td>
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-gray-900 uppercase">{b.tagNo}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${roleColor}`}>
                                                        {b.type === 'CALF' ? 'CALF' : 'BUFFALO'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-2 text-xs font-semibold text-gray-600 uppercase">
                                                {b.farm || '-'}
                                            </td>
                                            <td className="py-2 !text-center text-xs font-medium text-gray-500 uppercase">
                                                {b.shed || '-'}
                                            </td>
                                            <td className="py-2 !text-center text-xs font-medium text-gray-500 uppercase">
                                                {b.position || '-'}
                                            </td>
                                            <td className="py-2 text-xs font-medium text-gray-700">
                                                {b.breed || 'Murrah Buffalo'}
                                            </td>
                                            <td className="py-2 text-xs font-medium text-gray-600">
                                                {b.gender || 'Female'}
                                            </td>
                                            <td className="py-2 text-center text-xs font-bold text-gray-800">
                                                {b.age_months || (b.age ? b.age * 12 : '-')}
                                            </td>
                                            <td className="py-2 !text-center text-xs font-medium text-gray-400 uppercase">
                                                {b.location || '-'}
                                            </td>
                                            <td className="py-2 text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold ${statusColor}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                filteredBuffaloes.length > 0 && Math.ceil(filteredBuffaloes.length / pageSize) > 1 && (
                    <div className="flex-none mt-2 px-4 pb-2 flex justify-end">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(filteredBuffaloes.length / pageSize)}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )
            }

            {/* Shared Detail Drawer */}
            {
                selectedBuffalo && (
                    <div className="drawer-overlay" onClick={() => setSelectedBuffalo(null)}>
                        <div className="drawer-content" onClick={e => e.stopPropagation()}>
                            <div className="drawer-header">
                                <div>
                                    <h2 className="text-2xl font-black">{selectedBuffalo.tagNo}</h2>
                                    <p className="text-sm opacity-70">{selectedBuffalo.breed} Breed • Female • {selectedBuffalo.age} Years</p>
                                </div>
                                <button className="text-white opacity-50 hover:opacity-100" onClick={() => setSelectedBuffalo(null)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="drawer-body">
                                <div className="drawer-section">
                                    <h3 className="drawer-section-title"><Activity size={14} /> Performance Summary</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Avg Yield</span>
                                            <p className="text-lg font-black text-blue-600">{selectedBuffalo.milkYield ? selectedBuffalo.milkYield.toFixed(1) : '0.0'} L</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Health Status</span>
                                            <p className={`text-lg font-black ${selectedBuffalo.healthStatus === 'Excellent' ? 'text-green-600' : 'text-[#113025]'}`}>
                                                {selectedBuffalo.healthStatus || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="drawer-section">
                                    <h3 className="drawer-section-title"><Heart size={14} /> Medical History</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Last Vet Visit</span>
                                            <span className="font-bold">{selectedBuffalo.lastVetVisit || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Vaccination Status</span>
                                            <span className="font-bold text-green-600">Up to Date</span>
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Next Vaccine</p>
                                            <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg border border-green-100">
                                                <span className="text-[11px] font-bold text-green-700">FMD Booster</span>
                                                <span className="text-[10px] font-bold text-green-600">IN 12 DAYS</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="drawer-section">
                                    <h3 className="drawer-section-title"><Baby size={14} /> Associated Calves</h3>
                                    {isCalvesLoading ? (
                                        <div className="py-4 text-center">
                                            <Loader2 className="mx-auto text-[#113025] animate-spin" size={20} />
                                        </div>
                                    ) : calves.length > 0 ? (
                                        <div className="space-y-2">
                                            {calves.map((calf: any, idx: number) => (
                                                <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">{calf.rfid_tag || calf.animal_id || 'NEW CALF'}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{calf.breed_name || 'Murrah'} • {calf.gender || 'Female'}</p>
                                                    </div>
                                                    <div className="bg-white px-2 py-1 rounded text-[10px] font-black text-[#113025] shadow-sm border border-gray-100">
                                                        {calf.age_months || 0}M OLD
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">No calves recorded for this buffalo</p>
                                        </div>
                                    )}
                                </div>

                                <div className="drawer-section">
                                    <h3 className="drawer-section-title"><Info size={14} /> Location Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-gray-400">Current Facility</span>
                                            <span>{selectedBuffalo.location}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-gray-400">Assigned Shed</span>
                                            <span>{selectedBuffalo.farm} - {selectedBuffalo.shed}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-4">
                                    <button className="w-full py-3 bg-[#113025] text-white font-bold rounded-xl shadow-lg shadow-[#113025]/20 active:scale-95 transition-all">
                                        LOG MILK PRODUCTION
                                    </button>
                                    <button className="w-full py-3 bg-white text-gray-700 border border-gray-200 font-bold rounded-xl active:scale-95 transition-all">
                                        REQUEST VET VISIT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default BuffaloManagement;
