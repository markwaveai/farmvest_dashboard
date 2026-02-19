import React, { useState, useEffect, useRef, useMemo } from 'react';
import './AnimalOnboarding.css';
import { useNavigate } from 'react-router-dom';
import { farmvestService } from '../../services/farmvest_api';
import SuccessToast from '../../components/common/SuccessToast/ToastNotification';
import { Receipt, ChevronRight, Loader2, User, Trash2, Camera, QrCode, Tag, Cake, Pencil, Wand2, Smartphone, X, CheckCircle, FileText, Check } from 'lucide-react';
import CustomDropdown from '../../components/common/CustomDropdown';

const CalfIcon = ({ size = 24 }: { size?: number }) => (
    <img src="/buffalo_green_icon.png" alt="Calf" style={{ width: size, height: size, objectFit: 'contain' }} />
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
    tagNumber?: number; // New field for Buffaloes
}

interface Farm {
    farm_id: number;
    farm_name: string;
    location: string;
}

interface Employee {
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
    const [selectedFarmName, setSelectedFarmName] = useState<string>('');
    const [selectedFarmId, setSelectedFarmId] = useState<number | string>('');

    const [animals, setAnimals] = useState<AnimalDetail[]>([]);
    const [toastVisible, setToastVisible] = useState(false);
    // Removed startTagNumber as we use random generation now

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

    // CPF Modal State
    const [showCPFModal, setShowCPFModal] = useState(false);
    const [cpfData, setCpfData] = useState({
        name: '',
        mobile: '',
        method: 'online' as 'online' | 'offline',
        utrNumber: '',
        onlineImage: '',
        offlineImage: ''
    });
    const [hasSubmittedCPF, setHasSubmittedCPF] = useState(false);
    const [agreementChecked, setAgreementChecked] = useState(false);

    const [cpfEmployees, setCpfEmployees] = useState<any[]>([]);
    const [cpfSearchQuery, setCpfSearchQuery] = useState('');
    const [showCPFEmployeeDropdown, setShowCPFEmployeeDropdown] = useState(false);
    const [searchingEmployees, setSearchingEmployees] = useState(false);
    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('');

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

