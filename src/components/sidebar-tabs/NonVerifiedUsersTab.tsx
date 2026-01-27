import React, { useState, useEffect } from 'react';
import { usePersistentState, usePersistentPagination } from '../../hooks/usePersistence';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { useTableSortAndSearch } from '../../hooks/useTableSortAndSearch';
import { setEditReferralModal } from '../../store/slices/uiSlice';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';
import TableSkeleton from '../common/TableSkeleton';
import './NonVerifiedUsersTab.css';

interface NonVerifiedUsersTabProps {
    getSortIcon: (key: string, currentSortConfig: any) => string;
}

const NonVerifiedUsersTab: React.FC<NonVerifiedUsersTabProps> = ({
    getSortIcon
}) => {
    const dispatch = useAppDispatch();
    const { referralUsers, loading: usersLoading } = useAppSelector((state: RootState) => state.users);

    const [activeSubTab, setActiveSubTab] = usePersistentState<'verified' | 'non-verified'>('referrals_activeSubTab', 'non-verified');
    const [currentPage, setCurrentPage] = usePersistentPagination('referrals_currentPage', 1);
    const itemsPerPage = 15;

    // Filter for Admins and then split by verification
    const adminUsers = React.useMemo(() => {
        return referralUsers.filter(user => user.role === 'Admin' || user.role === 'SpecialCategory');
    }, [referralUsers]);

    const verifiedAdmins = React.useMemo(() => adminUsers.filter(user => user.verified), [adminUsers]);
    const nonVerifiedAdmins = React.useMemo(() => adminUsers.filter(user => !user.verified), [adminUsers]);

    const dataToDisplay = activeSubTab === 'verified' ? verifiedAdmins : nonVerifiedAdmins;

    const {
        filteredData: filteredReferrals,
        requestSort: requestReferralSort,
        sortConfig: referralSortConfig
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
    const currentItems = filteredReferrals.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    const handleRowClick = (user: any) => {
        dispatch(setEditReferralModal({ isOpen: true, user }));
    };

    return (
        <div className="non-verified-users-container">
            <div className="non-verified-users-header flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 py-4 px-2">
                <div className="admin-sub-tabs flex flex-nowrap gap-1 sm:gap-2 w-full sm:w-auto">
                    <button
                        className={`sub-tab-btn ${activeSubTab === 'verified' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('verified')}
                    >
                        Verified Admins ({verifiedAdmins.length})
                    </button>
                    <button
                        className={`sub-tab-btn ${activeSubTab === 'non-verified' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('non-verified')}
                    >
                        Non-Verified Users ({nonVerifiedAdmins.length})
                    </button>
                </div>
            </div>

            <div className="table-container non-verified-table-container">
                <table className="user-table non-verified-user-table">
                    <thead>
                        <tr>
                            <th className="non-verified-th">S.No</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('first_name')}>First Name {getSortIcon('first_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('last_name')}>Last Name {getSortIcon('last_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('mobile')}>Mobile {getSortIcon('mobile', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('role')}>Role {getSortIcon('role', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('refered_by_name')}>Referred By {getSortIcon('refered_by_name', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('refered_by_mobile')}>Referrer Mobile {getSortIcon('refered_by_mobile', referralSortConfig)}</th>
                            <th className="non-verified-th non-verified-th-sortable" onClick={() => requestReferralSort('verified')}>Verified {getSortIcon('verified', referralSortConfig)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersLoading ? (
                            <TableSkeleton cols={8} rows={10} />
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="non-verified-no-data">No users found</td>
                            </tr>
                        ) : (
                            currentItems.map((user: any, index: number) => (
                                <tr key={index}>
                                    <td className="non-verified-td">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="non-verified-td">{user.first_name || '-'}</td>
                                    <td className="non-verified-td">{user.last_name || '-'}</td>
                                    <td className="non-verified-td">{user.mobile}</td>
                                    <td className="non-verified-td">
                                        {user.role === 'SpecialCategory' ? 'Special Category' : user.role}
                                    </td>
                                    <td className="non-verified-td">{user.refered_by_name || '-'}</td>
                                    <td className="non-verified-td">{user.refered_by_mobile || '-'}</td>
                                    <td className="non-verified-td">
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

export default NonVerifiedUsersTab;
