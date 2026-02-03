import React, { useEffect, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { fetchInvestors, clearInvestorErrors } from '../store/slices/farmvest/investors';
import Snackbar from '../components/common/Snackbar';
import { Search, Users, Briefcase } from 'lucide-react';
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

    const currentItems = filteredInvestors;
    const totalPages = Math.ceil((totalCount || filteredInvestors.length) / itemsPerPage) || 1;

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const handleNameClick = useCallback((investor: any) => {
        navigate(`/farmvest/investors/${investor.id || investor.investor_id}`);
    }, [navigate]);

    return (
        <div className="p-6 max-w-full mx-auto min-h-screen">
            {/* Page Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">FarmVest Investors</h1>
                        <p className="text-xs text-gray-500 mt-1">Manage all investors (Total: {totalCount || 0} | {investors.length} visible)</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Name, Email, Phone..."
                                className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="mt-8 overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-[#f8f9fa]">
                            <tr>
                                <th onClick={() => requestSort('id')} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">S.No {getSortIcon('id')}</th>
                                <th onClick={() => requestSort('first_name')} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">Name {getSortIcon('first_name')}</th>
                                <th onClick={() => requestSort('email')} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">Email {getSortIcon('email')}</th>
                                <th onClick={() => requestSort('phone_number')} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">Phone {getSortIcon('phone_number')}</th>
                                <th onClick={() => requestSort('active_status')} className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer">Status {getSortIcon('active_status')}</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {investorsLoading ? (
                                <tr><td colSpan={6} className="p-4"><TableSkeleton cols={6} rows={5} /></td></tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((investor: any, index: number) => (
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
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${investor.active_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {investor.active_status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                            {investor.created_at ? new Date(investor.created_at).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6}>
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
            </div>

            <Snackbar
                message={error}
                type={error ? 'error' : null}
                onClose={() => dispatch(clearInvestorErrors())}
            />
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
    );
};

export default Investors;
