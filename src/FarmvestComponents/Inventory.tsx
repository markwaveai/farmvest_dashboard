import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, Plus, Package, AlertTriangle, ArrowLeft,
    Milk, Database, Camera, Activity, Info,
    ChevronRight, Users, Settings, Filter,
    TrendingUp, TrendingDown, ClipboardList, MapPin, Building2, LayoutGrid
} from 'lucide-react';
import { farmvestService } from '../services/farmvest_api';
import { MilkEntry } from '../types/farmvest';
import CreateMilkEntryModal from './CreateMilkEntryModal';
import './Inventory.css';

// Types
interface Buffalo {
    tagNo: string;
    breed: string;
    age: number;
    lactationStage: string;
    healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    pregnancyStatus: 'Pregnant' | 'Not Pregnant';
    milkYield: number; // Avg liters per day
}

interface ShedGroup {
    id: string;
    name: string;
    buffaloes: Buffalo[];
    cameras: number;
    feedConsumption: number; // kg per day
    totalMilkToday: number; // liters
    location: string;
    farm: string;
}

interface Consumable {
    name: string;
    openingStock: number;
    dailyConsumption: number;
    currentStock: number;
    reorderLevel: number;
    unit: string;
}

const Inventory: React.FC = () => {
    // UI State
    const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
    const [selectedShedId, setSelectedShedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'buffalo' | 'milk' | 'feed' | 'health' | 'cctv'>('buffalo');
    const [viewMode, setViewMode] = useState<'production' | 'finance'>('production');
    const [selectedBuffalo, setSelectedBuffalo] = useState<any | null>(null);
    const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7d' | '30d'>('today');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedLocation, setSelectedLocation] = useState<string>('All');
    const [selectedFarm, setSelectedFarm] = useState<string>('All');
    const [selectedShedFilter, setSelectedShedFilter] = useState<string>('All');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const [locations, setLocations] = useState<string[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [shedsList, setShedsList] = useState<any[]>([]);
    const [totalAnimalCount, setTotalAnimalCount] = useState<number>(0);
    const [allAnimals, setAllAnimals] = useState<any[]>([]);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
    const [milkLoading, setMilkLoading] = useState(false);
    const [healthTickets, setHealthTickets] = useState<any[]>([]);
    const [healthLoading, setHealthLoading] = useState(false);
    const [showMilkModal, setShowMilkModal] = useState(false);

    // Fetch Locations and Statistics
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsStatsLoading(true);
            try {
                const [locResponse, statsResponse] = await Promise.all([
                    farmvestService.getLocations(),
                    farmvestService.getTotalAnimals()
                ]);

                if (locResponse && Array.isArray(locResponse.data)) {
                    setLocations(locResponse.data);
                }

                if (statsResponse) {
                    const animalData = Array.isArray(statsResponse) ? statsResponse : (statsResponse.data || []);
                    setTotalAnimalCount(statsResponse.count || animalData.length);
                    setAllAnimals(animalData);
                }
            } catch (error) {
            } finally {
                setIsStatsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch Milk Entries and Health Tickets
    useEffect(() => {
        const fetchMilk = async () => {
            setMilkLoading(true);
            try {
                const res = await farmvestService.getMilkEntries({ page: 1, size: 50 });
                setMilkEntries(res.data || []);
            } catch {} finally { setMilkLoading(false); }
        };
        const fetchHealth = async () => {
            setHealthLoading(true);
            try {
                const res = await farmvestService.getTickets({ ticket_type: 'HEALTH', page: 1, size: 20 });
                setHealthTickets(res.data || []);
            } catch {} finally { setHealthLoading(false); }
        };
        fetchMilk();
        fetchHealth();
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
            } catch (error) {
            }
        };
        fetchFarms();
    }, [selectedLocation]);

    // Fetch Sheds when farm changes
    useEffect(() => {
        const fetchSheds = async () => {
            if (selectedFarm === 'All') {
                setShedsList([]);
                setSelectedShedFilter('All');
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
            } catch (error) {
            }
        };
        fetchSheds();
    }, [selectedFarm, farms]);

    // Derived Shed Data from Live API
    const sheds = useMemo(() => {
        if (allAnimals.length === 0) {
            return [];
        }

        // Group animals by shed
        const shedGroups: Record<string, any[]> = {};
        allAnimals.forEach(animal => {
            const shedKey = animal.shed_name || (animal.shed && (animal.shed.shed_name || animal.shed.shed_id)) || 'Unallocated';
            if (!shedGroups[shedKey]) shedGroups[shedKey] = [];
            shedGroups[shedKey].push(animal);
        });

        return Object.entries(shedGroups).map(([name, buffaloes]) => {
            const sampleAnimal = buffaloes[0];
            const farmName = sampleAnimal.farm_name || (sampleAnimal.farm && sampleAnimal.farm.farm_name) || (sampleAnimal.farm_details && sampleAnimal.farm_details.farm_name) || 'Unknown';
            const locationName = sampleAnimal.location_name || sampleAnimal.location || (sampleAnimal.farm && sampleAnimal.farm.location) || (sampleAnimal.farm_details && sampleAnimal.farm_details.location) || 'Unknown';

            return {
                id: name,
                name: `${farmName} - ${name}`,
                location: locationName.toUpperCase(),
                farm: farmName,
                buffaloes: buffaloes.map((a, i) => {
                    const months = a.age_months || a.age_in_months || a.animal_age_months;
                    const ageYears = months ? Math.floor(months / 12) : (a.age || a.animal_age || 4);

                    return {
                        tagNo: a.rfid_tag || a.rfid_tag_number || a.animal_id || `BUF-${i}`,
                        breed: a.breed_name || a.breed || 'Murrah',
                        age: ageYears,
                        lactationStage: a.status || 'Live',
                        healthStatus: (a.health_status === 'HEALTHY' ? 'Excellent' : (a.health_status === 'SICK' ? 'Poor' : 'Good')) as any,
                        pregnancyStatus: (a.pregnancy_status || 'Not Pregnant') as any,
                        milkYield: a.last_yield || 8.5
                    };
                }),
                cameras: Math.min(Math.ceil(buffaloes.length / 4), 75),
                feedConsumption: buffaloes.length * 12.5,
                totalMilkToday: buffaloes.reduce((sum, b) => sum + (b.last_yield || 8.5), 0)
            };
        });
    }, [allAnimals]);

    const consumables: Consumable[] = [];

    const selectedShed = useMemo(() => sheds.find(s => s.id === selectedShedId), [selectedShedId]);

    // Summary Statistics
    const totalBuffaloes = totalAnimalCount || sheds.reduce((sum, s) => sum + s.buffaloes.length, 0);
    const totalMilk = milkEntries.length > 0
        ? milkEntries.reduce((sum, e) => sum + (e.quantity || 0), 0)
        : sheds.reduce((sum, s) => sum + s.totalMilkToday, 0);
    const totalCameras = shedsList.length || sheds.length;
    const activeCameras = totalCameras;
    const totalFeedStock = 0;
    const lowStockCount = 0;

    const filteredSheds = useMemo(() => {
        return sheds.filter(shed => {
            const matchesLocation = selectedLocation === 'All' || shed.location === selectedLocation;
            const matchesFarm = selectedFarm === 'All' || shed.farm === selectedFarm;

            // Smart Search with Prefixes
            let matchesSearch = true;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (query.startsWith('tag:')) {
                    const tag = query.replace('tag:', '').trim();
                    matchesSearch = shed.buffaloes.some(b => b.tagNo.toLowerCase().includes(tag));
                } else if (query.startsWith('sick:')) {
                    const isSick = query.replace('sick:', '').trim() === 'true';
                    const hasSick = shed.buffaloes.some(b => b.healthStatus === 'Fair' || b.healthStatus === 'Poor');
                    matchesSearch = isSick ? hasSick : !hasSick;
                } else if (query.startsWith('camera:')) {
                    const status = query.replace('camera:', '').trim();
                    if (status === 'offline') matchesSearch = shed.cameras < 75; // Logic based on max capacity
                } else {
                    matchesSearch = shed.name.toLowerCase().includes(query) ||
                        shed.id.toLowerCase().includes(query) ||
                        shed.farm.toLowerCase().includes(query);
                }
            }

            const matchesShed = selectedShedFilter === 'All' || shed.name.includes(selectedShedFilter) || shed.id === selectedShedFilter;
            return matchesLocation && matchesFarm && matchesShed && matchesSearch;
        });
    }, [sheds, selectedLocation, selectedFarm, selectedShedFilter, searchQuery]);

    // Critical Alerts Logic
    const alerts = useMemo(() => {
        const list = [];
        const sickCount = sheds.reduce((sum, s) => sum + s.buffaloes.filter(b => b.healthStatus === 'Fair' || b.healthStatus === 'Poor').length, 0);
        if (sickCount > 0) list.push({ type: 'health', message: `${sickCount} animals require health check/veterinary attention` });

        consumables.forEach(c => {
            if (c.currentStock <= c.reorderLevel) {
                list.push({ type: 'stock', message: `${c.name} stock level critical (${c.currentStock} ${c.unit} left)` });
            }
        });

        if (activeCameras < totalCameras) {
            list.push({ type: 'camera', message: `${totalCameras - activeCameras} cameras are currently offline or signal weak` });
        }
        return list;
    }, [sheds, consumables, activeCameras, totalCameras]);

    const renderDashboard = () => (
        <div className="animate-in fade-in duration-500">
            {/* Summary Cards */}
            <div className="inventory-summary-grid">
                <div className="summary-card">
                    <div className="summary-icon bg-blue-50 text-blue-600">
                        <Users size={20} />
                    </div>
                    <div className="summary-info">
                        <h3>Total Buffaloes</h3>
                        <p>{totalBuffaloes}</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon bg-amber-50 text-amber-600">
                        <Milk size={20} />
                    </div>
                    <div className="summary-info">
                        <h3>Today's Milk</h3>
                        <p>{totalMilk} L</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon bg-green-50 text-green-600">
                        <Database size={20} />
                    </div>
                    <div className="summary-info">
                        <h3>Sheds</h3>
                        <p>{sheds.length}</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon bg-red-50 text-red-600">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="summary-info">
                        <h3>Health Tickets</h3>
                        <p>{healthTickets.length}</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon bg-purple-50 text-purple-600">
                        <Activity size={20} />
                    </div>
                    <div className="summary-info">
                        <h3>Milk Entries</h3>
                        <p>{milkEntries.length}</p>
                    </div>
                </div>
            </div>

            {/* Timeline Slider */}
            <div className="timeline-slider-container">
                {[
                    { id: 'today', label: 'Today', sub: 'Feb 3' },
                    { id: 'yesterday', label: 'Yesterday', sub: 'Feb 2' },
                    { id: '7d', label: 'Last 7 Days', sub: 'Projected' },
                    { id: '30d', label: 'Last 30 Days', sub: 'Projected' }
                ].map(step => (
                    <div
                        key={step.id}
                        className={`timeline-step ${timeRange === step.id ? 'active' : ''}`}
                        onClick={() => setTimeRange(step.id as any)}
                    >
                        <span className="period">{step.label}</span>
                        <span className="date-sub">{step.sub}</span>
                    </div>
                ))}
            </div>

            {/* Attention Panel */}
            {alerts.length > 0 && (
                <div className="attention-panel">
                    <div className="attention-header">
                        <AlertTriangle size={14} /> Attention Required
                    </div>
                    <div className="attention-body">
                        {alerts.slice(0, 3).map((alert, i) => (
                            <div key={i} className="attention-item">
                                <div className="attention-item-content">
                                    <span className={`attention-tag tag-${alert.type}`}>
                                        {alert.type.toUpperCase()}
                                    </span>
                                    {alert.message}
                                </div>
                                <ChevronRight size={14} className="text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shed Groups */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList size={16} /> Buffalo Groups (by Shed)
                </h2>
                <div className="view-mode-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'production' ? 'active' : ''}`}
                        onClick={() => setViewMode('production')}
                    >
                        <Activity size={12} /> Production
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'finance' ? 'active' : ''}`}
                        onClick={() => setViewMode('finance')}
                    >
                        <TrendingUp size={12} /> Finance
                    </button>
                </div>
            </div>

            <div className="shed-groups-grid">
                {filteredSheds.length > 0 ? (
                    filteredSheds.map(shed => {
                        const milkPerBuffalo = (shed.totalMilkToday / shed.buffaloes.length).toFixed(1);
                        const feedConversion = (shed.totalMilkToday / shed.feedConsumption).toFixed(2);
                        const revenue = shed.totalMilkToday * 65; // Mock: ₹65 per liter
                        const feedCost = shed.feedConsumption * 15; // Mock: ₹15 per kg
                        const margin = revenue - feedCost;

                        return (
                            <div
                                key={shed.id}
                                className="shed-group-card"
                                onClick={() => {
                                    setSelectedShedId(shed.id);
                                    setView('detail');
                                }}
                            >
                                <div className="shed-card-header">
                                    <div className="shed-card-title">
                                        {shed.name}
                                    </div>
                                    <div className="live-badge">
                                        <div className="live-dot" /> LIVE
                                    </div>
                                </div>
                                <div className="shed-card-body">
                                    {viewMode === 'production' ? (
                                        <>
                                            <div className="shed-stat-item">
                                                <span className="stat-label"><Users size={14} /> Buffaloes</span>
                                                <span className="stat-value">{shed.buffaloes.length}</span>
                                            </div>
                                            <div className="shed-stat-item">
                                                <span className="stat-label"><Milk size={14} /> Milk Today</span>
                                                <span className="stat-value">{shed.totalMilkToday} L</span>
                                            </div>
                                            <div className="kpi-row">
                                                <div className="kpi-mini">
                                                    <span className="kpi-label">Yield/Buff</span>
                                                    <span className="kpi-value text-blue-600">{milkPerBuffalo}L</span>
                                                </div>
                                                <div className="kpi-mini">
                                                    <span className="kpi-label">FCR (L/kg)</span>
                                                    <span className="kpi-value text-green-600">{feedConversion}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="shed-stat-item">
                                                <span className="stat-label"><TrendingUp size={14} /> Revenue Today</span>
                                                <span className="stat-value text-green-600">₹{revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="shed-stat-item">
                                                <span className="stat-label"><TrendingDown size={14} /> Total Cost</span>
                                                <span className="stat-value text-red-500">₹{feedCost.toLocaleString()}</span>
                                            </div>
                                            <div className="kpi-row">
                                                <div className="kpi-mini">
                                                    <span className="kpi-label">Net Margin</span>
                                                    <span className="kpi-value text-amber-600">₹{margin.toLocaleString()}</span>
                                                </div>
                                                <div className="kpi-mini">
                                                    <span className="kpi-label">Cost/Liter</span>
                                                    <span className="kpi-value">₹{(feedCost / shed.totalMilkToday).toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="mt-4 pt-4 border-top border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                            {shed.cameras} Active Cams
                                        </span>
                                        <button className="text-[11px] font-bold text-amber-600 flex items-center gap-1 hover:gap-2 transition-all">
                                            MANAGE <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
                        <Package size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="font-medium">No sheds found matching your filters</p>
                    </div>
                )}
            </div>

            {/* Consumables Section */}
            <div className="flex items-center justify-between mt-8 mb-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Database size={16} /> Feed & Consumables Stock
                </h2>
            </div>

            <div className="py-8 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
                <Database size={40} className="mx-auto mb-3 opacity-15" />
                <p className="font-bold text-gray-500">No Feed Data Available</p>
                <p className="text-xs mt-1">Feed tracking and consumable inventory integration is pending</p>
            </div>
        </div>
    );

    const renderDetail = () => {
        if (!selectedShed) return null;

        return (
            <div className="animate-in slide-in-from-right duration-500">
                <div className="detail-view-header">
                    <button className="back-btn" onClick={() => setView('dashboard')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{selectedShed.name}</h1>
                        <p className="text-xs text-gray-500">Detailed performance and health metrics</p>
                    </div>
                </div>

                <div className="metrics-grid">
                    <div className="metric-mini-card">
                        <span className="label">Group Milk</span>
                        <span className="value">{selectedShed.totalMilkToday} L</span>
                        <span className="trend up"><TrendingUp size={12} /> +4.2%</span>
                    </div>
                    <div className="metric-mini-card">
                        <span className="label">Feed Consumed</span>
                        <span className="value">{selectedShed.feedConsumption} kg</span>
                        <span className="trend down"><TrendingDown size={12} /> -2.1%</span>
                    </div>
                    <div className="metric-mini-card">
                        <span className="label">Buffalo Count</span>
                        <span className="value">{selectedShed.buffaloes.length}</span>
                        <span className="trend">300 Max Capacity</span>
                    </div>
                    <div className="metric-mini-card">
                        <span className="label">Health Index</span>
                        <span className="value text-green-600">92%</span>
                        <span className="trend">Excellent Avg</span>
                    </div>
                </div>

                <div className="detail-tabs">
                    <div
                        className={`detail-tab ${activeTab === 'buffalo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('buffalo')}
                    >
                        Buffalo List
                    </div>
                    <div
                        className={`detail-tab ${activeTab === 'milk' ? 'active' : ''}`}
                        onClick={() => setActiveTab('milk')}
                    >
                        Milk Records
                    </div>
                    <div
                        className={`detail-tab ${activeTab === 'feed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('feed')}
                    >
                        Feed Logs
                    </div>
                    <div
                        className={`detail-tab ${activeTab === 'health' ? 'active' : ''}`}
                        onClick={() => setActiveTab('health')}
                    >
                        Health Cards
                    </div>
                    <div
                        className={`detail-tab ${activeTab === 'cctv' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cctv')}
                    >
                        CCTV Grid
                    </div>
                </div>

                <div className="detail-content">
                    {activeTab === 'buffalo' && (
                        <div className="detail-table-container">
                            <table className="detail-table">
                                <thead>
                                    <tr>
                                        <th>Tag No</th>
                                        <th>Breed</th>
                                        <th>Age (Yrs)</th>
                                        <th>Stage</th>
                                        <th>Avg Yield</th>
                                        <th>Status</th>
                                        <th>Health</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedShed.buffaloes.map((b, i) => (
                                        <tr key={i}>
                                            <td className="font-bold text-amber-600">{b.tagNo}</td>
                                            <td>{b.breed}</td>
                                            <td>{b.age}</td>
                                            <td>{b.lactationStage}</td>
                                            <td>{b.milkYield.toFixed(1)} L</td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.pregnancyStatus === 'Pregnant'
                                                    ? 'bg-purple-50 text-purple-600'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {b.pregnancyStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${b.healthStatus === 'Excellent' ? 'bg-green-50 text-green-600' :
                                                    b.healthStatus === 'Good' ? 'bg-blue-50 text-blue-600' :
                                                        'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {b.healthStatus.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="text-amber-600 hover:text-amber-700 font-bold text-[10px]"
                                                    onClick={() => setSelectedBuffalo(b)}
                                                >
                                                    DETAILS
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'cctv' && (
                        <div className="cctv-grid-container">
                            <div className="cctv-grid">
                                {Array.from({ length: selectedShed.cameras }).map((_, i) => (
                                    <div key={i} className="cctv-item">
                                        <div className="cctv-overlay">
                                            CAM {i + 1} - {selectedShed.name}
                                        </div>
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            <div className="flex flex-col items-center gap-2">
                                                <Camera size={32} strokeWidth={1.5} />
                                                <span className="text-[10px] uppercase font-bold tracking-widest">Signal Active</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'milk' && (
                        <div>
                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                <h3 className="text-sm font-bold text-gray-700">Recent Milk Entries</h3>
                                <button
                                    onClick={() => setShowMilkModal(true)}
                                    className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-600"
                                >
                                    <Plus size={12} /> Add Entry
                                </button>
                            </div>
                            {milkLoading ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Loading milk data...</div>
                            ) : milkEntries.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Milk size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No milk entries recorded yet</p>
                                </div>
                            ) : (
                                <div className="detail-table-container">
                                    <table className="detail-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Timing</th>
                                                <th>Quantity</th>
                                                <th>Animal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {milkEntries.slice(0, 15).map(entry => (
                                                <tr key={entry.id}>
                                                    <td className="text-xs">{entry.start_date ? new Date(entry.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}</td>
                                                    <td>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${entry.timing === 'MORNING' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                                            {entry.timing}
                                                        </span>
                                                    </td>
                                                    <td className="font-bold">{entry.quantity} L</td>
                                                    <td className="text-xs text-gray-500">{entry.animal_id || 'Shed-level'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'health' && (
                        <div>
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="text-sm font-bold text-gray-700">Active Health Tickets</h3>
                            </div>
                            {healthLoading ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Loading health data...</div>
                            ) : healthTickets.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Activity size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No health tickets found</p>
                                </div>
                            ) : (
                                <div className="detail-table-container">
                                    <table className="detail-table">
                                        <thead>
                                            <tr>
                                                <th>Case ID</th>
                                                <th>Animal</th>
                                                <th>Status</th>
                                                <th>Priority</th>
                                                <th>Created</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {healthTickets.map((t: any) => (
                                                <tr key={t.id}>
                                                    <td className="font-bold text-xs">{t.case_id}</td>
                                                    <td className="text-xs text-amber-600">{t.animal_display_id}</td>
                                                    <td>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            t.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                                                            t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                                                            'bg-green-50 text-green-700'
                                                        }`}>
                                                            {t.status?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="text-xs font-bold">{t.priority}</td>
                                                    <td className="text-xs text-gray-400">
                                                        {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'feed' && (
                        <div className="py-12 text-center text-gray-400">
                            <Database size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No feed data available</p>
                            <p className="text-xs mt-1">Feed tracking integration pending</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="inventory-container">
            {/* Header */}
            <div className="inventory-header-card mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="text-[#f59e0b]" size={24} />
                            Farm Assets & Inventory
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">Live tracking of buffaloes, production, and resources</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-col">
                            <div className="inventory-search-wrapper flex-1 md:w-64">
                                <Search className="inventory-search-icon" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by Tag, Shed, Item..."
                                    className="inventory-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="search-hints">
                                <span className="hint-pill" onClick={() => setSearchQuery('tag:BUF-10')}>tag:</span>
                                <span className="hint-pill" onClick={() => setSearchQuery('sick:true')}>sick:</span>
                                <span className="hint-pill" onClick={() => setSearchQuery('camera:offline')}>camera:</span>
                            </div>
                        </div>
                        <button className="inventory-action-btn">
                            <Plus size={18} /> Update
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        <MapPin size={14} className="text-gray-400" />
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                            <option value="All">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        <Building2 size={14} className="text-gray-400" />
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
                            value={selectedFarm}
                            onChange={(e) => setSelectedFarm(e.target.value)}
                            disabled={selectedLocation === 'All'}
                        >
                            <option value="All">All Farms</option>
                            {farms.map(farm => (
                                <option key={farm.id} value={farm.farm_name}>{farm.farm_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        <LayoutGrid size={14} className="text-gray-400" />
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
                            value={selectedShedFilter}
                            onChange={(e) => setSelectedShedFilter(e.target.value)}
                            disabled={selectedFarm === 'All'}
                        >
                            <option value="All">All Sheds</option>
                            {shedsList.map(shed => (
                                <option key={shed.id} value={shed.shed_name || shed.shed_id}>{shed.shed_name || shed.shed_id}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        <Database size={14} className="text-gray-400" />
                        <select
                            className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            <option value="Feed">Feed</option>
                            <option value="Medicine">Medicine</option>
                            <option value="Vaccine">Vaccine</option>
                            <option value="Equipment">Equipment</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {(selectedLocation !== 'All' || selectedFarm !== 'All' || selectedShedFilter !== 'All' || selectedCategory !== 'All') && (
                        <button
                            onClick={() => {
                                setSelectedLocation('All');
                                setSelectedFarm('All');
                                setSelectedShedFilter('All');
                                setSelectedCategory('All');
                            }}
                            className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {view === 'dashboard' ? renderDashboard() : renderDetail()}

            <CreateMilkEntryModal
                isOpen={showMilkModal}
                onClose={() => setShowMilkModal(false)}
                onSuccess={() => {
                    setShowMilkModal(false);
                    // Re-fetch milk entries
                    farmvestService.getMilkEntries({ page: 1, size: 50 }).then(res => {
                        setMilkEntries(res.data || []);
                    }).catch(() => {});
                }}
            />

            {/* Buffalo Detail Drawer */}
            {selectedBuffalo && (
                <div className="drawer-overlay" onClick={() => setSelectedBuffalo(null)}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <div>
                                <h2 className="text-2xl font-black">{selectedBuffalo.tagNo}</h2>
                                <p className="text-sm opacity-70">Murrah Breed • Female • {selectedBuffalo.age} Years</p>
                            </div>
                            <button className="text-white opacity-50 hover:opacity-100" onClick={() => setSelectedBuffalo(null)}>
                                <Plus size={32} className="rotate-45" />
                            </button>
                        </div>
                        <div className="drawer-body">
                            <div className="drawer-section">
                                <h3 className="drawer-section-title"><Activity size={14} /> Vital Stats</h3>
                                <div className="drawer-grid">
                                    <div className="metric-mini">
                                        <span className="kpi-label">Health Status</span>
                                        <span className={`kpi-value ${selectedBuffalo.healthStatus === 'Excellent' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {selectedBuffalo.healthStatus}
                                        </span>
                                    </div>
                                    <div className="metric-mini">
                                        <span className="kpi-label">Pregnancy</span>
                                        <span className="kpi-value">{selectedBuffalo.pregnancyStatus}</span>
                                    </div>
                                    <div className="metric-mini">
                                        <span className="kpi-label">Lactation</span>
                                        <span className="kpi-value">{selectedBuffalo.lactationStage}</span>
                                    </div>
                                    <div className="metric-mini">
                                        <span className="kpi-label">Daily Avg</span>
                                        <span className="kpi-value">{selectedBuffalo.milkYield.toFixed(1)} L</span>
                                    </div>
                                </div>
                            </div>

                            <div className="drawer-section">
                                <h3 className="drawer-section-title"><TrendingUp size={14} /> Production History</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Total Lifetime Yield</span>
                                        <span className="font-bold">2,450 Liters</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Lactation Cycle</span>
                                        <span className="font-bold">#3 (Day 45)</span>
                                    </div>
                                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[65%]" />
                                    </div>
                                </div>
                            </div>

                            <div className="drawer-section">
                                <h3 className="drawer-section-title"><Info size={14} /> Recent Activities</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                                        <div>
                                            <p className="text-xs font-bold">Health Checkup</p>
                                            <p className="text-[10px] text-gray-500">Dr. Sharma • Feb 1, 2026</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
                                        <div>
                                            <p className="text-xs font-bold">Vaccination (FMD)</p>
                                            <p className="text-[10px] text-gray-500">Routine Dose • Jan 15, 2026</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition-all">
                                UPDATE MEDICAL LOG
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
