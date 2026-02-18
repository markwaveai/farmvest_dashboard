import React, { useState, useMemo } from 'react';
import {
    ChevronRight, ArrowLeftRight, Plus, LayoutGrid,
    AlertCircle, Calendar, BarChart3, Wrench, Box,
    ArrowUpRight, Info, Filter, MoreHorizontal, Droplet, Wind, Settings2,
    Search, X, ChevronDown, ChevronLeft
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';

interface EquipmentItem {
    id: number;
    name: string;
    sn: string;
    shed: string;
    status: 'Good' | 'Repair' | 'Replace';
    lastMain: string;
    nextService: string;
    type: 'melker' | 'pump' | 'feeder' | 'fan';
}

interface EquipmentInventoryProps {
    onBack: () => void;
}

export const EquipmentInventory: React.FC<EquipmentInventoryProps> = ({ onBack }) => {
    const [equipmentItems] = useState<EquipmentItem[]>([
        { id: 1, name: 'Milking Machine Model X', sn: 'MM-990-2023', shed: 'Shed 1', status: 'Good', lastMain: 'Aug 14, 2023', nextService: 'Nov 14, 2023', type: 'melker' },
        { id: 2, name: 'HydroFlow Pump v2', sn: 'HF-422-PMP', shed: 'Shed 2', status: 'Repair', lastMain: 'Sep 01, 2023', nextService: 'Oct 10, 2023', type: 'pump' },
        { id: 3, name: 'Auto-Feeder Pro 5k', sn: 'AF-8832-X', shed: 'Shed 3', status: 'Replace', lastMain: 'Jan 12, 2023', nextService: 'OVERDUE', type: 'feeder' },
        { id: 4, name: 'Ventilation Fan Array', sn: 'VF-901-22', shed: 'Shed 1', status: 'Good', lastMain: 'Sep 28, 2023', nextService: 'Dec 28, 2023', type: 'fan' },
    ]);

    // Table State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Filter Logic
    const filteredItems = useMemo(() => {
        return equipmentItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sn.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = selectedStatus ? item.status === selectedStatus : true;
            return matchesSearch && matchesStatus;
        });
    }, [equipmentItems, searchTerm, selectedStatus]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statuses = ['Good', 'Repair', 'Replace'];

    return (
        <div className="min-h-screen w-full flex flex-col gap-4 overflow-y-auto overflow-x-hidden font-sans text-gray-900 p-6">

            {/* Header Card */}
            <div className="flex-none bg-white border-b border-gray-100 p-4 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 cursor-pointer hover:text-blue-600 w-fit" onClick={onBack}>
                    <ChevronLeft size={16} />
                    <span>Back to Overview</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Equipment & Machinery</h1>

                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                className="pl-9 pr-8 py-2 w-full border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status Dropdown */}
                        <div className="relative z-20">
                            <button
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className={`flex items-center justify-between min-w-[140px] py-2 px-3 rounded-md text-xs font-medium focus:outline-none hover:bg-orange-50 hover:border-gray-300 hover:text-orange-700 transition-colors ${selectedStatus ? 'bg-orange-50 border border-gray-200 text-orange-700' : 'bg-white border border-gray-200 text-gray-700'}`}
                            >
                                <span>{selectedStatus || 'All Status'}</span>
                                <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 z-50">
                                    <button
                                        onClick={() => { setSelectedStatus(''); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs hover:bg-orange-50 hover:text-orange-700 ${!selectedStatus ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700'}`}
                                    >
                                        All Status
                                    </button>
                                    {statuses.map(st => (
                                        <button
                                            key={st}
                                            onClick={() => { setSelectedStatus(st); setIsStatusDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-orange-50 hover:text-orange-700 ${selectedStatus === st ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700'}`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-3 py-2 rounded-md font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all">
                            <Plus size={14} />
                            <span>Add Asset</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Assets</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">24 Active</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg ">
                        <Box size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Maint. Due</p>
                        <h3 className="text-lg font-bold  mt-1">03 Items</h3>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg ">
                        <Wrench size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Uptime</p>
                        <h3 className="text-lg font-bold  mt-1">98.2%</h3>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg ">
                        <BarChart3 size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Value</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">$12.4k</h3>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg ">
                        <LayoutGrid size={20} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[400px] max-h-[600px]">
                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-100 relative">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold tracking-wider text-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-left">Asset Name</th>
                                <th className="px-4 py-3 text-center">Shed</th>
                                <th className="px-4 py-3 text-center">Condition</th>
                                <th className="px-4 py-3 text-center">Last Maint.</th>
                                <th className="px-4 py-3 text-center">Next Service</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors text-sm">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                    {item.type === 'melker' && <Droplet size={14} />}
                                                    {item.type === 'pump' && <Settings2 size={14} />}
                                                    {item.type === 'feeder' && <LayoutGrid size={14} />}
                                                    {item.type === 'fan' && <Wind size={14} />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium">S/N: {item.sn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600 font-medium">
                                            {item.shed}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'Good' ? 'bg-green-100 text-green-700' :
                                                item.status === 'Repair' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600 text-xs">
                                            {item.lastMain}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-medium">
                                            <span className={item.nextService === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-gray-600'}>
                                                {item.nextService}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <button className="text-gray-500 hover:text-blue-600">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500">
                                        No assets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex-none flex justify-end pb-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Bottom Cards - Maintenance Schedule & Recent History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Maintenance Schedule Card */}
                <div className="bg-gradient-to-br from-green-700 to-green-800 p-6 rounded-xl shadow-md text-white">
                    <h3 className="text-lg font-bold mb-3">Maintenance Schedule</h3>
                    <p className="text-sm text-green-100 mb-4 leading-relaxed">
                        Ensure all heavy machinery is serviced before the peak harvest season begins next month.
                    </p>
                    <button className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors">
                        View Schedule
                    </button>
                </div>

                {/* Recent History Card */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Recent History</h3>
                        <button className="text-blue-600 text-xs font-semibold hover:text-blue-700">View All</button>
                    </div>
                    <div className="space-y-4">
                        {/* History Item 1 */}
                        <div className="flex items-start gap-3">
                            <div className="w-1 h-full bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">Water Pump WP-05 Service Completed</p>
                                <p className="text-xs text-gray-500 mt-0.5">2 hours ago by Kevin Miller</p>
                            </div>
                        </div>

                        {/* History Item 2 */}
                        <div className="flex items-start gap-3">
                            <div className="w-1 h-full bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">New Repair Request: Tractor Unit 4</p>
                                <p className="text-xs text-gray-500 mt-0.5">Yesterday at 2:35 PM</p>
                            </div>
                        </div>

                        {/* History Item 3 */}
                        <div className="flex items-start gap-3">
                            <div className="w-1 h-full bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">New Asset Registered: Soil Sensor Grid</p>
                                <p className="text-xs text-gray-500 mt-0.5">Jan 15, 2024</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
