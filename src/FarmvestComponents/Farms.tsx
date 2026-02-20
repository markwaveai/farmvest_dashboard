import React, { useEffect, useCallback, useState, useMemo, memo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchFarms } from '../store/slices/farmvest/farms';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';
import { farmvestService } from '../services/farmvest_api';
import AddFarmModal from './AddFarmModal';
import AddLocationDialog from './AddLocationDialog';
import './Farms.css';
import { Search, X } from 'lucide-react';
import CustomDropdown from '../components/common/CustomDropdown';

const FarmRow = memo(({ farm, index, currentPage, itemsPerPage, onFarmClick }: any) => {
    if (!farm) return null;

    // Safely calculate serial number
    const pageNum = isNaN(currentPage) ? 1 : currentPage;
    const sNo = (pageNum - 1) * itemsPerPage + index + 1;

    return (
        <tr className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
            <td className="px-4 py-3 text-center text-gray-400 font-bold text-xs">{sNo}</td>
            <td className="px-4 py-3 text-left font-black text-gray-900 text-xs cursor-pointer hover:text-orange-600 transition-colors uppercase tracking-tight" onClick={() => onFarmClick && onFarmClick(farm)}>
                {farm.farm_name || '-'}
            </td>
            <td className="px-4 py-3 text-left text-gray-600 uppercase tracking-widest text-[9px] font-black">
                {farm.location || '-'}
            </td>
            <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 uppercase">
                    {farm.sheds_count !== undefined ? farm.sheds_count : '-'}
                </span>
            </td>
            <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100 uppercase">
                    {typeof farm.total_buffaloes_count === 'number'
                        ? farm.total_buffaloes_count.toLocaleString()
                        : (farm.total_buffaloes_count || '0')}
                </span>
            </td>
            <td className="px-4 py-3 text-left">
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-xs">{farm.farm_manager_name || farm.manager_name || (farm.farm_manager?.name) || '-'}</span>
                    <span className="text-[10px] text-gray-400 font-bold mt-0.5">{farm.mobile_number || farm.manager_mobile || farm.manager_phone || (farm.farm_manager?.mobile) || '-'}</span>
                </div>
            </td>
        </tr>
    );
});

