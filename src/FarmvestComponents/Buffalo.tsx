import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Filter,
    ChevronRight,
    ChevronDown,
    MoreVertical,
    Activity,
    Heart,
    Baby,
    ClipboardList,
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
    LayoutGrid
} from 'lucide-react';
import './Buffalo.css';
import { farmvestService } from '../services/farmvest_api';

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
    const [activeFilter, setActiveFilter] = useState<'all' | 'pregnant' | 'sick' | 'high_yield'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [buffaloList, setBuffaloList] = useState<Buffalo[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [locations, setLocations] = useState<string[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [shedsList, setShedsList] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('All');
    const [selectedFarm, setSelectedFarm] = useState<string>('All');
    const [selectedShed, setSelectedShed] = useState<string>('All');

    // New: Inline Expansion States
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [inlineCalves, setInlineCalves] = useState<Record<string, any[]>>({});
    const [inlineLoading, setInlineLoading] = useState<Record<string, boolean>>({});

    const filteredBuffaloes = useMemo(() => {
        return buffaloList.filter(b => {
            // First, only show Buffaloes in the main registry
            if (b.type !== 'BUFFALO') return false;

            const matchesFilter =
                activeFilter === 'all' ||
                (activeFilter === 'pregnant' && (b.pregnancyStatus || '').startsWith('Pre')) ||
                (activeFilter === 'sick' && (b.healthStatus === 'Poor' || b.healthStatus === 'Fair' || b.healthStatus === 'Sick')) ||
                (activeFilter === 'high_yield' && b.milkYield > 15);

            return matchesFilter;
        });
    }, [buffaloList, activeFilter]);

    // Live Search Effect
    useEffect(() => {
        const fetchBuffalo = async () => {
            setError(null);
            setIsLoading(true);
            try {
                let response;
                if (searchQuery.trim() === '') {
                    // Initial load or Filtered load: get allocated animals
                    const farmId = selectedFarm !== 'All' ? farms.find(f => f.farm_name === selectedFarm)?.id : undefined;
                    const shedId = selectedShed !== 'All' ? shedsList.find(s => (s.shed_name || s.shed_id) === selectedShed)?.id : undefined;
                    response = await farmvestService.getTotalAnimals(farmId, shedId);
                } else {
                    // Search mode
                    response = await farmvestService.searchAnimal(searchQuery.trim());
                }

                if (response && (response.status === 'success' || Array.isArray(response) || response.data)) {

                    // Normalize dataPart
                    const dataPart = response.data || response;
                    const rawData = Array.isArray(dataPart) ? dataPart : [dataPart];

                    const seenIds = new Set();
                    const mappedData: Buffalo[] = [];

                    rawData.forEach((a: any, index: number) => {
                        // Extract unique Tag ID
                        const tagId = a.rfid_tag || a.rfid_tag_number || a.rfidTag || a.rfid || a.tag || a.animal_tag || a.tag_number || a.rfid_no || a.tag_id || a.TagId || a.tag_no || a.tagNo || a.animal_id || a.id || 'N/A';
                        const animalId = String(a.animal_id || a.id || tagId || `ANIMAL-${index}`);

                        if (seenIds.has(animalId)) return;
                        seenIds.add(animalId);
                        // Extract numeric age
                        const months = Number(a.age_months || a.age_in_months || a.animal_age_months || 0);
                        const years = Number(a.age || a.animal_age || 0);

                        // Extract location details
                        const loc = a.location_name || a.location ||
                            (a.farm_details && a.farm_details.location) ||
                            (a.farm && a.farm.location) ||
                            (a.location_details && a.location_details.location) || '-';

                        const farmInfo = a.farm_name || a.FarmName ||
                            (a.farm_details && a.farm_details.farm_name) ||
                            (a.farm && a.farm.farm_name) || (a.Farm && a.Farm.farm_name) || '-';

                        const shedInfo = a.shed_name || a.ShedNo ||
                            (a.shed_details && a.shed_details.shed_name) ||
                            (a.shed && (a.shed.shed_name || a.shed.shed_id)) || '-';

                        mappedData.push({
                            animalId,
                            tagNo: tagId,
                            breed: a.breed_name || a.breed || a.breed_id || 'Murrah',
                            age: Math.floor(months / 12) || years || 1,
                            age_months: months || (years * 12) || 0,
                            gender: a.gender || a.sex || 'Female',
                            location: loc,
                            farm: farmInfo,
                            shed: shedInfo,
                            position: a.position || a.parking_id || a.parking_tag || '-',
                            status: a.active_status || a.status || (a.is_active ? 'Active' : 'N/A'),
                            type: (a.animal_type || a.type || (a.is_calf ? 'CALF' : 'BUFFALO')).toUpperCase(),
                            lactationStage: a.lactation_stage || a.lactation || '-',
                            healthStatus: a.health_status === 'HEALTHY' || a.health === 'HEALTHY' ? 'Excellent' :
                                (a.health_status === 'SICK' || a.health === 'SICK' ? 'Poor' :
                                    (a.healthStatus || a.health_status || a.health || 'Good')),
                            pregnancyStatus: a.pregnancy_status || a.pregnancyStatus || a.reproduction_status || (a.is_pregnant ? 'Pregnant' : 'Not Pregnant'),
                            milkYield: Number(a.milk_yield || a.average_yield || a.last_yield || a.yield || 0),
                            lastVetVisit: a.last_vet_check || a.last_vet_visit || a.last_visit || '-',
                            associated_calves: a.associated_calves || a.calves || a.calf_list || []
                        });
                    });

                    setBuffaloList(mappedData);
                    setTotalCount(response.count || mappedData.length);

                    // Auto-open if exact match
                    if (searchQuery.trim().length >= 4) {
                        const exactMatch = mappedData.find((b: Buffalo) =>
                            b.tagNo.toLowerCase() === searchQuery.trim().toLowerCase()
                        );
                        if (exactMatch) {
                            setSelectedBuffalo(exactMatch);
                            setExpandedRowId(null); // Mutual exclusion: Close row if drawer opens
                        }
                    }
                } else {
                    setBuffaloList([]);
                    setTotalCount(0);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch buffalo data');
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchBuffalo, searchQuery.trim() === '' ? 0 : 500);
        setExpandedRowId(null); // Clear expansion on new search/filter
        return () => clearTimeout(debounce);
    }, [searchQuery, selectedFarm, selectedShed]);

    // Fetch Initial Locations
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await farmvestService.getLocations();
                if (response && Array.isArray(response.data)) {
                    setLocations(response.data);
                }
            } catch (err) {
            }
        };
        fetchLocations();
    }, []);

    // Fetch Farms when location changes
    useEffect(() => {
        const fetchFarms = async () => {
            if (selectedLocation === 'All') {
                setFarms([]);
                setSelectedFarm('All');
                return;
            }
            try {
                const farmResponse = await farmvestService.getFarms(selectedLocation);
                if (farmResponse && Array.isArray(farmResponse.data)) {
                    setFarms(farmResponse.data);
                }
            } catch (err) {
            }
        };
        fetchFarms();
    }, [selectedLocation]);

    // Fetch Sheds when farm changes
    useEffect(() => {
        const fetchSheds = async () => {
            if (selectedFarm === 'All') {
                setShedsList([]);
                setSelectedShed('All');
                return;
            }
            try {
                const farmId = farms.find(f => f.farm_name === selectedFarm)?.id;
                if (farmId) {
                    const shedResponse = await farmvestService.getShedsByFarm(farmId);
                    if (shedResponse && Array.isArray(shedResponse.data)) {
                        setShedsList(shedResponse.data);
                    }
                }
            } catch (err) {
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

    const getStatusStyles = (status: string) => {
        const s = (status || '').toUpperCase();
        if (s === 'ACTIVE' || s === 'HEALTHY' || s === 'EXCELLENT') return 'bg-green-50 text-green-700';
        if (s === 'SICK' || s === 'POOR' || s === 'INACTIVE') return 'bg-red-50 text-red-700';
        if (s === 'PREGNANT' || s === 'DRY') return 'bg-purple-50 text-purple-700';
        if (s === 'FAIR' || s === 'GOOD') return 'bg-amber-50 text-amber-700';
        return 'bg-gray-50 text-gray-500';
    };

    // Statistics derived from API data
    const stats = useMemo(() => {
        const buffaloes = buffaloList.filter(b => b.type === 'BUFFALO');
        const calvesInList = buffaloList.filter(b => b.type === 'CALF');

        // Logic check: If calves are in-list, don't double count if we assume API returns all animals
        // However, if the API only returns Buffaloes when not searching, nested counts are safer
        const totalCalfCount = calvesInList.length > 0 ? calvesInList.length : buffaloes.reduce((sum, b) => sum + (b.associated_calves?.length || 0), 0);

        return {
            totalBuffaloes: buffaloes.length,
            totalCalves: totalCalfCount,
            pregnant: buffaloList.filter(b => (b.pregnancyStatus || '').startsWith('Pre')).length,
            sick: buffaloList.filter(b => b.healthStatus === 'Fair' || b.healthStatus === 'Poor' || b.healthStatus === 'Sick').length,
            avgYield: buffaloes.length > 0
                ? (buffaloes.reduce((sum, b) => sum + b.milkYield, 0) / buffaloes.length).toFixed(1)
                : '0.0'
        };
    }, [buffaloList]);

    const toggleRow = async (animalId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't open drawer when clicking chevron

        const animal = buffaloList.find(b => b.animalId === animalId);
        // Only buffaloes can be expanded to show calves
        if (!animal || animal.type === 'CALF') return;

        if (expandedRowId === animalId) {
            setExpandedRowId(null);
            return;
        }

        setExpandedRowId(animalId);
        setSelectedBuffalo(null); // Mutual exclusion: Close drawer if row expands

        // Use pre-loaded associated calves if available
        if (animal.associated_calves && animal.associated_calves.length > 0 && !inlineCalves[animalId]) {
            setInlineCalves(prev => ({ ...prev, [animalId]: animal.associated_calves! }));
            return;
        }

        // Fetch if not already fetched
        if (!inlineCalves[animalId]) {
            setInlineLoading(prev => ({ ...prev, [animalId]: true }));
            try {
                const response = await farmvestService.getCalves(animalId);
                const rawData = Array.isArray(response) ? response : (response.data || []);

                // De-duplicate calves by ID
                const seenCalfIds = new Set();
                const uniqueCalves = rawData.filter((c: any) => {
                    const id = c.animal_id || c.id || c.rfid_tag || c.rfid_tag_number || c.rfidTag;
                    if (seenCalfIds.has(id)) return false;
                    seenCalfIds.add(id);
                    return true;
                });

                setInlineCalves(prev => ({ ...prev, [animalId]: uniqueCalves }));
            } catch (err) {
                setInlineCalves(prev => ({ ...prev, [animalId]: [] }));
            } finally {
                setInlineLoading(prev => ({ ...prev, [animalId]: false }));
            }
        }
    };

    return (
        <div className="buffalo-page animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-md font-black text-gray-800 flex items-center gap-3">
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
                    </div>
                    <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
                        <Filter size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="buffalo-stat-card border-blue-100 bg-blue-50/10">
                    <div className="stat-icon bg-blue-100 text-blue-600 shadow-sm"><Users size={20} /></div>
                    <div className="stat-info">
                        <h3 className="text-gray-500 font-bold">Buffaloes</h3>
                        <p className="text-blue-700">{stats.totalBuffaloes}</p>
                    </div>
                </div>
                <div className="buffalo-stat-card border-green-100 bg-green-50/10">
                    <div className="stat-icon bg-green-100 text-green-600 shadow-sm"><Baby size={20} /></div>
                    <div className="stat-info">
                        <h3 className="text-gray-500 font-bold">Total Calves</h3>
                        <p className="text-green-700">{stats.totalCalves}</p>
                    </div>
                </div>
                <div className="buffalo-stat-card border-purple-100 bg-purple-50/10">
                    <div className="stat-icon bg-purple-100 text-purple-600 shadow-sm"><Heart size={20} /></div>
                    <div className="stat-info">
                        <h3 className="text-gray-500 font-bold">Pregnant</h3>
                        <p className="text-purple-700">{stats.pregnant}</p>
                    </div>
                </div>
                <div className="buffalo-stat-card border-red-100 bg-red-50/10">
                    <div className="stat-icon bg-red-100 text-red-600 shadow-sm"><Activity size={20} /></div>
                    <div className="stat-info">
                        <h3 className="text-gray-500 font-bold">Under Care</h3>
                        <p className="text-red-700">{stats.sick}</p>
                    </div>
                </div>
                <div className="buffalo-stat-card border-green-100 bg-green-50/10">
                    <div className="stat-icon bg-green-100 text-green-600 shadow-sm"><TrendingUp size={20} /></div>
                    <div className="stat-info">
                        <h3 className="text-gray-500 font-bold">Avg Yield</h3>
                        <p className="text-green-700">{stats.avgYield} L</p>
                    </div>
                </div>
            </div>

            {/* Location & Farm Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#113025] transition-all">
                    <MapPin size={14} className="text-[#113025]" />
                    <select
                        className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
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

                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#113025] transition-all">
                    <Building2 size={14} className="text-[#113025]" />
                    <select
                        className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
                        value={selectedFarm}
                        onChange={(e) => {
                            setSelectedFarm(e.target.value);
                            setSelectedShed('All');
                        }}
                        disabled={selectedLocation === 'All'}
                    >
                        <option value="All">All Farms</option>
                        {farms.map(farm => (
                            <option key={farm.farm_id || farm.id} value={farm.farm_name}>{farm.farm_name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#113025] transition-all">
                    <LayoutGrid size={14} className="text-[#113025]" />
                    <select
                        className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
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

                <div className="md:ml-auto flex items-center gap-2">
                    <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block" />
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
                        {stats.totalBuffaloes} Buffalo Assets
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-pills-row mb-6">
                <button
                    className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveFilter('all');
                        setExpandedRowId(null);
                    }}
                >
                    All Animals
                </button>
                <button
                    className={`filter-pill ${activeFilter === 'pregnant' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveFilter('pregnant');
                        setExpandedRowId(null);
                    }}
                >
                    Pregnant ({stats.pregnant})
                </button>
                <button
                    className={`filter-pill ${activeFilter === 'sick' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveFilter('sick');
                        setExpandedRowId(null);
                    }}
                >
                    Attention Needed ({stats.sick})
                </button>
                <button
                    className={`filter-pill ${activeFilter === 'high_yield' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveFilter('high_yield');
                        setExpandedRowId(null);
                    }}
                >
                    High Performers
                </button>
            </div>

            {/* Registry Table */}
            <div className="registry-container">
                {isLoading && buffaloList.length === 0 ? (
                    <div className="p-20 text-center">
                        <Loader2 className="mx-auto text-[#113025] animate-spin mb-4" size={48} />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Live Assets...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center text-red-500">
                        <AlertTriangle className="mx-auto mb-4" size={48} />
                        <p className="font-bold">{error}</p>
                        <button
                            onClick={() => setSearchQuery(searchQuery)}
                            className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200"
                        >
                            RETRY FETCH
                        </button>
                    </div>
                ) : filteredBuffaloes.length > 0 ? (
                    <>
                        <table className="registry-table">
                            <thead>
                                <tr>
                                    <th className="w-10"></th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Tag ID</th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Farm</th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Shed</th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Position</th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Breed</th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Gender</th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Age (M)</th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Location</th>
                                    <th className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center">Status</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBuffaloes.slice(0, 50).map((b) => (
                                    <React.Fragment key={b.animalId}>
                                        <tr
                                            className={`hover:bg-green-50/10 transition-colors cursor-pointer border-b border-gray-100 ${expandedRowId === b.animalId ? 'bg-green-50/20' : ''}`}
                                            onClick={(e) => toggleRow(b.animalId, e)}
                                        >
                                            <td className="px-4 py-4 text-center">
                                                {b.type === 'BUFFALO' ? (
                                                    expandedRowId === b.animalId ? (
                                                        <ChevronDown size={18} className="text-[#113025] animate-in fade-in" />
                                                    ) : (
                                                        <ChevronRight size={18} className="text-gray-300 hover:text-[#113025] transition-colors" />
                                                    )
                                                ) : null}
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center">
                                                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded mr-2 shadow-sm border border-blue-100/50">
                                                        <Tag size={14} />
                                                    </span>
                                                    <span className="font-black text-gray-900 text-xs">{b.tagNo}</span>
                                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${b.type === 'CALF' ? 'bg-green-100 text-[#113025]' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {b.type.charAt(0) + b.type.slice(1).toLowerCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-[11px] font-bold text-gray-600">{b.farm}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-[11px] font-bold text-gray-500">{b.shed}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-[10px] font-black text-gray-400 font-mono tracking-tighter">{b.position}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-[11px] font-bold text-gray-600">{b.breed}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-[11px] font-bold text-gray-600">{b.gender}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-[11px] font-black text-gray-900">{b.age_months}</div>
                                            </td>
                                            <td className="text-center">
                                                <div className="text-[11px] font-bold text-gray-500">{b.location}</div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${getStatusStyles(b.status)}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-4 text-center">
                                                <button
                                                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBuffalo(b);
                                                        setExpandedRowId(null);
                                                    }}
                                                >
                                                    <Info size={16} className="text-gray-400 hover:text-[#113025]" />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expandable Calf Row */}
                                        {expandedRowId === b.animalId && (
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <td colSpan={11} className="p-4 pl-12">
                                                    <div className="rounded-lg border border-[#113025] bg-white overflow-hidden shadow-md">
                                                        <div className="px-4 py-2 bg-[#113025] border-b border-[#113025] flex items-center">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center">
                                                                <Milk size={14} className="mr-2 text-white" /> Associated Calf ({inlineCalves[b.animalId]?.length || 0})
                                                            </span>
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full divide-y divide-[#113025]/10">
                                                                <thead className="bg-[#113025]">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-wider">Tag ID</th>
                                                                        <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-wider">Farm</th>
                                                                        <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-wider">Shed</th>
                                                                        <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-wider">Position</th>
                                                                        <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-wider">Breed</th>
                                                                        <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-wider">Gender</th>
                                                                        <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-wider">Age (Months)</th>
                                                                        <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-wider">Location</th>
                                                                        <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-wider">Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                                    {inlineLoading[b.animalId] ? (
                                                                        <tr>
                                                                            <td colSpan={9} className="py-8 text-center">
                                                                                <div className="flex items-center justify-center gap-2 text-[#113025]">
                                                                                    <Loader2 size={16} className="animate-spin" />
                                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Fetching Lineage...</span>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ) : inlineCalves[b.animalId]?.length > 0 ? (
                                                                        inlineCalves[b.animalId].map((calf: any, cIdx: number) => (
                                                                            <tr key={cIdx} className="hover:bg-gray-50 transition-colors">
                                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                                    <div className="flex items-center">
                                                                                        <span className="p-1 bg-gray-100 text-gray-500 rounded mr-2">
                                                                                            <Tag size={12} />
                                                                                        </span>
                                                                                        <span className="font-black text-gray-800 text-[11px]">{calf.rfid_tag || calf.rfid_tag_number || calf.rfidTag || calf.rfid || calf.tag_id || calf.animal_id || '-'}</span>
                                                                                        <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black bg-gray-100 text-gray-500 uppercase">Calf</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-600 font-bold">{calf.farm_name || calf.farm || (calf.farm_details && calf.farm_details.farm_name) || b.farm}</td>
                                                                                <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-500 font-bold">{calf.shed_name || calf.shed || (calf.shed_details && calf.shed_details.shed_name) || b.shed}</td>
                                                                                <td className="px-4 py-3 whitespace-nowrap text-[10px] font-black text-gray-400 font-mono tracking-tighter">{calf.position || calf.parking_id || calf.parking_tag || '-'}</td>
                                                                                <td className="px-4 py-3 whitespace-nowrap text-[11px] font-bold text-gray-600">{calf.breed_name || calf.breed || (calf.breed_details && calf.breed_details.breed_name) || b.breed}</td>
                                                                                <td className="px-4 py-3 whitespace-nowrap text-[11px] font-bold text-gray-600">{calf.gender || calf.sex || 'Female'}</td>
                                                                                <td className="px-4 py-3 whitespace-nowrap text-center text-[11px] font-black text-gray-700">{calf.age_months || calf.age_in_months || calf.age || 0}</td>
                                                                                <td className="px-4 py-3 whitespace-nowrap text-[11px] font-bold text-gray-500">{calf.location_name || calf.location || (calf.location_details && calf.location_details.location) || (calf.farm_details && calf.farm_details.location) || b.location}</td>
                                                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${getStatusStyles(calf.status || calf.active_status || 'Active')}`}>
                                                                                        {calf.status || calf.active_status || 'Active'}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={9} className="py-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                                No calves recorded for this buffalo
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-6 text-center border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-bold">Showing top {Math.min(filteredBuffaloes.length, 50)} of {totalCount} assets. Use search for specific records.</p>
                        </div>
                    </>
                ) : (
                    <div className="p-20 text-center">
                        <Users className="mx-auto text-gray-200 mb-4" size={64} />
                        <h3 className="text-lg font-bold text-gray-400">No Asset Data Available</h3>
                        <p className="text-sm text-gray-400">The search returned no buffalo records from the live server.</p>
                    </div>
                )}
            </div>

            {/* Shared Detail Drawer */}
            {selectedBuffalo && (
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
                                        <p className="text-lg font-black text-blue-600">{selectedBuffalo.milkYield.toFixed(1)} L</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Health Status</span>
                                        <p className={`text-lg font-black ${selectedBuffalo.healthStatus === 'Excellent' ? 'text-green-600' : 'text-[#113025]'}`}>
                                            {selectedBuffalo.healthStatus}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="drawer-section">
                                <h3 className="drawer-section-title"><Heart size={14} /> Medical History</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Last Vet Visit</span>
                                        <span className="font-bold">{selectedBuffalo.lastVetVisit}</span>
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
            )}
        </div>
    );
};

export default BuffaloManagement;
