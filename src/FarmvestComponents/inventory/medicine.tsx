import React, { useState, useMemo } from 'react';
import {
    ChevronRight, ArrowLeftRight, Plus, LayoutGrid,
    AlertCircle, Calendar, BarChart3, Wrench, Box,
    ArrowUpRight, Info, Search, X, ChevronDown, ChevronLeft
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';

interface MedicineItem {
    id: number;
    name: string;
    batch: string;
    remaining: number;
    total: number;
    unit: string;
    expiry: string;
    vet: string;
    status: string;
    daysLeft?: string;
}

interface UsageLog {
    id: number;
    time: string;
    text: string;
    type: 'admin' | 'stock' | 'expiry';
}

interface MedicineInventoryProps {
    onBack: () => void;
}

export const MedicineInventory: React.FC<MedicineInventoryProps> = ({ onBack }) => {
    const [medicineItems] = useState<MedicineItem[]>([
        { id: 1, name: 'Ceftiofur Crystalline', batch: 'Batch: A-4431-XZ', remaining: 15, total: 100, unit: 'doses', expiry: 'Dec 05, 2024', vet: 'Dr. Robert Chen', status: 'critical' },
        { id: 2, name: 'Brucellosis Vaccine', batch: 'Batch: B-9822-VY', remaining: 60, total: 100, unit: 'doses', expiry: 'Oct 12, 2024', daysLeft: '22 DAYS LEFT', vet: 'Dr. Sarah Miller', status: 'warning' },
        { id: 3, name: 'Bovikalc Supplement', batch: 'Batch: B-1102-BL', remaining: 850, total: 1000, unit: 'ml', expiry: 'Mar 22, 2025', vet: 'Dr. Robert Chen', status: 'good' },
        { id: 4, name: 'Oxytetracycline LA', batch: 'Batch: O-7782-VW', remaining: 460, total: 500, unit: 'ml', expiry: 'Jan 15, 2025', vet: 'Dr. Sarah Miller', status: 'good' },
    ]);

    const [usageHistory] = useState<UsageLog[]>([
        { id: 1, time: '2 hours ago', text: '20ml Ceftiofur administered to Cow #402 by Dr. Chen.', type: 'admin' },
        { id: 2, time: '5 hours ago', text: '5ml Brucellosis vaccination for Heifer #68.', type: 'admin' },
        { id: 3, time: 'Yesterday, 4:30 PM', text: 'Stock replenishment: 50 vials of Bovikalc received.', type: 'stock' },
        { id: 4, time: 'Yesterday, 11:00 AM', text: 'Batch Expired: A-3312 Disposal logged by Dr. Miller.', type: 'expiry' },
    ]);

    // Table State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filter Logic
    const filteredItems = useMemo(() => {
        return medicineItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.batch.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = selectedStatus ?
                (selectedStatus === 'Critical' ? item.status === 'critical' :
                    selectedStatus === 'Warning' ? item.status === 'warning' : item.status === 'good')
                : true;
            return matchesSearch && matchesStatus;
        });
    }, [medicineItems, searchTerm, selectedStatus]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statuses = ['Good', 'Warning', 'Critical'];

    return (
        <div className="min-h-screen w-full flex flex-col gap-4 overflow-y-auto overflow-x-hidden font-sans text-gray-900 p-6">

            {/* Header Card */}
            <div className="flex-none bg-white border-b border-gray-100 p-4 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 cursor-pointer hover:text-blue-900 w-fit" onClick={onBack}>
                    <ChevronLeft size={16} />
                    <span>Back to Overview</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Medicine & Veterinary Inventory</h1>

                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search medicines..."
                                className="pl-9 pr-8 py-2 w-full border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                                className={`flex items-center justify-between min-w-[140px] py-2 px-3 rounded-md text-xs font-medium focus:outline-none hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900 transition-colors ${selectedStatus ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'bg-white border border-gray-200 text-gray-700'}`}
                            >
                                <span>{selectedStatus || 'All Status'}</span>
                                <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 z-50">
                                    <button
                                        onClick={() => { setSelectedStatus(''); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-900 ${!selectedStatus ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-700'}`}
                                    >
                                        All Status
                                    </button>
                                    {statuses.map(st => (
                                        <button
                                            key={st}
                                            onClick={() => { setSelectedStatus(st); setIsStatusDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-900 ${selectedStatus === st ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-700'}`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="bg-[#f59e0b] hover:bg-[#d97706] text-white  px-3 py-2 rounded-md font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all">
                            <Plus size={14} />
                            <span>Log Shipment</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total SKUs</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">142</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg ">
                        <LayoutGrid size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Critical Stock</p>
                        <h3 className="text-lg font-bold  mt-1">06 Items</h3>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                        <AlertCircle size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Near Expiry</p>
                        <h3 className="text-lg font-bold  mt-1">12 Items</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg ">
                        <Calendar size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daily Usage</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">4.2L</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <BarChart3 size={20} />
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[400px] max-h-[600px]">
                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-100 relative">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold tracking-wider text-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-left">Medicine & Batch</th>
                                <th className="px-4 py-3 text-center">Remaining Stock</th>
                                <th className="px-4 py-3 text-left">Expiry Status</th>
                                <th className="px-4 py-3 text-left">Assigned Vet</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors text-sm">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div>
                                                <div className="font-semibold text-gray-900 justify-center text-sm">{item.name}</div>
                                                <div className="text-[10px] text-gray-500 justify-center font-medium">{item.batch}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap align-middle">
                                            <div className="w-full max-w-[140px] mx-auto">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[10px] font-bold uppercase ${item.status === 'critical' ? 'text-red-500' : item.status === 'warning' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                        {((item.remaining / item.total) * 100).toFixed(0)}% Left
                                                    </span>
                                                    <span className="text-xs text-gray-700 font-bold">{item.remaining} / {item.total}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${item.status === 'critical' ? 'bg-red-400' : item.status === 'warning' ? 'bg-orange-400' : 'bg-emerald-400'}`} style={{ width: `${(item.remaining / item.total) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {item.expiry}
                                                </div>
                                                {item.daysLeft && <div className="text-[10px] text-red-500 font-bold mt-0.5">{item.daysLeft}</div>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-gray-700 font-medium">{item.vet}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <button className="text-blue-900 hover: font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ml-auto">
                                                <ArrowUpRight size={14} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500">
                                        No medicines found.
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

            {/* Bottom Section: Usage History & Vet Consultation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Usage History Card */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Usage History</h3>
                        <button className="text-blue-600 text-xs font-semibold hover:text-blue-700">View All</button>
                    </div>
                    <div className="space-y-4">
                        {usageHistory.map((log) => (
                            <div key={log.id} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${log.type === 'admin' ? 'bg-blue-500' :
                                    log.type === 'stock' ? 'bg-green-500' :
                                        'bg-red-500'
                                    }`}></div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900" dangerouslySetInnerHTML={{
                                        __html: log.text.replace(/(\d+ml|#\d+|Batch [A-Z]-\d+|\d+ vials)/g, '<strong>$1</strong>')
                                    }}></p>
                                    <p className="text-xs text-gray-500 mt-0.5">{log.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Veterinary Consultation Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-md text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <Info size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Need a Veterinary Consultation?</h3>
                    <p className="text-sm text-blue-100 mb-6 leading-relaxed">
                        Schedule a specialist review for your recent herd health logs.
                    </p>
                    <button className="bg-white text-blue-700 px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors w-full">
                        Book Tele-Vet
                    </button>
                </div>
            </div>
        </div>
    );
};
