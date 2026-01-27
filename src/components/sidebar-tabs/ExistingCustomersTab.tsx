import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePersistentState } from '../../hooks/usePersistence';
import { useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { useTableSortAndSearch } from '../../hooks/useTableSortAndSearch';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';
import TableSkeleton from '../common/TableSkeleton';
import './ExistingCustomersTab.css';

interface ExistingCustomersTabProps {
    getSortIcon: (key: string, currentSortConfig: any) => string;
}

const ExistingCustomersTab: React.FC<ExistingCustomersTabProps> = ({
    getSortIcon
}) => {
    const { existingCustomers, referralUsers, loading: usersLoading } = useAppSelector((state: RootState) => state.users);

    // URL Search Params for Pagination
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const setCurrentPage = (page: number) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('page', String(page));
            return newParams;
        });
    };

    // Use persistent state
    const [activeSubTab, setActiveSubTab] = usePersistentState<'verified' | 'non-verified'>('existing_activeSubTab', 'verified');
    const itemsPerPage = 15;

    // Combine and deduplicate users (only Investors for this tab)
    const allUsers = useMemo(() => {
        const investorReferrals = referralUsers.filter(user => user.role === 'Investor');
        const combined = [...existingCustomers, ...investorReferrals];
        // Deduplicate by mobile
        const seen = new Set();
        return combined.filter(user => {
            if (seen.has(user.mobile)) return false;
            seen.add(user.mobile);
            return true;
        });
    }, [existingCustomers, referralUsers]);

    // Split users into verified and non-verified
    const verifiedUsers = useMemo(() => allUsers.filter(user => user.verified), [allUsers]);
    const nonVerifiedUsers = useMemo(() => allUsers.filter(user => !user.verified), [allUsers]);

    // Choose which data to pass to the sort and search hook based on active sub-tab
    const dataToDisplay = activeSubTab === 'verified' ? verifiedUsers : nonVerifiedUsers;

    const {
        filteredData: filteredExistingUsers,
        requestSort: requestExistingUsersSort,
        sortConfig: existingUsersSortConfig
    } = useTableSortAndSearch(dataToDisplay);

    // Reset to page 1 ONLY if sub-tab changes (skip on initial mount to preserve persisted page)
    const prevSubTabRef = React.useRef(activeSubTab);
    useEffect(() => {
        if (prevSubTabRef.current !== activeSubTab) {
            setCurrentPage(1);
            prevSubTabRef.current = activeSubTab;
        }
    }, [activeSubTab, setCurrentPage]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredExistingUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredExistingUsers.length / itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    return (
        <div className="existing-customers-container">
            <div className="existing-customers-header flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 py-4 px-2">
                <div className="investor-sub-tabs flex flex-nowrap gap-0 w-full sm:w-auto">
                    <button
                        className={`sub-tab-btn ${activeSubTab === 'verified' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('verified')}
                    >
                        Verified Users ({verifiedUsers.length})
                    </button>
                    <button
                        className={`sub-tab-btn ${activeSubTab === 'non-verified' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('non-verified')}
                    >
                        Non-Verified Users ({nonVerifiedUsers.length})
                    </button>
                </div>
            </div>

            <div className="table-container existing-customers-table-container">
                <table className="user-table existing-customers-table">
                    <thead>
                        <tr>
                            <th className="existing-customers-th">S.No</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('first_name')}>First Name {getSortIcon('first_name', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('last_name')}>Last Name {getSortIcon('last_name', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('mobile')}>Mobile {getSortIcon('mobile', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('role')}>Role {getSortIcon('role', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('isFormFilled')}>Form Filled {getSortIcon('isFormFilled', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('refered_by_name')}>Referred By {getSortIcon('refered_by_name', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('refered_by_mobile')}>Referrer Mobile {getSortIcon('refered_by_mobile', existingUsersSortConfig)}</th>
                            <th className="existing-customers-th existing-customers-th-sortable" onClick={() => requestExistingUsersSort('verified')}>Verified {getSortIcon('verified', existingUsersSortConfig)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersLoading ? (
                            <TableSkeleton cols={8} rows={10} />
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="existing-customers-no-data">No users found</td>
                            </tr>
                        ) : (
                            currentItems.map((user: any, index: number) => (
                                <tr key={index}>
                                    <td className="existing-customers-td">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="existing-customers-td">{user.first_name || '-'}</td>
                                    <td className="existing-customers-td">{user.last_name || '-'}</td>
                                    <td className="existing-customers-td">{user.mobile}</td>
                                    <td className="existing-customers-td">{user.role || 'Investor'}</td>
                                    <td className="existing-customers-td">{user.isFormFilled ? 'Yes' : 'No'}</td>
                                    <td className="existing-customers-td">{user.refered_by_name || '-'}</td>
                                    <td className="existing-customers-td">{user.refered_by_mobile || '-'}</td>
                                    <td className="existing-customers-td">
                                        <span className={`status-pill ${user.verified ? 'status-pill-verified' : 'status-pill-non-verified'}`}>
                                            {user.verified ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default ExistingCustomersTab;