    useEffect(() => {
        const timer = setTimeout(async () => {
            const lowerQuery = cpfSearchQuery.toLowerCase().trim();

            // 1. Local Search from allEmployees (Pre-fetched)
            const employeeMatches = allEmployees.filter(emp => {
                const fullName = (emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`).toLowerCase();
                const mobile = (emp.mobile_number || emp.phone_number || emp.mobile || '').toLowerCase();
                return fullName.includes(lowerQuery) || mobile.includes(lowerQuery);
            });

            // 2. Local Search from allMembers (Investors)
            const investorMatches = allMembers
                .filter(m => (m.displayName?.toLowerCase().includes(lowerQuery)) || (m.mobile?.includes(cpfSearchQuery)))
                .map(m => ({
                    full_name: m.displayName,
                    mobile_number: m.mobile,
                    roles: [m.type || 'investor'],
                    is_active: 1
                }));

            if (lowerQuery.length > 0) {
                setSearchingEmployees(true);
                try {
                    // 3. Remote Search from API for latest/missing results
                    const response = await farmvestService.searchEmployee(cpfSearchQuery);
                    let remoteEmployees = [];
                    if (Array.isArray(response)) remoteEmployees = response;
                    else if (response && Array.isArray(response.data)) remoteEmployees = response.data;
                    else if (response && (response.users || response.employees)) remoteEmployees = response.users || response.employees;

                    // Combined and unique results
                    const combined = [...remoteEmployees];
                    [...employeeMatches, ...investorMatches].forEach(lm => {
                        const lmMobile = lm.mobile_number || lm.phone_number || lm.mobile;
                        if (!combined.some(re => (re.mobile_number || re.phone_number || re.mobile) === lmMobile)) {
                            combined.push(lm);
                        }
                    });

                    setCpfEmployees(combined.slice(0, 15));
                    setShowCPFEmployeeDropdown(true);
                } catch (e) {
                    const combinedLocal = [...employeeMatches];
                    investorMatches.forEach(im => {
                        if (!combinedLocal.some(em => em.mobile_number === im.mobile_number)) combinedLocal.push(im);
                    });
                    setCpfEmployees(combinedLocal.slice(0, 15));
                    setShowCPFEmployeeDropdown(combinedLocal.length > 0);
                } finally {
                    setSearchingEmployees(false);
                }
            } else {
                // If empty query, show all pre-fetched employees
                setCpfEmployees(allEmployees.slice(0, 15));
                setSearchingEmployees(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [cpfSearchQuery, allMembers, allEmployees]);


    const handleMobileChange = (val: string) => {
        setMobile(val);
        if (val.length > 0) {
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

    // Dynamic Search Effect
    useEffect(() => {
        const performSearch = async () => {
            if (!mobile || mobile.trim() === '') {
                setFilteredMembers([]);
                return;
            }

            // 1. Local Search
            const lowerVal = mobile.toLowerCase();
            const localMatches = allMembers.filter(member =>
                (member.displayName?.toLowerCase().includes(lowerVal)) ||
                (member.mobile?.includes(mobile))
            );

            setFilteredMembers(localMatches.slice(0, 10));

            // 2. Remote Search (for In-Transit/New Users not in local list)
            // Check if we have an exact match locally. If not, and it looks like a valid mobile, try fetching.
            const exactMatch = localMatches.find(m => m.mobile === mobile);

            if (!exactMatch && /^\d{10}$/.test(mobile)) {
                try {
                    const result = await farmvestService.getPaidOrders(mobile);

                    if (result && result.user) {
                        const u = result.user;
                        const remoteUser = {
                            displayName: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown Investor',
                            mobile: u.mobile || u.mobile_number || u.phone_number || '', // Ensure phone_number is mapped
                            id: u.id || u.investor_id || 0,
                            type: 'investor',
                            ...u
                        };

                        // Update lists
                        setAllMembers(prev => {
                            // Avoid duplicates
                            if (prev.some(m => m.mobile === remoteUser.mobile)) return prev;
                            return [...prev, remoteUser];
                        });

                        // The effect will re-run because allMembers changed, and catch it in Local Search next time.
                    }
                } catch (e) {
                    // Silent catch for remote search
                }
            }
        };

        const timeoutId = setTimeout(performSearch, 1000); // 1000ms debounce as requested
        return () => clearTimeout(timeoutId);
    }, [mobile, allMembers]);

    // Fetch initial data on load
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Farms with the specified API parameters
                try {
                    const farmData = await farmvestService.getAllFarms({
                        sort_by: 2,
                        page: 1,
                        size: 15
                    });

                    let farmList: Farm[] = [];
                    if (Array.isArray(farmData)) {
                        farmList = farmData;
                    } else if (farmData && Array.isArray(farmData.farms)) {
                        farmList = farmData.farms;
                    } else if (farmData && Array.isArray(farmData.data)) {
                        farmList = farmData.data;
                    }

                    const normalizedFarms = farmList.map((f: any) => ({
                        farm_id: f.farm_id || f.id || 0,
                        farm_name: f.farm_name || f.name || 'Unknown Farm',
                        location: f.location || ''
                    }));

                    setFarms(normalizedFarms);
                } catch (farmError) {
                    console.error('Error fetching farms:', farmError);
                }

                // Fetch Investors
                const allFetchedMembers: any[] = [];

                try {
                    // 1. Fetch Existing Investors
                    const investorData = await farmvestService.getAllInvestors({ size: 1000, page: 1 });

                    let investorList: any[] = [];
                    if (Array.isArray(investorData)) {
                        investorList = investorData;
                    } else if (investorData && investorData.data && Array.isArray(investorData.data)) {
                        investorList = investorData.data;
                    } else if (investorData && investorData.users && Array.isArray(investorData.users)) {
                        investorList = investorData.users;
                    } else if (investorData && investorData.investors && Array.isArray(investorData.investors)) {
                        investorList = investorData.investors;
                    }

                    const normalizedInvestors = investorList.map((inv: any) => ({
                        ...inv,
                        displayName: inv.full_name || `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || 'Unknown Investor',
                        mobile: inv.mobile || inv.mobile_number || inv.phone_number || '',
                        id: inv.id || inv.investor_id || 0,
                        type: 'investor'
                    }));
                    allFetchedMembers.push(...normalizedInvestors);

                    // 2. Fetch In-Transit Orders (Pending Users)
                    try {
                        const transitData = await farmvestService.getPaidOrders('');
                        if (transitData && transitData.user) {
                            const u = transitData.user;
                            const normalizedTransitUser = {
                                displayName: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown Investor',
                                mobile: u.mobile || u.mobile_number || u.phone_number || '',
                                id: u.id || u.investor_id || 0,
                                type: 'investor',
                                ...u
                            };
                            if (!allFetchedMembers.some(member => member.mobile === normalizedTransitUser.mobile)) {
                                allFetchedMembers.push(normalizedTransitUser);
                            }
                        }
                    } catch (transitError) {
                        console.error('Error fetching transit users:', transitError);
                    }
                } catch (investorError) {
                    console.error('Error fetching investors:', investorError);
                }

                // 3. Fetch All Employees specifically for CPF
                try {
                    const empData = await farmvestService.getEmployees({ size: 1000, page: 1 });
                    let empList: any[] = [];
                    if (Array.isArray(empData)) {
                        empList = empData;
                    } else if (empData && Array.isArray(empData.data)) {
                        empList = empData.data;
                    } else if (empData && (empData.users || empData.employees)) {
                        empList = empData.users || empData.employees;
                    }
                    setAllEmployees(empList);

                    // Fetch Admins
                    try {
                        const adminData = await farmvestService.getAdminsList();
                        console.log("Admin list data:", adminData);
                        let adminList = [];
                        if (adminData && Array.isArray(adminData.admins)) {
                            adminList = adminData.admins;
                        } else if (adminData && adminData.data && Array.isArray(adminData.data.admins)) {
                            adminList = adminData.data.admins;
                        } else if (adminData && Array.isArray(adminData.users)) {
                            adminList = adminData.users;
                        } else if (adminData && adminData.data && Array.isArray(adminData.data.users)) {
                            adminList = adminData.data.users;
                        } else if (adminData && Array.isArray(adminData.data)) {
                            adminList = adminData.data;
                        } else if (Array.isArray(adminData)) {
                            adminList = adminData;
                        }

                        console.log("Extracted admin list:", adminList);

                        if (adminList.length > 0) {
                            setAdmins(adminList);
                            // Auto-select first admin
                            const firstAdmin = adminList[0];
                            const firstId = String(firstAdmin.id || firstAdmin.user_id || firstAdmin.mobile || '');
                            console.log("Auto-selecting first admin ID:", firstId);
                            if (firstId) {
                                setSelectedAdminId(firstId);
                            }
                        } else {
                            console.warn("Admin list is empty after extraction");
                        }
                    } catch (e) {
                        console.error("Error fetching admin list:", e);
                    }
                } catch (e) {
                    console.error("Error fetching all employees:", e);
                }

                setAllMembers(allFetchedMembers);
            } catch (error) {
                console.error('Error in fetchInitialData:', error);
            }
        };

        // Removed fetchTagCount as we use random generation

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
            let idCounter = 100000;
            let currentTagNumber = 10000;
            for (let i = 0; i < bCount; i++) {
                const buffaloId = Date.now() + i;
                const uid = (++idCounter).toString(); // 100001, 100002...
                const randomTagNum = Math.floor(10000 + Math.random() * 90000); // 10000-99999

                newAnimals.push({
                    id: buffaloId,
                    uid: bIds[i] || uid, // Use ID from list if available, else sequential
                    type: 'Buffalo',
                    rfidTag: '',
                    earTag: '',
                    age: '',
                    photos: [],
                    videos: [],
                    index: i + 1,
                    status: 'Pending',
                    tagNumber: undefined // Wait for autofill
                });
            }

            // 2. Initialize Calves and link them to Buffaloes
            for (let i = 0; i < cCount; i++) {
                // Distribute calves among buffaloes (e.g., if 2 B and 2 C, each B gets 1 C)
                // If more calves than buffaloes, some buffaloes get multiple
                const parentBuffalo = newAnimals[i % bCount];
                const uid = (++idCounter).toString(); // Sequential continuation

                newAnimals.push({
                    id: Date.now() + 1000 + i,
                    uid: uid,
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

        // Pre-resolve from local cache if possible
        const localMember = allMembers.find(m => m.mobile === mobile);
        if (localMember) {
            const cachedUser: UserProfile = {
                id: String(localMember.id),
                name: localMember.displayName || 'Investor',
                mobile: localMember.mobile,
                email: localMember.email || '',
                aadhar_number: localMember.aadhar_number || '',
                aadhar_front_image_url: localMember.aadhar_front_image_url || '',
                aadhar_back_image_url: localMember.aadhar_back_image_url || '',
                panCardUrl: localMember.panCardUrl || ''
            };
            setUser(cachedUser);
        }

        try {
            const result = await farmvestService.getPaidOrders(mobile);

            if (result && Array.isArray(result.orders) && result.orders.length > 0) {
                // If API returned a user, prioritize it, otherwise keep the local one
                if (result.user) {
                    const u = result.user;
                    const userData: UserProfile = {
                        id: String(u.id || u.mobile || localMember?.id || ''),
                        name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || localMember?.displayName || 'Investor',
                        mobile: u.mobile || mobile,
                        email: u.email || localMember?.email || '',
                        aadhar_number: u.aadhar_number || localMember?.aadhar_number || '',
                        aadhar_front_image_url: u.aadhar_front_image_url || localMember?.aadhar_front_image_url || '',
                        aadhar_back_image_url: u.aadhar_back_image_url || localMember?.aadhar_back_image_url || '',
                        panCardUrl: u.panCardUrl || localMember?.panCardUrl || ''
                    };
                    setUser(userData);
                }

                setOrders(result.orders.map(normalizeOrder));
            } else {
                // If result.user is null or orders are empty, check if they exist in our local investor cache
                if (localMember) {
                    setNoOrdersFound(true);
                } else {
                    setSearchNotFound(true);
                }
            }
        } catch (error) {
            if (localMember) {
                setNoOrdersFound(true);
            } else {
                setSearchNotFound(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAnimalChange = (id: number, field: keyof AnimalDetail, value: any) => {
        setAnimals(prev => prev.map(animal =>
            animal.id === id ? { ...animal, [field]: value } : animal
        ));
    };

    const handleOrderSelect = async (order: Order) => {
        setSelectedOrder(order);

        // Fetch admins specifically when clicking on order (onboarding start)
        try {
            const adminData = await farmvestService.getAdminsList();
            console.log("Admin list data on select:", adminData);
            let adminList = [];
            if (adminData && Array.isArray(adminData.admins)) {
                adminList = adminData.admins;
            } else if (adminData && adminData.data && Array.isArray(adminData.data.admins)) {
                adminList = adminData.data.admins;
            } else if (adminData && Array.isArray(adminData.users)) {
                adminList = adminData.users;
            } else if (adminData && adminData.data && Array.isArray(adminData.data.users)) {
                adminList = adminData.data.users;
            } else if (adminData && Array.isArray(adminData.data)) {
                adminList = adminData.data;
            } else if (Array.isArray(adminData)) {
                adminList = adminData;
            }

            console.log("Extracted admin list on select:", adminList);

            if (adminList.length > 0) {
                setAdmins(adminList);
                // Auto-select first admin if none selected
                if (!selectedAdminId) {
                    const firstAdmin = adminList[0];
                    const firstId = String(firstAdmin.id || firstAdmin.user_id || firstAdmin.mobile || '');
                    console.log("Auto-selecting first admin ID on select:", firstId);
                    if (firstId) {
                        setSelectedAdminId(firstId);
                    }
                }
            } else {
                console.warn("Admin list is empty after extraction on select");
            }
        } catch (e) {
            console.error("Error fetching admin list on order select:", e);
        }
    };

    const handleAutofill = () => {
        setAnimals(prev => {
            const buffaloes = prev.filter(a => a.type === 'Buffalo');

            return prev.map(animal => {
                const isBuffalo = animal.type === 'Buffalo';
                const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const rfidTag = `RFID-${randomSuffix}-${animal.index.toString().padStart(3, '0')}`;
                const earTag = `ET-${randomSuffix}-${animal.index.toString().padStart(4, '0')}`;
                // Generate Neckband ID for both Buffalo and Calf
                // Match user request: NB-123 (shorter format)
                const shortRandom = Math.floor(Math.random() * 9000 + 1000).toString();
                const neckbandId = `NB-${shortRandom}`;
                const age = isBuffalo ? '36' : '6';

                let parentId = animal.parentBuffaloId;
                if (!isBuffalo && buffaloes.length > 0) {
                    parentId = animal.parentBuffaloId || buffaloes[0].id;
                }

                const randomTagNum = Math.floor(10000 + Math.random() * 90000); // 10000-99999

                return {
                    ...animal,
                    rfidTag,
                    earTag,
                    neckbandId, // Auto-fill this
                    age,
                    parentBuffaloId: parentId,
                    status: 'Completed',
                    tagNumber: animal.tagNumber || randomTagNum // Use existing if set, or random
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
            if (a.type === 'Buffalo' && a.photos.length === 0) return true;
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
            if (a.type === 'Buffalo' && a.photos.length === 0) return true;
            return false;
        });

        if (incompleteAnimals.length > 0) {
            const missingImages = incompleteAnimals.some(a => a.type === 'Buffalo' && a.photos.length === 0);
            if (missingImages) {
                alert('Please upload at least one image for every Buffalo.');
            } else {
                alert(`Please complete RFID, Ear Tag, and Age for all animals.`);
            }
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

        const formatNeckband = (id: string | undefined) => {
            if (!id || !id.trim()) return null;
            let clean = id.trim();
            if (/^nb/i.test(clean)) {
                clean = clean.replace(/^nb-?/i, '');
            }
            if (!clean) return null;
            return `NB-${clean}`;
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
                    utr_number: cpfData.utrNumber || "",
                    payment_verification_screenshot: (cpfData.method === 'online' ? cpfData.onlineImage : cpfData.offlineImage) || "https://firebasestorage.googleapis.com/v0/b/markwave-481315.firebasestorage.app/o/placeholders%2Fpy.jpg?alt=media",
                    cpf_employee_name: cpfData.name,
                    cpf_employee_mobile: cpfData.mobile,
                    cpf_payment_type: cpfData.method,
                    cpf_name: cpfData.name,
                    cpf_image: (cpfData.method === 'online' ? cpfData.onlineImage : cpfData.offlineImage) || ""
                },
                animals: animals.map(a => {
                    const isBuffalo = a.type === 'Buffalo';
                    const formattedRfid = formatRfid(a.rfidTag);
                    const formattedNeckband = formatNeckband(a.neckbandId);

                    if (isBuffalo) {
                        return {
                            animal_id: a.uid,
                            animal_type: "BUFFALO",
                            rfid_tag: formattedRfid,
                            ear_tag: a.earTag,
                            neckband_id: formattedNeckband, // Sends NB-XXX or null
                            age_months: parseInt(a.age) || 0,
                            health_status: "HEALTHY",
                            images: a.photos.length > 0 ? a.photos : [],
                            videos: a.videos.length > 0 ? a.videos : [],
                            status: "high_yield",
                            breed_id: "MURRAH-001",
                            breed_name: "Murrah Buffalo",
                            tag_number: a.tagNumber // Include tag_number for Buffalo
                        };
                    } else {
                        return {
                            animal_id: a.uid,
                            animal_type: "CALF",
                            rfid_tag: formattedRfid,
                            ear_tag: a.earTag,
                            neckband_id: formattedNeckband, // Sends NB-XXX or null
                            age_months: parseInt(a.age) || 0,
                            health_status: "HEALTHY",
                            images: a.photos.length > 0 ? a.photos : [],
                            videos: a.videos.length > 0 ? a.videos : [],
                            parent_animal_id: getParentUid(a.parentBuffaloId)
                        };
                    }
                }),
                farm_id: Number(selectedFarmId),
                agreement_accepted: true,
                agreement_type: hasSubmittedCPF ? "CPF_AGREEMENT" : "STANDARD_AGREEMENT"
            };

            await farmvestService.onboardAnimal(payload);

            // Update Order Status
            try {
                // Determine farm location name if possible, or use ID
                const farmName = farms.find(f => String(f.farm_id) === String(selectedFarmId))?.farm_name || `Farm ID: ${selectedFarmId}`;

                // Collect all animal UIDs
                const allAnimalUids = animals.map(a => a.uid);

                // Fetch freshest admin list right before updating status as requested
                let adminMobileForHeader = selectedAdminId;
                try {
                    const adminData = await farmvestService.getAdminsList();
                    console.log("Admin list data on confirm:", adminData);
                    let adminList = [];
                    if (adminData && Array.isArray(adminData.admins)) {
                        adminList = adminData.admins;
                    } else if (adminData && adminData.data && Array.isArray(adminData.data.admins)) {
                        adminList = adminData.data.admins;
                    } else if (adminData && Array.isArray(adminData.users)) {
                        adminList = adminData.users;
                    } else if (adminData && adminData.data && Array.isArray(adminData.data.users)) {
                        adminList = adminData.data.users;
                    } else if (adminData && Array.isArray(adminData.data)) {
                        adminList = adminData.data;
                    } else if (Array.isArray(adminData)) {
                        adminList = adminData;
                    }

                    if (adminList.length > 0) {
                        const firstAdmin = adminList[0];
                        adminMobileForHeader = String(firstAdmin.mobile || firstAdmin.mobile_number || firstAdmin.phone_number || firstAdmin.id || '');
                        console.log("Using first admin mobile for header:", adminMobileForHeader);
                    }
                } catch (adminFetchError) {
                    console.error("Failed to fetch admin list on confirm, falling back to cached ID:", adminFetchError);
                }

                await farmvestService.updateOrderStatus({
                    orderId: selectedOrder.id,
                    status: 'DELIVERED',
                    buffaloId: allAnimalUids[0] || "",
                    buffaloIds: allAnimalUids.length > 0 ? [allAnimalUids[0]] : [],
                    description: `Onboarding completed for ${user.name} at ${farmName}`,
                    location: farmName
                }, adminMobileForHeader);
            } catch (orderUpdateError) {
                console.error("Failed to update order status:", orderUpdateError);
            }

            setToastVisible(true);
            setTimeout(() => {
                navigate('/farmvest/unallocated-animals');
            }, 1500);

            setSelectedOrder(null);
            setOrders(null);
            setMobile('');
        } catch (error) {
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

            <div className="flex-1 overflow-auto p-6 scrollbar-hide">
                {!selectedOrder && (
                    <>
                        <div className="onboarding-search-container">
                            <div className="search-input-wrapper" ref={dropdownRef}>
                                <Smartphone size={20} className="phone-icon" color="#6B7280" />
                                <input
                                    type="text"
                                    placeholder="Search by mobile number..."
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
                                    <h2>Paid Orders for {user?.name ? `${user.name} (${searchedMobile})` : searchedMobile}</h2>
                                </div>
                                <div className="orders-list">
                                    {orders.map((order, index) => (
                                        <div key={order.id || index} className="order-card" onClick={() => handleOrderSelect(order)}>
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
                            <div className="cards-grid-container">
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
                            </div>

                            <div className="farm-selection-group" style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                gap: '15px',
                                width: '100%',
                                marginBottom: '20px'
                            }}>

                            </div>
                        </div>
                        <div className="farm-field">
                            <label style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px', display: 'block' }}>Farm</label>
                            <CustomDropdown
                                options={farms.map(farm => ({
                                    value: farm.farm_id,
                                    label: farm.farm_name
                                }))}
                                value={selectedFarmId}
                                onChange={(val) => {
                                    setSelectedFarmId(val);
                                    const farm = farms.find(f => f.farm_id === Number(val));
                                    if (farm) {
                                        setSelectedFarmName(farm.farm_name);
                                    }
                                }}
                                placeholder="Select Farm"
                            />
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
                                            <label>Tag Number</label>
                                            <div className="input-with-icon">
                                                <Tag size={18} className="input-icon" />
                                                <input
                                                    type="number"
                                                    value={animal.tagNumber || ''}
                                                    onChange={(e) => handleAnimalChange(animal.id, 'tagNumber', parseInt(e.target.value))}
                                                    // readOnly removed to allow editing
                                                    style={{ backgroundColor: 'white' }}
                                                />
                                            </div>
                                        </div>
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
                                            <label>Neckband ID </label>
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
                                                    <CalfIcon size={28} />
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
                                                <ChevronRight size={16} color="white" />
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

                        <div className="onboarding-actions">
                            <button
                                className="cpf-details-btn"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: hasSubmittedCPF ? '#E8F5E9' : '#F9FAFB',
                                    color: hasSubmittedCPF ? '#2E7D32' : '#374151',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => {
                                    if (!hasSubmittedCPF) {
                                        // Removed initial name/mobile pre-filling as per user request
                                        // Employee will now enter their own details or select from list
                                        setShowCPFModal(true);
                                    } else {
                                        setShowCPFModal(true); // Open modal even if submitted, to allow editing
                                    }
                                }}
                            >
                                <FileText size={20} />
                                {hasSubmittedCPF ? 'Edit CPF Details' : 'Add CPF Details'}
                                {hasSubmittedCPF && <CheckCircle size={18} />}
                            </button>

                            <button className="autofill-btn" onClick={handleAutofill}>
                                <Wand2 size={16} color="#F97316" />
                                Autofill Test Data
                            </button>

                            <div style={{
                                backgroundColor: '#F9FAFB',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid #E5E7EB',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px'
                            }}>
                                <input
                                    type="checkbox"
                                    id="agreement"
                                    checked={agreementChecked}
                                    onChange={(e) => setAgreementChecked(e.target.checked)}
                                    style={{ marginTop: '3px', cursor: 'pointer', transform: 'scale(1.2)' }}
                                />
                                <label htmlFor="agreement" style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', cursor: 'pointer', fontWeight: '500' }}>
                                    {hasSubmittedCPF
                                        ? "I hereby confirm that I have collected and verified the CPF details and payment proof for this onboarding."
                                        : "I hereby confirm that all animal details entered are correct and move the animal to the unallocated list."
                                    }
                                </label>
                            </div>

                            <button
                                className="confirm-onboarding-btn"
                                onClick={handleConfirmOnboarding}
                                disabled={!isFormComplete || !agreementChecked}
                                style={{
                                    opacity: (!isFormComplete || !agreementChecked) ? 0.6 : 1,
                                    cursor: (!isFormComplete || !agreementChecked) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Confirm Onboarding
                            </button>
                        </div>
                    </div>
                )}

                {loading && (
                    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 100 }}>
                        <Loader2 className="animate-spin" size={48} color="#2E7D32" />
                    </div>
                )}

                {viewingImage && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingImage(null)}>
                        <img src={viewingImage} style={{ maxWidth: '90%', maxHeight: '90%' }} alt="Preview" />
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
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                        <CalfIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>Calf</h3>
                                        <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0, fontStyle: 'italic' }}>Enter details below</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
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

                {/* CPF Details Modal */}
                {showCPFModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{
                            background: 'white',
                            width: '100%',
                            maxWidth: '440px',
                            maxHeight: 'calc(100vh - 40px)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden'
                        }}>
                            {/* Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 20px 10px 20px',
                                borderBottom: '1px solid #F3F4F6'
                            }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>CPF Details</h3>
                                <button onClick={() => setShowCPFModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Scrollable Body */}
                            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="form-group" style={{ position: 'relative' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>EMPLOYEE NAME</label>
                                        <input
                                            type="text"
                                            placeholder="Search Employee..."
                                            value={cpfSearchQuery || cpfData.name}
                                            onFocus={() => {
                                                if (cpfEmployees.length === 0 && allEmployees.length > 0) {
                                                    setCpfEmployees(allEmployees.slice(0, 15));
                                                }
                                                setShowCPFEmployeeDropdown(true);
                                            }}
                                            onChange={(e) => {
                                                setCpfSearchQuery(e.target.value);
                                                setCpfData(prev => ({ ...prev, name: e.target.value }));
                                            }}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '1rem' }}
                                        />
                                        {searchingEmployees && (
                                            <div style={{ position: 'absolute', right: '12px', top: '42px' }}>
                                                <Loader2 size={16} className="animate-spin" color="#2E7D32" />
                                            </div>
                                        )}
                                        {showCPFEmployeeDropdown && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                background: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                marginTop: '4px',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                zIndex: 100,
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                {cpfEmployees.length > 0 ? (
                                                    cpfEmployees.map((emp, idx) => {
                                                        const fullName = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
                                                        const mobile = emp.mobile_number || emp.phone_number || emp.mobile || '';
                                                        const role = Array.isArray(emp.roles) ? emp.roles[0] : (emp.role || emp.role_name || 'Employee');
                                                        const isActive = emp.is_active !== undefined ? Number(emp.is_active) === 1 : Number(emp.active_status) === 1;

                                                        return (
                                                            <div
                                                                key={idx}
                                                                onClick={() => {
                                                                    setCpfData(prev => ({
                                                                        ...prev,
                                                                        name: fullName,
                                                                        mobile: mobile
                                                                    }));
                                                                    setCpfSearchQuery('');
                                                                    setShowCPFEmployeeDropdown(false);
                                                                }}
                                                                style={{
                                                                    padding: '12px',
                                                                    cursor: 'pointer',
                                                                    borderBottom: idx === cpfEmployees.length - 1 ? 'none' : '1px solid #F3F4F6',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                            >
                                                                <div>
                                                                    <p style={{ margin: 0, fontWeight: '600', color: '#374151' }}>{fullName}</p>
                                                                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                                                                        {mobile} {role ? `• ${role.replace(/_/g, ' ')}` : ''}
                                                                    </p>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '12px',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2',
                                                                    color: isActive ? '#166534' : '#991B1B'
                                                                }}>
                                                                    {isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                                                        No results found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>MOBILE NUMBER</label>
                                        <input
                                            type="text"
                                            value={cpfData.mobile}
                                            onChange={(e) => setCpfData(prev => ({ ...prev, mobile: e.target.value }))}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '1rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '14px', padding: '6px' }}>
                                        <button
                                            onClick={() => setCpfData(prev => ({ ...prev, method: 'online' }))}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: cpfData.method === 'online' ? 'white' : 'transparent',
                                                color: cpfData.method === 'online' ? '#2E7D32' : '#6B7280',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                boxShadow: cpfData.method === 'online' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Online
                                        </button>
                                        <button
                                            onClick={() => setCpfData(prev => ({ ...prev, method: 'offline' }))}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: cpfData.method === 'offline' ? 'white' : 'transparent',
                                                color: cpfData.method === 'offline' ? '#2E7D32' : '#6B7280',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                boxShadow: cpfData.method === 'offline' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Offline
                                        </button>
                                    </div>

                                    <div>
                                        {cpfData.method === 'online' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                <div className="form-group">
                                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>UTR NUMBER</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter UTR Number"
                                                        value={cpfData.utrNumber}
                                                        onChange={(e) => setCpfData(prev => ({ ...prev, utrNumber: e.target.value }))}
                                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '1rem' }}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>PAYMENT SCREENSHOT</label>
                                                    <div
                                                        onClick={() => document.getElementById('online-payment-img')?.click()}
                                                        style={{
                                                            border: '2px dashed #E5E7EB',
                                                            borderRadius: '16px',
                                                            height: '140px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            overflow: 'hidden',
                                                            position: 'relative',
                                                            backgroundColor: '#F9FAFB'
                                                        }}
                                                    >
                                                        {cpfData.onlineImage ? (
                                                            <img src={cpfData.onlineImage} alt="Payment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <>
                                                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '8px' }}>
                                                                    <Camera size={24} color="#9CA3AF" />
                                                                </div>
                                                                <span style={{ fontSize: '0.875rem', color: '#9CA3AF', fontWeight: '500' }}>Click to upload screenshot</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <input
                                                        id="online-payment-img"
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={async (e) => {
                                                            if (e.target.files?.[0]) {
                                                                const { uploadToFirebase } = await import('../../config/firebaseAppConfig');
                                                                const url = await uploadToFirebase(e.target.files[0]);
                                                                setCpfData(prev => ({ ...prev, onlineImage: url }));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>PAYMENT RECEIPT</label>
                                                <div
                                                    onClick={() => document.getElementById('offline-payment-img')?.click()}
                                                    style={{
                                                        border: '2px dashed #E5E7EB',
                                                        borderRadius: '16px',
                                                        height: '140px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        overflow: 'hidden',
                                                        position: 'relative',
                                                        backgroundColor: '#F9FAFB'
                                                    }}
                                                >
                                                    {cpfData.offlineImage ? (
                                                        <img src={cpfData.offlineImage} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <>
                                                            <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '8px' }}>
                                                                <Camera size={24} color="#9CA3AF" />
                                                            </div>
                                                            <span style={{ fontSize: '0.875rem', color: '#9CA3AF', fontWeight: '500' }}>Click to upload receipt</span>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    id="offline-payment-img"
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={async (e) => {
                                                        if (e.target.files?.[0]) {
                                                            const { uploadToFirebase } = await import('../../config/firebaseAppConfig');
                                                            const url = await uploadToFirebase(e.target.files[0]);
                                                            setCpfData(prev => ({ ...prev, offlineImage: url }));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '20px', borderTop: '1px solid #F3F4F6' }}>
                                <button
                                    onClick={() => {
                                        const finalJson = {
                                            cpf_name: cpfData.name,
                                            cpf_image: cpfData.method === 'online' ? cpfData.onlineImage : cpfData.offlineImage,
                                            cpf_payment_type: cpfData.method
                                        };
                                        console.log('CPF Details JSON:', finalJson);
                                        setHasSubmittedCPF(true);
                                        setShowCPFModal(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        backgroundColor: '#FFA000',
                                        color: 'white',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontWeight: '800',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(255, 160, 0, 0.3)',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        letterSpacing: '0.025em'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF8F00'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFA000'}
                                >
                                    Save CPF Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnimalOnboarding;
