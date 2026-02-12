import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store';
import { fetchLeaveRequests, updateLeaveStatus, clearLeaveMessages } from '../store/slices/farmvest/leaveRequests';
import { LeaveRequest } from '../types/farmvest';
import { Calendar, Plus, Check, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import CreateLeaveRequestModal from './CreateLeaveRequestModal';
import './LeaveRequests.css';

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
    CASUAL: 'bg-blue-50 text-blue-700',
    SICK: 'bg-rose-50 text-rose-700',
    ANNUAL: 'bg-indigo-50 text-indigo-700',
    MATERNITY: 'bg-purple-50 text-purple-700',
    PATERNITY: 'bg-teal-50 text-teal-700',
    UNPAID: 'bg-gray-100 text-gray-600',
};

const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

const LeaveRequests: React.FC = () => {
    const dispatch = useAppDispatch();
    const { leaveRequests, loading, error, successMessage, pagination, actionLoading } = useAppSelector(
        (state: RootState) => state.farmvestLeaveRequests
    );

    const [activeTab, setActiveTab] = useState<string>('ALL');
    const [page, setPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        dispatch(fetchLeaveRequests({
            status_filter: activeTab === 'ALL' ? undefined : activeTab,
            page,
            size: 15,
        }));
    }, [dispatch, activeTab, page]);

    useEffect(() => {
        if (error || successMessage) {
            const timer = setTimeout(() => dispatch(clearLeaveMessages()), 4000);
            return () => clearTimeout(timer);
        }
    }, [error, successMessage, dispatch]);

    const pendingCount = useMemo(() => leaveRequests.filter(l => l.status === 'PENDING').length, [leaveRequests]);
    const approvedCount = useMemo(() => leaveRequests.filter(l => l.status === 'APPROVED').length, [leaveRequests]);

    const getDuration = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `${diff} day${diff !== 1 ? 's' : ''}`;
    };

    const handleApprove = (leaveId: number) => {
        dispatch(updateLeaveStatus({ leaveId, status: 'APPROVED' }));
    };

    const handleReject = (leaveId: number) => {
        if (rejectionReason.length < 10) return;
        dispatch(updateLeaveStatus({ leaveId, status: 'REJECTED', rejection_reason: rejectionReason }));
        setRejectingId(null);
        setRejectionReason('');
    };

    return (
        <div className="leave-container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="text-amber-500" size={24} />
                        Leave Requests
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Manage employee leave requests</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 bg-amber-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm"
                >
                    <Plus size={16} /> Request Leave
                </button>
            </div>

            {/* Stats */}
            <div className="leave-stats-row">
                <div className="leave-stat-card">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{pagination?.total_items || leaveRequests.length}</p>
                </div>
                <div className="leave-stat-card">
                    <p className="text-xs font-bold text-amber-500 uppercase">Pending</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
                </div>
                <div className="leave-stat-card">
                    <p className="text-xs font-bold text-green-500 uppercase">Approved</p>
                    <p className="text-2xl font-black text-green-600 mt-1">{approvedCount}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="leave-filter-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`leave-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tab); setPage(1); }}
                    >
                        {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Messages */}
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            {successMessage && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{successMessage}</div>}

            {/* Table */}
            <div className="leave-table-container">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500 font-medium">Loading leave requests...</p>
                    </div>
                ) : leaveRequests.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FileText size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No leave requests found</p>
                        <p className="text-xs mt-1">Try changing the filter or create a new request</p>
                    </div>
                ) : (
                    <table className="leave-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Leave Type</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveRequests.map(leave => (
                                <React.Fragment key={leave.id}>
                                    <tr>
                                        <td className="font-bold text-gray-800">#{leave.id}</td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${LEAVE_TYPE_COLORS[leave.leave_type] || 'bg-gray-100 text-gray-600'}`}>
                                                {leave.leave_type}
                                            </span>
                                        </td>
                                        <td className="text-xs text-gray-600">
                                            {new Date(leave.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </td>
                                        <td className="text-xs text-gray-600">
                                            {new Date(leave.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </td>
                                        <td className="text-xs font-bold text-gray-700">
                                            {getDuration(leave.start_date, leave.end_date)}
                                        </td>
                                        <td className="text-xs text-gray-500 max-w-[200px] truncate" title={leave.reason}>
                                            {leave.reason}
                                        </td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${STATUS_COLORS[leave.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {leave.status}
                                            </span>
                                            {leave.rejection_reason && (
                                                <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[150px]" title={leave.rejection_reason}>
                                                    {leave.rejection_reason}
                                                </p>
                                            )}
                                        </td>
                                        <td>
                                            {leave.status === 'PENDING' && (
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => handleApprove(leave.id)}
                                                        disabled={actionLoading === leave.id}
                                                        className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <Check size={12} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectingId(rejectingId === leave.id ? null : leave.id)}
                                                        disabled={actionLoading === leave.id}
                                                        className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <X size={12} /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                    {rejectingId === leave.id && (
                                        <tr>
                                            <td colSpan={8}>
                                                <div className="rejection-input-row">
                                                    <input
                                                        type="text"
                                                        placeholder="Rejection reason (min 10 chars)..."
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleReject(leave.id)}
                                                        disabled={rejectionReason.length < 10}
                                                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-red-600"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                                                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}

                {pagination && pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                            Page {pagination.current_page} of {pagination.total_pages}
                        </span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-200">
                                <ChevronLeft size={14} />
                            </button>
                            <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-200">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateLeaveRequestModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
        </div>
    );
};

export default LeaveRequests;
