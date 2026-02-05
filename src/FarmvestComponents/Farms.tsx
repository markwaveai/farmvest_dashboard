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
    // Debug logging to inspect structure
    console.log('Farm Data Row:', farm);

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
            <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 shadow-sm mx-auto">
                    {typeof farm.total_buffaloes_count === 'number'
                        ? farm.total_buffaloes_count.toLocaleString()
                        : (farm.total_buffaloes_count || '0')}
                </span>
            </td>
            <td className="px-4 py-3 text-gray-600">
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{farm.farm_manager_name || farm.manager_name || (farm.farm_manager?.name) || '-'}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{farm.mobile_number || farm.manager_mobile || farm.manager_phone || (farm.farm_manager?.mobile) || '-'}</span>
                </div>
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

    // Derived location from URL or default to Kurnool
    const location = useMemo(() => {
        return searchParams.get('location') ? searchParams.get('location')!.toUpperCase() : 'KURNOOL';
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
    const [availableLocations, setAvailableLocations] = useState<string[]>([]);

    useEffect(() => {
        const loadLocations = async () => {
            try {
                const response = await farmvestService.getLocations();
                console.log('Fetched locations response:', response);

                // Based on node script test: response.data.locations
                let locs: string[] = [];

                if (response && response.data && Array.isArray(response.data.locations)) {
                    locs = response.data.locations;
                } else if (response && Array.isArray(response.locations)) {
                    locs = response.locations;
                } else if (Array.isArray(response)) {
                    locs = response;
                }

                // Set locations if valid strings
                if (locs.length > 0) {
                    setAvailableLocations(locs.map(l => String(l).toUpperCase()));
                }
            } catch (err) {
                console.error("Failed to load locations", err);
            }
        };
        loadLocations();
    }, []);

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

        // Safely access and convert properties to strings for searching
        const farmName = String(item.farm_name || '').toLowerCase();
        const farmLocation = String(item.location || '').toLowerCase();

        // Also search by manager name and mobile as they are displayed in the table
        const managerName = String(item.farm_manager_name || item.manager_name || item.farm_manager?.name || '').toLowerCase();
        const mobile = String(item.mobile_number || item.manager_mobile || item.manager_phone || item.farm_manager?.mobile || '').toLowerCase();

        return farmName.includes(lowerQuery) ||
            farmLocation.includes(lowerQuery) ||
            managerName.includes(lowerQuery) ||
            mobile.includes(lowerQuery);
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




    const getSortIcon = useCallback((key: string) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    }, [sortConfig]);

    return (
        <div className="farms-container animate-fadeIn">
            <div className="farms-header p-3 border-b border-gray-100 bg-white shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-md font-bold text-gray-800 tracking-tight">FarmVest Management</h2>
                    <div className="text-sm text-gray-500 font-medium flex items-center gap-2 mt-1">
                        <span>{location} Operations • {filteredFarms.length} Farms Loaded</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Search Input - Swapped with dropdown */}
                    <div className="w-full sm:w-56 relative group">
                        <input
                            type="text"
                            placeholder="Find farm name..."
                            className="w-full pl-11 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
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

                    <div className="relative w-full sm:w-36">
                        <select
                            className="w-full py-2 px-3 pl-4 pr-10 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none font-bold text-gray-700 shadow-sm"
                            value={location}
                            onChange={handleLocationChange}
                        >
                            {availableLocations.length > 0 ? (
                                availableLocations.map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))
                            ) : (
                                <>
                                    <option value="KURNOOL">KURNOOL</option>
                                    <option value="HYDERABAD">HYDERABAD</option>
                                </>
                            )}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAddFarmModalOpen(true)}
                        className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-all shadow-orange-100"
                    >
                        <span className="text-base">+</span> Add Farm
                    </button>
                </div>
            </div>

            <div className="farms-content p-6 flex-1 flex flex-col min-h-0">
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

                <div className="bg-white border border-gray-100 rounded-2xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="overflow-auto flex-1 h-full hide-scrollbar">
                        <table className="farms-table w-full h-full text-xs text-left border-collapse relative">
                            <thead className="bg-gray-50 border-b border-gray-100 text-sm font-extrabold tracking-wider text-black sticky top-0 z-10 shadow-sm h-12">
                                <tr>
                                    <th className="px-4 py-3 text-center">S.no</th>
                                    <th className="px-4 py-3 text-left">
                                        <div className="flex items-center gap-2">Farm Name</div>
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <div className="flex items-center gap-2">Location</div>
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">Live Count</div>
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <div className="flex items-center gap-2">Farm Manager</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {farmsLoading ? (
                                    <TableSkeleton cols={5} rows={10} />
                                ) : (currentItems.length === 0 && !farmsError) ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 text-center h-full align-middle">
                                            <div className="flex flex-col items-center justify-center h-full pb-12">
                                                <div className="text-3xl mb-2 animate-bounce">🚜</div>
                                                <p className="text-sm font-bold text-gray-800 tracking-tight">No Farm Records Found</p>
                                                <p className="text-xs text-gray-500 mt-1">We couldn't find any farms matching your filter in <span className="font-bold text-blue-600">{location}</span></p>
                                            </div>
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
