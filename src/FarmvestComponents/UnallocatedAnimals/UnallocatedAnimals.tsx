import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './UnallocatedAnimals.css';
import { ChevronDown, Video, LayoutGrid, PawPrint, ShoppingBag, Loader2, Camera } from 'lucide-react';
import CommonShedGrid from '../../components/common/ShedGrid/CommonShedGrid';
import { farmvestService } from '../../services/farmvest_api';
import AnimalDetailsModal from '../AnimalDetailsModal';

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
    uuid?: string; // Raw Backend UUID
    isOccupied?: boolean;
    investor_name?: string;
    display_text?: string;
    onboarding_time?: string;
}

const UnallocatedAnimals: React.FC = () => {
    // ---------------------------------------------------------
    // 1. STATE
    // ---------------------------------------------------------
    const location = useLocation();
    const navState = location.state as { farmId?: string; shedId?: string } | null;

    const [farms, setFarms] = useState<Farm[]>([]);
    const [sheds, setSheds] = useState<Shed[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<string>(() => {
        if (navState?.farmId) {
            localStorage.setItem('fv_selected_farm_id', navState.farmId);
            return navState.farmId;
        }
        return localStorage.getItem('fv_selected_farm_id') || '';
    });
    const [selectedShedId, setSelectedShedId] = useState<string>(navState?.shedId || '');
    const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

    const [animals, setAnimals] = useState<Animal[]>([]);
    const [loadingAnimals, setLoadingAnimals] = useState(false);
    const [gridPositions, setGridPositions] = useState<any[]>([]);
    const [loadingGrid, setLoadingGrid] = useState(false);
    const [selectedShedAlloc, setSelectedShedAlloc] = useState<any>(null);

    // BATCH ALLOCATION STATE
    // Map<SlotLabel, AnimalID>
    const [pendingAllocations, setPendingAllocations] = useState<Map<string, string>>(new Map());
    const [isSaving, setIsSaving] = useState(false);

    // Fail-safe "Stop" when API fails
    const [hasError, setHasError] = useState(false);

    // Modal State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedParkingId, setSelectedParkingId] = useState<string | undefined>(undefined);
    const [selectedRowContext, setSelectedRowContext] = useState<string | undefined>(undefined);

    // ---------------------------------------------------------
    // 2. STABILITY REFS (Guaranteed One-Time Fetching)
    // ---------------------------------------------------------
    const lastFarmIdRef = useRef<string | null>(null);
    const lastShedIdRef = useRef<string | null>(null);
    const isMounted = useRef(false);

    const log = useCallback((msg: string) => console.log(`[FarmVest Final] ${new Date().toLocaleTimeString()}: ${msg}`), []);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            const day = date.getDate();
            const month = date.getMonth() + 1; // 0-indexed
            const time = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            return `${day}/${month} ${time}`;
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

                // Check all possible image fields
                if (a.images && Array.isArray(a.images) && a.images.length > 0 && a.images[0]) {
                    imgUrl = a.images[0];
                } else if (a.image && typeof a.image === 'string' && a.image.trim() !== '') {
                    imgUrl = a.image;
                } else if (a.photos && Array.isArray(a.photos) && a.photos.length > 0 && a.photos[0]) { // Check 'photos'
                    imgUrl = a.photos[0];
                } else if (a.documents && Array.isArray(a.documents) && a.documents.length > 0) { // Check 'documents'
                    // Sometimes images are stored in documents with type 'image' or just as strings
                    const docImg = a.documents.find((d: any) => typeof d === 'string' && (d.startsWith('http') || d.startsWith('data:image')));
                    if (docImg) imgUrl = docImg;
                }

                // Filter out the specific bad fallback URL from previous onboardings
                if (imgUrl.includes('payment_receipt.jpg')) {
                    imgUrl = 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=100&h=100&fit=crop';
                }

                if (imgUrl.includes('unsplash') && (a.rfid || a.rfid_tag_number)) {
                    console.warn(`[UnallocatedAnimals] Missing image for animal ${a.rfid || a.rfid_tag_number}. Data:`, a);
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
                    uuid: a.animal_id || a.id, // Store raw UUID for API calls
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

            // DYNAMIC SHED ID CALCULATION RESTORED
            // Formula: ((FarmIndex - 1) * 12) + ShedIndex
            let numericId = Number(sId);
            if (selectedFarmId) {
                const farmIndex = farms.findIndex((f: any) => String(f.farm_id || f.id) === String(selectedFarmId)) + 1;
                const shedIndex = sheds.findIndex((s: any) => String(s.shed_id || s.id) === String(sId)) + 1;
                if (farmIndex > 0 && shedIndex > 0) {
                    numericId = ((farmIndex - 1) * 12) + shedIndex;
                }
            }
            if (isNaN(numericId)) numericId = Number(sId);

            log(`Fetching Shed: ${sId} (Numeric: ${numericId})`);

            const [animalsResponse, gridData] = await Promise.all([
                farmvestService.getTotalAnimals(Number(selectedFarmId), Number(sId)).catch(e => {
                    log(`Note: Animal fetch failed (possibly empty): ${sId}`);
                    return { data: [] };
                }),
                // Use available_positions as requested by USER
                farmvestService.getShedPositions(numericId as any).catch(e => {
                    log(`Warning: Shed positions fetch failed: ${e.message}`);
                    return [];
                })
            ]);

            if (!isMounted.current) return;

            const allocatedAnimals = animalsResponse?.data || [];
            const allocationMap = new Map();
            const rowToLetter: { [key: string]: string } = { 'R1': 'A', 'R2': 'B', 'R3': 'C', 'R4': 'D' };

            allocatedAnimals.forEach((a: any) => {
                // Key it by the short identifier we expect in the grid (e.g. "A1")
                // Row can be R1, R2...
                const rowLetter = rowToLetter[a.row_number] || a.row_number;

                // Try to extract the short label from the long parking_id or use provided info
                let shortId = null;
                if (a.parking_id) {
                    const match = a.parking_id.match(/[A-DF][0-9]+$/);
                    shortId = match ? match[0] : a.parking_id;
                }

                if (shortId) {
                    allocationMap.set(shortId, a);
                    // Also key by the literal label if it's stored differently
                    allocationMap.set(`${rowLetter}${shortId.replace(/^\D+/, '')}`, a);
                }

                // Fallback: search by RFID too if needed
                if (a.rfid_tag_number) allocationMap.set(a.rfid_tag_number, a);
            });

            // 3. Process Positions Layout and Merge with Allocations
            let positions: any[] = [];
            const extractPositions = (pkg: any, rowContext?: string) => {
                if (!pkg) return;

                if (Array.isArray(pkg)) {
                    const processed = pkg.map(p => {
                        const base = typeof p === 'string' ? { label: p, id: p } : { ...p };
                        return { ...base, _rowContext: rowContext };
                    });
                    positions = positions.concat(processed);
                } else if (typeof pkg === 'object') {
                    if (pkg.available || pkg.filled) {
                        if (Array.isArray(pkg.available)) {
                            const avail = pkg.available.map((p: any) => {
                                const base = typeof p === 'string' ? { label: p, id: p } : { ...p };
                                return { ...base, status: 'Available', _rowContext: rowContext };
                            });
                            positions = positions.concat(avail);
                        }
                        if (Array.isArray(pkg.filled)) {
                            const filled = pkg.filled.map((p: any) => {
                                const base = typeof p === 'string' ? { label: p, id: p } : { ...p };
                                return { ...base, status: 'Occupied', _rowContext: rowContext };
                            });
                            positions = positions.concat(filled);
                        }
                        return;
                    }
                    if (pkg.data && (Array.isArray(pkg.data) || typeof pkg.data === 'object')) {
                        extractPositions(pkg.data, rowContext);
                        return;
                    }
                    Object.entries(pkg).forEach(([key, val]: [string, any]) => {
                        const isRowKey = key.match(/^[R|r][0-9]+/);
                        const nextContext = isRowKey ? key : rowContext;
                        extractPositions(val, nextContext);
                    });
                }
            };
            extractPositions(gridData);

            // Mock generation if empty
            if (positions.length === 0) {
                log(`Shed ${sId} layout empty from API. Generating base grid.`);
                const mock: any[] = [];
                ['A', 'B', 'C', 'D'].forEach(r => {
                    for (let i = 1; i <= 75; i++) mock.push({ label: `${r}${i}`, status: 'Available', id: `${r}${i}` });
                });
                positions = mock;
            }

            const mergedPositions = positions.map((p: any) => {
                let rawLabel = p.position_name || p.label || p.id || "";
                if ((!rawLabel || !isNaN(Number(rawLabel))) && p._rowContext) {
                    const letter = rowToLetter[p._rowContext.toUpperCase()] || p._rowContext;
                    rawLabel = `${letter}${rawLabel}`;
                }

                let standardLabel = String(rawLabel);

                // Find allocation
                const animal = allocationMap.get(standardLabel) || allocationMap.get(rawLabel) || allocationMap.get(p.id);
                const isOccupiedFromGrid = p.status && String(p.status).toLowerCase() !== 'available';
                const finalStatus = (animal || isOccupiedFromGrid) ? 'Occupied' : 'Available';

                return {
                    ...p,
                    label: standardLabel,
                    status: finalStatus,
                    isOccupied: (finalStatus === 'Occupied'),
                    animal_image: animal?.images?.[0] || p.animal_image || p.image,
                    rfid_tag_number: animal?.rfid_tag_number || p.rfid_tag_number,
                    parking_id: animal?.parking_id || p.parking_id || p.id,
                    _animal: animal // Store full object for easy modal access
                };
            });

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

                // Auto-select or Validate Persisted ID from Onboarding Handoff
                const persistedId = localStorage.getItem('fv_selected_farm_id');
                if (persistedId) {
                    const exists = list.some((f: any) => String(f.farm_id || f.id) === persistedId);
                    if (exists) {
                        setSelectedFarmId(persistedId);
                    }
                    // CONSUME ONCE: Clear it so it doesn't persist on refresh or direct navigation later
                    localStorage.removeItem('fv_selected_farm_id');
                }
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
        console.log(`[UnallocatedAnimals] Grid slot clicked:`, position);
        if (hasError) { console.error("API Connection is currently blocked. Please refresh."); return; }

        const isOccupied = position.status.toLowerCase() !== 'available';
        console.log(`[UnallocatedAnimals] Slot isOccupied: ${isOccupied} (Status: ${position.status})`);

        if (isOccupied) {
            // New Requirement: Show Details Modal instead of blocking
            // Use explicit parking_id if available (LONG one), otherwise fallback to label (SHORT one)
            const pId = position.parking_id || position.label || position.id;
            const rContext = position._rowContext;

            console.log(`[UnallocatedAnimals] Opening Details Modal for ParkingID: ${pId}, Context: ${rContext}`);

            setSelectedParkingId(pId);
            setSelectedRowContext(rContext);
            setDetailsModalOpen(true);
            return;
        }

        if (!selectedFarmId) { console.warn('Please select a farm first.'); return; }
        if (!selectedShedId) { console.warn('Please select a shed first.'); return; }
        if (!selectedAnimalId) { console.warn('Please select an animal first.'); return; }

        // BATCH MODE: Toggle pending state
        const slotLabel = position.label;
        const currentPending = new Map(pendingAllocations);

        if (currentPending.has(slotLabel)) {
            // ALREADY HERE? Toggle off (remove)
            currentPending.delete(slotLabel);
        } else {
            // CHECK: Is this animal already pending in ANOTHER slot?
            // If so, remove that old slot first (enforce 1-to-1)
            const entries = Array.from(currentPending.entries());
            for (const [sLabel, sAnimalId] of entries) {
                if (sAnimalId === selectedAnimalId) {
                    currentPending.delete(sLabel);
                    break;
                }
            }

            // Add new pending allocation
            // Note: We allow selecting occupied slots to show the "Red Paw" (invalid) state as requested
            currentPending.set(slotLabel, selectedAnimalId);
        }
        setPendingAllocations(currentPending);
    };

    const handleSaveAllocation = async () => {
        if (pendingAllocations.size === 0) {
            console.warn("No changes to save.");
            return;
        }

        const validAllocations: any[] = [];
        const invalidAllocations: string[] = [];

        // Validate pending items
        pendingAllocations.forEach((animalId, slotLabel) => {
            const slot = gridPositions.find(p => p.label === slotLabel);
            const isOccupied = slot && slot.status.toLowerCase() !== 'available';

            if (isOccupied) {
                invalidAllocations.push(slotLabel);
            } else {
                // Prepare payload item
                const animal = animals.find(a => a.id === animalId);
                if (animal && animal.rfid) {
                    // NEW REQUIREMENT (Step 906):
                    // row_number: "R1", "R2"...
                    // parking_id: "A1", "A2", "B1"... (The Label)

                    let rowNum = 'R1';
                    const letter = slotLabel.charAt(0).toUpperCase();

                    if (letter === 'A') rowNum = 'R1';
                    else if (letter === 'B') rowNum = 'R2';
                    else if (letter === 'C') rowNum = 'R3';
                    else if (letter === 'D') rowNum = 'R4';
                    else if (slotLabel.startsWith('R')) {
                        // Fallback for R1-1 style
                        const match = slotLabel.match(/^R(\d+)/);
                        if (match) rowNum = `R${match[1]}`;
                    }

                    validAllocations.push({
                        rfid_tag_number: animal.uuid || animal.rfid || animal.id, // User Request: Convert RFID to UUID
                        row_number: rowNum,    // "R1"
                        parking_id: slotLabel  // "A1"
                    });
                }
            }
        });

        if (validAllocations.length === 0) {
            console.warn("No valid allocations to save. Please check for red indicators.");
            return;
        }

        try {
            setIsSaving(true);
            await farmvestService.allocateAnimal(selectedShedId, validAllocations);

            console.log(`Successfully allocated ${validAllocations.length} animals!`);

            // Clear all pending state
            setPendingAllocations(new Map());
            setSelectedAnimalId(null);

            // Refetch data
            lastFarmIdRef.current = null;
            lastShedIdRef.current = null;
            fetchFarmData(Number(selectedFarmId));
            fetchShedDetails(selectedShedId);

        } catch (error: any) {
            const apiError = error.response?.data?.message || error.message || 'Unknown error';
            console.error(`Save Failed: ${apiError}`);
        } finally {
            if (isMounted.current) setIsSaving(false);
        }
    };

    // ---------------------------------------------------------
    // 5. MEMOIZED DATA
    // ---------------------------------------------------------
    const stats = useMemo(() => {
        // Dropdown now uses 'id' (numeric PK), so we find based on that.
        // We cast to Number just in case selectedShedId is a string.
        const shed = sheds.find((s: any) => s.id == selectedShedId);
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
                <button
                    className="save-allocation-btn"
                    onClick={handleSaveAllocation}
                    disabled={isSaving || pendingAllocations.size === 0}
                    style={{
                        marginLeft: 'auto',
                        backgroundColor: pendingAllocations.size > 0 ? '#f59e0b' : '#9CA3AF',
                        color: 'white',
                        padding: '8px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: pendingAllocations.size > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
                    {isSaving ? 'Saving...' : `Save Changes (${pendingAllocations.size})`}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div className="ua-select-wrapper">
                    <select className="ua-select" value={selectedFarmId} onChange={(e) => {
                        const val = e.target.value;
                        setSelectedFarmId(val);
                        // Do NOT save to localStorage here. Only Onboarding saves it.
                        setSelectedShedId('');
                        lastShedIdRef.current = null;
                    }}>
                        <option value="">Select Farm</option>
                        {farms.map((f: any) => (
                            <option key={f.farm_id || f.id} value={f.farm_id || f.id}>
                                🚜 {f.farm_name || f.name || 'Unnamed Farm'} - {f.location || 'Unknown'}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="ua-select-icon" size={20} color="#9CA3AF" />
                </div>

                <div className="ua-select-wrapper">
                    <select className="ua-select" value={selectedShedId} onChange={(e) => setSelectedShedId(e.target.value)} disabled={!selectedFarmId}>
                        <option value="">{!selectedFarmId ? "Select Farm First" : (sheds.length === 0 ? "No Sheds Found" : "Select Shed")}</option>
                        {sheds.map((s: any) => (
                            <option key={s.id || s.shed_id} value={s.id || s.shed_id}>
                                🏠 {s.shed_name || s.name || 'Unnamed Shed'}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="ua-select-icon" size={20} color="#9CA3AF" />
                </div>
            </div>

            {/* Stats Cards - Updated to use Shed Object Data */}
            {selectedShedId && (() => {
                // Find the full shed object from the list
                const shed = sheds.find((s: any) => String(s.id) === selectedShedId || s.shed_id === selectedShedId) || {} as any;
                // Use API values or fallbacks
                const capacity = shed.capacity || 300;
                const allocated = shed.current_buffaloes ?? shed.entry_count ?? 0;
                // Pending is local state
                const pendingCount = pendingAllocations.size;

                return (
                    <div className="ua-stats-card">
                        <div className="ua-stat-item">
                            <div className="ua-stat-value"><LayoutGrid size={24} color="#3B82F6" />{capacity}</div>
                            <span className="ua-stat-label">Capacity</span>
                        </div>
                        <div className="ua-stat-item">
                            <div className="ua-stat-value"><PawPrint size={24} color="#15803D" />{allocated}</div>
                            <span className="ua-stat-label">Allocated</span>
                        </div>
                        <div className="ua-stat-item">
                            <div className="ua-stat-value"><ShoppingBag size={24} color="#F97316" />{pendingCount}</div>
                            <span className="ua-stat-label">Pending</span>
                        </div>
                    </div>
                );
            })()}
            <div className="ua-section-title">Select Animal to Allocate</div>
            <div className="ua-animals-list">
                {loadingAnimals ? <div style={{ padding: '20px' }}>Loading animals...</div> : (
                    animals.length > 0 ? animals.map((animal, idx) => (
                        <div
                            key={animal.id}
                            id={`ua-animal-card-${animal.id}`}
                            className={`ua-animal-avatar-card card-animate ${selectedAnimalId === animal.id ? 'selected' : ''}`}
                            style={{ animationDelay: `${idx * 0.05}s` }}
                            onClick={() => setSelectedAnimalId(prev => prev === animal.id ? null : animal.id)}
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
                                    {formatDate(animal.onboarding_time)}
                                </span>
                            )}
                        </div>
                    )) : <div style={{ padding: '10px' }}>{selectedFarmId ? "No unallocated animals." : "Select farm first."}</div>
                )}
            </div>

            {loadingGrid ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 size={32} className="animate-spin" color="#2E7D32" /></div>
            ) : (
                <div className="space-y-2 p-4">
                    {(() => {
                        const Separator = ({ label }: { label: string }) => (
                            <div className="w-full bg-[#f0fdf4]/80 border border-green-100/50 rounded-lg py-1.5 mb-3 shadow-sm flex items-center justify-center">
                                <span className="text-[10px] font-bold text-green-700/60 tracking-widest uppercase">{label}</span>
                            </div>
                        );

                        // Group positions
                        const groupedPositions: Record<string, any[]> = { A: [], B: [], C: [], D: [] };
                        const sortPositions = (a: any, b: any) => {
                            const numA = parseInt(a.label.slice(1));
                            const numB = parseInt(b.label.slice(1));
                            return numA - numB;
                        };

                        displayPositions.forEach((pos: any) => {
                            const letter = pos.label.charAt(0).toUpperCase();
                            if (groupedPositions[letter]) {
                                groupedPositions[letter].push(pos);
                            }
                        });

                        Object.keys(groupedPositions).forEach(key => {
                            groupedPositions[key].sort(sortPositions);
                        });

                        const renderRow = (letter: string, rowLabel: string) => {
                            const rowPositions = groupedPositions[letter];
                            const chunks = [];
                            for (let i = 0; i < rowPositions.length; i += 4) {
                                chunks.push(rowPositions.slice(i, i + 4));
                            }

                            return (
                                <div className="mb-4">
                                    <h4 className="text-[12px] font-bold text-gray-700 mb-1 ml-1">{rowLabel}</h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                                        {chunks.map((chunk, groupIndex) => (
                                            <div key={groupIndex} className="flex flex-col items-center">
                                                {/* Camera Overhead */}
                                                <div className="mb-0.5 flex flex-col items-center animate-pulse">
                                                    <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shadow-sm z-10 transition-transform hover:scale-110 cursor-pointer" title="CCTV Coverage">
                                                        <Camera size={11} className="text-blue-600" />
                                                    </div>
                                                    <div className="h-1.5 w-0.5 bg-blue-200 -mt-0.5"></div>
                                                    <div className="w-full h-0.5 bg-blue-200"></div>
                                                </div>

                                                {/* Group of 4 Slots */}
                                                <div className="flex gap-1 bg-gray-50/50 p-1 rounded-lg border border-dashed border-gray-200 relative pt-1.5 min-w-[164px]">
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-blue-200"></div>
                                                    {chunk.map((pos) => {
                                                        const rawStatus = String(pos.status || 'Available').trim().toLowerCase();
                                                        const isOccupied = rawStatus !== 'available' || (pos.animal && pos.animal.length > 0) || pos.isOccupied;
                                                        const isPending = pendingAllocations.has(pos.label);
                                                        const displayImg = pos.animal_image || "/buffalo_green_icon.png";

                                                        return (
                                                            <div
                                                                key={pos.label}
                                                                className={`flex-shrink-0 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform`}
                                                                onClick={(e) => {
                                                                    handleGridSlotClick(pos, e);
                                                                }}
                                                            >
                                                                <div className={`
                                                                    w-11 h-11 border rounded-md flex flex-col items-center justify-center bg-white shadow-sm transition-all relative overflow-hidden
                                                                    ${isOccupied && !isPending ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}
                                                                    ${isPending ? 'ring-1 ring-emerald-500 border-emerald-500' : ''}
                                                                `}>
                                                                    {/* Occupied State - Green Paw */}
                                                                    {isOccupied && !isPending && (
                                                                        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
                                                                            <PawPrint size={18} color="#22C55E" fill="#22C55E" />
                                                                            <span className="text-[7px] font-bold text-emerald-600 mt-0">{pos.label}</span>
                                                                        </div>
                                                                    )}
                                                                    {/* Pending Overlay */}
                                                                    {isPending && (
                                                                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90">
                                                                            <PawPrint
                                                                                size={18}
                                                                                color={isOccupied ? '#EF4444' : '#22C55E'}
                                                                                fill={isOccupied ? '#EF4444' : '#22C55E'}
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Available State Content (Hidden if Occupied/Pawned) */}
                                                                    {!isOccupied && !isPending && (
                                                                        <>
                                                                            <img
                                                                                src={displayImg}
                                                                                alt="Buffalo"
                                                                                className={`w-4 h-4 object-contain mb-0.5`}
                                                                            />
                                                                            <span className="text-[8px] font-bold text-gray-400">{pos.label}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-4 w-full max-w-full mx-auto">
                                <div className="space-y-1">
                                    <Separator label="DRAINAGE" />
                                    {renderRow('A', 'Row R1')}

                                    <Separator label="FEED WAY" />
                                    {renderRow('B', 'Row R2')}

                                    <Separator label="DRAINAGE" />
                                    {renderRow('C', 'Row R3')}

                                    <Separator label="FEED WAY" />
                                    {renderRow('D', 'Row R4')}

                                    <Separator label="DRAINAGE" />
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
            {/* Occupied Slot Details Modal */}
            <AnimalDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedParkingId(undefined);
                    setSelectedRowContext(undefined);
                }}
                parkingId={selectedParkingId}
                farmId={selectedFarmId ? Number(selectedFarmId) : undefined}
                shedId={selectedShedId ? Number(selectedShedId) : undefined}
                rowNumber={selectedRowContext}
            />
        </div>
    );
};

export default UnallocatedAnimals;