const Farms: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // Select data from Redux
    const farms = useAppSelector((state: RootState) => state.farmvestFarms?.farms || []);
    const farmsLoading = useAppSelector((state: RootState) => !!state.farmvestFarms?.loading);
    const farmsError = useAppSelector((state: RootState) => state.farmvestFarms?.error);
    const totalCount = useAppSelector((state: RootState) => state.farmvestFarms?.totalCount || 0);
    const totalAnimalsCount = useAppSelector((state: RootState) => state.farmvestFarms?.totalAnimalsCount || 0);

    // Auth Role check
    const adminRole = useAppSelector((state: RootState) => state.auth.adminRole);
    const isAdmin = adminRole?.toUpperCase() === 'ADMIN' || adminRole?.toUpperCase() === 'SUPER ADMIN';

    // URL Search Params for Pagination and Location
    const [searchParams, setSearchParams] = useSearchParams();

    // Derived location from URL or default to ALL
    const location = useMemo(() => {
        return searchParams.get('location') || 'ALL';
    }, [searchParams]);

    // Defensive parsing of currentPage
    const currentPage = useMemo(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        return isNaN(page) || page < 1 ? 1 : page;
    }, [searchParams]);

    const itemsPerPage = 15;

    // Local State for search
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isAddFarmModalOpen, setIsAddFarmModalOpen] = useState(false);
    const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
    const [availableLocations, setAvailableLocations] = useState<string[]>([]);

    const loadLocations = useCallback(async () => {
        try {
            const response = await farmvestService.getLocations();

            // Based on node script test: response.data.locations
            let locs: any[] = [];

            if (response && response.data && Array.isArray(response.data.locations)) {
                locs = response.data.locations;
            } else if (response && Array.isArray(response.locations)) {
                locs = response.locations;
            } else if (Array.isArray(response)) {
                locs = response;
            }

            // Set locations if valid strings or objects
            if (locs.length > 0) {
                setAvailableLocations(locs.map(l =>
                    (typeof l === 'object' ? (l.name || l.location || '') : String(l))
                ));
            }
        } catch (err) {
        }
    }, []);

    useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    const handleFarmNameClick = useCallback((farm: any) => {
        if (!farm || !farm.id) return;

        // Navigate to details page
        navigate(`/farmvest/farms/${farm.id}`, { state: { farm } });
    }, [navigate]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Effect: Trigger fetch when location, page, or search changes
    useEffect(() => {
        dispatch(fetchFarms({
            location,
            page: currentPage,
            size: itemsPerPage,
            search: debouncedSearch
        }));
    }, [dispatch, location, currentPage, debouncedSearch]);

    // Transform locations for CustomDropdown
    const locationOptions = useMemo(() => {
        const allOption = { value: 'ALL', label: 'ALL LOCATIONS' };
        if (availableLocations.length > 0) {
            return [allOption, ...availableLocations.map(loc => ({ value: loc, label: loc.toUpperCase() }))];
        }
        return [
            allOption,
            { value: 'Adoni', label: 'adoni' },
            { value: 'Kurnool', label: 'kurnool' },
            { value: 'Hyderabad', label: 'hyderabad' },
            { value: 'Vijayawada', label: 'vijayawada' }
        ];
    }, [availableLocations]);

    // Handle location change via CustomDropdown
    const handleLocationSelect = useCallback((newLocation: string) => {
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

    // Pagination metrics
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalCount / itemsPerPage));
    }, [totalCount, itemsPerPage]);
    return (
        <div className="h-full flex flex-col overflow-hidden animate-fadeIn bg-transparent">
            {/* Page Header - Matches Employees Tab */}
            <div className="flex-none bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="mb-3 lg:mb-0">
                        <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">FarmVest Management</h1>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                            {location} Operations • {totalCount} Farms Found
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64 lg:w-72">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Search className="h-3.5 w-3.5 text-gray-300" />
                            </div>
                            <input
                                type="text"
                                placeholder="Find farm name..."
                                className="farms-search-input w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-48 z-20">
                                <CustomDropdown
                                    options={locationOptions}
                                    value={location}
                                    onChange={handleLocationSelect}
                                    placeholder="all locations"
                                    className="farms-location-filter"
                                />
                            </div>

                            <button
                                onClick={() => setIsAddFarmModalOpen(true)}
                                className="add-btn-compact w-full sm:w-auto flex items-center justify-center gap-1.5"
                            >
                                <span className="text-base leading-none">+</span> Farm
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="farms-container flex-1 min-h-0">
                {farmsError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg flex items-center shadow-sm">
                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-tight">API Error</p>
                            <p className="text-xs font-medium">{farmsError}</p>
                        </div>
                        <button
                            className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-md hover:bg-red-700 transition-all uppercase"
                            onClick={() => dispatch(fetchFarms({ location, page: currentPage, size: itemsPerPage }))}
                        >
                            Sync
                        </button>
                    </div>
                )}

                <div className="farms-table-container h-full flex flex-col">
                    <div className="overflow-auto flex-1 hide-scrollbar">
                        <table className="farms-table">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className="w-16 text-center">S.No</th>
                                    <th>FARM NAME</th>
                                    <th>LOCATION</th>
                                    <th className="text-center">SHEDS</th>
                                    <th className="text-center">LIVE COUNT</th>
                                    <th>FARM MANAGER</th>
                                </tr>
                            </thead>
                            <tbody>
                                {farmsLoading ? (
                                    <TableSkeleton cols={6} rows={10} />
                                ) : (farms.length === 0 && !farmsError) ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 text-center h-full align-middle">
                                            <div className="flex flex-col items-center justify-center h-full pb-12">
                                                <div className="text-3xl mb-2 animate-bounce">🚜</div>
                                                <p className="text-sm font-bold text-gray-800 tracking-tight">No Farm Records Found</p>
                                                <p className="text-xs text-gray-500 mt-1">We couldn't find any farms matching your filter in <span className="font-bold text-blue-600">{location}</span></p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    farms.map((farm: any, index: number) => (
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
            </div>

            {totalPages > 1 && (
                <div className="flex-none mt-2 px-4 pb-2 flex justify-end">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

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
                        // Refresh current page
                        dispatch(fetchFarms({ location, page: currentPage, size: itemsPerPage }));
                    }
                }}
            />

            <AddLocationDialog
                isOpen={isAddLocationModalOpen}
                onClose={() => setIsAddLocationModalOpen(false)}
                onSuccess={loadLocations}
            />
        </div>
    );
};

export default memo(Farms);
