import React, { useEffect, useCallback, useState, useMemo, memo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchFarms } from '../store/slices/farmvest/farms';
import { useTableSortAndSearch } from '../hooks/useTableSortAndSearch';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';
import { farmvestService } from '../services/farmvest_api';
import AddFarmModal from './AddFarmModal';
import './Farms.css';

// Memoized table row with defensive checks
// Memoized table row with defensive checks
const FarmRow = memo(({ farm, index, currentPage, itemsPerPage, onFarmClick }: any) => {
    if (!farm) return null;

    // Safely calculate serial number
    const pageNum = isNaN(currentPage) ? 1 : currentPage;
    const sNo = (pageNum - 1) * itemsPerPage + index + 1;

    return (
        <tr className="bg-white border-b hover:bg-gray-50 transition-colors duration-150">
            <td className="px-4 py-3 text-center text-gray-400 font-medium">{sNo}</td>
            <td className="px-4 py-3 font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onFarmClick && onFarmClick(farm)}>
                {farm.farm_name || '-'}
            </td>
            <td className="px-4 py-3 text-gray-600">
                {farm.location || '-'}
            </td>
            <td className="px-4 py-3">
                <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
                    {typeof farm.total_buffaloes_count === 'number'
                        ? farm.total_buffaloes_count.toLocaleString()
                        : (farm.total_buffaloes_count || '0')}
                </span>
            </td>
        </tr>
    );
});

