import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './UnallocatedAnimals.css';
import { ChevronDown, Video, LayoutGrid, PawPrint, ShoppingBag, Loader2 } from 'lucide-react';
import CommonShedGrid from '../../components/common/ShedGrid/CommonShedGrid';
import { farmvestService } from '../../services/farmvest_api';

interface Farm {
    farm_id: number;
    farm_name: string;
    location: string;
}

interface Shed {
    shed_id: string;
    shed_name: string;
    capacity: number;
    allocationStats?: any;
}

interface Animal {
    id: string; // Internal stable unique ID
    role: string;
    image: string;
    // Add fields likely returned by API
    animal_id?: string;
    animal_type?: string;
    images?: string[];
    // New fields from user's JSON
    rfid?: string;
    investor_name?: string;
    display_text?: string;
    onboarding_time?: string;
}

const UnallocatedAnimals: React.FC = () => {
    // ---------------------------------------------------------
    // 1. STATE
    // ---------------------------------------------------------
    const [farms, setFarms] = useState<Farm[]>([]);
    const [sheds, setSheds] = useState<Shed[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<string>('');
    const [selectedShedId, setSelectedShedId] = useState<string>('');
    const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

    const [animals, setAnimals] = useState<Animal[]>([]);
    const [loadingAnimals, setLoadingAnimals] = useState(false);
    const [gridPositions, setGridPositions] = useState<any[]>([]);
    const [loadingGrid, setLoadingGrid] = useState(false);
    const [selectedShedAlloc, setSelectedShedAlloc] = useState<any>(null);

    // Fail-safe "Stop" when API fails
    const [hasError, setHasError] = useState(false);

    // ---------------------------------------------------------
    // 2. STABILITY REFS (Guaranteed One-Time Fetching)
    // ---------------------------------------------------------
    const lastFarmIdRef = useRef<string | null>(null);
    const lastShedIdRef = useRef<string | null>(null);
    const isMounted = useRef(false);

    const log = (msg: string) => console.log(`[FarmVest Final] ${new Date().toLocaleTimeString()}: ${msg}`);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return dateString;
        }
    };

    // ---------------------------------------------------------
    // 3. FETCH FUNCTIONS (useCallback for stability & manual refresh)
    // ---------------------------------------------------------

    // A. FETCH FARM DATA (Sheds & Animals)
    const fetchFarmData = useCallback(async (fId: number) => {
        log(`>>> START FETCH FARM: ${fId}`);
        try {
            setLoadingAnimals(true);
            const [shedData, animalData] = await Promise.all([
                farmvestService.getShedsByFarm(fId),
                farmvestService.getUnallocatedAnimals(fId)
            ]);

            if (!isMounted.current) return;

            const sl = Array.isArray(shedData) ? shedData : (shedData.data || shedData.sheds || []);
            setSheds(sl);

            let animalList: any[] = [];
            if (Array.isArray(animalData)) {
                animalList = animalData;
            } else if (animalData.data) {
                animalList = Array.isArray(animalData.data.unallocated_animals) ? animalData.data.unallocated_animals : (Array.isArray(animalData.data) ? animalData.data : []);
            } else if (animalData.unallocated_animals) {
                animalList = animalData.unallocated_animals;
            } else if (animalData.animals) {
                animalList = animalData.animals;
            }

            const mapped = animalList.map((a, idx) => {
                let imgUrl = 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=100&h=100&fit=crop';
                if (a.images && Array.isArray(a.images) && a.images.length > 0 && a.images[0]) {
                    imgUrl = a.images[0];
                } else if (a.image && typeof a.image === 'string' && a.image.trim() !== '') {
                    imgUrl = a.image;
                }

                return {
                    ...a,
                    id: `animal-${idx}-${a.animal_id || a.rfid || 'unnamed'}`,
                    role: a.animal_type || a.role || 'Animal',
                    image: imgUrl,
                    rfid: a.rfid_tag_number || a.rfid || a.animal_id || String(idx),
                    display_text: a.display_text,
                    investor_name: a.investor_name,
                    // Extensive fallbacks to find the onboarding date
                    onboarding_time: a.investment_details?.order_date || a.order_date || a.created_at || a.onboarded_time || a.onboarded_at || a.onboarding_date || a.placedAt
                };
            });

            // DEBUG LOG: Help identify the correct field if still missing
            if (mapped.length > 0) {
                const first = animalList[0];
                log(`>>> DEBUG Mapping Sample (ID: ${first.animal_id}): Found Time: ${mapped[0].onboarding_time || 'NOT FOUND'}`);
                log(`Available Keys: ${Object.keys(first).join(', ')}`);
            }
            setAnimals(mapped);
            log(`<<< END FETCH FARM: Successfully loaded ${mapped.length} animals`);
        } catch (e: any) {
            log(`ERROR: Farm data fetch failed: ${e.message}`);
            setHasError(true);
        } finally {
            if (isMounted.current) setLoadingAnimals(false);
        }
    }, [log]);

    // B. FETCH SHED DETAILS (Allocations & Grid Layout)
    const fetchShedDetails = useCallback(async (sId: string) => {
        log(`>>> START FETCH SHED: ${sId}`);
        try {
            setLoadingGrid(true);
            const numericId = isNaN(Number(sId)) ? sId : Number(sId);
            const [allocResponse, gridData] = await Promise.all([
                farmvestService.getShedAllocation(sId).catch(e => {
                    log(`Note: Shed allocation fetch failed (possibly empty or 404): ${sId}`);
                    return null;
                }),
                farmvestService.getShedPositions(numericId as any).catch(e => {
                    log(`Warning: Shed positions fetch failed: ${e.message}`);
                    return [];
                })
            ]);

            if (!isMounted.current) return;

            const allocations = allocResponse?.data?.allocations || [];
            const allocationMap = new Map();
            const rowToLetter: { [key: string]: string } = { 'R1': 'A', 'R2': 'B', 'R3': 'C', 'R4': 'D' };

            allocations.forEach((a: any) => {
                const rowLetter = rowToLetter[a.row_number] || a.row_number;
                // Mapped Keys (A1, A-1)
                allocationMap.set(`${rowLetter}${a.parking_id}`, a);
                allocationMap.set(`${rowLetter}-${a.parking_id}`, a);
                // Original Keys (R11, R1-1)
                allocationMap.set(`${a.row_number}${a.parking_id}`, a);
                allocationMap.set(`${a.row_number}-${a.parking_id}`, a);
            });

            // 3. Process Positions Layout and Merge with Allocations
            let positions = Array.isArray(gridData) ? gridData : (gridData.data || []);

            // If API returns no positions, generate base layout to ensure allocations show somewhere
            if (positions.length === 0) {
                log(`Shed ${sId} layout empty from API. Generating base grid for mapping.`);
                const mock: any[] = [];
                ['A', 'B', 'C', 'D'].forEach(r => {
                    for (let i = 1; i <= 75; i++) mock.push({ label: `${r}${i}`, status: 'Available', id: `${r}${i}` });
                });
                positions = mock;
            }

            const mergedPositions = positions.map((p: any) => {
                const label = p.position_name || p.label || p.id || "";
                const allocation = allocationMap.get(label);

                if (allocation) {
                    log(`Matched Allocation: Label ${label} -> RFID ${allocation.rfid_tag_number}`);
                }

                return {
                    id: p.id,
                    label: label,
                    status: allocation ? 'Occupied' : (p.status || 'Available'),
                    animal_image: allocation?.animal_image || p.animal_image || p.image,
                    rfid_tag_number: allocation?.rfid_tag_number || p.rfid_tag_number || p.rfid,
                    onboarding_time: allocation?.investment_details?.order_date || allocation?.order_date || allocation?.created_at || allocation?.onboarded_time || allocation?.onboarded_at || allocation?.onboarding_date || allocation?.placedAt
                };
            });

            const occupied = mergedPositions.filter((p: any) => p.status.toLowerCase() !== 'available');
            log(`<<< END FETCH SHED: ${mergedPositions.length} positions total, ${occupied.length} occupied slots found.`);

            setSelectedShedAlloc(allocResponse);
            setGridPositions(mergedPositions);
        } catch (e: any) {
            log(`CRITICAL: Shed detail handler exception: ${e.message}`);
        } finally {
            if (isMounted.current) setLoadingGrid(false);
        }
    }, [log]);

    // ---------------------------------------------------------
    // 4. EFFECTS
    // ---------------------------------------------------------

    // A. INITIAL LOAD: Farms (Once only)
    useEffect(() => {
        isMounted.current = true;
        log("Component Mounted");

        async function fetchInitialFarms() {
            try {
                const data = await farmvestService.getAllFarms();
                if (!isMounted.current) return;
                const list = Array.isArray(data) ? data : (data.farms || data.data || []);
                setFarms(list);
            } catch (e: any) {
                log(`FATAL: Farm load failed: ${e.message}`);
                setHasError(true);
            }
        }
        fetchInitialFarms();
        return () => { isMounted.current = false; };
    }, []);

    // B. Trigger Farm Data Load
    useEffect(() => {
        if (!selectedFarmId || hasError) {
            if (!selectedFarmId) {
                setSheds([]);
                setAnimals([]);
                lastFarmIdRef.current = null;
            }
            return;
        }

        if (selectedFarmId === lastFarmIdRef.current) return;
        lastFarmIdRef.current = selectedFarmId;
        fetchFarmData(Number(selectedFarmId));
    }, [selectedFarmId, hasError, fetchFarmData]);

    // C. Trigger Shed Detail Load
    useEffect(() => {
        if (!selectedShedId || hasError) {
            if (!selectedShedId) {
                setGridPositions([]);
                setSelectedShedAlloc(null);
                lastShedIdRef.current = null;
            }
            return;
        }

        if (selectedShedId === lastShedIdRef.current) return;
        lastShedIdRef.current = selectedShedId;
        fetchShedDetails(selectedShedId);
    }, [selectedShedId, hasError, fetchShedDetails]);

    // ---------------------------------------------------------
    // 4. HANDLERS
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // 4. HANDLERS
    // ---------------------------------------------------------

    // Animation Helper
    const runFlyAnimation = (animalId: string, endRect: DOMRect, imageUrl: string) => {
        const startEl = document.getElementById(`ua-animal-card-${animalId}`);
        if (!startEl) return;
        const startRect = startEl.getBoundingClientRect();

        const flyer = document.createElement('img');
        flyer.src = imageUrl;
        flyer.style.position = 'fixed';
        flyer.style.left = `${startRect.left}px`;
        flyer.style.top = `${startRect.top}px`;
        flyer.style.width = `${startRect.width}px`;
        flyer.style.height = `${startRect.height}px`;
        flyer.style.borderRadius = '12px';
        flyer.style.zIndex = '9999';
        flyer.style.transition = 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1)';
        flyer.style.pointerEvents = 'none';
        flyer.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';

        document.body.appendChild(flyer);

        // Force reflow
        flyer.getBoundingClientRect();

        requestAnimationFrame(() => {
            flyer.style.left = `${endRect.left}px`;
            flyer.style.top = `${endRect.top}px`;
            flyer.style.width = `${endRect.width}px`;
            flyer.style.height = `${endRect.height}px`;
            flyer.style.opacity = '0.5';
        });

        setTimeout(() => {
            flyer.remove();
        }, 800);
    };

    const handleGridSlotClick = async (position: any, e?: React.MouseEvent) => {
        if (hasError) { alert("API Connection is currently blocked. Please refresh."); return; }
        if (!selectedFarmId) { alert('Please select a farm first.'); return; }
        if (!selectedShedId) { alert('Please select a shed first.'); return; }
        if (!selectedAnimalId) { alert('Please select an animal first.'); return; }
        if (position.status !== 'Available') { alert('This slot is already occupied.'); return; }

        const selectedAnimal = animals.find(a => a.id === selectedAnimalId);
        if (!selectedAnimal || !selectedAnimal.rfid) { alert('Selected animal missing RFID tag.'); return; }

        const shedName = sheds.find(s => String(s.shed_id) === selectedShedId)?.shed_name || 'shed';
        if (!window.confirm(`Allocate animal ${selectedAnimal.rfid} to slot ${position.label} in ${shedName}?`)) return;

        // Trigger animation immediately after confirmation
        if (e && e.target) {
            // Use currentTarget or specific logic to get the slot element effectively
            // e.currentTarget is the slot card div because we attached onClick there
            const targetEl = e.currentTarget as HTMLElement;
            const rect = targetEl.getBoundingClientRect();
            runFlyAnimation(selectedAnimal.id, rect, selectedAnimal.image);
        }

        try {
            setLoadingGrid(true);
            const label = position.label;

            // Parse row and parking ID. Handles "A1" or "R1-1"
            let rowNum = label.charAt(0);
            let parkId = label.slice(1);

            // If it's a hyphenated label (like R1-1), split it
            if (label.includes('-')) {
                const parts = label.split('-');
                rowNum = parts[0];
                parkId = parts[1];
            } else if (label.startsWith('R') && !isNaN(Number(label.charAt(1)))) {
                // Potential fallback for "R1-1" without hyphen
                rowNum = label.substring(0, 2);
                parkId = label.substring(2);
            }

            await farmvestService.allocateAnimal(selectedShedId, [
                {
                    rfid_tag_number: selectedAnimal.rfid,
                    row_number: rowNum,
                    parking_id: parkId
                }
            ]);

            alert('Allocation Successful!');
            // Refresh logic: clear selection and trigger manual refetch
            setSelectedAnimalId(null);

            // To prevent full page reload, we manually trigger the fetch calls
            // and clear refs to ensure they execute
            lastFarmIdRef.current = null;
            lastShedIdRef.current = null;
            fetchFarmData(Number(selectedFarmId));
            fetchShedDetails(selectedShedId);
        } catch (error: any) {
            log(`Allocation Failed: ${error.message}`);
            // Extract meaningful error message
            const apiError = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Allocation Failed: ${apiError}`);
            // Do NOT setHasError(true) here, so the user can try again
            // setHasError(true); 
        } finally {
            if (isMounted.current) setLoadingGrid(false);
        }
    };

    // ---------------------------------------------------------
    // 5. MEMOIZED DATA
    // ---------------------------------------------------------
    const stats = useMemo(() => {
        const shed = sheds.find(s => String(s.shed_id) === selectedShedId);
        const cap = shed?.capacity || 300;
        if (selectedShedAlloc) {
            return {
                capacity: cap,
                allocated: selectedShedAlloc.allocated_slots || (cap - (selectedShedAlloc.available_slots || 0)),
                pending: animals.length
            };
        }
        return { capacity: cap, allocated: 0, pending: animals.length };
    }, [sheds, selectedShedId, selectedShedAlloc, animals.length]);

    const displayPositions = useMemo(() => {
        if (gridPositions.length > 0) return gridPositions;
        const mock: any[] = [];
        // Use A, B, C, D for labels inside slots as requested
        ['A', 'B', 'C', 'D'].forEach(r => {
            for (let i = 1; i <= 75; i++) mock.push({ label: `${r}${i}`, status: 'Available', id: `${r}${i}` });
        });
        return mock;
    }, [gridPositions]);

    const rows = useMemo(() => {
        // Updated layout according to user request:
        // Drainage, R1, Feed way, R2, Drainage, R3, Feed way, R4, Drainage
        return ['Drainage', 'R1', 'Feed way', 'R2', 'Drainage', 'R3', 'Feed way', 'R4', 'Drainage'];
    }, []);

    // ---------------------------------------------------------
    // 6. RENDER
    // ---------------------------------------------------------
    if (hasError) {
        return (
            <div className="unallocated-animals-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', backgroundColor: '#FEF2F2', borderRadius: '12px' }}>
                <h2 style={{ color: '#DC2626' }}>API Connection Error Detected</h2>
                <p style={{ color: '#991B1B' }}>The system has been stopped to prevent infinite loops. Review the console for details.</p>
                <button
                    style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => window.location.reload()}
                >
                    Refresh & Restart
                </button>
            </div>
        );
    }

    return (
        <div className="unallocated-animals-container">
            <div className="ua-header">
                <h1><span>Shed Allocation</span></h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div className="ua-select-wrapper">
                    <select className="ua-select" value={selectedFarmId} onChange={(e) => {
                        setSelectedFarmId(e.target.value);
                        setSelectedShedId('');
                        lastShedIdRef.current = null;
                    }}>
                        <option value="">Select Farm</option>
                        {farms.map((f: any) => (
                            <option key={f.farm_id || f.id} value={f.farm_id || f.id}>
                                🚜 {f.farm_name || f.name || 'Unnamed Farm'}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="ua-select-icon" size={20} color="#9CA3AF" />
                </div>

                <div className="ua-select-wrapper">
                    <select className="ua-select" value={selectedShedId} onChange={(e) => setSelectedShedId(e.target.value)} disabled={!selectedFarmId}>
                        <option value="">{!selectedFarmId ? "Select Farm First" : (sheds.length === 0 ? "No Sheds Found" : "Select Shed")}</option>
                        {sheds.map((s: any) => (
                            <option key={s.shed_id || s.id} value={s.shed_id || s.id}>
                                🏠 {s.shed_name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="ua-select-icon" size={20} color="#9CA3AF" />
                </div>
            </div>

            <div className="ua-stats-card">
                <div className="ua-stat-item">
                    <div className="ua-stat-value"><LayoutGrid size={24} color="#3B82F6" />{stats.capacity}</div>
                    <span className="ua-stat-label">Capacity</span>
                </div>
                <div className="ua-stat-item">
                    <div className="ua-stat-value"><PawPrint size={24} color="#15803D" />{stats.allocated}</div>
                    <span className="ua-stat-label">Allocated</span>
                </div>
                <div className="ua-stat-item">
                    <div className="ua-stat-value"><ShoppingBag size={24} color="#F97316" />{stats.pending}</div>
                    <span className="ua-stat-label">Pending</span>
                </div>
            </div>

            <div className="ua-section-title">Select Animal to Allocate</div>
            <div className="ua-animals-list">
                {loadingAnimals ? <div style={{ padding: '20px' }}>Loading animals...</div> : (
                    animals.length > 0 ? animals.map((animal) => (
                        <div
                            key={animal.id}
                            id={`ua-animal-card-${animal.id}`}
                            className={`ua-animal-avatar-card ${selectedAnimalId === animal.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAnimalId(animal.id)}
                        >
                            <img
                                src={animal.image}
                                alt={animal.id}
                                className="ua-animal-img"
                                onError={(e) => {
                                    const fallback = 'https://via.placeholder.com/100?text=No+Img';
                                    if (e.currentTarget.src !== fallback) {
                                        e.currentTarget.src = fallback;
                                    }
                                }}
                            />
                            <span className="ua-animal-id" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{animal.display_text || animal.rfid || 'Animal'}</span>
                            {animal.onboarding_time && (
                                <span className="ua-animal-time" style={{ fontSize: '0.65rem', color: '#6B7280', marginTop: '2px' }}>
                                    Onboarded at: {formatDate(animal.onboarding_time)}
                                </span>
                            )}
                        </div>
                    )) : <div style={{ padding: '10px' }}>{selectedFarmId ? "No unallocated animals." : "Select farm first."}</div>
                )}
            </div>

            {loadingGrid ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 size={32} className="animate-spin" color="#2E7D32" /></div>
            ) : (
                <CommonShedGrid
                    positions={displayPositions}
                    layout="row"
                    groups={rows}
                    onSlotClick={(pos, e) => handleGridSlotClick(pos, e)}
                    renderSlot={(pos: any) => {
                        const isOccupied = pos.status.toLowerCase() !== 'available';
                        const displayImg = pos.animal_image || "/buffalo_green_icon.png";
                        return (
                            <div className="slot-inner-icon">
                                <img
                                    src={displayImg}
                                    alt="animal"
                                    className={`slot-animal-icon ${isOccupied && !pos.animal_image ? 'faded' : ''}`}
                                />
                                <span className="slot-label">
                                    {isOccupied ? (pos.rfid_tag_number || pos.label) : pos.label}
                                </span>
                                {isOccupied && pos.onboarding_time && (
                                    <span className="slot-time">
                                        {formatDate(pos.onboarding_time)}
                                    </span>
                                )}
                            </div>
                        );
                    }}
                />
            )}
        </div>
    );
};

export default UnallocatedAnimals;
