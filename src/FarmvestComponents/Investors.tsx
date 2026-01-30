import React, { useEffect, useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchInvestors, clearInvestorsMessages } from '../store/slices/farmvest/investors';
import { RootState } from '../store';
import Snackbar from '../components/common/Snackbar';
import { useTableSortAndSearch } from '../hooks/useTableSortAndSearch';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';
import './Employees.css'; // Reusing Employees CSS for consistency

const Investors: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // Selectors
    const {
        investors,
        totalCount,
        loading: investorsLoading,
        error
    } = useAppSelector((state: RootState) => state.farmvestInvestors);

    // URL Search Params for Pagination
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = 20;

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    const setCurrentPage = useCallback((page: number) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', String(page));
            return newParams;
        });
    }, [setSearchParams]);

    const handleNameClick = useCallback((investor: any) => {
        navigate(`/farmvest/investors/${investor.id}`);
    }, [navigate]);

    // Custom Search Function
    const searchFn = useCallback((item: any, query: string) => {
        const lowerQuery = query.toLowerCase();
        const fullName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
        const email = (item.email || '').toLowerCase();
        const phone = item.phone_number || '';
        const mobile = item.mobile || '';

        return (
            fullName.includes(lowerQuery) ||
            email.includes(lowerQuery) ||
            phone.includes(lowerQuery) ||
            mobile.includes(lowerQuery)
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

    // Fetch data
    useEffect(() => {
        dispatch(fetchInvestors({
            page: currentPage,
            size: itemsPerPage
        }));
    }, [dispatch, currentPage]);

    // Client-side pagination logic if API returns all or we just want to be safe with filtered data
    // Assuming API paginates, but search is client-side for now based on current page data or if API returns all
    // If API returns paginated data, `investors` will only contain current page.
    // However, `useTableSortAndSearch` filters *what is present*.
    const currentItems = filteredInvestors;
    const totalPages = Math.ceil((totalCount || 0) / itemsPerPage) || 1;

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="employees-container">
            <div className="employees-header p-4 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Investors</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage all investors ({totalCount} total)</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="w-full md:w-auto relative">
                        <input
                            type="text"
                            placeholder="Search Investors..."
                            className="w-full md:w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>

                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="employees-content p-4">
                <div className="table-container relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="employees-table w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-center">S.No</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('first_name')}>Name {getSortIcon('first_name')}</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('email')}>Email {getSortIcon('email')}</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('mobile')}>Mobile {getSortIcon('mobile')}</th>
                                <th className="px-4 py-3 cursor-pointer" onClick={() => requestSort('created_at')}>Joining Date {getSortIcon('created_at')}</th>
                                <th className="px-4 py-3 cursor-pointer">Roles</th>
                                <th className="px-4 py-3 text-center cursor-pointer" onClick={() => requestSort('is_active')}>Status {getSortIcon('is_active')}</th>
                            </tr>
                        </thead>

                        <tbody>
                            {investorsLoading ? (
                                <TableSkeleton cols={7} rows={10} />
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No investors found</td>
                                </tr>
                            ) : (
                                currentItems.map((investor: any, index: number) => (
                                    <tr key={investor.id || index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td
                                            className="px-4 py-3 font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                            onClick={() => handleNameClick(investor)}
                                        >
                                            {`${investor.first_name || ''} ${investor.last_name || ''}`.trim() || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {investor.email || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {investor.mobile || investor.phone_number || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {investor.created_at ? new Date(investor.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {investor.roles && investor.roles.length > 0 ? (
                                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                                    {investor.roles[0].replace(/_/g, ' ')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${investor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {investor.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
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

            <Snackbar
                message={error}
                type={error ? 'error' : null}
                onClose={() => dispatch(clearInvestorsMessages())}
            />
        </div>
    );
};

export default Investors;
