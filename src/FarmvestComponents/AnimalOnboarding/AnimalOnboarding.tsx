import React, { useState, useEffect, useRef, useMemo } from 'react';
import './AnimalOnboarding.css';
import { useNavigate } from 'react-router-dom';
import { farmvestService } from '../../services/farmvest_api';
import SuccessToast from '../../components/common/SuccessToast/ToastNotification';
import { Receipt, ChevronRight, Loader2, User, Trash2, Camera, QrCode, Tag, Cake, Pencil, Wand2, Smartphone, X, CheckCircle } from 'lucide-react';

const CalfIcon = ({ size = 24, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 512 512" fill={color}>
        <path d="M437.3 112c-4 0-14.7 1.3-27.1 11.2-12.8 10.3-24.1 27.5-27.4 50.8-3.4-2.4-11.8-8.1-24.1-13-17.7-7-35.1-11.3-54.7-11.3v34.7c15.8 0 28.5 3.3 43.1 9.1 12 4.7 18.5 9.4 20.8 11.1-12.7 10.2-18.7 28.1-16.7 49 1.9 19.3 13.5 31.9 31.6 31.9h2c18.5 0 35.8-13.8 38.3-33.5l.8-6.1c1.3-9.5 2.1-18.3 2.1-26.6 0-35.3-7.5-66.2-27.2-94.6-2.5-3.6-5.8-6.6-9.7-8.7-4-2.1-8.5-4-12-4zm-308 0c-3.6 0-8 1.9-12 4-4 2.1-7.2 5.1-9.7 8.7-19.7 28.4-27.2 59.3-27.2 94.6 0 8.2.8 17.1 2 26.6l.8 6.1c2.5 19.8 19.8 33.5 38.3 33.5h2c18.2 0 29.7-12.6 31.6-31.9 2-20.9-4-38.8-16.7-49 2.3-1.7 8.8-6.4 20.8-11.1 14.6-5.8 27.3-9.1 43.1-9.1v-34.7c-19.6 0-37 4.3-54.7 11.3-12.3 4.9-20.7 10.5-24.1 13-3.3-23.3-14.6-40.6-27.4-50.8-12.3-9.9-23-11.2-27.1-11.2zm126.7 54.5c-41.2 0-77.3 36.1-77.3 77.3s36.1 77.3 77.3 77.3 77.3-36.1 77.3-77.3-36.1-77.3-77.3-77.3zm0 34.7c23.5 0 42.7 19.1 42.7 42.7s-19.1 42.7-42.7 42.7-42.7-19.1-42.7-42.7 19.1-42.7 42.7-42.7zm126.3 118.9c-4 0-11.3 2.3-16.7 6.1-28.7 20.3-67.6 32.3-109.6 32.3s-80.9-12-109.6-32.3c-5.3-3.8-12.7-6.1-16.7-6.1-19.2 0-34.7 15.5-34.7 34.7 0 24.3 24.8 55.4 59.3 84.7 11.2 9.5 23.3 18.2 35.7 25.8 20.7 12.6 42.4 21.6 66 21.6s45.3-9 66-21.6c12.4-7.5 24.5-16.2 35.7-25.8 34.5-29.3 59.3-60.4 59.3-84.7 0-19.1-15.5-34.7-34.7-34.7z" />
    </svg>
);

interface UserProfile {
    id: string;
    name: string;
    mobile: string;
    email: string;
    aadhar_number: string;
    aadhar_front_image_url: string;
    aadhar_back_image_url: string;
    panCardUrl: string;
}

interface Order {
    id: string;
    buffaloCount: number;
    calfCount: number;
    totalCost: number;
    unitCost: number;
    numUnits: number;
    placedAt: string;
    status: string;
    paymentStatus: string;
    paymentType: string;
    buffaloIds: string[];
}

interface AnimalDetail {
    id: number;
    uid: string; // Internal unique ID for backend animal_id
    type: 'Buffalo' | 'Calf';
    rfidTag: string;
    earTag: string;
    neckbandId?: string;
    age: string;
    parentBuffaloId?: number;
    photos: string[];
    videos: string[]; // New field for videos
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
    const [noOrdersFound, setNoOrdersFound] = useState(false);

    // API Data States
    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | string>('');


    const [animals, setAnimals] = useState<AnimalDetail[]>([]);
    const [toastVisible, setToastVisible] = useState(false);

    // Calf Modal State
    const [activeParentId, setActiveParentId] = useState<number | null>(null);
    const [tempCalf, setTempCalf] = useState<Partial<AnimalDetail>>({
        rfidTag: '',
        earTag: '',
        age: '6',
        photos: [],
        videos: []
    });

    const [viewingImage, setViewingImage] = useState<string | null>(null);

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

    // handlePhotoSelect now uploads IMMEDIATELY with limits
    const handlePhotoSelect = async (animalId: number, fileList: FileList) => {
        if (!fileList || fileList.length === 0) return;
        const selectedFiles = Array.from(fileList);

        const animal = animals.find(a => a.id === animalId);
        if (!animal) return;

        const { uploadToFirebase } = await import('../../config/firebaseAppConfig');

        const newPhotoUrls: string[] = [];
        const newVideoUrls: string[] = [];

        for (const file of selectedFiles) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (isImage) {
                if (animal.photos.length + newPhotoUrls.length >= 3) {
                    alert('Maximum 3 photos allowed per animal.');
                    continue;
                }
            } else if (isVideo) {
                if (animal.videos.length + newVideoUrls.length >= 1) {
                    alert('Maximum 1 video allowed per animal.');
                    continue;
                }
            } else {
                continue; // Skip unsupported types
            }

            setAnimals(prev => prev.map(a => a.id === animalId ? { ...a, isUploading: true } : a));
            try {
                const url = await uploadToFirebase(file);
                if (isImage) newPhotoUrls.push(url);
                else newVideoUrls.push(url);
            } catch (err) {
                console.error("Upload failed", err);
            }
        }

        setAnimals(prev => prev.map(a => {
            if (a.id === animalId) {
                return {
                    ...a,
                    photos: [...a.photos, ...newPhotoUrls],
                    videos: [...a.videos, ...newVideoUrls],
                    isUploading: false
                };
            }
            return a;
        }));
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

    const handleRemoveVideo = (animalId: number, indexToRemove: number) => {
        setAnimals(prev => prev.map(a => {
            if (a.id === animalId) {
                const newVideos = a.videos.filter((_, i) => i !== indexToRemove);
                return { ...a, videos: newVideos };
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
            const bCount = selectedOrder.buffaloCount || 0;
            const cCount = selectedOrder.calfCount || 0;
            const bIds = selectedOrder.buffaloIds || [];

            // 1. Initialize Buffaloes
            for (let i = 0; i < bCount; i++) {
                const buffaloId = Date.now() + i;
                newAnimals.push({
                    id: buffaloId,
                    uid: bIds[i] || crypto.randomUUID(), // Use ID from list if available
                    type: 'Buffalo',
                    rfidTag: '',
                    earTag: '',
                    age: '',
                    photos: [],
                    videos: [],
                    index: i + 1,
                    status: 'Pending'
                });
            }

            // 2. Initialize Calves and link them to Buffaloes
            for (let i = 0; i < cCount; i++) {
                // Distribute calves among buffaloes (e.g., if 2 B and 2 C, each B gets 1 C)
                // If more calves than buffaloes, some buffaloes get multiple
                const parentBuffalo = newAnimals[i % bCount];

                newAnimals.push({
                    id: Date.now() + 1000 + i,
                    uid: crypto.randomUUID(),
                    type: 'Calf',
                    rfidTag: '',
                    earTag: '',
                    age: '6',
                    photos: [],
                    videos: [],
                    parentBuffaloId: parentBuffalo?.id,
                    index: (parentBuffalo?.index || 0), // Use same index as parent for sorting if needed, or just 1
                    status: 'Pending'
                });
            }

            setAnimals(newAnimals);
            console.log(`Initialized ${bCount} Buffaloes and ${cCount} Calves for Order ${selectedOrder.id}`);
        } else {
            setAnimals([]);
        }
    }, [selectedOrder]);

    const normalizeOrder = (o: any): Order => {
        const parseNum = (val: any) => {
            if (val === undefined || val === null) return 0;
            const n = parseFloat(val);
            return isNaN(n) ? 0 : n;
        };
        return {
            id: o.id || o.order_id || 'N/A',
            buffaloCount: parseNum(o.buffaloCount || o.buffalo_count || 0),
            calfCount: parseNum(o.calfCount || o.calf_count || 0),
            totalCost: parseNum(o.totalCost || o.total_amount || 0),
            unitCost: parseNum(o.unitCost || o.baseUnitCost || 0),
            numUnits: parseNum(o.numUnits || o.num_units || 0),
            placedAt: o.placedAt || o.created_at || new Date().toISOString(),
            status: o.status || 'pending',
            paymentStatus: o.paymentStatus || 'paid',
            paymentType: o.paymentType || o.payment_type || 'BANK_TRANSFER',
            buffaloIds: Array.isArray(o.buffaloIds || o.buffalo_ids) ? (o.buffaloIds || o.buffalo_ids) : []
        };
    };

    const handleFind = async () => {
        if (!mobile) return;

        setLoading(true);
        setOrders(null);
        setUser(null);
        setSearchNotFound(false);
        setNoOrdersFound(false);
        setSearchedMobile(mobile);

        try {
            console.log(`Fetching intransit orders for mobile: ${mobile}`);
            const result = await farmvestService.getPaidOrders(mobile);

            if (result && result.user && Array.isArray(result.orders) && result.orders.length > 0) {
                const u = result.user;
                const userData: UserProfile = {
                    id: u.id || u.mobile || '',
                    name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Investor',
                    mobile: u.mobile || mobile,
                    email: u.email || '',
                    aadhar_number: u.aadhar_number || '',
                    aadhar_front_image_url: u.aadhar_front_image_url || '',
                    aadhar_back_image_url: u.aadhar_back_image_url || '',
                    panCardUrl: u.panCardUrl || ''
                };

                setUser(userData);
                setOrders(result.orders.map(normalizeOrder));
            } else {
                // If result.user is null or orders are empty, check if they exist in our local investor cache
                const investorExists = allMembers.some(m => m.mobile === mobile);
                if (investorExists) {
                    setNoOrdersFound(true);
                } else {
                    setSearchNotFound(true);
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            const investorExists = allMembers.some(m => m.mobile === mobile);
            if (investorExists) {
                setNoOrdersFound(true);
            } else {
                setSearchNotFound(true);
            }
            try {
                const employeeResults = await farmvestService.searchEmployee(mobile);
                if (employeeResults && Array.isArray(employeeResults) && employeeResults.length > 0) {
                    console.log("User exists but has no in-transit orders");
                }
            } catch (e) { }
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

    const isFormComplete = useMemo(() => {
        if (!selectedFarmId || selectedFarmId === 'Show all farms') return false;

        const incompleteAnimals = animals.filter(a => {
            if (!a.rfidTag || !a.earTag || !a.age) return true;
            if (a.type === 'Calf' && !a.parentBuffaloId) return true;
            return false;
        });

        return incompleteAnimals.length === 0;
    }, [animals, selectedFarmId]);

    const handleConfirmOnboarding = async () => {
        if (!selectedOrder || !user) {
            alert('Missing order or user details. Please try searching again.');
            return;
        }

        const incompleteAnimals = animals.filter(a => {
            if (!a.rfidTag || !a.earTag || !a.age) return true;
            if (a.type === 'Calf' && !a.parentBuffaloId) return true;
            return false;
        });

        if (incompleteAnimals.length > 0) {
            alert(`Please complete RFID, Ear Tag, and Age for all animals.`);
            return;
        }

        if (!selectedFarmId || selectedFarmId === 'Show all farms') {
            alert('Please select a Farm Location from the dropdown.');
            return;
        }

        const formatRfid = (tag: string) => {
            if (!tag) return '';
            const clean = tag.trim();
            if (clean.toUpperCase().startsWith('RFID-')) {
                return 'RFID-' + clean.substring(5);
            }
            return `RFID-${clean}`;
        };

        const getParentUid = (parentId: number | undefined) => {
            if (!parentId) return '';
            const parent = animals.find(a => a.id === parentId);
            return parent ? parent.uid : '';
        };

        setLoading(true);
        try {
            const payload = {
                investor_details: {
                    investor_id: user.id,
                    full_name: user.name,
                    mobile: user.mobile,
                    email: user.email || "no-email@example.com",
                    kyc_details: {
                        aadhar_number: user.aadhar_number || "",
                        aadhar_front_url: user.aadhar_front_image_url || "",
                        aadhar_back_url: user.aadhar_back_image_url || "",
                        pan_card_url: user.panCardUrl || ""
                    }
                },
                investment_details: {
                    animalkart_order_id: selectedOrder.id,
                    order_date: selectedOrder.placedAt,
                    total_investment_amount: selectedOrder.totalCost,
                    unit_cost: selectedOrder.unitCost,
                    number_of_units: selectedOrder.numUnits,
                    payment_method: selectedOrder.paymentType || "BANK_TRANSFER",
                    bank_name: "HDFC Bank - PARK STREET",
                    utr_number: "",
                    payment_verification_screenshot: "https://firebasestorage.googleapis.com/v0/b/markwave-481315.firebasestorage.app/o/placeholders%2Fpy.jpg?alt=media"
                },
                animals: animals.map(a => {
                    const isBuffalo = a.type === 'Buffalo';
                    const formattedRfid = formatRfid(a.rfidTag);

                    if (isBuffalo) {
                        return {
                            animal_id: a.uid,
                            animal_type: "BUFFALO",
                            rfid_tag: formattedRfid,
                            ear_tag: a.earTag,
                            neckband_id: a.neckbandId || "",
                            age_months: parseInt(a.age) || 0,
                            health_status: "HEALTHY",
                            images: a.photos.length > 0 ? a.photos : [],
                            videos: a.videos.length > 0 ? a.videos : [],
                            status: "high_yield",
                            breed_id: "MURRAH-001",
                            breed_name: "Murrah Buffalo"
                        };
                    } else {
                        return {
                            animal_id: a.uid,
                            animal_type: "CALF",
                            rfid_tag: formattedRfid,
                            ear_tag: a.earTag,
                            neckband_id: a.neckbandId || "",
                            age_months: parseInt(a.age) || 0,
                            health_status: "HEALTHY",
                            images: a.photos.length > 0 ? a.photos : [],
                            videos: a.videos.length > 0 ? a.videos : [],
                            parent_animal_id: getParentUid(a.parentBuffaloId)
                        };
                    }
                }),
                farm_id: Number(selectedFarmId)
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
                        <button className="find-btn" onClick={handleFind} disabled={loading || !mobile.trim()}>
                            {loading ? 'Finding...' : 'Find'}
                        </button>
                    </div>
                    {searchNotFound && (
                        <div className="search-not-found-message" style={{
                            textAlign: 'center',
                            marginTop: '8px',
                            color: '#EF4444',
                            fontSize: '11px',
                            fontWeight: 500,
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '4px'
                        }}>
                            <span>Search not found.</span>
                            <span style={{ opacity: 0.8 }}>No investor found with mobile number: {searchedMobile}</span>
                        </div>
                    )}
                    {noOrdersFound && !searchNotFound && (
                        <div className="search-not-found-message" style={{
                            textAlign: 'center',
                            marginTop: '8px',
                            color: '#F59E0B', // Amber-500
                            fontSize: '11px',
                            fontWeight: 500,
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.8 }}> no pending in-transit orders for mobile: {searchedMobile}</span>
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
                        {animals.filter(a => a.type === 'Buffalo').map((animal, filteredIdx) => (
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

                                        {animal.rfidTag && animal.earTag && animal.age ? (
                                            <div className="status-badge completed">
                                                <CheckCircle size={10} color="#16A34A" />
                                                <span>Completed</span>
                                            </div>
                                        ) : null}
                                        <button className="delete-btn" onClick={() => handleDeleteAnimal(animal.id)}>
                                            <Trash2 size={18} color="#EF4444" />
                                        </button>
                                    </div>
                                </div>

                                <div className="animal-form-grid">
                                    <div className="form-group">
                                        <label>RFID Tag <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span></label>
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
                                        <label>Ear Tag <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span></label>
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
                                        <label>Age (Months) <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span></label>
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
                                        <label>Neckband ID (Optional)</label>
                                        <div className="input-with-icon">
                                            <Tag size={18} className="input-icon" style={{ rotate: '90deg' }} />
                                            <input
                                                type="text"
                                                placeholder="NB-XXXX"
                                                value={animal.neckbandId || ''}
                                                onChange={(e) => handleAnimalChange(animal.id, 'neckbandId', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {/* Parent Buffalo field removed as requested */}
                                </div>

                                <div className="media-section">
                                    <div className="media-actions-row">
                                        {animal.isUploading ? (
                                            <div className="upload-indicator-box">
                                                <Loader2 size={18} className="animate-spin" color="#2E7D32" />
                                            </div>
                                        ) : (
                                            (animal.photos.length < 3 || animal.videos.length < 1) && (
                                                <>
                                                    <button
                                                        className="media-add-btn"
                                                        onClick={() => document.getElementById(`media-input-${animal.id}`)?.click()}
                                                    >
                                                        <Camera size={20} color="#2E7D32" />
                                                        <span>Add</span>
                                                    </button>
                                                    <input
                                                        id={`media-input-${animal.id}`}
                                                        type="file"
                                                        accept="image/*,video/*"
                                                        multiple
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files.length > 0) {
                                                                handlePhotoSelect(animal.id, e.target.files);
                                                            }
                                                        }}
                                                    />
                                                </>
                                            )
                                        )}

                                        {/* Calf Details Trigger - Beside Add button */}
                                        <button
                                            className="calf-action-btn"
                                            onClick={() => {
                                                setActiveParentId(animal.id);
                                                const existingCalf = animals.find(a => a.type === 'Calf' && a.parentBuffaloId === animal.id);
                                                if (existingCalf) {
                                                    setTempCalf({
                                                        rfidTag: existingCalf.rfidTag || '',
                                                        earTag: existingCalf.earTag || '',
                                                        neckbandId: existingCalf.neckbandId || '',
                                                        age: existingCalf.age || '6',
                                                        photos: existingCalf.photos || [],
                                                        videos: existingCalf.videos || []
                                                    });
                                                } else {
                                                    setTempCalf({
                                                        rfidTag: animal.rfidTag ? `${animal.rfidTag}-C` : '',
                                                        earTag: animal.earTag ? `${animal.earTag}-C` : '',
                                                        neckbandId: animal.neckbandId ? `${animal.neckbandId}-C` : '',
                                                        age: '6',
                                                        photos: [],
                                                        videos: []
                                                    });
                                                }
                                            }}
                                        >
                                            <div className="calf-btn-icon">
                                                <CalfIcon size={20} color="#0EA5E9" />
                                            </div>
                                            <div className="calf-btn-text">
                                                <span className="calf-btn-title">Calf Details</span>
                                                <span className="calf-btn-subtitle">
                                                    {(() => {
                                                        const calf = animals.find(a => a.type === 'Calf' && a.parentBuffaloId === animal.id);
                                                        return calf ? `Tag: ${calf.earTag || calf.rfidTag || 'Saved'}` : 'Tap to enter';
                                                    })()}
                                                </span>
                                            </div>
                                            <ChevronRight size={16} color="#0EA5E9" />
                                        </button>
                                    </div>

                                    <div className="media-grid previews-only">
                                        {/* Photos */}
                                        {animal.photos.map((photo, idx) => (
                                            <div key={`photo-${idx}`} className="media-preview-item">
                                                <img
                                                    src={photo}
                                                    alt={`Animal ${idx + 1}`}
                                                    onClick={() => setViewingImage(photo)}
                                                />
                                                <button
                                                    className="remove-media-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemovePhoto(animal.id, idx);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}

                                        {/* Videos */}
                                        {animal.videos.map((video, idx) => (
                                            <div key={`video-${idx}`} className="media-preview-item video-item">
                                                <video src={video} />
                                                <div className="video-overlay" onClick={() => window.open(video, '_blank')}>
                                                    <div className="play-icon">▶</div>
                                                </div>
                                                <button
                                                    className="remove-media-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveVideo(animal.id, idx);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
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
                            disabled={!isFormComplete}
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

            {/* Calf Details Modal Overlay */}
            {activeParentId !== null && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', width: '90%', maxWidth: '500px', borderRadius: '20px', padding: '24px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', fontWeight: 'bold' }}>
                                    #{animals.find(a => a.id === activeParentId)?.index || '?'}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>Calf</h3>
                                    <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0, fontStyle: 'italic' }}>Enter details below</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {tempCalf.rfidTag && tempCalf.earTag && tempCalf.age ? (
                                    <div className="status-badge completed">
                                        <CheckCircle size={10} /> Completed
                                    </div>
                                ) : null}
                                <button onClick={() => setActiveParentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                                    <Trash2 size={20} />
                                </button>
                                <button onClick={() => setActiveParentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="animal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label>RFID Tag <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span></label>
                                <div className="input-with-icon">
                                    <QrCode size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="RFID-X..."
                                        value={tempCalf.rfidTag}
                                        onChange={(e) => setTempCalf(prev => ({ ...prev, rfidTag: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Ear Tag <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span></label>
                                <div className="input-with-icon">
                                    <Tag size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="ET-XXXX"
                                        value={tempCalf.earTag}
                                        onChange={(e) => setTempCalf(prev => ({ ...prev, earTag: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Age (Months) <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span></label>
                                <div className="input-with-icon">
                                    <Cake size={18} className="input-icon" />
                                    <input
                                        type="number"
                                        placeholder="6"
                                        value={tempCalf.age}
                                        onChange={(e) => setTempCalf(prev => ({ ...prev, age: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Neckband ID </label>
                                <div className="input-with-icon">
                                    <Tag size={18} className="input-icon" style={{ rotate: '90deg' }} />
                                    <input
                                        type="text"
                                        placeholder="NB-XXXX"
                                        value={tempCalf.neckbandId || ''}
                                        onChange={(e) => setTempCalf(prev => ({ ...prev, neckbandId: e.target.value }))}
                                    />
                                </div>
                            </div>
                            {/* Parent Buffalo field removed as requested */}
                        </div>

                        <div className="media-section" style={{ marginTop: '20px' }}>
                            <div className="media-grid">
                                {tempCalf.photos?.map((photo, idx) => (
                                    <div key={`photo-${idx}`} className="media-preview-item">
                                        <img
                                            src={photo}
                                            alt={`Calf ${idx + 1}`}
                                            onClick={() => setViewingImage(photo)}
                                        />
                                        <button
                                            className="remove-media-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTempCalf(prev => ({ ...prev, photos: (prev.photos || []).filter((_, i) => i !== idx) }));
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {tempCalf.videos?.map((video, idx) => (
                                    <div key={`video-${idx}`} className="media-preview-item video-item">
                                        <video src={video} />
                                        <div className="video-overlay" onClick={() => window.open(video, '_blank')}>
                                            <div className="play-icon">▶</div>
                                        </div>
                                        <button
                                            className="remove-media-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTempCalf(prev => ({ ...prev, videos: (prev.videos || []).filter((_, i) => i !== idx) }));
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                {((tempCalf.photos?.length || 0) < 3 || (tempCalf.videos?.length || 0) < 1) && (
                                    <>
                                        <button
                                            className="media-add-btn"
                                            onClick={() => document.getElementById('calf-media-input')?.click()}
                                        >
                                            <Camera size={20} color="#2E7D32" />
                                            <span>Add</span>
                                        </button>
                                        <input
                                            id="calf-media-input"
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    const files = Array.from(e.target.files);
                                                    const { uploadToFirebase } = await import('../../config/firebaseAppConfig');

                                                    const pUrls: string[] = [];
                                                    const vUrls: string[] = [];

                                                    for (const file of files) {
                                                        const isImg = file.type.startsWith('image/');
                                                        const isVid = file.type.startsWith('video/');

                                                        if (isImg && (tempCalf.photos?.length || 0) + pUrls.length < 3) {
                                                            const url = await uploadToFirebase(file);
                                                            pUrls.push(url);
                                                        } else if (isVid && (tempCalf.videos?.length || 0) + vUrls.length < 1) {
                                                            const url = await uploadToFirebase(file);
                                                            vUrls.push(url);
                                                        } else if (isImg || isVid) {
                                                            alert(`Limit exceeded for ${isImg ? 'photos' : 'videos'}`);
                                                        }
                                                    }
                                                    setTempCalf(prev => ({
                                                        ...prev,
                                                        photos: [...(prev.photos || []), ...pUrls],
                                                        videos: [...(prev.videos || []), ...vUrls]
                                                    }));
                                                }
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                // Save logic
                                const parentBuffalo = animals.find(a => a.id === activeParentId);
                                if (!parentBuffalo) return;

                                setAnimals(prev => {
                                    const existingCalfIndex = prev.findIndex(a => a.type === 'Calf' && a.parentBuffaloId === parentBuffalo.id);

                                    if (existingCalfIndex !== -1) {
                                        // Update existing calf
                                        const updatedAnimals = [...prev];
                                        updatedAnimals[existingCalfIndex] = {
                                            ...updatedAnimals[existingCalfIndex],
                                            rfidTag: tempCalf.rfidTag || '',
                                            earTag: tempCalf.earTag || '',
                                            neckbandId: tempCalf.neckbandId || '',
                                            age: tempCalf.age || '6',
                                            photos: tempCalf.photos || [],
                                            videos: tempCalf.videos || [],
                                            status: 'Completed'
                                        };
                                        return updatedAnimals;
                                    } else {
                                        // Add new calf
                                        const newCalf: AnimalDetail = {
                                            id: Date.now() + 999,
                                            uid: crypto.randomUUID(),
                                            type: 'Calf',
                                            rfidTag: tempCalf.rfidTag || '',
                                            earTag: tempCalf.earTag || '',
                                            neckbandId: tempCalf.neckbandId || '',
                                            age: tempCalf.age || '6',
                                            photos: tempCalf.photos || [],
                                            videos: tempCalf.videos || [],
                                            parentBuffaloId: parentBuffalo.id,
                                            index: 1,
                                            status: 'Completed'
                                        };
                                        return [...prev, newCalf];
                                    }
                                });

                                setActiveParentId(null);
                                setTempCalf({ rfidTag: '', earTag: '', age: '6', photos: [], videos: [] }); // Reset form
                            }}
                            style={{
                                width: '100%',
                                marginTop: '24px',
                                padding: '14px',
                                backgroundColor: '#2E7D32',
                                color: 'white',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                cursor: 'pointer'
                            }}
                        >
                            Save Calf Details
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AnimalOnboarding;
