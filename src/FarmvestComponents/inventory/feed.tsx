import React, { useState, useMemo } from 'react';
import {
    ChevronRight, ArrowLeftRight, Plus, LayoutGrid,
    AlertCircle, Calendar, BarChart3, Wrench, Box,
    ArrowUpRight, Info, Search, X, ChevronDown, ChevronLeft, Wheat
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';

interface FeedItem {
    id: number;
    name: string;
    batch: string;
    remaining: number;
    total: number;
    unit: string;
    expiry: string;
    supplier: string;
    status: string;
}

interface FeedFodderProps {
    onBack: () => void;
}

export const FeedFodder: React.FC<FeedFodderProps> = ({ onBack }) => {
    const [feedItems] = useState<FeedItem[]>([
        { id: 1, name: 'Premium Hay', batch: 'Batch: H-2301-AX', remaining: 450, total: 1000, unit: 'kg', expiry: 'Mar 15, 2025', supplier: 'GreenFields Co.', status: 'good' },
        { id: 2, name: 'Mineral Mix', batch: 'Batch: M-8821-BY', remaining: 180, total: 500, unit: 'kg', expiry: 'Feb 10, 2025', supplier: 'NutriFeeds Inc.', status: 'warning' },
        { id: 3, name: 'Corn Silage', batch: 'Batch: C-4401-ZX', remaining: 50, total: 800, unit: 'kg', expiry: 'Jan 20, 2025', supplier: 'FarmSupply Ltd.', status: 'critical' },
        { id: 4, name: 'Protein Supplement', batch: 'Batch: P-9901-WX', remaining: 320, total: 400, unit: 'kg', expiry: 'Apr 05, 2025', supplier: 'ProFeed Solutions', status: 'good' },
    ]);

    // Table State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filter Logic
    const filteredItems = useMemo(() => {
        return feedItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.batch.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = selectedStatus ?
                (selectedStatus === 'Critical' ? item.status === 'critical' :
                    selectedStatus === 'Warning' ? item.status === 'warning' : item.status === 'good')
                : true;
            return matchesSearch && matchesStatus;
        });
    }, [feedItems, searchTerm, selectedStatus]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statuses = ['Good', 'Warning', 'Critical'];

    return (
        <div className="min-h-screen w-full flex flex-col gap-4 overflow-y-auto overflow-x-hidden font-sans text-gray-900 ">

            {/* Header Card */}
            <div className="flex-none bg-white border-b border-gray-100 p-4 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 cursor-pointer hover:text-green-900 w-fit" onClick={onBack}>
                    <ChevronLeft size={16} />
                    <span>Back to Overview</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Feed & Fodder Inventory</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search feed..."
                                className="pl-9 pr-8 py-2 w-full border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                className={`flex items-center justify-between min-w-[140px] py-2 px-3 rounded-md text-xs font-medium focus:outline-none hover:bg-green-50 hover:border-green-200 hover:text-green-900 transition-colors ${selectedStatus ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-white border border-gray-200 text-gray-700'}`}
                            >
                                <span>{selectedStatus || 'All Status'}</span>
                                <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 z-50">
                                    <button
                                        onClick={() => { setSelectedStatus(''); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs hover:bg-green-50 hover:text-green-900 ${!selectedStatus ? 'bg-green-50 text-green-900 font-semibold' : 'text-gray-700'}`}
                                    >
                                        All Status
                                    </button>
                                    {statuses.map(st => (
                                        <button
                                            key={st}
                                            onClick={() => { setSelectedStatus(st); setIsStatusDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-green-50 hover:text-green-900 ${selectedStatus === st ? 'bg-green-50 text-green-900 font-semibold' : 'text-gray-700'}`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-3 py-2 rounded-md font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all">
                            <Plus size={14} />
                            <span>Log Shipment</span>
                        </button>
                    </div>
                </div>
deburger;
                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                    {/* Purchase History */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold text-xs hover:bg-gray-50 hover:border-gray-400 transition-all">
                        <ArrowLeftRight size={16} className="text-gray-600" />
                        Purchase History
                    </button>

                    {/* Consumption Tracking */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold text-xs hover:bg-gray-50 hover:border-gray-400 transition-all">
                        <BarChart3 size={16} className="text-gray-600" />
                        Consumption Tracking
                    </button>

                    {/* Request Replenishment */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-xs hover:bg-blue-700 transition-all">
                        <Plus size={16} />
                        Request Replenishment
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total SKUs</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">24</h3>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg ">
                        <LayoutGrid size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Critical Low</p>
                        <h3 className="text-lg font-bold  mt-1">03 Items</h3>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg ">
                        <AlertCircle size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weekly Usage</p>
                        <h3 className="text-lg font-bold  mt-1">1.2 Tons</h3>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg ">
                        <BarChart3 size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Next Delivery</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">3 Days</h3>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg ">
                        <Calendar size={20} />
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[400px] max-h-[600px]">
                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-100 relative">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold tracking-wider text-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-left">Feed Type & Batch</th>
                                <th className="px-4 py-3 text-center">Remaining Stock</th>
                                <th className="px-4 py-3 text-left">Expiry Date</th>
                                <th className="px-4 py-3 text-left">Supplier</th>
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
                                                    <span className={`text-[10px] font-bold uppercase ${item.status === 'critical' ? 'text-red-500' : item.status === 'warning' ? 'text-orange-500' : 'text-green-500'}`}>
                                                        {((item.remaining / item.total) * 100).toFixed(0)}% Left
                                                    </span>
                                                    <span className="text-xs text-gray-700 font-bold">{item.remaining} / {item.total} {item.unit}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${item.status === 'critical' ? 'bg-red-500' : item.status === 'warning' ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${(item.remaining / item.total) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                <Calendar size={12} className="text-gray-400" />
                                                {item.expiry}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-gray-700 font-medium">{item.supplier}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <button className="text-black hover:text-green-800 font-bold text-xs bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ml-auto">
                                                <ArrowUpRight size={14} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500">
                                        No feed items found.
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
        </div>
    );
};
