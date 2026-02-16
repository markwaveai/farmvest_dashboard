import React, { useState, useMemo } from 'react';
import {
    RotateCcw, BarChart3, ShoppingBag, Package,
    AlertTriangle, Tractor, Filter, Box,
    Download, FileText, ChevronLeft, ChevronRight,
    Search, X, ChevronDown, Check
} from 'lucide-react';
import Pagination from '../../components/common/Pagination';

interface FeedItem {
    id: number;
    name: string;
    sub: string;
    category: string;
    stock: number;
    total: number;
    unit: string;
    reorder: number;
    color: string;
    dist: { s: string; v: string }[];
    vendor: string;
    vSub: string;
    status: string;
}

interface FeedFodderProps {
    onBack: () => void;
}

export const FeedFodder: React.FC<FeedFodderProps> = ({ onBack }) => {
    const [feedItems] = useState<FeedItem[]>([
        { id: 1, name: 'Alfalfa Hay', sub: 'Premium Grade 1', category: 'Dry Fodder', stock: 12.5, total: 15.0, unit: 'Tons', reorder: 2.0, color: '#10b981', dist: [{ s: 'S1', v: '5.0T' }, { s: 'S2', v: '7.5T' }], vendor: 'Green Valley Farms', vSub: 'Contract Active', status: 'Optimal' },
        { id: 2, name: 'Maize Silage', sub: 'LOW STOCK', category: 'Silage', stock: 1.2, total: 10.0, unit: 'Tons', reorder: 5.0, color: '#ef4444', dist: [{ s: 'S1', v: '0.8T' }, { s: 'S3', v: '0.4T' }], vendor: 'BioFeed Ind.', vSub: 'Next Delivery: Pending', status: 'Reorder' },
        { id: 3, name: 'Soybean Meal', sub: 'High Protein (48%)', category: 'Concentrate', stock: 4.8, total: 6.0, unit: 'Tons', reorder: 3.0, color: '#3b82f6', dist: [{ s: 'S2', v: '2.0T' }, { s: 'S4', v: '2.8T' }], vendor: 'AgriPro Solutions', vSub: 'Reliable Partner', status: 'Optimal' },
        { id: 4, name: 'Mineral Licks', sub: 'APPROACHING REORDER', category: 'Minerals', stock: 0.5, total: 1.0, unit: 'Tons', reorder: 0.4, color: '#f59e0b', dist: [{ s: 'S1', v: '0.2T' }, { s: 'S2', v: '0.3T' }], vendor: 'NutriGrow', vSub: 'Premium Supplier', status: 'Warning' },
        { id: 5, name: 'Napier Grass', sub: 'Fresh Harvest', category: 'Green Fodder', stock: 25.0, total: 30.0, unit: 'Tons', reorder: 5.0, color: '#10b981', dist: [{ s: 'S3', v: '15T' }, { s: 'S4', v: '10T' }], vendor: 'Local Cooperative', vSub: 'Weekly Delivery', status: 'Optimal' },
    ]);

    // Table State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filter Logic
    const filteredItems = useMemo(() => {
        return feedItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.vendor.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
            return matchesSearch && matchesCategory;
        });
    }, [feedItems, searchTerm, selectedCategory]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const categories = Array.from(new Set(feedItems.map(item => item.category)));

    return (
        <div className="h-full flex flex-col gap-4 max-w-full mx-auto overflow-hidden min-w-full font-sans text-gray-900 bg-white p-6">

            {/* Navigation & Header Card */}
            <div className="flex-none bg-white border-b border-gray-100 p-4 shadow-sm rounded-xl">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 cursor-pointer hover:text-blue-900 w-fit" onClick={onBack}>
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

                        {/* Category Dropdown */}
                        <div className="relative z-20">
                            <button
                                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                className={`flex items-center justify-between min-w-[140px] py-2 px-3 rounded-md text-xs font-medium focus:outline-none hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900 transition-colors ${selectedCategory ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'bg-white border border-gray-200 text-gray-700'}`}
                            >
                                <span>{selectedCategory || 'All Categories'}</span>
                                <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isCategoryDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-1 z-50">
                                    <button
                                        onClick={() => { setSelectedCategory(''); setIsCategoryDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-900 ${!selectedCategory ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-700'}`}
                                    >
                                        All Categories
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setIsCategoryDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-900 ${selectedCategory === cat ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-700'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all">
                            <ShoppingBag size={14} />
                            <span>Request Stock</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview - Optional, styled to fit new look */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Value */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Value</p>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">$42,500</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-900">
                        <Box size={22} />
                    </div>
                </div>

                {/* Critical Low */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Critical Low</p>
                        <h3 className="text-xl font-bold text-red-600 mt-1">4 Items</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-red-600">
                        <AlertTriangle size={22} />
                    </div>
                </div>

                {/* Weekly Usage */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weekly Usage</p>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">12.8T</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                        <BarChart3 size={22} />
                    </div>
                </div>

                {/* Next Delivery */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Next Delivery</p>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">Oct 24</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-900">
                        <Tractor size={22} />
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-100 relative">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold tracking-wider text-gray-700 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-left">Item Name</th>
                                <th className="px-4 py-3 text-left">Category</th>
                                <th className="px-4 py-3 text-left">Stock Level</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-left">Vendor</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {currentItems.length > 0 ? (
                                currentItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors text-sm">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.status === 'Reorder' ? 'bg-red-50 text-red-500' : 'bg-sky-50 text-sky-600'}`}>
                                                    {item.status === 'Reorder' ? <AlertTriangle size={14} /> : <Box size={14} />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                                                    <div className={`text-[10px] uppercase font-bold ${item.sub === 'LOW STOCK' ? 'text-red-500' : 'text-gray-400'}`}>{item.sub}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap align-middle">
                                            <div className="w-full max-w-[140px]">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-gray-700">{item.stock} {item.unit}</span>
                                                    <span className="text-[10px] text-gray-400">Target: {item.total}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.stock / item.total) * 100}%`, backgroundColor: item.color }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold ${item.status === 'Optimal' ? 'bg-emerald-100 text-emerald-700' :
                                                item.status === 'Reorder' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div>
                                                <div className="font-medium text-gray-900 text-sm">{item.vendor}</div>
                                                <div className="text-[10px] text-gray-500">{item.vSub}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <button className="text-blue-900 hover:text-blue-950 font-bold text-xs bg-sky-100 hover:bg-sky-200 px-3 py-1.5 rounded-md transition-colors shadow-sm">
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500">
                                        No items found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex-none flex justify-end">
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
