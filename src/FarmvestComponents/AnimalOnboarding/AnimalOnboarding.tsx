import React, { useState, useEffect } from 'react';
import './AnimalOnboarding.css';
import { useNavigate } from 'react-router-dom';
import { farmvestService } from '../../services/farmvest_api';
import { uploadToFirebase } from '../../config/firebaseAppConfig';
import SuccessToast from '../../components/common/SuccessToast/ToastNotification';
import { Receipt, ChevronRight, Loader2, User, Trash2, Camera, QrCode, Tag, Cake, Pencil, Wand2 } from 'lucide-react';

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
}



const AnimalOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [orders, setOrders] = useState<Order[] | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchedMobile, setSearchedMobile] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // API Data States
    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | string>('');

    const [animals, setAnimals] = useState<AnimalDetail[]>([]);
    const [toastVisible, setToastVisible] = useState(false);

    // Fetch Farms on load
    useEffect(() => {
        const fetchFarms = async () => {
            try {
                console.log("Fetching farms in AnimalOnboarding...");
                const data = await farmvestService.getAllFarms();
                console.log("AnimalOnboarding Farms Resp:", data);

                let farmList: Farm[] = [];
                if (Array.isArray(data)) {
                    farmList = data;
                } else if (data.farms && Array.isArray(data.farms)) {
                    farmList = data.farms;
                } else if (data.data && Array.isArray(data.data)) {
                    farmList = data.data;
                }

                console.log("Parsed Farm list (Raw):", farmList);

                // Normalize farm objects to ensure farm_id exists
                const normalizedFarms = farmList.map((f: any) => ({
                    farm_id: f.farm_id || f.id || 0,
                    farm_name: f.farm_name || f.name || 'Unknown Farm',
                    location: f.location || ''
                }));

                console.log("Normalized Farms:", normalizedFarms);
                setFarms(normalizedFarms);
            } catch (error) {
                console.error("Failed to load farms", error);
            }
        };
        fetchFarms();
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
            alert("Failed to upload images. Please check your connection and try again.");
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

    // Initialize animals when order is selected
    React.useEffect(() => {
        if (selectedOrder) {
            const newAnimals: AnimalDetail[] = [];
            let currentIndex = 1;

            const bCount = selectedOrder.buffaloCount > 0 ? selectedOrder.buffaloCount : 1;
            const cCount = selectedOrder.calfCount > 0 ? selectedOrder.calfCount : 1;

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

        try {
            const data = await farmvestService.getPaidOrders(mobile);

            let ordersList: Order[] = [];
            let userData: UserProfile | null = null;

            if (data && Array.isArray(data)) {
                ordersList = data.map(normalizeOrder);
                if (data.length > 0) {
                    const first = data[0];
                    userData = {
                        name: first.user_name || first.username || first.name || 'N/A',
                        mobile: first.user_mobile || first.mobile || mobile,
                        email: first.user_email || first.email || 'N/A'
                    };
                }
            } else if (data && data.orders) {
                if (Array.isArray(data.orders)) {
                    ordersList = data.orders.map(normalizeOrder);
                }
                if (data.user) {
                    userData = data.user;
                }
            }

            if (ordersList.length > 0) {
                setOrders(ordersList);
                if (!userData) {
                    userData = { name: 'Investor', mobile: mobile, email: '' };
                }
                setUser(userData);
                setSearchedMobile(mobile);
            } else {
                setOrders([]);
                setSearchedMobile(mobile);
                alert('No paid orders found for this mobile number.');
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
            alert('Failed to fetch orders. Please check console for details.');
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
            alert('Missing order or user details.');
            return;
        }

        const incompleteAnimals = animals.filter(a => {
            if (!a.rfidTag || !a.earTag || !a.age) return true;
            if (a.type === 'Calf' && !a.parentBuffaloId) return true;
            return false;
        });

        if (incompleteAnimals.length > 0) {
            alert(`Please complete details for all animals. (Incomplete: ${incompleteAnimals.length})`);
            return;
        }

        if (!selectedFarmId || selectedFarmId === 'Show all farms') {
            alert('Please select a Farm Location.');
            return;
        }

        const getParentRfid = (parentId: number | undefined) => {
            if (!parentId) return '';
            const parent = animals.find(a => a.id === parentId);
            return parent ? parent.rfidTag : '';
        };

        setLoading(true);
        try {

            // 2. CONSTRUCT PAYLOAD
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
                        images: a.photos.length > 0 ? a.photos : ["https://firebasestorage.googleapis.com/v0/b/app/o/payment_receipt.jpg"],
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
                // We add selected shed logic if the payload supported it, but it doesn't seem to.
                // However, the allocation call verified space.
                investment_details: {
                    animalkart_order_id: selectedOrder.id,
                    bank_name: "N/A",
                    number_of_units: (selectedOrder.buffaloCount || 0) + (selectedOrder.calfCount || 0),
                    order_date: selectedOrder.placedAt,
                    payment_method: selectedOrder.paymentStatus === 'paid' ? 'BANK_TRANSFER' : 'UNKNOWN',
                    payment_verification_screenshot: "https://firebasestorage.googleapis.com/v0/b/app/o/payment_receipt.jpg",
                    total_investment_amount: selectedOrder.totalCost,
                    unit_cost: selectedOrder.totalCost / (selectedOrder.buffaloCount || 1),
                    utr_number: "N/A"
                },
                investor_details: {
                    email: user.email || "no-email@example.com",
                    full_name: user.name,
                    investor_id: String((user as any).id || user.mobile),
                    kyc_details: {
                        aadhar_back_url: "https://firebasestorage.googleapis.com/v0/b/app/o/aadhar_back.jpg",
                        aadhar_front_url: "https://firebasestorage.googleapis.com/v0/b/app/o/aadhar_front.jpg",
                        aadhar_number: "000000000000",
                        pan_card_url: "https://firebasestorage.googleapis.com/v0/b/app/o/pan_card.pdf"
                    },
                    mobile: user.mobile
                }
            };


            console.log("SENDING PAYLOAD:", payload); // Keep for console
            alert(`Debug Info:\nPayload FarmID: ${payload.farm_id}\nRaw State: ${selectedFarmId}\nFarms Count: ${farms.length}`);

            await farmvestService.onboardAnimal(payload);
            setToastVisible(true);

            // Redirect to Unallocated Animals page after short delay to show toast
            setTimeout(() => {
                navigate('/farmvest/unallocated-animals');
            }, 1500);

            setSelectedOrder(null);
            setOrders(null);
            setMobile('');
        } catch (error) {
            console.error('Onboarding failed:', error);
            alert('Failed to complete onboarding. check console.');
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
                        <div className="search-input-wrapper">
                            <span className="phone-icon">📱</span>
                            <input
                                type="text"
                                placeholder="Investor Mobile"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                            />
                        </div>
                        <button className="find-btn" onClick={handleFind} disabled={loading}>
                            {loading ? 'Finding...' : 'Find'}
                        </button>
                    </div>
                    {(orders && orders.length > 0) && (
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
                                                    <span className="stat-label"><span className="stat-icon">🐃</span> Buffaloes</span>
                                                    <span className="stat-value">{order.buffaloCount}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-label"><span className="stat-icon">🐄</span> Calves</span>
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
                                onChange={(e) => setSelectedFarmId(e.target.value)}
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
                                        <button className="delete-btn">
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
