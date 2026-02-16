import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchInvestors, fetchInvestorStats, clearInvestorErrors } from '../store/slices/farmvest/investors';
import Snackbar from '../components/common/Snackbar';
import { Search, Plus, Users, Briefcase, X, ChevronDown, Check, UserPlus, Filter, CheckCircle2, Ban, MoreHorizontal, PawPrint, UserCheck, UserMinus, Edit2, Download, Banknote, TrendingUp, BadgeCheck, Phone } from 'lucide-react';
import { farmvestService } from '../services/farmvest_api';
import { useTableSortAndSearch } from '../hooks/useTableSortAndSearch';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';

const Investors = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const { investors, loading: investorsLoading, error, totalCount } = useAppSelector((state: RootState) => state.farmvestInvestors);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string | number>('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [animalStats, setAnimalStats] = useState<Record<string, { buffaloes: number; calves: number; loading: boolean }>>({});

    // Table State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        dispatch(fetchInvestors());
    }, [dispatch]);

    // Search and Filter Logic Wrapper
    const searchFn = (item: any, query: string) => {
        const lowerQuery = query.toLowerCase();
        // Custom search across multiple fields
        const matchesSearch =
            String(item.first_name || '').toLowerCase().includes(lowerQuery) ||
            String(item.last_name || '').toLowerCase().includes(lowerQuery) ||
            String(item.email || '').toLowerCase().includes(lowerQuery) ||
            String(item.phone_number || '').toLowerCase().includes(lowerQuery);

        // Custom filter for status
        if (selectedStatus !== '') {
            return matchesSearch && String(item.active_status) === String(selectedStatus);
        }

        return matchesSearch;
    };

    // Filter and Sort Logic using existing hook
    const {
        filteredData: sortedAndFilteredItems,
        requestSort,
        sortConfig,
        setSearchQuery
    } = useTableSortAndSearch(investors, { key: 'created_at', direction: 'desc' }, searchFn);

    // Synchronize searchTerm with the hook's searchQuery
    useEffect(() => {
        setSearchQuery(searchTerm);
    }, [searchTerm, setSearchQuery]);

    const totalPages = Math.ceil(sortedAndFilteredItems.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return sortedAndFilteredItems.slice(indexOfFirstItem, indexOfLastItem);
    }, [sortedAndFilteredItems, currentPage]);

    // Status aggregates for cards
    const statusCounts = useMemo(() => {
        return investors.reduce((acc: { active: number; inactive: number }, inv: any) => {
            if (inv.active_status === 1) acc.active++;
            else acc.inactive++;
            return acc;
        }, { active: 0, inactive: 0 });
    }, [investors]);

    // Fetch Animal Stats for current items
    useEffect(() => {
        const fetchStats = async () => {
            for (const investor of currentItems as any[]) {
                const idStr = String(investor.id || investor.investor_id);
                if (animalStats[idStr]) continue;

                setAnimalStats(prev => ({
                    ...prev,
                    [idStr]: { buffaloes: 0, calves: 0, loading: true }
                }));

                try {
                    const investorId = investor.id || investor.investor_id;
                    const animalsRes = await farmvestService.getAnimalsByInvestor(investorId);
                    const animals = Array.isArray(animalsRes.data) ? animalsRes.data : (Array.isArray(animalsRes) ? animalsRes : []);

                    const buffaloes = animals.filter((a: any) => a.animal_type === 'Buffalo');
                    const indepedentCalves = animals.filter((a: any) => a.animal_type === 'Calf');

                    // Count linked calves from buffaloes
                    let linkedCalvesCount = 0;
                    for (const buffalo of buffaloes) {
                        if (buffalo.tag_id) {
                            try {
                                const calfRes = await farmvestService.getCalves(buffalo.tag_id);
                                if (calfRes && Array.isArray(calfRes)) {
                                    linkedCalvesCount += calfRes.length;
                                } else if (calfRes?.status === 'success' && Array.isArray(calfRes.data)) {
                                    linkedCalvesCount += calfRes.data.length;
                                }
                            } catch (e) {
                                console.error('Error fetching linked calves', e);
                            }
                        }
                    }

                    const totalCalves = Math.max(indepedentCalves.length, linkedCalvesCount);

                    setAnimalStats(prev => ({
                        ...prev,
                        [idStr]: { buffaloes: buffaloes.length, calves: totalCalves, loading: false }
                    }));
                } catch (e) {
                    console.error('Error fetching stats', e);
                    setAnimalStats(prev => ({
                        ...prev,
                        [idStr]: { buffaloes: 0, calves: 0, loading: false }
                    }));
                }
            }
        };

        if (currentItems.length > 0) {
            fetchStats();
        }
    }, [currentItems]);

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    const handleNameClick = (investor: any) => {
        navigate(`/farmvest/investors/${investor.id || investor.investor_id}`);
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden ">
            <div className="flex-1 flex flex-col overflow-auto p-10">
                <div className="max-w-7xl mx-auto w-full flex flex-col gap-10">

                    {/* Header with Title and Primary Actions */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font text-[#1e293b] tracking-tight">Investor Management</h1>
                            <p className="text-slate-500 font-medium text-sm">
                                ALL Operations • <span className="text-slate-600 ">{investors.length} Investors Found</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Find investor..."
                                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#f59e0b] border border-transparent rounded-xl text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95">
                                <Plus className="h-4 w-4" />
                                Add Investor
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards Grid - 4 Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Investors */}
                        <div className="bg-white rounded-[1.25rem] p-4 shadow-premium border border-slate-100 flex items-center gap-4 transition-all hover:shadow-premium-hover hover:-translate-y-1">
                            <div className="p-3 bg-blue-50/50 rounded-xl">
                                <Users className="h-5 w-5 text-[#2563eb]" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-1">Total Investors</p>
                                <h3 className="text-xl font-black text-slate-900">{statusCounts.active + statusCounts.inactive}</h3>
                            </div>
                        </div>

                        {/* Active Assets */}
                        <div className="bg-white rounded-[1.25rem] p-4 shadow-premium border border-slate-100 flex items-center gap-4 transition-all hover:shadow-premium-hover hover:-translate-y-1">
                            <div className="p-3 bg-emerald-50/50 rounded-xl">
                                <Banknote className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-1">Active Assets</p>
                                <h3 className="text-xl font-black text-slate-900">$12.4M</h3>
                            </div>
                        </div>

                        {/* Avg. Growth */}
                        <div className="bg-white rounded-[1.25rem] p-4 shadow-premium border border-slate-100 flex items-center gap-4 transition-all hover:shadow-premium-hover hover:-translate-y-1">
                            <div className="p-3 bg-orange-50/50 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-1">Avg. Growth</p>
                                <h3 className="text-xl font-black text-slate-900">+14.2%</h3>
                            </div>
                        </div>

                        {/* Verified Status */}
                        <div className="bg-white rounded-[1.25rem] p-4 shadow-premium border border-slate-100 flex items-center gap-4 transition-all hover:shadow-premium-hover hover:-translate-y-1">
                            <div className="p-3 bg-purple-50/50 rounded-xl">
                                <BadgeCheck className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-1">Verified</p>
                                <h3 className="text-xl font-black text-slate-900">98.2%</h3>
                            </div>
                        </div>
                    </div>



                    {/* Table Container */}
                    <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/20">
                                        <th className="px-8 py-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] w-24">
                                            S.NO
                                        </th>
                                        <th onClick={() => requestSort('first_name')} className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors">
                                            Investor Name {getSortIcon('first_name')}
                                        </th>
                                        <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Contact Details
                                        </th>
                                        <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Phone
                                        </th>
                                        <th className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Portfolio Mix
                                        </th>
                                        <th onClick={() => requestSort('created_at')} className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors">
                                            Joined Date {getSortIcon('created_at')}
                                        </th>
                                        <th onClick={() => requestSort('active_status')} className="px-6 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors">
                                            Status {getSortIcon('active_status')}
                                        </th>
                                        <th className="px-8 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {investorsLoading ? (
                                        <TableSkeleton cols={8} rows={8} />
                                    ) : currentItems.length > 0 ? (
                                        currentItems.map((investor: any, index: number) => {
                                            const idStr = String(investor.id || investor.investor_id);
                                            const stats = animalStats[idStr] || { buffaloes: 0, calves: 0, loading: true };
                                            const fullName = `${investor.first_name || ''} ${investor.last_name || ''}`;
                                            const displayIndex = String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0');

                                            return (
                                                <tr
                                                    key={investor.id || index}
                                                    className="group hover:bg-slate-50/50 transition-all cursor-pointer border-b border-transparent hover:border-slate-100"
                                                    onClick={() => handleNameClick(investor)}
                                                >
                                                    <td className="px-8 py-9">
                                                        <span className="text-slate-400 font-bold text-sm tracking-tighter">{displayIndex}</span>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm border border-blue-100/50">
                                                                {getInitials(investor.first_name, investor.last_name)}
                                                            </div>
                                                            <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-all">{fullName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <span className="text-[#2563eb] font-bold text-sm hover:underline cursor-pointer">{investor.email || '-'}</span>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-600 font-bold text-sm whitespace-nowrap">
                                                                {investor.phone_number?.startsWith('+') ? '' : '+91 '}
                                                                {investor.phone_number || investor.mobile || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-lg font-black text-[#1e293b]">{stats.buffaloes}</span>
                                                                <span className="text-sm font-bold text-[#1e293b]">Buffaloes</span>
                                                            </div>
                                                            <span className="text-[11px] text-slate-400 font-bold">{stats.calves} Calves</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <span className="text-slate-500 text-sm font-bold">{formatDate(investor.created_at)}</span>
                                                    </td>
                                                    <td className="px-6 py-6 transition-all">
                                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${investor.active_status === 1
                                                            ? 'bg-[#e7f8ef] text-[#059669]' // ACTIVE - Green
                                                            : investor.active_status === 2
                                                                ? 'bg-[#fff7ed] text-[#d97706]' // PENDING - Orange
                                                                : 'bg-[#f1f5f9] text-[#64748b]' // INACTIVE - Grey
                                                            }`}>
                                                            {investor.active_status === 1 ? 'ACTIVE' : investor.active_status === 2 ? 'PENDING' : 'INACTIVE'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            className="p-2.5 opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-slate-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="py-32 text-center text-slate-400 font-bold">
                                                No records found matching your criteria
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Custom Footer Pagination */}
                        <div className="px-10 py-12 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                            <p className="text-sm text-slate-400 font-black uppercase tracking-widest">
                                Result Page <span className="text-slate-900">{currentPage}</span> / <span className="text-slate-900">{totalPages}</span>
                            </p>

                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </div>
                        <div className="h-4" /> {/* Bottom Spacer */}
                    </div>
                </div>
            </div>

            <Snackbar
                message={error}
                type={error ? 'error' : null}
                onClose={() => dispatch(clearInvestorErrors())}
            />
        </div>
    );
};

export default Investors;
