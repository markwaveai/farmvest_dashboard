import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Package, Bell,
    TrendingUp, ArrowUpRight, ArrowDownRight,
    AlertTriangle, Calendar, Zap, Tractor,
    Stethoscope, Wrench, Droplet,
    PawPrint, ArrowLeftRight, BarChart3,
    ChevronRight, Box, AlertCircle
} from 'lucide-react';
import { farmvestService } from '../services/farmvest_api';
import { MilkEntry } from '../types/farmvest';
import { FeedFodder } from './inventory/feed';
import { MedicineInventory } from './inventory/medicine';
import { EquipmentInventory } from './inventory/equipment';
import './Inventory.css';

const Inventory: React.FC = () => {
    // UI State
    const [view, setView] = useState<'overview' | 'feed-fodder' | 'equipment' | 'medicines'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [statsLoading, setStatsLoading] = useState(false);
    const [totalAnimalCount, setTotalAnimalCount] = useState(0);

    // Mock data for things not in API yet to match the design
    const [inventoryStats] = useState({
        totalValue: 124580,
        lowStock: 12,
        expiringMedicines: 8,
        dailyConsumption: 1420
    });

    // Fetch initial data for real parts of the UI
    useEffect(() => {
        const fetchInitialData = async () => {
            setStatsLoading(true);
            try {
                const statsResponse = await farmvestService.getTotalAnimals();
                if (statsResponse) {
                    setTotalAnimalCount(statsResponse.animals_count || 0);
                }
            } catch (error) {
                console.error("Failed to fetch inventory data", error);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    if (view === 'medicines') {
        return <MedicineInventory onBack={() => setView('overview')} />;
    }

    if (view === 'feed-fodder') {
        return <FeedFodder onBack={() => setView('overview')} />;
    }

    if (view === 'equipment') {
        return <EquipmentInventory onBack={() => setView('overview')} />;
    }

    return (
        <div className="h-full flex flex-col gap-6 pt-4 pb-8 px-8 font-sans bg-white min-h-screen text-gray-900">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Inventory Management</h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative min-w-[320px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search inventory, sheds..."
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button className="p-2.5 text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-700 rounded-lg relative transition-all border border-transparent hover:border-gray-200">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors">
                        <Plus size={18} />
                        New Entry
                    </button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total Inventory Value</span>
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[11px] font-medium">
                            <TrendingUp size={12} />
                            2.4%
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">$124,000</h2>
                        <p className="text-xs font-medium text-slate-500">Valuation across all categories</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Low Stock</span>
                            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Alerts</span>
                        </div>
                        <div className="bg-blue-50 text-blue-900 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide leading-tight text-center">
                            Needs<br />Attention
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">8 Items</h2>
                        <p className="text-xs font-medium">Critical levels in fodder & meds</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Expiring</span>
                            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Medicines</span>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                            Priority
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">3 Units</h2>
                        <p className="text-xs font-medium">Expires within next 7 days</p>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Feed</span>
                            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Consumption</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium leading-tight text-right">
                            Daily Avg:<br /><span className="text-emerald-600 font-bold text-xs">2.7k</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">2,850 kg</h2>
                        <p className="text-xs font-medium">Last 24 hours total usage</p>
                    </div>
                </div>
            </div>

            {/* Shed-wise Quick Stats */}
            <section className="mt-2">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Shed-wise Quick Stats</h3>
                    <button className="text-blue-900 hover:text-blue-800 text-sm font-semibold hover:underline">View Map View</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                        <div className="h-32 bg-gradient-to-br from-blue-900 to-slate-900 relative p-6 flex flex-col justify-end">
                            <div>
                                <h4 className="text-white font-bold text-lg leading-tight">Shed 1: Main Barn</h4>
                                <p className="text-blue-100 text-[11px] font-medium">Primary Housing</p>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-center mb-2 text-sm font-medium text-gray-600">
                                <span>Occupancy Capacity</span>
                                <span className="font-bold text-gray-900">85%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
                                <div className="h-full bg-blue-900 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                                    <Tractor size={14} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">450 kg</div>
                                    <div className="text-xs text-gray-500 font-medium">Current feed stock</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                        <div className="h-32 bg-gradient-to-br from-emerald-600 to-emerald-800 relative p-6 flex flex-col justify-end">
                            <div>
                                <h4 className="text-white font-bold text-lg leading-tight">Shed 2: Milking Parlor</h4>
                                <p className="text-emerald-100 text-[11px] font-medium">Production Area</p>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-center mb-2 text-sm font-medium text-gray-600">
                                <span>Occupancy Capacity</span>
                                <span className="font-bold text-gray-900">92%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                            </div>
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Tractor size={14} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">210 kg</div>
                                    <div className="text-xs text-gray-500 font-medium">Current feed stock</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                        <div className="h-32 bg-gradient-to-br from-teal-600 to-teal-800 relative p-6 flex flex-col justify-end">
                            <div>
                                <h4 className="text-white font-bold text-lg leading-tight">Shed 3: Calving Unit</h4>
                                <p className="text-teal-100 text-[11px] font-medium">Healthcare & Nursery</p>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-center mb-2 text-sm font-medium text-gray-600">
                                <span>Occupancy Capacity</span>
                                <span className="font-bold text-gray-900">60%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
                                <div className="h-full bg-teal-500 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                    <Tractor size={14} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">120 kg</div>
                                    <div className="text-xs text-gray-500 font-medium">Current feed stock</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="mt-4 pb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    <div onClick={() => setView('feed-fodder')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group h-28 text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Tractor size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-emerald-700">Feed & Fodder</span>
                    </div>
                    <div onClick={() => setView('medicines')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-900 transition-all group h-28 text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                            <Stethoscope size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-blue-900 transition-colors">Medicines</span>
                    </div>
                    <div onClick={() => setView('equipment')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group h-28 text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Wrench size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-emerald-700">Equipment</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-900 transition-all group h-28 text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                            <Droplet size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-blue-900">Dairy Production</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group h-28 text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Box size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-emerald-700">Consumables</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-900 transition-all group h-28 text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                            <PawPrint size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-blue-900">Breeding</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group h-28 text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <ArrowLeftRight size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-emerald-700">Transfers</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-900 transition-all group h-28 text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                            <AlertTriangle size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 group-hover:text-blue-900">Alerts & Logs</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Inventory;