const Farms: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { farms, loading: farmsLoading, error: farmsError } = useAppSelector((state: RootState) => {
        // Safe selector fallback
        const farmState = state.farmvestFarms || { farms: [], loading: false, error: null };
        return {
            farms: Array.isArray(farmState.farms) ? farmState.farms : [],
            loading: !!farmState.loading,
            error: farmState.error
        };
    });

    // URL Search Params for Pagination and Location
    const [searchParams, setSearchParams] = useSearchParams();

    // Derived location from URL or default to KURNOOL
    const location = useMemo(() => {
        return (searchParams.get('location') || 'KURNOOL').toUpperCase();
    }, [searchParams]);

    // Defensive parsing of currentPage
    const currentPage = useMemo(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        return isNaN(page) || page < 1 ? 1 : page;
    }, [searchParams]);

    const itemsPerPage = 15;

    // Local State for search
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddFarmModalOpen, setIsAddFarmModalOpen] = useState(false);

    const handleFarmNameClick = useCallback((farm: any) => {
        if (!farm || !farm.id) return;

        // Navigate to details page
        navigate(`/farmvest/farms/${farm.id}`, { state: { farm } });
    }, [navigate]);

    // Removed old modal state and logic





    // Effect: Trigger fetch when location changes
    useEffect(() => {
        console.log(`[FarmsComponent] Location changed to: ${location}, triggering fetch`);
        dispatch(fetchFarms(location));
    }, [dispatch, location]);

    // Handle location change via URL
    const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLocation = e.target.value;
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('location', newLocation);
            next.set('page', '1'); // Reset to first page on location change
            return next;
        });
    }, [setSearchParams]);


    // Handle pagination
    const setCurrentPage = useCallback((page: number) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', String(page));
            return newParams;
        });
    }, [setSearchParams]);

    // Custom Search Function (Memoized)
    const searchFn = useCallback((item: any, query: string) => {
        if (!item) return false;
        const lowerQuery = query.toLowerCase();
        const farmName = (item.farm_name || '').toLowerCase();
        const farmLocation = (item.location || '').toLowerCase();
        return farmName.includes(lowerQuery) || farmLocation.includes(lowerQuery);
    }, []);

    const {
        filteredData: filteredFarms,
        requestSort,
        sortConfig,
        searchQuery: activeSearchQuery,
        setSearchQuery
    } = useTableSortAndSearch(farms, { key: '', direction: 'asc' }, searchFn);

    // Debounce Search updates
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== activeSearchQuery) {
                setSearchQuery(searchTerm);
                if (currentPage !== 1) setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, activeSearchQuery, setSearchQuery, currentPage, setCurrentPage]);

    // Pagination metrics
    const totalPages = useMemo(() => {
        const count = filteredFarms?.length || 0;
        return Math.max(1, Math.ceil(count / itemsPerPage));
    }, [filteredFarms, itemsPerPage]);

    const currentItems = useMemo(() => {
        if (!Array.isArray(filteredFarms)) return [];
        const last = currentPage * itemsPerPage;
        const first = last - itemsPerPage;
        return filteredFarms.slice(Math.max(0, first), last);
    }, [filteredFarms, currentPage, itemsPerPage]);

    // Page Clamping: Prevent being on a page that no longer exists
    useEffect(() => {
        if (!farmsLoading && currentPage > totalPages && totalPages > 0) {
            console.log(`[FarmsComponent] Page clamp: ${currentPage} -> ${totalPages}`);
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage, setCurrentPage, farmsLoading]);

    // Extra safeguard for currentPage parsing
    const currentPageToUse = useMemo(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        return isNaN(page) || page < 1 ? 1 : page;
    }, [searchParams]);


    const getSortIcon = useCallback((key: string) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    }, [sortConfig]);

    return (
        <div className="farms-container animate-fadeIn">
            <div className="farms-header p-6 border-b border-gray-100 bg-white shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">FarmVest Management</h2>
                    <div className="text-sm text-gray-500 font-medium flex items-center gap-2 mt-1">
                        {/* <span className={`inline-block w-2 h-2 rounded-full ${farmsLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span> */}
                        {/* <span>{location} Operations • {farms.length} Farms Loaded</span> */}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <button
                        onClick={() => setIsAddFarmModalOpen(true)}
                        className="px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                    >
                        <span>+</span> Add Farm
                    </button>

                    {/* Location Selector */}
                    <div className="relative w-full sm:w-56">
                        <select
                            className="w-full p-3 pl-4 pr-10 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none font-bold text-gray-700 shadow-sm"
                            value={location}
                            onChange={handleLocationChange}
                        >
                            <option value="KURNOOL">KURNOOL </option>
                            <option value="HYDERABAD">HYDERABAD</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="w-full sm:w-80 relative group">
                        <input
                            type="text"
                            placeholder="Find farm name..."
                            className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="farms-content p-6">
                {farmsError && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-lg flex items-center shadow-md animate-shake">
                        <div className="p-2 bg-red-100 rounded-lg mr-4">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold uppercase tracking-tight text-xs">API Configuration Error</p>
                            <p className="text-sm font-medium">{farmsError}</p>
                        </div>
                        <button
                            className="px-5 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg active:scale-95 ml-4"
                            onClick={() => dispatch(fetchFarms(location))}
                        >
                            RE-SYNC API
                        </button>
                    </div>
                )}

                <div className="overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-2xl">
                    <table className="farms-table w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                            <tr>
                                <th className="px-6 py-5 text-center">S.no</th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100/50 transition-colors group" onClick={() => requestSort('farm_name')}>
                                    <div className="flex items-center gap-2">Farm Name <span className="text-blue-500 opacity-60">{getSortIcon('farm_name')}</span></div>
                                </th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100/50 transition-colors group" onClick={() => requestSort('location')}>
                                    <div className="flex items-center gap-2">Location <span className="text-blue-500 opacity-60">{getSortIcon('location')}</span></div>
                                </th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-gray-100/50 transition-colors group" onClick={() => requestSort('total_buffaloes_count')}>
                                    <div className="flex items-center gap-2">Live Count <span className="text-blue-500 opacity-60">{getSortIcon('total_buffaloes_count')}</span></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {farmsLoading ? (
                                <TableSkeleton cols={4} rows={10} />
                            ) : (currentItems.length === 0 && !farmsError) ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-gray-400">
                                        <div className="text-4xl mb-4 grayscale opacity-50">🚜</div>
                                        <p className="text-lg font-medium text-gray-500">No Farm Records Found</p>
                                        <p className="text-sm">We couldn't find any farms matching your filter in {location}</p>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((farm: any, index: number) => (
                                    <FarmRow
                                        key={`${farm?.id || 'farm'}-${index}`}
                                        farm={farm}
                                        index={index}
                                        currentPage={currentPage}
                                        itemsPerPage={itemsPerPage}
                                        onFarmClick={handleFarmNameClick}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-10 flex justify-center">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>



            <AddFarmModal
                isOpen={isAddFarmModalOpen}
                onClose={() => setIsAddFarmModalOpen(false)}
                initialLocation={location}
                onSuccess={(newLocation) => {
                    // Refresh data, potentially switching location if needed
                    if (newLocation !== location) {
                        setSearchParams(prev => {
                            const next = new URLSearchParams(prev);
                            next.set('location', newLocation);
                            return next;
                        });
                    } else {
                        dispatch(fetchFarms(location));
                    }
                }}
            />
        </div >
    );
};

export default memo(Farms);
