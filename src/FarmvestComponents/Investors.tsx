import React, { useEffect, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchInvestors, clearInvestorErrors } from '../store/slices/farmvest/investors';
import Snackbar from '../components/common/Snackbar';
import { Search, Users, Briefcase, X } from 'lucide-react';
import { farmvestService } from '../services/farmvest_api';
import { useTableSortAndSearch } from '../hooks/useTableSortAndSearch';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';

const Investors: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        investors,
        totalCount,
        loading: investorsLoading,
        error,
    } = useAppSelector((state: RootState) => state.farmvestInvestors);

    // URL Search Params for Pagination
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = 20;

    // Search State
    const [searchTerm, setSearchTerm] = React.useState('');

    // Animal Stats State
    const [animalStats, setAnimalStats] = useState<Record<string, { buffaloes: number; calves: number; loading: boolean }>>({});

    const setCurrentPage = useCallback((page: number) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', String(page));
            return newParams;
        });
    }, [setSearchParams]);

    // Custom Search Function
    const searchFn = useCallback((item: any, query: string) => {
        const lowerQuery = query.toLowerCase();
        const fullName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
        const email = (item.email || '').toLowerCase();
        const phone = item.phone_number || '';

        return (
            fullName.includes(lowerQuery) ||
            email.includes(lowerQuery) ||
            phone.includes(lowerQuery)
        );
    }, []);

    const {
        filteredData: filteredInvestors,
        requestSort,
        sortConfig,
        searchQuery: activeSearchQuery,
        setSearchQuery
    } = useTableSortAndSearch(investors, { key: '', direction: 'asc' }, searchFn);

    const currentItems = filteredInvestors;
    const totalPages = Math.ceil((totalCount || filteredInvestors.length) / itemsPerPage) || 1;

    // Fetch Animal Stats for current items
    useEffect(() => {
        const fetchStats = async () => {
            if (currentItems.length === 0) return;

            // Identify items that need stats (not already loaded or loading)
            const itemsToFetch = currentItems.filter(item => {
                const id = String(item.id || item.investor_id);
                return !animalStats[id];
            });

            if (itemsToFetch.length === 0) return;

            // Mark as loading clearly
            setAnimalStats(prev => {
                const next = { ...prev };
                itemsToFetch.forEach(item => {
                    const id = String(item.id || item.investor_id);
                    next[id] = { buffaloes: 0, calves: 0, loading: true };
                });
                return next;
            });

            // Fetch in parallel
            await Promise.allSettled(itemsToFetch.map(async (investor) => {
                const investorId = investor.id || investor.investor_id;
                const idStr = String(investorId);

                try {
                    // 1. Get all animals for investor
                    const animalsResponse = await farmvestService.getAnimalsByInvestor(Number(investorId));
                    const allAnimals = Array.isArray(animalsResponse) ? animalsResponse : (animalsResponse.data || []);

                    if (!allAnimals || allAnimals.length === 0) {
                        setAnimalStats(prev => ({
                            ...prev,
                            [idStr]: { buffaloes: 0, calves: 0, loading: false }
                        }));
                        return;
                    }

                    // 2. Filter Buffaloes
                    const buffaloes = allAnimals.filter((a: any) =>
                        (a.animal_type || a.type || '').toUpperCase() === 'BUFFALO'
                    );

                    // 3. Get Calves for each Buffalo (as per Details Page logic)
                    let totalCalves = 0;
                    await Promise.all(buffaloes.map(async (buffalo: any) => {
                        const buffaloFetchId = String(buffalo.animal_id || buffalo.id || buffalo.rfid_tag_number);
                        if (buffaloFetchId) {
                            try {
                                const calvesResponse = await farmvestService.getCalves(buffaloFetchId);
                                let myCalves = [];
                                if (Array.isArray(calvesResponse)) {
                                    myCalves = calvesResponse;
                                } else if (calvesResponse && Array.isArray(calvesResponse.data)) {
                                    myCalves = calvesResponse.data;
                                } else if (calvesResponse && Array.isArray(calvesResponse.calves)) {
                                    myCalves = calvesResponse.calves;
                                }
                                totalCalves += myCalves.length;
                            } catch (e) {
                                // ignore individual calf fetch error
                            }
                        }
                    }));

                    setAnimalStats(prev => ({
                        ...prev,
                        [idStr]: { buffaloes: buffaloes.length, calves: totalCalves, loading: false }
                    }));

                } catch (error) {
                    setAnimalStats(prev => ({
                        ...prev,
                        [idStr]: { buffaloes: 0, calves: 0, loading: false }
                    }));
                }
            }));
        };

        fetchStats();
    }, [currentItems]); // Only fetch when items change (e.g. pagination/search)


    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== activeSearchQuery) {
                setSearchQuery(searchTerm);
                if (currentPage !== 1) {
                    setCurrentPage(1);
                }
            }
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, activeSearchQuery, setSearchQuery, currentPage, setCurrentPage]);

    useEffect(() => {
        dispatch(fetchInvestors({
            page: currentPage,
            size: itemsPerPage,
        }));
    }, [dispatch, currentPage]);

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const handleNameClick = useCallback((investor: any) => {
        navigate(`/farmvest/investors/${investor.id || investor.investor_id}`);
    }, [navigate]);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#f9fafb]">
            <div className="flex-1 overflow-auto p-6 scrollbar-hide">
                <div className="max-w-full mx-auto">
                    {/* Page Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">FarmVest Investors</h1>
                                <p className="text-xs text-gray-500 mt-1">Manage all investors (Total: {totalCount || 0})</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by Name, Email, Phone..."
                                        className="pl-10 pr-10 py-2.5 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-[#f8f9fa]">
                                <tr>
                                    <th onClick={() => requestSort('id')} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">S.No {getSortIcon('id')}</th>
                                    <th onClick={() => requestSort('first_name')} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">Name {getSortIcon('first_name')}</th>
                                    <th onClick={() => requestSort('email')} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">Email {getSortIcon('email')}</th>
                                    <th onClick={() => requestSort('phone_number')} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">Phone {getSortIcon('phone_number')}</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Buffaloes</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Calves</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Joined Date</th>
                                    <th onClick={() => requestSort('active_status')} className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">Status {getSortIcon('active_status')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {investorsLoading ? (
                                    <TableSkeleton cols={9} rows={5} />
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((investor: any, index: number) => {
                                        const idStr = String(investor.id || investor.investor_id);
                                        const stats = animalStats[idStr] || { buffaloes: 0, calves: 0, loading: true };

                                        return (
                                            <tr key={investor.id || index} className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50" onClick={() => handleNameClick(investor)}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div
                                                        className="font-semibold text-blue-600 cursor-pointer hover:underline"
                                                        onClick={(e) => { e.stopPropagation(); handleNameClick(investor); }}
                                                    >
                                                        {`${investor.first_name || ''} ${investor.last_name || ''}`}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{investor.email || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{investor.phone_number || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 truncate max-w-[200px]" title={investor.address || ''}>{investor.address || '-'}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-700">
                                                    {stats.loading ? (
                                                        <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-200 border-t-amber-500 animate-spin"></span>
                                                    ) : stats.buffaloes}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-700">
                                                    {stats.loading ? (
                                                        <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-200 border-t-amber-500 animate-spin"></span>
                                                    ) : stats.calves}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {investor.created_at ? new Date(investor.created_at).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${investor.active_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {investor.active_status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9}>
                                            <div className="flex flex-col items-center justify-center py-16 px-4">
                                                <div className="bg-gray-50 rounded-full p-6 mb-4">
                                                    <Users size={48} className="text-gray-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">No investors found</h3>
                                                <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
                                                    No investor records are available at the moment.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
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
