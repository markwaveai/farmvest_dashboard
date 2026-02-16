import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './Dashboard.css';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    DollarSign, Home, Archive, Users, ArrowUpRight, ArrowDownRight, Filter, Loader2
} from 'lucide-react';

import SearchableDropdown from '../components/common/SearchableDropdown';
import { farmvestService } from '../services/farmvest_api';

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';
type FilterOption = 'All' | string;

const THICK_GREEN = '#113025';
const COLORS = [THICK_GREEN, '#E27D60', '#64748b', '#94a3b8'];

const Dashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
    const [selectedFarm, setSelectedFarm] = useState<FilterOption>('All');
    const [selectedShed, setSelectedShed] = useState<FilterOption>('All');
    const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
    const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
    const [isBuffaloModalOpen, setIsBuffaloModalOpen] = useState(false);
    const [isShedModalOpen, setIsShedModalOpen] = useState(false);

    // Live Data State
    const [farms, setFarms] = useState<any[]>([]);
    const [sheds, setSheds] = useState<any[]>([]);
    const [animalCount, setAnimalCount] = useState(0);
    const [allAnimals, setAllAnimals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Mock Data Constants (Retained for Charts not yet in API) ---
    const FARMS = ['Farm A'];
    const SHEDS = ['Shed A', 'Shed B', 'Shed C', 'Shed D'];

    // Initial Data Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const farmsResponse = await farmvestService.getAllFarms();
                const farmsList = Array.isArray(farmsResponse) ? farmsResponse : (farmsResponse.farms || farmsResponse.data || farmsResponse.data?.farms || []);
                setFarms(farmsList);

                // Fetch Initial Animals (Total)
                const statsResponse = await farmvestService.getTotalAnimals(undefined, undefined, 1, 5000);
                if (statsResponse) {
                    const animalData = Array.isArray(statsResponse) ? statsResponse : (statsResponse.data || statsResponse.animals || statsResponse.data?.animals || []);
                    setAnimalCount(statsResponse.animals_count || statsResponse.count || statsResponse.total_count || animalData.length);
                    setAllAnimals(animalData);
                }
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch Sheds when farm changes
    useEffect(() => {
        const fetchSheds = async () => {
            if (selectedFarm === 'All') {
                setSheds([]);
                setSelectedShed('All');
                return;
            }
            try {
                const farmId = farms.find(f => (f.farm_name || f.name) === selectedFarm)?.id ||
                    farms.find(f => (f.farm_name || f.name) === selectedFarm)?.farm_id;
                if (farmId) {
                    const shedResponse = await farmvestService.getShedsByFarm(farmId);
                    const sl = Array.isArray(shedResponse) ? shedResponse : (shedResponse.sheds || shedResponse.data || shedResponse.data?.sheds || []);
                    setSheds(sl);
                }
            } catch (error) {
            }
        };
        fetchSheds();
    }, [selectedFarm, farms]);

    // Update Animal Count when filters change
    useEffect(() => {
        const updateCount = async () => {
            try {
                const farmObj = farms.find(f => (f.farm_name || f.name) === selectedFarm);
                const shedObj = sheds.find(s => (s.shed_name || s.shed_id) === selectedShed);

                const farmId = farmObj?.id || farmObj?.farm_id;
                const shedId = shedObj?.id || shedObj?.shed_id;

                const response = await farmvestService.getTotalAnimals(farmId, shedId, 1, 5000);
                if (response) {
                    const data = Array.isArray(response) ? response : (response.data || response.animals || response.data?.animals || []);
                    setAnimalCount(response.animals_count || response.count || response.total_count || data.length);
                    if (selectedFarm === 'All' && selectedShed === 'All') {
                        setAllAnimals(data);
                    }
                }
            } catch (error) {
            }
        };
        updateCount();
    }, [selectedFarm, selectedShed]);

    // Data strictly according to: 1 Farm = 4 Sheds, 300 Buffalos each.
    // Enhanced: Use live data for distribution if all animals loaded
    const allShedData = useMemo(() => {
        if (allAnimals.length > 0) {
            const groups: Record<string, { name: string, farmName?: string, animals: number, revenue: number, color: string }> = {};

            // Filter by selected farm name if not "All"
            const filteredAnimals = selectedFarm === 'All' ? allAnimals : allAnimals.filter(a =>
                (a.farm_name || (a.farm && a.farm.farm_name)) === selectedFarm
            );

            filteredAnimals.forEach((a) => {
                const shedName = a.shed_name || (a.shed && a.shed.shed_name) || 'Unknown';
                const farmName = a.farm_name || (a.farm && a.farm.farm_name) || 'Unknown';
                const groupKey = selectedFarm === 'All' ? `${farmName}-${shedName}` : shedName;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        name: selectedFarm === 'All' ? `${farmName} - ${shedName}` : shedName,
                        farmName: farmName,
                        animals: 0,
                        revenue: 0,
                        color: COLORS[Object.keys(groups).length % COLORS.length]
                    };
                }
                groups[groupKey].animals += 1;
                groups[groupKey].revenue += 500;
            });
            return Object.values(groups);
        }

        return [
            { name: 'Shed A', animals: 300, revenue: 150000, color: '#113025' },
            { name: 'Shed B', animals: 300, revenue: 145000, color: '#E27D60' },
            { name: 'Shed C', animals: 300, revenue: 160000, color: '#64748b' },
            { name: 'Shed D', animals: 300, revenue: 155000, color: '#94a3b8' },
        ];
    }, [allAnimals, selectedFarm]);

    // Filter logic for Sheds/Animals/Revenue
    const currentShedData = useMemo(() => {
        if (selectedShed !== 'All') {
            return allShedData.filter(s => s.name === selectedShed);
        }
        return allShedData;
    }, [selectedShed, allShedData]);

    // Calculate Totals based on selection
    const totalRevenue = currentShedData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalAnimals = selectedFarm === 'All' && selectedShed === 'All' ? animalCount : currentShedData.reduce((acc, curr) => acc + curr.animals, 0);
    const activeSheds = selectedShed === 'All' ? (sheds.length || 4) : 1;
    const totalFarms = farms.length || 1;

    // --- Mock Data Generators ---
    const getRevenueData = (range: TimeRange, shedFilter: FilterOption) => {
        // Base multiplier to simulate lower values when single shed is selected
        const multiplier = shedFilter === 'All' ? 1 : (1 / (sheds.length || 4));

        switch (range) {
            case 'daily':
                return Array.from({ length: 7 }, (_, i) => ({
                    name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
                    revenue: (Math.floor(Math.random() * 50000) + 10000) * multiplier,
                    expenses: (Math.floor(Math.random() * 30000) + 5000) * multiplier,
                    feedCost: (Math.floor(Math.random() * 15000) + 2000) * multiplier,
                    feedConsumption: (Math.floor(Math.random() * 500) + 100) * multiplier, // in kg
                }));
            case 'weekly':
                return Array.from({ length: 4 }, (_, i) => ({
                    name: `Week ${i + 1}`,
                    revenue: (Math.floor(Math.random() * 200000) + 50000) * multiplier,
                    expenses: (Math.floor(Math.random() * 100000) + 20000) * multiplier,
                    feedCost: (Math.floor(Math.random() * 50000) + 10000) * multiplier,
                    feedConsumption: (Math.floor(Math.random() * 2000) + 500) * multiplier,
                }));
            case 'monthly':
                return [
                    { name: 'Jan', revenue: 400000 * multiplier, expenses: 240000 * multiplier, feedCost: 100000 * multiplier, feedConsumption: 5000 * multiplier },
                    { name: 'Feb', revenue: 300000 * multiplier, expenses: 139800 * multiplier, feedCost: 60000 * multiplier, feedConsumption: 3500 * multiplier },
                    { name: 'Mar', revenue: 200000 * multiplier, expenses: 98000 * multiplier, feedCost: 40000 * multiplier, feedConsumption: 2500 * multiplier },
                    { name: 'Apr', revenue: 278000 * multiplier, expenses: 39080 * multiplier, feedCost: 15000 * multiplier, feedConsumption: 1000 * multiplier },
                    { name: 'May', revenue: 189000 * multiplier, expenses: 48000 * multiplier, feedCost: 20000 * multiplier, feedConsumption: 1200 * multiplier },
                    { name: 'Jun', revenue: 239000 * multiplier, expenses: 38000 * multiplier, feedCost: 18000 * multiplier, feedConsumption: 1100 * multiplier },
                    { name: 'Jul', revenue: 349000 * multiplier, expenses: 43000 * multiplier, feedCost: 20000 * multiplier, feedConsumption: 1250 * multiplier },
                    { name: 'Aug', revenue: 400000 * multiplier, expenses: 240000 * multiplier, feedCost: 100000 * multiplier, feedConsumption: 5000 * multiplier },
                    { name: 'Sep', revenue: 300000 * multiplier, expenses: 139800 * multiplier, feedCost: 60000 * multiplier, feedConsumption: 3500 * multiplier },
                    { name: 'Oct', revenue: 200000 * multiplier, expenses: 98000 * multiplier, feedCost: 40000 * multiplier, feedConsumption: 2500 * multiplier },
                    { name: 'Nov', revenue: 278000 * multiplier, expenses: 39080 * multiplier, feedCost: 15000 * multiplier, feedConsumption: 1000 * multiplier },
                    { name: 'Dec', revenue: 189000 * multiplier, expenses: 48000 * multiplier, feedCost: 20000 * multiplier, feedConsumption: 1200 * multiplier },
                ];
            case 'yearly':
                return [
                    { name: '2021', revenue: 2400000 * multiplier, expenses: 1400000 * multiplier, feedCost: 600000 * multiplier, feedConsumption: 30000 * multiplier },
                    { name: '2022', revenue: 3000000 * multiplier, expenses: 1800000 * multiplier, feedCost: 800000 * multiplier, feedConsumption: 40000 * multiplier },
                    { name: '2023', revenue: 4500000 * multiplier, expenses: 2400000 * multiplier, feedCost: 1000000 * multiplier, feedConsumption: 50000 * multiplier },
                    { name: '2024', revenue: 5200000 * multiplier, expenses: 2800000 * multiplier, feedCost: 1200000 * multiplier, feedConsumption: 60000 * multiplier },
                    { name: '2025', revenue: 6100000 * multiplier, expenses: 3100000 * multiplier, feedCost: 1400000 * multiplier, feedConsumption: 70000 * multiplier },
                ];
            default:
                return [];
        }
    };

    const revenueTrendData = useMemo(() => getRevenueData(timeRange, selectedShed), [timeRange, selectedShed, sheds.length]);
    const totalFeedConsumption = revenueTrendData.reduce((acc, curr) => acc + curr.feedConsumption, 0);

    const handleShedChange = (val: string) => {
        setSelectedShed(val);
    };

    const handleFarmChange = (val: string) => {
        setSelectedFarm(val);
        // Reset shed if farm changes
        setSelectedShed('All');
    };

    // Prepare options for SearchableDropdown from live data
    const farmOptions = [{ value: 'All', label: 'All Farms' }, ...farms.map(f => ({ value: f.farm_name || f.name, label: f.farm_name || f.name }))];
    const shedOptions = [{ value: 'All', label: 'All Sheds' }, ...sheds.map(s => ({ value: s.shed_name || s.shed_id, label: s.shed_name || s.shed_id }))];

    const chartTitle = selectedShed !== 'All'
        ? `Revenue & Expenses Trend (${selectedShed})`
        : selectedFarm !== 'All' && selectedFarm !== 'All Farms'
            ? `Revenue & Expenses Trend (${selectedFarm})`
            : 'Revenue & Expenses Trend (Entire Farm)';

    return (
        <div className="dashboard-container relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-green-800" size={40} />
                        <span className="font-semibold text-green-900">Synchronizing Farm Data...</span>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="dashboard-header">
                <h1 className="dashboard-title">Financial & Feed Overview</h1>

                <div className="flex gap-4 items-center">
                    {/* Filters */}
                    <SearchableDropdown
                        options={farmOptions}
                        value={selectedFarm}
                        onChange={handleFarmChange}
                        placeholder="Select Farm"
                        className="w-48"
                    />

                    <SearchableDropdown
                        options={shedOptions}
                        value={selectedShed}
                        onChange={handleShedChange}
                        placeholder="Select Shed"
                        disabled={selectedFarm === 'All'}
                        className="w-48"
                    />

                    {/* Time Filter */}
                    <div className="time-filter-container ml-4">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                className={`time-filter-btn ${timeRange === range ? 'active' : ''}`}
                                onClick={() => setTimeRange(range)}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards-grid">
                <SummaryCard
                    title="Total Revenue"
                    value={`₹ ${totalRevenue.toLocaleString()}`}
                    subtitle="Monthly Aggregate"
                    icon={<DollarSign color="white" size={24} />}
                    color={THICK_GREEN}
                    onClick={() => setIsRevenueModalOpen(true)}
                />
                <SummaryCard
                    title="Feed Consumption"
                    value={`${totalFeedConsumption.toLocaleString()} kg`}
                    subtitle="Estimated Usage"
                    icon={<Archive color="white" size={24} />}
                    color="#E27D60"
                    onClick={() => setIsFeedModalOpen(true)}
                />
                <SummaryCard
                    title="Active Sheds"
                    value={activeSheds.toString()}
                    subtitle={selectedShed === 'All' ? "100% Operational" : "Selected Shed"}
                    icon={<Home color="white" size={24} />}
                    color="#64748b"
                    onClick={() => setIsShedModalOpen(true)}
                />
                <SummaryCard
                    title="Total Animals"
                    value={totalAnimals.toLocaleString()}
                    subtitle="Live Count"
                    icon={<Users color="white" size={24} />}
                    color="#E27D60"
                    onClick={() => setIsBuffaloModalOpen(true)}
                />
            </div>

            {/* Modals */}
            <FeedDetailsModal
                isOpen={isFeedModalOpen}
                onClose={() => setIsFeedModalOpen(false)}
                data={revenueTrendData}
                timeRange={timeRange}
                shed={selectedShed}
            />
            <RevenueDetailsModal
                isOpen={isRevenueModalOpen}
                onClose={() => setIsRevenueModalOpen(false)}
                data={revenueTrendData}
                timeRange={timeRange}
                shed={selectedShed}
            />
            <BuffaloDetailsModal
                isOpen={isBuffaloModalOpen}
                onClose={() => setIsBuffaloModalOpen(false)}
                shed={selectedShed}
                totalAnimals={totalAnimals}
            />
            <ShedDetailsModal
                isOpen={isShedModalOpen}
                onClose={() => setIsShedModalOpen(false)}
                activeSheds={activeSheds}
                totalAnimals={totalAnimals}
            />

            {/* Main Charts Area */}
            <div className="flex flex-col gap-6 mb-6">
                {/* Revenue Trends */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h2 className="chart-title">{chartTitle}</h2>
                    </div>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <AreaChart data={revenueTrendData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={THICK_GREEN} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#113025" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E27D60" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#E27D60" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" stroke={THICK_GREEN} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                <Area type="monotone" dataKey="expenses" stroke="#E27D60" fillOpacity={1} fill="url(#colorExpense)" name="Expenses" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Charts - Row of 3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feed Consumption Logic */}
                    <div className="chart-card" style={{ minHeight: 'auto', flex: 1 }}>
                        <div className="chart-header">
                            <h2 className="chart-title">Feed Consumption ({timeRange})</h2>
                        </div>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <BarChart data={revenueTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="feedConsumption" fill="#E27D60" name="Feed (kg)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue by Shed */}
                    <div className="chart-card" style={{ minHeight: 'auto', flex: 1 }}>
                        <div className="chart-header">
                            <h2 className="chart-title">Revenue by Shed</h2>
                        </div>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <BarChart data={currentShedData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={80} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="revenue" fill={THICK_GREEN} radius={[0, 4, 4, 0]} barSize={20} name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Shed Distribution (Buffalo Count) */}
                    <div className="chart-card" style={{ minHeight: 'auto', flex: 1 }}>
                        <div className="chart-header">
                            <h2 className="chart-title">Buffalo Distribution</h2>
                        </div>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={currentShedData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#E27D60"
                                        paddingAngle={5}
                                        dataKey="animals"
                                        nameKey="name"
                                    >
                                        {currentShedData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="chart-card" style={{ marginBottom: '24px' }}>
                <div className="chart-header">
                    <h2 className="chart-title">Detailed Financial Breakdown {selectedShed !== 'All' ? `- ${selectedShed}` : ''}</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                                <th style={{ padding: '12px', color: '#666', fontWeight: 600 }}>Range</th>
                                <th style={{ padding: '12px', color: '#666', fontWeight: 600 }}>Revenue</th>
                                <th style={{ padding: '12px', color: '#666', fontWeight: 600 }}>Expenses</th>
                                <th style={{ padding: '12px', color: '#666', fontWeight: 600 }}>Feed Cost (Est.)</th>
                                <th style={{ padding: '12px', color: '#666', fontWeight: 600 }}>Net Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenueTrendData.map((data, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '12px', fontWeight: 500 }}>{data.name}</td>
                                    <td style={{ padding: '12px', color: THICK_GREEN }}>₹ {data.revenue.toLocaleString()}</td>
                                    <td style={{ padding: '12px', color: '#E27D60' }}>₹ {data.expenses.toLocaleString()}</td>
                                    <td style={{ padding: '12px', color: '#64748b' }}>₹ {data.feedCost.toLocaleString()}</td>
                                    <td style={{ padding: '12px', color: data.revenue - data.expenses >= 0 ? THICK_GREEN : '#E27D60', fontWeight: 600 }}>
                                        ₹ {(data.revenue - data.expenses).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const FeedDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; data: any; timeRange: string; shed: string }> = ({ isOpen, onClose, data, timeRange, shed }) => {
    if (!isOpen) return null;

    // Simulate breakdown based on total consumption
    const totalConsumption = data.reduce((acc: number, curr: any) => acc + curr.feedConsumption, 0);
    const totalCost = data.reduce((acc: number, curr: any) => acc + curr.feedCost, 0);

    // Default distribution ratios (Mock)
    const breakdown = [
        { name: 'Dry Fodder', value: totalConsumption * 0.45, fill: '#8884d8' },
        { name: 'Green Fodder', value: totalConsumption * 0.35, fill: '#82ca9d' },
        { name: 'Concentrates', value: totalConsumption * 0.15, fill: '#ffc658' },
        { name: 'Mineral Mixture', value: totalConsumption * 0.05, fill: '#ff8042' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Feed Details Analysis</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <ArrowUpRight className="transform rotate-45" size={24} /> {/* Using as close icon surrogate */}
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Stats & Cost */}
                    <div>
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <p className="text-sm text-gray-500">Time Range</p>
                            <p className="text-lg font-semibold capitalize">{timeRange} ({shed})</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Total Consumption</p>
                                <p className="text-xl font-bold text-blue-600">{totalConsumption.toLocaleString()} kg</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Total Cost</p>
                                <p className="text-xl font-bold text-orange-600">₹ {totalCost.toLocaleString()}</p>
                            </div>
                        </div>

                        <h3 className="font-semibold text-gray-700 mb-2">Consumption by Type</h3>
                        <ul className="space-y-2">
                            {breakdown.map((item, index) => (
                                <li key={index} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.fill }}></div>
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="font-medium">{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right: Visualization */}
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 mb-2 w-full text-center">Distribution Ratio</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={breakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {breakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RevenueDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; data: any; timeRange: string; shed: string }> = ({ isOpen, onClose, data, timeRange, shed }) => {
    if (!isOpen) return null;

    const totalRevenue = data.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
    const totalExpenses = data.reduce((acc: number, curr: any) => acc + curr.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;

    const revenueSources = [
        { name: 'Milk Sales', value: totalRevenue * 0.82, fill: '#0f766e' },
        { name: 'Manure Sales', value: totalRevenue * 0.08, fill: '#2dd4bf' },
        { name: 'Animal Sales', value: totalRevenue * 0.10, fill: '#14b8a6' },
    ];

    const expenseBreakdown = [
        { name: 'Feed Cost', value: totalExpenses * 0.60, fill: '#d97706' },
        { name: 'Labor Cost', value: totalExpenses * 0.20, fill: '#f59e0b' },
        { name: 'Medical/Vet', value: totalExpenses * 0.10, fill: '#fbbf24' },
        { name: 'Ops & Maint', value: totalExpenses * 0.10, fill: '#fcd34d' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[900px] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Financial Performance Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Net Profit</p>
                        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹ {netProfit.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Gross Revenue</p>
                        <p className="text-2xl font-bold text-teal-700">₹ {totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Total Expenses</p>
                        <p className="text-2xl font-bold text-orange-700">₹ {totalExpenses.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Revenue Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-center text-gray-700 mb-4">Revenue Sources</h3>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={revenueSources}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {revenueSources.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `₹ ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Expense Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-center text-gray-700 mb-4">Expense Breakdown</h3>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={expenseBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {expenseBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `₹ ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BuffaloDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; shed: string; totalAnimals: number }> = ({ isOpen, onClose, shed, totalAnimals }) => {
    if (!isOpen) return null;

    // Simulate Herd Composition
    const composition = [
        { name: 'Milking', value: totalAnimals * 0.60, fill: '#7c3aed' },
        { name: 'Dry', value: totalAnimals * 0.20, fill: '#a78bfa' },
        { name: 'Pregnant Heifers', value: totalAnimals * 0.10, fill: '#c4b5fd' },
        { name: 'Calves', value: totalAnimals * 0.10, fill: '#ddd6fe' },
    ];

    const healthStatus = [
        { name: 'Healthy', value: totalAnimals * 0.95, fill: '#10b981' },
        { name: 'Under Treatment', value: totalAnimals * 0.03, fill: '#f59e0b' },
        { name: 'Quarantine', value: totalAnimals * 0.02, fill: '#ef4444' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Buffalo Herd Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Selected Scope</p>
                        <p className="text-lg font-semibold">{shed === 'All' ? 'Farm Level Aggregate' : shed}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total Head Count</p>
                        <p className="text-2xl font-bold text-purple-700">{totalAnimals.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Herd Composition */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-4 bg-gray-50 p-2 rounded text-center">Herd Composition (Stage)</h3>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={composition}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {composition.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Health Status */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-4 bg-gray-50 p-2 rounded text-center">Health Status</h3>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={healthStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {healthStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShedDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; activeSheds: number; totalAnimals: number }> = ({ isOpen, onClose, activeSheds, totalAnimals }) => {
    if (!isOpen) return null;

    // Simulate Capacity
    const capacityPerShed = 300; // Mock Max Capacity
    const totalCapacity = activeSheds * capacityPerShed; // Total capacity based on active sheds
    const occupancyRate = (totalAnimals / totalCapacity) * 100;
    const availableSpace = totalCapacity - totalAnimals;

    const occupancyData = [
        { name: 'Occupied', value: totalAnimals, fill: '#2563eb' },
        { name: 'Available', value: availableSpace, fill: '#93c5fd' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Shed Utilization Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Active Sheds</p>
                        <p className="text-2xl font-bold text-blue-700">{activeSheds}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Total Capacity</p>
                        <p className="text-2xl font-bold text-indigo-700">{totalCapacity}</p>
                    </div>
                    <div className="bg-cyan-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Occupied Count</p>
                        <p className={`text-2xl font-bold ${occupancyRate > 90 ? 'text-red-600' : 'text-cyan-700'}`}>
                            {totalAnimals}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Occupancy Stats */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Occupancy Rate</span>
                            <span className="text-blue-600 font-bold">{occupancyRate.toFixed(1)}%</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Available Space</span>
                            <span className="text-blue-400 font-bold">{availableSpace}</span>
                        </div>
                        <p className="text-xs text-slate-500 italic mt-2">
                            * Based on maximum capacity of {capacityPerShed} animals per shed.
                        </p>
                    </div>

                    {/* Chart */}
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-700 mb-4 w-full text-center">Capacity Utilization</h3>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={occupancyData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        startAngle={180}
                                        endAngle={0}
                                        dataKey="value"
                                    >
                                        {occupancyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `${value}`} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SummaryCard: React.FC<{ title: string, value: string, subtitle: string, icon: React.ReactNode, color: string, onClick?: () => void }> = ({ title, value, subtitle, icon, color, onClick }) => {
    const isPositive = subtitle.includes('+') || subtitle.includes('Occupancy') || subtitle.includes('New') || subtitle.includes('Live') || subtitle.includes('Monthly');

    return (
        <div
            className={`summary-card ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={onClick}
        >
            <div className="card-header">
                <div className="card-icon" style={{ backgroundColor: color }}>
                    {icon}
                </div>
                <span className="card-title">{title}</span>
            </div>
            <div className="card-value">{value}</div>
            <div className={`card-subtitle ${!isPositive ? 'negative' : ''}`}>
                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {subtitle}
            </div>
        </div>
    );
};

export default Dashboard;
