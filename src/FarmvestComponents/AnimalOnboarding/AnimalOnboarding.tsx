import React, { useState, useEffect, useRef } from 'react';
import './AnimalOnboarding.css';
import { useNavigate } from 'react-router-dom';
import { farmvestService } from '../../services/farmvest_api';
import SuccessToast from '../../components/common/SuccessToast/ToastNotification';
import { Receipt, ChevronRight, Loader2, User, Trash2, Camera, QrCode, Tag, Cake, Pencil, Wand2, Smartphone, X } from 'lucide-react';

const CustomStrollerIcon = ({ size = 24, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
        <path d="M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
        <path d="M13.34 16h-5.08"></path>
        <path d="M3 5h2l.6 3h13.15a1 1 0 0 1 .95 1.34l-2.43 8.1a1 1 0 0 1-.95.72H7.7"></path>
        <path d="M21 5h-7"></path>
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

    // Calf Modal State
    const [activeParentId, setActiveParentId] = useState<number | null>(null);
    const [tempCalf, setTempCalf] = useState<Partial<AnimalDetail>>({
        rfidTag: '',
        earTag: '',
        age: '6',
        photos: []
    });

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
            // Dynamic import to solve initialization order issues
            const { uploadToFirebase } = await import('../../config/firebaseAppConfig');

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

            // If the order has specific buffalo UUIDs from Animalkart, use them
            if (selectedOrder.buffaloIds && selectedOrder.buffaloIds.length > 0) {
                // Use a Set to avoid duplicates if any (though we should respect the count)
                const uniqueUids = Array.from(new Set(selectedOrder.buffaloIds));
                uniqueUids.forEach((uuid, idx) => {
                    newAnimals.push({
                        id: Date.now() + idx,
                        uid: uuid,
                        type: 'Buffalo',
                        rfidTag: '',
                        earTag: '',
                        age: '',
                        photos: [],
                        index: idx + 1,
                        status: 'Pending'
                    });
                });
            } else {
                // Fallback to traditional count-based initialization
                const bCount = selectedOrder.buffaloCount > 0 ? selectedOrder.buffaloCount : 1;
                for (let i = 0; i < bCount; i++) {
                    newAnimals.push({
                        id: Date.now() + i,
                        uid: crypto.randomUUID(),
                        type: 'Buffalo',
                        rfidTag: '',
                        earTag: '',
                        age: '',
                        photos: [],
                        index: i + 1,
                        status: 'Pending'
                    });
                }
            }

            setAnimals(newAnimals);
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
                setSearchedMobile(mobile);
            } else {
                setSearchNotFound(true);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setSearchNotFound(true);
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

                                <div className="photos-section">
                                    <label>Photos ({animal.photos.length})</label>
                                    <div className="photos-grid">
                                        {animal.photos.map((photo, idx) => (
                                            <div key={idx} className="photo-preview">
                                                <img
                                                    src={photo}
                                                    alt={`Animal ${idx + 1}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => window.open(photo, '_blank')}
                                                    title="Click to view full image"
                                                />
                                                <button
                                                    className="remove-photo-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemovePhoto(animal.id, idx);
                                                    }}
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
                                {
                                    // SHOW CALF BUTTON FOR ALL BUFFALO CARDS
                                    <div
                                        className="calf-details-trigger-wrapper"
                                        style={{ marginTop: '20px', padding: '16px', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #BAE6FD', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                        onClick={() => {
                                            setActiveParentId(animal.id);
                                            // Check if a calf already exists for this buffalo
                                            const existingCalf = animals.find(a => a.type === 'Calf' && a.parentBuffaloId === animal.id);

                                            if (existingCalf) {
                                                setTempCalf({
                                                    rfidTag: existingCalf.rfidTag || '',
                                                    earTag: existingCalf.earTag || '',
                                                    neckbandId: existingCalf.neckbandId || '',
                                                    age: existingCalf.age || '6',
                                                    photos: existingCalf.photos || []
                                                });
                                            } else {
                                                // Auto-fill Calf details from Parent (New Calf)
                                                setTempCalf({
                                                    rfidTag: animal.rfidTag ? `${animal.rfidTag}-C` : '',
                                                    earTag: animal.earTag ? `${animal.earTag}-C` : '',
                                                    neckbandId: animal.neckbandId ? `${animal.neckbandId}-C` : '',
                                                    age: '6',
                                                    photos: []
                                                });
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                <CustomStrollerIcon size={20} color="#0EA5E9" />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Calf Details</span>
                                                <span style={{ fontSize: '12px', color: '#64748B' }}>
                                                    {(() => {
                                                        const calf = animals.find(a => a.type === 'Calf' && a.parentBuffaloId === animal.id);
                                                        return calf ? `Tag: ${calf.earTag || calf.rfidTag || 'Saved'}` : 'Tap to enter calf details';
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} color="#0EA5E9" />
                                    </div>
                                }
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
                                <div style={{ padding: '6px 12px', background: '#FFF7ED', color: '#F97316', borderRadius: '100px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Pencil size={12} /> Pending
                                </div>
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
                                <label>RFID Tag</label>
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
                                <label>Ear Tag</label>
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
                                <label>Age (Months)</label>
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
                                <label>Neckband ID (Optional)</label>
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

                        <div className="photos-section" style={{ marginTop: '20px' }}>
                            <label>Photos ({tempCalf.photos?.length || 0})</label>
                            <div className="photos-grid">
                                {tempCalf.photos?.map((photo, idx) => (
                                    <div key={idx} className="photo-preview">
                                        <img
                                            src={photo}
                                            alt={`Calf ${idx + 1}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => window.open(photo, '_blank')}
                                            title="Click to view full image"
                                        />
                                        <button
                                            className="remove-photo-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTempCalf(prev => ({ ...prev, photos: (prev.photos || []).filter((_, i) => i !== idx) }));
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className="add-photo-btn"
                                    onClick={() => document.getElementById('calf-photo-input')?.click()}
                                >
                                    <Camera size={24} color="#2E7D32" />
                                    <span>Add</span>
                                </button>
                                <input
                                    id="calf-photo-input"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            const files = Array.from(e.target.files);
                                            try {
                                                const { uploadToFirebase } = await import('../../config/firebaseAppConfig');
                                                const urls = await Promise.all(files.map(uploadToFirebase));
                                                setTempCalf(prev => ({ ...prev, photos: [...(prev.photos || []), ...urls] }));
                                            } catch (err) { console.error('Calf photo upload failed', err); }
                                        }
                                    }}
                                />
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
                                            parentBuffaloId: parentBuffalo.id,
                                            index: 1,
                                            status: 'Completed'
                                        };
                                        return [...prev, newCalf];
                                    }
                                });

                                setActiveParentId(null);
                                setTempCalf({ rfidTag: '', earTag: '', age: '6', photos: [] }); // Reset form
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
