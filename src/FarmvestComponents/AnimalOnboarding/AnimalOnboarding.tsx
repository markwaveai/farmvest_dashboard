import React, { useState, useEffect, useRef } from 'react';
import './AnimalOnboarding.css';
import { useNavigate } from 'react-router-dom';
import { farmvestService } from '../../services/farmvest_api';
import { uploadToFirebase } from '../../config/firebaseAppConfig';
import SuccessToast from '../../components/common/SuccessToast/ToastNotification';
import { Receipt, ChevronRight, Loader2, User, Trash2, Camera, QrCode, Tag, Cake, Pencil, Wand2, Smartphone } from 'lucide-react';

interface UserProfile {
    name: string;
    mobile: string;
    email: string;
}

interface Order {
    id: string;
    buffaloCount: number;
    calfCount: number;
    totalCost: number;
    placedAt: string;
    status: string;
    paymentStatus: string;
}

interface AnimalDetail {
    id: number;
    type: 'Buffalo' | 'Calf';
    rfidTag: string;
    earTag: string;
    age: string;
    parentBuffaloId?: number;
    photos: string[];
    index: number;
    status: 'Pending' | 'Completed';
    isUploading?: boolean;
}

interface Farm {
    farm_id: number;
    farm_name: string;
    location: string;
}interface Employee {
    id: number;
    full_name: string;
    role: string;
}

const AnimalOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [orders, setOrders] = useState<Order[] | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchedMobile, setSearchedMobile] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchNotFound, setSearchNotFound] = useState(false);

    // API Data States
    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | string>('');


    const [animals, setAnimals] = useState<AnimalDetail[]>([]);
    const [toastVisible, setToastVisible] = useState(false);

    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMobileChange = (val: string) => {
        setMobile(val);
        if (val.length > 0) {
            const lowerVal = val.toLowerCase();
            const filtered = allMembers.filter(member =>
                (member.displayName?.toLowerCase().includes(lowerVal)) ||
                (member.mobile?.includes(val))
            );
            setFilteredMembers(filtered.slice(0, 10)); // Show top 10 matches
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
        }
    };

    const handleSelectMember = (member: any) => {
        setMobile(member.mobile);
        setSelectedMember(member);
        setShowDropdown(false);
    };

    // Fetch initial data on load
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                console.log("Fetching initial data in AnimalOnboarding...");
                const [farmData, investorData] = await Promise.all([
                    farmvestService.getAllFarms(),
                    farmvestService.getAllInvestors({ size: 5000 })
                ]);

                // Parse Farms
                let farmList: Farm[] = [];
                if (Array.isArray(farmData)) {
                    farmList = farmData;
                } else if (farmData.farms && Array.isArray(farmData.farms)) {
                    farmList = farmData.farms;
                } else if (farmData.data && Array.isArray(farmData.data)) {
                    farmList = farmData.data;
                }
                const normalizedFarms = farmList.map((f: any) => ({
                    farm_id: f.farm_id || f.id || 0,
                    farm_name: f.farm_name || f.name || 'Unknown Farm',
                    location: f.location || ''
                }));
                setFarms(normalizedFarms);

                // Parse Investors
                let investorList: any[] = [];
                if (Array.isArray(investorData)) {
                    investorList = investorData;
                } else if (investorData.data && Array.isArray(investorData.data)) {
                    investorList = investorData.data;
                } else if (investorData.investors && Array.isArray(investorData.investors)) {
                    investorList = investorData.investors;
                }

                // Unified Member List Normalization (Investors Only)
                const normalizedInvestors = investorList.map((inv: any) => ({
                    ...inv,
                    displayName: inv.full_name || `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || 'Unknown Investor',
                    mobile: inv.mobile || inv.mobile_number || inv.phone_number || '', // Ensure phone_number is mapped
                    id: inv.id || inv.investor_id || 0,
                    type: 'investor'
                }));

                const combined = [...normalizedInvestors];
                setAllMembers(combined);

                console.log("Initial data loaded:", {
                    farms: normalizedFarms.length,
                    investors: normalizedInvestors.length,
                    totalMembers: combined.length
                });
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        fetchInitialData();
    }, []);

    // handlePhotoSelect now uploads IMMEDIATELY
    const handlePhotoSelect = async (animalId: number, fileList: FileList) => {
        if (!fileList || fileList.length === 0) return;
        const selectedFiles = Array.from(fileList);

        // Set uploading state for this animal (optional UX improvement)
        setAnimals(prev => prev.map(a => a.id === animalId ? { ...a, isUploading: true } : a));

        try {
            console.log(`Uploading ${selectedFiles.length} images for animal ID ${animalId}...`);
            // Upload all files concurrently
            const uploadedUrls = await Promise.all(selectedFiles.map(file => uploadToFirebase(file)));

            console.log("Uploads complete. URLs:", uploadedUrls);

            // Update state with new REAL Firebase URLs
            setAnimals(prev => prev.map(a => {
                if (a.id === animalId) {
                    return {
                        ...a,
                        photos: [...a.photos, ...uploadedUrls],
                        isUploading: false
                    };
                }
                return a;
            }));
        } catch (error) {
            console.error("Upload failed:", error);
            setAnimals(prev => prev.map(a => a.id === animalId ? { ...a, isUploading: false } : a));
        }
    };

    const handleRemovePhoto = (animalId: number, indexToRemove: number) => {
        setAnimals(prev => prev.map(a => {
            if (a.id === animalId) {
                const newPhotos = a.photos.filter((_, i) => i !== indexToRemove);
                return { ...a, photos: newPhotos };
            }
            return a;
        }));
    };

    const handleDeleteAnimal = (animalId: number) => {
        setAnimals(prev => prev.filter(a => a.id !== animalId));
    };

    // Initialize animals when order is selected
    useEffect(() => {
        if (selectedOrder) {
            const newAnimals: AnimalDetail[] = [];
            let currentIndex = 1;

            const bCount = selectedOrder.buffaloCount > 0 ? selectedOrder.buffaloCount : 1;
            const cCount = selectedOrder.calfCount > 0 ? selectedOrder.calfCount : 0; // Fixed: default to 0 if not specified

            // Add Buffaloes
            for (let i = 0; i < bCount; i++) {
                newAnimals.push({
                    id: Date.now() + i,
                    type: 'Buffalo',
                    rfidTag: '',
                    earTag: '',
                    age: '',
                    photos: [],
                    index: currentIndex++,
                    status: 'Pending'
                });
            }

            // Add Calves
            for (let i = 0; i < cCount; i++) {
                newAnimals.push({
                    id: Date.now() + 100 + i,
                    type: 'Calf',
                    rfidTag: '',
                    earTag: '',
                    age: '',
                    photos: [],
                    index: currentIndex++,
                    status: 'Pending'
                });
            }
            setAnimals(newAnimals);
        } else {
            setAnimals([]);
        }
    }, [selectedOrder]);

    const normalizeOrder = (o: any): Order => {
        const parseNum = (val: any) => {
            if (val === undefined || val === null) return 0;
            const n = parseInt(val, 10);
            return isNaN(n) ? 0 : n;
        };
        return {
            id: o.id || o.order_id || 'N/A',
            buffaloCount: parseNum(o.buffaloCount || o.buffalo_count || o.buffaloes_count || o.buffaloesCount || o.quantity || 0) || 1,
            calfCount: parseNum(o.calfCount || o.calf_count || o.calves_count || o.calvesCount),
            totalCost: parseNum(o.totalCost || o.total_amount || o.totalCost || o.amount),
            placedAt: o.placedAt || o.created_at || o.date || new Date().toISOString(),
            status: o.status || 'pending',
            paymentStatus: o.paymentStatus || o.payment_status || 'paid'
        };
    };

    const handleFind = async () => {
        if (!mobile) return;

        setLoading(true);
        setOrders(null);
        setUser(null);
        setSearchNotFound(false);

        try {
            let userData: UserProfile | null = null;
            let isValidUser = false;

            // 0. Pre-validation: Check if user exists locally or in API
            // Check local cache first
            const localMatch = allMembers.find(m => (m.mobile || m.mobile_number) === mobile);
            if (localMatch) {
                isValidUser = true;
                userData = {
                    name: localMatch.displayName,
                    mobile: localMatch.mobile,
                    email: localMatch.email || ''
                };
            } else {
                // Check API if not found locally
                try {
                    const employeeResults = await farmvestService.searchEmployee(mobile);
                    if (employeeResults && Array.isArray(employeeResults) && employeeResults.length > 0) {
                        isValidUser = true;
                        const match = employeeResults.find((e: any) =>
                            (e.mobile || e.mobile_number) === mobile
                        ) || employeeResults[0];
                        userData = {
                            name: match.full_name || `${match.first_name || ''} ${match.last_name || ''}`.trim(),
                            mobile: match.mobile || match.mobile_number,
                            email: match.email || ''
                        };
                    }
                } catch (err) {
                    console.warn('User validation failed:', err);
                }
            }

            if (!isValidUser) {
                setSearchNotFound(true);
                setLoading(false);
                return;
            }

            // proceed to get orders (mock) only if user is valid
            let ordersList: Order[] = [];

            if (isValidUser && localMatch) {
                const investorId = localMatch.id || localMatch.user_id || localMatch.investor_id || localMatch.uid;
                if (investorId) {
                    try {
                        console.log(`Fetching animals for investor ID: ${investorId}`);
                        const animalData = await farmvestService.getAnimalsByInvestor(investorId);
                        console.log("Fetched Animals:", animalData);

                        let bCount = 0;
                        let cCount = 0;
                        // Handle potential response structures (array or object with data/animals property)
                        const list = Array.isArray(animalData) ? animalData : (animalData.data || animalData.animals || []);
                        let totalInvestment = 0;

                        // 1. Initialize with manual calculation (which is 0 initially)
                        // Then override if API provides summaries

                        // 1. Initialize with manual calculation (which is 0 initially)
                        // Then override if API provides summaries

                        // Check if the API response itself has summary stats
                        // We must check the ROOT object (animalData) for stats, not the array
                        const statsSource = animalData;
                        const statsSourceData = (animalData.data && !Array.isArray(animalData.data)) ? animalData.data : {};

                        // Function to try getting value from multiple sources
                        const getVal = (keys: string[]) => {
                            for (const k of keys) {
                                if (statsSource[k] !== undefined) return statsSource[k];
                                if (statsSourceData[k] !== undefined) return statsSourceData[k];
                            }
                            return undefined;
                        };

                        const apiBuffaloCount = getVal(['buffalo_count', 'buffaloes_count', 'buffalo_counts', 'buffaloes']);
                        const apiCalfCount = getVal(['calf_count', 'calves_count', 'calf_counts', 'calves']);
                        const apiTotalInvestment = getVal(['total_investment', 'total_amount', 'investment_amount', 'total_cost', 'total_value']);

                        // Also check the investor object (localMatch) as user suggested
                        const invBuffaloCount = localMatch.buffalo_count || localMatch.buffaloes_count || localMatch.buffaloes;
                        const invCalfCount = localMatch.calf_count || localMatch.calves_count || localMatch.calves;
                        const invTotalInvestment = localMatch.total_investment || localMatch.total_amount || localMatch.investment_amount;

                        // Calculation Loop (Robust) as fallback or verification
                        let manualB = 0;
                        let manualC = 0;
                        let manualInvestment = 0;

                        if (Array.isArray(list)) {
                            list.forEach((a: any) => {
                                // Count Logic - Enhanced for Nested/Linked Calves
                                const typeStr = (a.animal_type || a.type || a.sps_animal_type || a.category || a.species || '').toLowerCase();

                                // Direct type check
                                if (typeStr.includes('buffalo')) {
                                    manualB++;
                                } else if (typeStr.includes('calf')) {
                                    manualC++;
                                }

                                // Nested/Attribute Check (e.g. if calf is a property of the buffalo)
                                if (Array.isArray(a.calves)) {
                                    manualC += a.calves.length;
                                } else if (a.calf_details && Array.isArray(a.calf_details)) {
                                    manualC += a.calf_details.length;
                                } else {
                                    // Check numeric fields if not an array
                                    const nestedCount = Number(a.no_of_calves || a.calf_count || a.calves_count || 0);
                                    if (nestedCount > 0) manualC += nestedCount;
                                }

                                // Cost Logic
                                const rawAmount = a.investment_amount || a.amount || a.cost || a.price || a.total_amount || a.value || a.final_amount || a.buying_price || 0;
                                let amount = 0;
                                if (typeof rawAmount === 'number') {
                                    amount = rawAmount;
                                } else if (typeof rawAmount === 'string') {
                                    const sanitized = rawAmount.replace(/,/g, '').replace(/[^0-9.]/g, '');
                                    amount = parseFloat(sanitized);
                                }
                                if (!isNaN(amount)) manualInvestment += amount;
                            });
                        }

                        // Robust helper to extract a number from any junk
                        const parseAnyNum = (val: any) => {
                            if (val === undefined || val === null) return 0;
                            const str = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
                            const n = parseFloat(str);
                            return isNaN(n) ? 0 : n;
                        };

                        // MAX Strategy: Trust the source that has data (highest value)
                        // This handles cases where API returns 0/null but List implies data, or vice versa.
                        bCount = Math.max(
                            parseAnyNum(apiBuffaloCount),
                            parseAnyNum(invBuffaloCount),
                            manualB
                        );

                        cCount = Math.max(
                            parseAnyNum(apiCalfCount),
                            parseAnyNum(invCalfCount),
                            manualC
                        );

                        totalInvestment = Math.max(
                            parseAnyNum(apiTotalInvestment),
                            parseAnyNum(invTotalInvestment),
                            manualInvestment
                        );

                        console.log("Final Resolved Stats:", {
                            bCount, cCount, totalInvestment,
                            sources: {
                                api: { b: apiBuffaloCount, c: apiCalfCount, inv: apiTotalInvestment },
                                local: { b: invBuffaloCount, c: invCalfCount, inv: invTotalInvestment },
                                manual: { b: manualB, c: manualC, inv: manualInvestment }
                            }
                        });

                        // Create a synthetic order to display the portfolio
                        ordersList.push({
                            id: `PORTFOLIO-${investorId}`,
                            buffaloCount: bCount,
                            calfCount: cCount,
                            totalCost: totalInvestment,
                            placedAt: new Date().toISOString(),
                            status: 'active',
                            paymentStatus: 'paid'
                        });

                    } catch (e) {
                        console.error("Error fetching investor animals", e);
                    }
                }
            }

            if (ordersList.length > 0) {
                setOrders(ordersList);
                if (!userData) {
                    userData = {
                        name: selectedMember?.displayName || 'Investor',
                        mobile: mobile,
                        email: selectedMember?.email || ''
                    };
                }

                // Check for generic or mock names and try to fetch real details
                if (userData.name === 'Mock Investor' || userData.name === 'N/A' || userData.name === 'Investor') {
                    // 1. Try selected member first
                    if (selectedMember) {
                        userData.name = selectedMember.displayName;
                    } else {
                        // 2. Try fetching from API as per user request
                        try {
                            const employeeResults = await farmvestService.searchEmployee(mobile);
                            if (employeeResults && Array.isArray(employeeResults) && employeeResults.length > 0) {
                                // Find exact match if multiple
                                const match = employeeResults.find((e: any) =>
                                    (e.mobile || e.mobile_number) === mobile
                                ) || employeeResults[0];

                                if (match) {
                                    userData.name = match.full_name || `${match.first_name || ''} ${match.last_name || ''}`.trim();
                                    userData.email = match.email || userData.email;
                                }
                            }
                        } catch (err) {
                            console.warn('Failed to fetch employee details:', err);
                        }
                    }
                }
                setUser(userData);
                setSearchedMobile(mobile);
            } else {
                setOrders([]);
                setSearchedMobile(mobile);
                console.warn('No paid orders found for this mobile number.');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnimalChange = (id: number, field: keyof AnimalDetail, value: any) => {
        setAnimals(prev => prev.map(animal =>
            animal.id === id ? { ...animal, [field]: value } : animal
        ));
    };

    const handleAutofill = () => {
        setAnimals(prev => {
            const buffaloes = prev.filter(a => a.type === 'Buffalo');

            return prev.map(animal => {
                const isBuffalo = animal.type === 'Buffalo';
                const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const rfidTag = `RFID-${randomSuffix}-${animal.index.toString().padStart(3, '0')}`;
                const earTag = `ET-${randomSuffix}-${animal.index.toString().padStart(4, '0')}`;
                const age = isBuffalo ? '36' : '6';

                let parentId = animal.parentBuffaloId;
                if (!isBuffalo && buffaloes.length > 0) {
                    parentId = buffaloes[0].id;
                }

                return {
                    ...animal,
                    rfidTag,
                    earTag,
                    age,
                    parentBuffaloId: parentId,
                    status: 'Completed'
                };
            });
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleConfirmOnboarding = async () => {
        if (!selectedOrder || !user) {
            alert('Missing order or user details. Please try searching again.');
            console.warn('Missing order or user details.');
            return;
        }

        const incompleteAnimals = animals.filter(a => {
            if (!a.rfidTag || !a.earTag || !a.age) return true;
            if (a.type === 'Calf' && !a.parentBuffaloId) return true;
            return false;
        });

        if (incompleteAnimals.length > 0) {
            alert(`Please complete RFID, Ear Tag, and Age for all animals.\n${incompleteAnimals.length} animal(s) are incomplete.`);
            console.warn(`Please complete details for all animals. (Incomplete: ${incompleteAnimals.length})`);
            return;
        }

        if (!selectedFarmId || selectedFarmId === 'Show all farms') {
            alert('Please select a Farm Location from the dropdown.');
            console.warn('Please select a Farm Location.');
            return;
        }


        const getParentRfid = (parentId: number | undefined) => {
            if (!parentId) return '';
            const parent = animals.find(a => a.id === parentId);
            return parent ? parent.rfidTag : '';
        };

        setLoading(true);
        try {
            const payload = {
                animals: animals.map(a => {
                    const isBuffalo = a.type === 'Buffalo';
                    const baseAnimal = {
                        age_months: parseInt(a.age) || 0,
                        animal_id: isBuffalo ? `BUFF-V-${a.index.toString().padStart(3, '0')}` : `CALF-${a.index.toString().padStart(3, '0')}`,
                        animal_type: isBuffalo ? "BUFFALO" : "CALF",
                        breed_id: "MURRAH-001",
                        breed_name: "Murrah Buffalo",
                        ear_tag: a.earTag,
                        health_status: "HEALTHY",
                        images: a.photos.length > 0 ? a.photos : [],
                        neckband_id: `NB-${a.rfidTag.split('-').pop() || '0000'}`,
                        rfid_tag: a.rfidTag,
                        status: "high_yield"
                    };

                    if (isBuffalo) {
                        return baseAnimal;
                    } else {
                        return {
                            age_months: parseInt(a.age) || 0,
                            animal_id: `CALF-${a.index.toString().padStart(3, '0')}`,
                            animal_type: "CALF",
                            health_status: "HEALTHY",
                            parent_animal_id: getParentRfid(a.parentBuffaloId),
                            rfid_tag: a.rfidTag,
                            images: a.photos.length > 0 ? a.photos : []
                        };
                    }
                }),
                farm_id: Number(selectedFarmId),
                // employee_id removed as per request format
                investment_details: {
                    animalkart_order_id: selectedOrder.id,
                    bank_name: "HDFC Bank - PARK STREET", // Hardcoded default as per request example or could be from order if available
                    number_of_units: (selectedOrder.buffaloCount || 0) + (selectedOrder.calfCount || 0),
                    order_date: selectedOrder.placedAt,
                    payment_method: "BANK_TRANSFER", // Forced as per request example
                    payment_verification_screenshot: "https://firebasestorage.googleapis.com/v0/b/app/o/payment_receipt.jpg",
                    total_investment_amount: selectedOrder.totalCost,
                    unit_cost: selectedOrder.totalCost / (Math.max((selectedOrder.buffaloCount || 1), 1)),
                    utr_number: "HDFC123456ABCD" // Hardcoded default
                },
                investor_details: {
                    email: user.email || "no-email@example.com",
                    full_name: user.name,
                    investor_id: String((user as any).id || user.mobile),
                    kyc_details: {
                        aadhar_back_url: "https://firebasestorage.googleapis.com/v0/b/app/o/aadhar_back.jpg",
                        aadhar_front_url: "https://firebasestorage.googleapis.com/v0/b/app/o/aadhar_front.jpg",
                        aadhar_number: "412867484526",
                        pan_card_url: "https://firebasestorage.googleapis.com/v0/b/app/o/pan_card.pdf"
                    },
                    mobile: user.mobile
                }
            };

            await farmvestService.onboardAnimal(payload);
            setToastVisible(true);

            setTimeout(() => {
                navigate('/farmvest/unallocated-animals');
            }, 1500);

            setSelectedOrder(null);
            setOrders(null);
            setMobile('');
        } catch (error) {
            console.error('Onboarding failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (selectedOrder) {
            setSelectedOrder(null);
        } else {
            navigate(-1);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    return (
        <div className="animal-onboarding-container">
            <div className="onboarding-header">
                {selectedOrder && (
                    <button className="back-btn" onClick={handleBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
                <h1>{selectedOrder ? 'Order Details' : 'Admin Animal Onboarding'}</h1>
            </div>

            {!selectedOrder && (
                <>
                    <div className="onboarding-search-container">
                        <div className="search-input-wrapper" ref={dropdownRef}>
                            <Smartphone size={20} className="phone-icon" color="#6B7280" />
                            <input
                                type="text"
                                placeholder="Search by Investor name or mobile number..."
                                value={mobile}
                                onChange={(e) => handleMobileChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                                onFocus={() => mobile.length > 0 && setShowDropdown(true)}
                            />
                            {showDropdown && filteredMembers.length > 0 && (
                                <div className="search-results-dropdown">
                                    {filteredMembers.map((member, idx) => (
                                        <div
                                            key={`${member.type}-${member.id || idx}`}
                                            className="search-result-item"
                                            onClick={() => handleSelectMember(member)}
                                        >
                                            <div className="member-info-row">
                                                <span className="member-name">{member.displayName}</span>
                                                {member.type === 'employee' && (
                                                    <span className="member-badge employee-badge">Staff</span>
                                                )}
                                            </div>
                                            <span className="member-mobile">📱 {member.mobile}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showDropdown && mobile.length > 0 && filteredMembers.length === 0 && (
                                <div className="search-results-dropdown">
                                    <div className="no-results">No members found</div>
                                </div>
                            )}
                        </div>
                        <button className="find-btn" onClick={handleFind} disabled={loading}>
                            {loading ? 'Finding...' : 'Find'}
                        </button>
                    </div>
                    {searchNotFound && (
                        <div className="search-not-found-message" style={{
                            textAlign: 'center',
                            marginTop: '20px',
                            padding: '20px',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            borderRadius: '8px',
                            border: '1px solid #FECACA'
                        }}>
                            <h3>Search not found</h3>
                            <p>No member found with mobile number: {searchedMobile || mobile}</p>
                        </div>
                    )}
                    {orders && orders.length > 0 && !searchNotFound && (
                        <div className="orders-overlay">
                            <div className="orders-header">
                                <h2>Paid Orders for {searchedMobile}</h2>
                            </div>
                            <div className="orders-list">
                                {orders.map((order, index) => (
                                    <div key={order.id || index} className="order-card" onClick={() => setSelectedOrder(order)}>
                                        <div className="order-card-icon">
                                            <Receipt size={24} color="#2E7D32" strokeWidth={1.5} />
                                        </div>
                                        <div className="order-card-content">
                                            <div className="order-user-info">
                                                <h3 className="order-user-name">{user?.name || 'N/A'}</h3>
                                                <div className="order-user-mobile-wrapper">
                                                    <span className="order-user-mobile-icon">📱</span>
                                                    <span className="order-user-mobile">{user?.mobile || searchedMobile}</span>
                                                </div>
                                            </div>
                                            <div className="order-id">Order #{order.id}</div>
                                            <div className="order-stats-divider"></div>
                                            <div className="order-stats">
                                                <div className="stat-item">
                                                    <span className="stat-label"><span className="stat-icon">🐃</span> Buffalo</span>
                                                    <span className="stat-value">{order.buffaloCount}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-label"><span className="stat-icon">🐄</span> Calf</span>
                                                    <span className="stat-value">{order.calfCount}</span>
                                                </div>
                                                <div className="stat-item total-amount">
                                                    <span className="stat-label"><span className="stat-icon">💵</span> Total</span>
                                                    <span className="stat-value">{formatCurrency(order.totalCost)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="order-card-action">
                                            <ChevronRight size={20} color="#9CA3AF" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {selectedOrder && (
                <div className="order-details-wrapper">
                    <div className="order-details-container">
                        <div className="detail-card investor-profile-card">
                            <div className="detail-card-header">
                                <User size={20} className="detail-icon" />
                                <h3>Investor Profile</h3>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Name</span>
                                <span className="detail-value">{user?.name || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Mobile</span>
                                <span className="detail-value">{user?.mobile || searchedMobile}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{user?.email || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="detail-card investment-details-card">
                            <div className="detail-card-header">
                                <Receipt size={20} className="detail-icon" />
                                <h3>Investment Details</h3>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Order ID</span>
                                <span className="detail-value text-dark-bold">{selectedOrder.id}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Total Cost</span>
                                <span className="detail-value text-dark-bold">{formatCurrency(selectedOrder.totalCost)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">UTR Number</span>
                                <span className="detail-value">{'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date</span>
                                <span className="detail-value">{formatDate(selectedOrder.placedAt)}</span>
                            </div>
                        </div>

                        {/* Updated Farm and Shed Selection */}
                        <div className="farm-select-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <select
                                className="farm-select"
                                value={selectedFarmId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedFarmId(val);
                                    if (val) {
                                        localStorage.setItem('fv_selected_farm_id', String(val));
                                    } else {
                                        localStorage.removeItem('fv_selected_farm_id');
                                    }
                                }}
                                style={{ maxWidth: '300px' }}
                            >
                                <option value="">Select Farm Location</option>
                                {farms.map(f => (
                                    <option key={f.farm_id} value={f.farm_id}>
                                        {f.farm_name} - {f.location}
                                    </option>
                                ))}
                            </select>

                        </div>
                    </div>

                    <div className="animals-list-container">
                        {animals.map((animal) => (
                            <div key={animal.id} className="animal-card">
                                <div className="animal-card-header">
                                    <div className="header-left">
                                        <div className="animal-index-badge">#{animal.index}</div>
                                        <div className="animal-title-section">
                                            <h3>{animal.type}</h3>
                                            <span className="enter-details-text">Enter details below</span>
                                        </div>
                                    </div>
                                    <div className="header-right">
                                        <div className="status-badge pending">
                                            <Pencil size={12} color="#F97316" />
                                            <span>Pending</span>
                                        </div>
                                        <button className="delete-btn" onClick={() => handleDeleteAnimal(animal.id)}>
                                            <Trash2 size={18} color="#EF4444" />
                                        </button>
                                    </div>
                                </div>

                                <div className="animal-form-grid">
                                    <div className="form-group">
                                        <label>RFID Tag</label>
                                        <div className="input-with-icon">
                                            <QrCode size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="RFID-X..."
                                                value={animal.rfidTag}
                                                onChange={(e) => handleAnimalChange(animal.id, 'rfidTag', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Ear Tag</label>
                                        <div className="input-with-icon">
                                            <Tag size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="ET-XXXX"
                                                value={animal.earTag}
                                                onChange={(e) => handleAnimalChange(animal.id, 'earTag', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Age (Months)</label>
                                        <div className="input-with-icon">
                                            <Cake size={18} className="input-icon" />
                                            <input
                                                type="number"
                                                placeholder="36"
                                                value={animal.age}
                                                onChange={(e) => handleAnimalChange(animal.id, 'age', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Parent Buffalo</label>
                                        {animal.type === 'Calf' ? (
                                            <select
                                                className="parent-select"
                                                value={animal.parentBuffaloId || ''}
                                                onChange={(e) => handleAnimalChange(animal.id, 'parentBuffaloId', parseInt(e.target.value))}
                                            >
                                                <option value="">Select Parent Buffalo</option>
                                                {animals.filter(a => a.type === 'Buffalo').map(b => (
                                                    <option key={b.id} value={b.id}>Buffalo #{b.index}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="input-with-icon disabled">
                                                <input type="text" value="N/A" disabled style={{ backgroundColor: '#F3F4F6' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="photos-section">
                                    <label>Photos ({animal.photos.length})</label>
                                    <div className="photos-grid">
                                        {animal.photos.map((photo, idx) => (
                                            <div key={idx} className="photo-preview">
                                                <img src={photo} alt={`Animal ${idx + 1}`} />
                                                <button
                                                    className="remove-photo-btn"
                                                    onClick={() => handleRemovePhoto(animal.id, idx)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {animal.isUploading ? (
                                            <div className="uploading-indicator">
                                                <Loader2 size={24} className="animate-spin" color="#2E7D32" />
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    className="add-photo-btn"
                                                    onClick={() => document.getElementById(`file-input-${animal.id}`)?.click()}
                                                >
                                                    <Camera size={24} color="#2E7D32" />
                                                    <span>Add</span>
                                                </button>
                                                <input
                                                    id={`file-input-${animal.id}`}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files.length > 0) {
                                                            handlePhotoSelect(animal.id, e.target.files);
                                                        }
                                                    }}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="onboarding-actions" style={{ flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                        <button
                            className="autofill-btn"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#F97316',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                padding: '8px'
                            }}
                            onClick={handleAutofill}
                        >
                            <Wand2 size={16} color="#F97316" />
                            Autofill Test Data
                        </button>

                        <button
                            className="confirm-onboarding-btn"
                            style={{ width: '100%', maxWidth: '400px' }}
                            onClick={handleConfirmOnboarding}
                        >
                            Confirm Onboarding
                        </button>
                    </div>
                </div>
            )}
            <SuccessToast
                message="Animal Onboarding Successful!"
                isVisible={toastVisible}
                onClose={() => setToastVisible(false)}
            />
        </div>
    );
};

export default AnimalOnboarding;
