import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchInvestors, fetchInvestorStats, clearInvestorErrors } from '../store/slices/farmvest/investors';
import Snackbar from '../components/common/Snackbar';
import { Search, Plus, Users, Briefcase, X, ChevronDown, Check, UserPlus, Filter, CheckCircle2, Ban, MoreHorizontal, PawPrint, UserCheck, UserMinus, Edit2, Download, Banknote, TrendingUp, BadgeCheck, Phone, Sprout } from 'lucide-react';
import { farmvestService } from '../services/farmvest_api';
import { useTableSortAndSearch } from '../hooks/useTableSortAndSearch';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';
import './Investors.css';
import InvestorStatusModal from './InvestorStatusModal';

// Module-level cache to persist across component remounts (Strict Mode / Navigation)
const globalAnimalStatsCache: Record<string, { buffaloes: number; calves: number; total?: number; loading: boolean; fetched?: boolean }> = {};
const allAnimalsCache: { data: any[] | null; fetched: boolean } = { data: null, fetched: false };
const processingCache = new Set<string>();

const Investors = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const { investors, loading: investorsLoading, error, totalCount, statusCounts: reduxStatusCounts } = useAppSelector((state: RootState) => state.farmvestInvestors);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string | number>('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    // Status Modal State
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedInvestorForStatus, setSelectedInvestorForStatus] = useState<any>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    // Table State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Initialize state from global cache
    const [animalStats, setAnimalStats] = useState<Record<string, { buffaloes: number; calves: number; total?: number; loading: boolean; fetched?: boolean }>>(globalAnimalStatsCache);
    const [grandTotalAnimals, setGrandTotalAnimals] = useState(0);
    const [grandTotalBuffaloes, setGrandTotalBuffaloes] = useState(0);
    const [grandTotalCalves, setGrandTotalCalves] = useState(0);

    useEffect(() => {
        if (investors.length === 0 && !investorsLoading) {
            dispatch(fetchInvestors());
        }
        // Always fetch global stats to get accurate counts (active/inactive) for cards
        dispatch(fetchInvestorStats());
    }, [dispatch, investors.length, investorsLoading]);

    // Search and Filter Logic Wrapper
    const searchFn = useMemo(() => (item: any, query: string) => {
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
    }, [selectedStatus]);

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

    // Status aggregates for cards (use Redux if available for global count, fallback to local calculation)
    const statusCounts = useMemo(() => {
        if (reduxStatusCounts && (reduxStatusCounts.active > 0 || reduxStatusCounts.inactive > 0)) {
            return reduxStatusCounts;
        }
        return investors.reduce((acc: { active: number; inactive: number }, inv: any) => {
            if (inv.active_status === 1) acc.active++;
            else acc.inactive++;
            return acc;
        }, { active: 0, inactive: 0 });
    }, [investors, reduxStatusCounts]);

    const currentItemIdsString = useMemo(() => {
        return currentItems.map(item => String(item.id || item.investor_id)).join(',');
    }, [currentItems]);

    const failedIds = useRef<Set<string>>(new Set());
    const fetchingPromiseRef = useRef<Promise<void> | null>(null);

    // Fetch all animals once to calculate stats for everyone
    useEffect(() => {
        const fetchAllAnimalsStats = async () => {
            if (allAnimalsCache.fetched && allAnimalsCache.data) {
                // Already have data, process it
                processAnimalStats(allAnimalsCache.data);
                return;
            }

            // Only fetch if not already fetching
            if (fetchingPromiseRef.current) return;

            console.log('[Investors] Starting bulk fetch of all animals');
            fetchingPromiseRef.current = (async () => {
                try {
                    // Fetch all animals (up to 10000)
                    const response = await farmvestService.getTotalAnimals(undefined, undefined, 1, 10000);
                    const allAnimals = Array.isArray(response) ? response : (response?.data || response?.animals || response?.items || []);

                    if (Array.isArray(allAnimals)) {
                        allAnimalsCache.data = allAnimals;
                        allAnimalsCache.fetched = true;
                        processAnimalStats(allAnimals);
                    }
                } catch (err) {
                    console.error('[Investors] Failed to fetch all animals:', err);
                } finally {
                    fetchingPromiseRef.current = null;
                }
            })();
        };

        const processAnimalStats = (animals: any[]) => {
            const statsMap: Record<string, { buffaloes: number; calves: number; total?: number; loading: boolean; fetched?: boolean }> = {};
            let globalTotal = 0;
            let globalBuffaloes = 0;
            let globalCalves = 0;
            const processedCalfIds = new Set<string>();

            // Initialize all current investors with 0
            currentItems.forEach(inv => {
                const id = String(inv.id || inv.investor_id);
                // Initialize fresh stats for current items to prevent accumulation
                statsMap[id] = { buffaloes: 0, calves: 0, total: 0, loading: false, fetched: true };
            });

            // First pass: Identify all calves that exist as independent records
            animals.forEach(animal => {
                const type = (animal.animal_type || animal.type || '').toUpperCase();
                const isCalf = animal.is_calf === true || animal.is_calf === 1 || String(animal.is_calf).toLowerCase() === 'true' || type.includes('CALF');

                if (isCalf) {
                    const calfId = String(animal.id || animal.rfid_tag || animal.tag_id || Math.random()); // key for dedupe
                    processedCalfIds.add(calfId);
                }
            });

            // Second pass: Count buffaloes and associated calves (checking dedupe)
            animals.forEach(animal => {
                // Check investor_id or fallback to user_id/owner_id
                const investorId = String(animal.investor_id || animal.user_id || animal.owner_id || '');
                if (!investorId) return;

                // Create entry if missing
                if (!statsMap[investorId]) {
                    statsMap[investorId] = { buffaloes: 0, calves: 0, total: 0, loading: false, fetched: true };
                }

                const type = (animal.animal_type || animal.type || '').toUpperCase();
                const isCalf = animal.is_calf === true || animal.is_calf === 1 || String(animal.is_calf).toLowerCase() === 'true' || type.includes('CALF');

                if (isCalf) {
                    statsMap[investorId].calves++;
                    globalCalves++;
                    globalTotal++;
                } else if (type === 'BUFFALO' || type === 'ADULT') {
                    statsMap[investorId].buffaloes++;
                    globalBuffaloes++;
                    globalTotal++;

                    // Check for nested calves
                    const nestedCalves = animal.associated_calves || animal.calves || animal.calf_list;
                    if (Array.isArray(nestedCalves)) {
                        nestedCalves.forEach((calf: any) => {
                            const calfId = String(calf.id || calf.rfid_tag || calf.tag_id || calf.rfid);
                            // Only count if NOT already counted as a top-level item
                            if (!processedCalfIds.has(calfId)) {
                                statsMap[investorId].calves++;
                                globalCalves++;
                                globalTotal++;
                                processedCalfIds.add(calfId); // Mark as processed so we don't count it again if it appears later (unlikely but safe)
                            }
                        });
                    }
                }
            });

            // Update state and global cache
            Object.keys(statsMap).forEach(key => {
                statsMap[key].total = statsMap[key].buffaloes + statsMap[key].calves;
                globalAnimalStatsCache[key] = statsMap[key];
            });

            setGrandTotalAnimals(globalTotal);
            setGrandTotalBuffaloes(globalBuffaloes);
            setGrandTotalCalves(globalCalves);

            setAnimalStats(prev => ({
                ...prev,
                ...statsMap
            }));
        };

        fetchAllAnimalsStats();
    }, [currentItems]); // Re-run process if items change (pagination), but fetch only once via cache check

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    };

    const handleStatusToggle = (e: React.MouseEvent, investor: any) => {
        e.stopPropagation();
        setSelectedInvestorForStatus(investor);
        setIsStatusModalOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!selectedInvestorForStatus) return;

        setStatusLoading(true);
        try {
            const mobile = selectedInvestorForStatus.mobile || selectedInvestorForStatus.phone_number;
            if (!mobile) {
                console.error("No mobile number found for investor", selectedInvestorForStatus);
                // Could show an error snackbar here
                setStatusLoading(false);
                setIsStatusModalOpen(false);
                return;
            }

            if (selectedInvestorForStatus.active_status === 1) {
                await farmvestService.deactivateUser(mobile);
            } else {
                await farmvestService.activateUser(mobile);
            }

            dispatch(fetchInvestors());
            dispatch(fetchInvestorStats()); // Refresh stats too
            setIsStatusModalOpen(false);
            setSelectedInvestorForStatus(null);
        } catch (err: any) {
            console.error('Status toggle failed:', err);
            // Error handling is managed by global snackbar/redux usually, or we can dispatch an error
        } finally {
            setStatusLoading(false);
        }
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

    // Calculate rates
    const totalInvestorsCount = statusCounts.active + statusCounts.inactive;
    const activeRate = totalInvestorsCount > 0
        ? ((statusCounts.active / totalInvestorsCount) * 100).toFixed(1)
        : '0.0';
    const inactiveRate = totalInvestorsCount > 0
        ? ((statusCounts.inactive / totalInvestorsCount) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col gap-2 min-h-0">

                    {/* Header with Title and Primary Actions */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 bg-white px-3 py-2 border-b border-gray-100 shadow-premium flex-none">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-bold  tracking-tight">Investor Management</h1>
                            <p className="text-slate-500 font-medium text-sm">
                                ALL Operations • <span className="text-slate-600">{investors.length} Investors Found</span>
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
                            <div className="relative">
                                <button
                                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                    className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium transition-all hover:bg-slate-50 ${selectedStatus !== '' ? 'text-blue-600 border-blue-200 bg-blue-50/50' : 'text-slate-600'
                                        }`}
                                >
                                    <Filter className="h-4 w-4" />
                                    <span>
                                        {selectedStatus === '' ? 'All Status' :
                                            selectedStatus === '1' ? 'Active' : 'Inactive'}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isStatusDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsStatusDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                                            {[
                                                { label: 'All Status', value: '' },
                                                { label: 'Active', value: '1' },
                                                { label: 'Inactive', value: '0' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSelectedStatus(option.value);
                                                        setIsStatusDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${selectedStatus === option.value
                                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {option.label}
                                                    {selectedStatus === option.value && (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards Grid - 5 Cards (Total Inv, CPF, CGF, Active Rate, Inactive Rate) */}
                    <div className="px-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 flex-none">
                        {/* Total Investors - CLICKABLE (Show All) */}
                        <div
                            onClick={() => setSelectedStatus('')}
                            className="bg-white rounded-[1rem] p-2.5 shadow-premium border border-slate-100 flex items-center gap-2.5 transition-all hover:shadow-premium-hover hover:-translate-y-1 cursor-pointer"
                        >
                            <div className="p-2.5 bg-blue-50/50 rounded-xl">
                                <Users className="h-5 w-5 text-[#2563eb]" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-1">Total Investors</p>
                                <h3 className="text-xl font-black text-slate-900">{totalInvestorsCount}</h3>
                            </div>
                        </div>

                        {/* CPF (Buffaloes) - CLICKABLE (Show All) */}
                        <div
                            onClick={() => setSelectedStatus('')}
                            className="bg-white rounded-[1rem] p-2.5 shadow-premium border border-slate-100 flex items-center gap-2.5 transition-all hover:shadow-premium-hover hover:-translate-y-1 cursor-pointer"
                        >
                            <div className="p-2.5 bg-cyan-50/50 rounded-xl">
                                <Banknote className="h-5 w-5 text-cyan-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-none mb-1">CPF</h3>
                                <p className="text-slate-400 text-[7px] font-bold uppercase tracking-wide leading-tight">(Cattle Protection Fund)</p>
                            </div>
                        </div>

                        {/* CGF (Calves) - CLICKABLE (Show All) */}
                        <div
                            onClick={() => setSelectedStatus('')}
                            className="bg-white rounded-[1rem] p-2.5 shadow-premium border border-slate-100 flex items-center gap-2.5 transition-all hover:shadow-premium-hover hover:-translate-y-1 cursor-pointer"
                        >
                            <div className="p-2.5 bg-emerald-50/50 rounded-xl">
                                <Sprout className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-none mb-1">CGF</h3>
                                <p className="text-slate-400 text-[7px] font-bold uppercase tracking-wide leading-tight">(Cattle Growth Fund)</p>
                            </div>
                        </div>

                        {/* Active Investor Rate - CLICKABLE (Show Active) */}
                        <div
                            onClick={() => setSelectedStatus('1')}
                            className="bg-white rounded-[1rem] p-2.5 shadow-premium border border-slate-100 flex items-center gap-2.5 transition-all hover:shadow-premium-hover hover:-translate-y-1 cursor-pointer"
                        >
                            <div className="p-2.5 bg-orange-50/50 rounded-xl">
                                <BadgeCheck className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-1">Active Rate</p>
                                <h3 className="text-xl font-black text-slate-900">{activeRate}%</h3>
                            </div>
                        </div>

                        {/* Inactive Investor Rate - CLICKABLE (Show Inactive) */}
                        <div
                            onClick={() => setSelectedStatus('0')}
                            className="bg-white rounded-[1rem] p-2.5 shadow-premium border border-slate-100 flex items-center gap-2.5 transition-all hover:shadow-premium-hover hover:-translate-y-1 cursor-pointer"
                        >
                            <div className="p-2.5 bg-purple-50/50 rounded-xl">
                                <BadgeCheck className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-1">Inactive Rate</p>
                                <h3 className="text-xl font-black text-slate-900">{inactiveRate}%</h3>
                            </div>
                        </div>
                    </div>



                    {/* Table Container */}
                    <div className="px-3 pb-3 flex-1 flex flex-col min-h-0">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-auto table-scroll-wrapper">
                                <table className="w-full registry-table"> {/* Added registry-table class for CSS styles */}
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10"> {/* Added sticky top-0 */}
                                            <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50"> {/* Added bg-gray-50 for sticky opacity */}
                                                S.No
                                            </th>
                                            <th onClick={() => requestSort('first_name')} className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 bg-gray-50">
                                                Name {getSortIcon('first_name')}
                                            </th>
                                            <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                Email
                                            </th>
                                            <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                Phone
                                            </th>
                                            <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                Joining Date
                                            </th>
                                            <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                Total Animals
                                            </th>
                                            <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                Buffaloes
                                            </th>
                                            <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                                                Calves
                                            </th>

                                            <th onClick={() => requestSort('active_status')} className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 bg-gray-50">
                                                Status {getSortIcon('active_status')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {investorsLoading ? (
                                            <TableSkeleton cols={7} rows={15} />
                                        ) : currentItems.length > 0 ? (
                                            currentItems.map((investor: any, index: number) => {
                                                const idStr = String(investor.id || investor.investor_id);
                                                const stats = animalStats[idStr];
                                                const currentCount = stats ? (stats.total || 0) : 0;
                                                const isLoadingStats = stats?.loading && !stats?.fetched;
                                                const fullName = `${investor.first_name || ''} ${investor.last_name || ''}`;
                                                const displayIndex = (currentPage - 1) * itemsPerPage + index + 1;

                                                return (
                                                    <tr
                                                        key={investor.id || index}
                                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                                        onClick={() => handleNameClick(investor)}
                                                    >
                                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-500 font-bold">
                                                            {displayIndex}
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="text-xs font-bold text-slate-900">{fullName}</span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="text-xs font-bold text-blue-600">{investor.email || '-'}</span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="text-xs font-bold text-slate-700">
                                                                {investor.phone_number || investor.mobile || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="text-xs font-bold text-slate-500">{formatDate(investor.created_at)}</span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                                                {isLoadingStats ? (
                                                                    <span className="animate-pulse text-gray-400">...</span>
                                                                ) : currentCount}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                                {isLoadingStats ? (
                                                                    <span className="animate-pulse text-blue-300">...</span>
                                                                ) : (stats?.buffaloes || 0)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                                                {isLoadingStats ? (
                                                                    <span className="animate-pulse text-orange-300">...</span>
                                                                ) : (stats?.calves || 0)}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                                            <button
                                                                onClick={(e) => handleStatusToggle(e, investor)}
                                                                className={`inline-flex px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider cursor-pointer transition-all hover:scale-105 active:scale-95 focus:outline-none ${investor.active_status === 1
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : investor.active_status === 2
                                                                        ? 'bg-orange-100 text-orange-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}
                                                                title="Click to toggle status"
                                                            >
                                                                {investor.active_status === 1 ? 'Active' : investor.active_status === 2 ? 'Pending' : 'Inactive'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-gray-500">
                                                    No records found matching your criteria
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-none">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Snackbar
                message={error}
                type={error ? 'error' : null}
                onClose={() => dispatch(clearInvestorErrors())}
            />

            <InvestorStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => {
                    setIsStatusModalOpen(false);
                    setSelectedInvestorForStatus(null);
                }}
                onConfirm={confirmStatusChange}
                investorName={selectedInvestorForStatus ? `${selectedInvestorForStatus.first_name || ''} ${selectedInvestorForStatus.last_name || ''}` : ''}
                currentStatus={selectedInvestorForStatus?.active_status || 0}
                loading={statusLoading}
            />
        </div >
    );
};

export default Investors;
