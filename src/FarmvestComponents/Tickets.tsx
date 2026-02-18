import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store';
import { fetchTickets, fetchTicketStats, clearTicketMessages } from '../store/slices/farmvest/tickets';
import { farmvestService } from '../services/farmvest_api';
import { FarmvestTicket } from '../types/farmvest';
import { AlertCircle, Search, Filter, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import TicketDetailDrawer from './TicketDetailDrawer';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';
import CustomDropdown from '../components/common/CustomDropdown';
import AIEntry from './AIEntry';
import CreateTicketModal from './CreateTicketModal';
import { setSnackbar } from '../store/slices/uiSlice';
import './Tickets.css';

const TYPE_COLORS: Record<string, string> = {
    'HEALTH': 'bg-[#fff1f2] text-[#e11d48]',
    'TRANSFER': 'bg-[#eff6ff] text-[#2563eb]',
    'VACCINATION': 'bg-[#f0fdf4] text-[#16a34a]',
};

const STATUS_COLORS: Record<string, string> = {
    'PENDING': 'bg-[#fffbeb] text-[#d97706]',
    'IN_PROGRESS': 'bg-[#f0f9ff] text-[#0369a1]',
    'APPROVED': 'bg-[#f0fdf4] text-[#16a34a]',
    'RESOLVED': 'bg-[#f0fdf4] text-[#16a34a]',
    'REJECTED': 'bg-[#fef2f2] text-[#dc2626]',
};

const PRIORITY_COLORS: Record<string, string> = {
    'HIGH': 'bg-[#fffbeb] text-[#d97706]',
    'MEDIUM': 'bg-[#f8fafc] text-[#64748b]',
    'LOW': 'bg-[#f0fdf4] text-[#16a34a]',
    'CRITICAL': 'bg-[#fef2f2] text-[#dc2626]',
};

const Tickets: React.FC = () => {
    const dispatch = useAppDispatch();
    const { tickets, counts, stats, loading, error, pagination } = useAppSelector((state: RootState) => state.farmvestTickets);

    const [searchParams, setSearchParams] = useSearchParams();
    const activeView = searchParams.get('view') === 'AI_ENTRY' ? 'AI_ENTRY' : 'LIST';
    const [ticketType, setTicketType] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [farmId, setFarmId] = useState<number | undefined>(undefined);
    const [shedId, setShedId] = useState<number | undefined>(undefined);
    const [transferDirection, setTransferDirection] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [farms, setFarms] = useState<any[]>([]);
    const [sheds, setSheds] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<FarmvestTicket | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        farmvestService.getAllFarms({ size: 100 }).then(res => {
            const farmData = Array.isArray(res) ? res : (res?.data?.farms || res?.farms || res?.data || []);
            setFarms(farmData);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (farmId) {
            farmvestService.getShedList(farmId).then(res => {
                const fetchedSheds = Array.isArray(res) ? res : (res?.data || []);
                setSheds(fetchedSheds);
            }).catch(() => setSheds([]));
        } else {
            setSheds([]);
            setShedId(undefined);
        }
    }, [farmId]);

    useEffect(() => {
        if (activeView === 'LIST') {
            dispatch(fetchTickets({
                ticket_type: ticketType || undefined,
                status_filter: statusFilter || undefined,
                transfer_direction: transferDirection || undefined,
                farm_id: farmId,
                shed_id: shedId,
                page,
                size: 15,
            }));
        }
    }, [dispatch, ticketType, statusFilter, transferDirection, farmId, shedId, page, activeView]);

    useEffect(() => {
        if (activeView === 'LIST') {
            dispatch(fetchTicketStats({
                ticket_type: ticketType || undefined,
                transfer_direction: transferDirection || undefined,
                farm_id: farmId,
                shed_id: shedId,
            }));
        }
    }, [dispatch, ticketType, transferDirection, farmId, shedId, activeView]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => dispatch(clearTicketMessages()), 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    const activeCounts: any = stats || counts;

    const getSubCounts = (key: string) => {
        if (!activeCounts) return null;
        const val = activeCounts[key] ||
            activeCounts[key.toLowerCase()] ||
            activeCounts[key.replace('_', '')] ||
            activeCounts[key.replace('Tickets', '_tickets')] ||
            activeCounts[key.replace('_tickets', 'Tickets')];
        if (Array.isArray(val) && val.length > 0 && val[0].case_id) return null;
        return val;
    };

    const healthCounts = getSubCounts('health_tickets') || (activeCounts && !Array.isArray(activeCounts) ? activeCounts : null) || { total: 0, pending: 0, in_progress: 0, completed: 0 };
    const vaccCounts = getSubCounts('vaccination_tickets') || { total: 0, pending: 0, in_progress: 0, completed: 0 };
    const transferCounts = getSubCounts('transfer_tickets') || { total: 0, pending: 0, in_progress: 0, completed: 0 };

    const getCount = (obj: any, key: string) => {
        if (!obj) return 0;
        const normalizedKey = key.toLowerCase();
        return Number(
            obj[key] ??
            obj[normalizedKey] ??
            obj[key.replace('_', '')] ??
            obj[`${normalizedKey}_count`] ??
            obj[`${key}_count`] ??
            obj[`${normalizedKey}_tickets`] ??
            obj[`${key}_tickets`] ??
            obj[`${key}Tickets`] ??
            0
        );
    };

    let totalAll = pagination?.total_items || getCount(healthCounts, 'total') + getCount(vaccCounts, 'total') + getCount(transferCounts, 'total') || getCount(activeCounts, 'total') || getCount(activeCounts, 'total_tickets') || getCount(activeCounts, 'total_count') || tickets.length;

    const localPendingCount = tickets.filter(t => {
        const s = String(t.status || '').toUpperCase().trim();
        return s === 'PENDING' || s === '1';
    }).length;

    const localInProgressCount = tickets.filter(t => {
        const s = String(t.status || '').toUpperCase().trim();
        return s === 'IN_PROGRESS' || s === 'INPROGRESS' || s.includes('PROGRESS') || s === '2';
    }).length;

    const localCompletedCount = tickets.filter(t => {
        const s = String(t.status || '').toUpperCase().trim();
        return ['RESOLVED', 'COMPLETED', 'APPROVED', 'SUCCESS', '3'].includes(s);
    }).length;

    const totalPending = Math.max((getCount(healthCounts, 'pending') + getCount(vaccCounts, 'pending') + getCount(transferCounts, 'pending') || getCount(activeCounts, 'pending') || getCount(activeCounts, 'pending_count')), localPendingCount);
    const totalInProgress = Math.max((getCount(healthCounts, 'in_progress') + getCount(vaccCounts, 'in_progress') + getCount(transferCounts, 'in_progress') || getCount(activeCounts, 'in_progress') || getCount(activeCounts, 'in_progress_count')), localInProgressCount);
    const totalCompleted = Math.max(((getCount(healthCounts, 'completed') || getCount(healthCounts, 'resolved')) + (getCount(vaccCounts, 'completed') || getCount(vaccCounts, 'resolved')) + (getCount(transferCounts, 'completed') || getCount(transferCounts, 'resolved')) || getCount(activeCounts, 'completed') || getCount(activeCounts, 'resolved') || getCount(activeCounts, 'completed_count')), localCompletedCount);

    const filteredTickets = useMemo(() => {
        let result = tickets;
        if (searchQuery) {
            const lowerSearch = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.case_id?.toLowerCase().includes(lowerSearch) ||
                t.animal_display_id?.toLowerCase().includes(lowerSearch) ||
                t.animal_tag?.toLowerCase().includes(lowerSearch) ||
                String(t.farm_id || t.farm?.id || '').includes(lowerSearch) ||
                String(t.shed_id || t.shed?.id || t.source_shed_id || t.destination_shed_id || '').includes(lowerSearch)
            );
        }
        const isServerFiltered = tickets.every(t =>
            (!farmId || Number(t.farm_id) === farmId || Number(t.farm?.id) === farmId) &&
            (!shedId || Number(t.shed_id) === shedId || Number(t.shed?.id) === shedId)
        );
        if (!isServerFiltered && (farmId || shedId)) {
            if (farmId) result = result.filter(t => Number(t.farm_id) === farmId || Number(t.farm?.id) === farmId);
            if (shedId) result = result.filter(t => Number(t.shed_id) === shedId || Number(t.shed?.id) === shedId);
        }
        return result;
    }, [tickets, searchQuery, farmId, shedId]);

    const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);

    const totalPages = useMemo(() => {
        if (pagination?.total_pages) return pagination.total_pages;
        return Math.max(1, Math.ceil(totalAll / 15));
    }, [pagination?.total_pages, totalAll]);

    const handleAIEntrySubmit = async (data: any) => {
        try {
            await farmvestService.submitAIEntry(data);
            dispatch(setSnackbar({ message: 'AI Entry submitted successfully!', type: 'success' }));
            // stay on current page
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to submit AI entry';
            dispatch(setSnackbar({ message: errorMsg, type: 'error' }));
            throw err; // Let AIEntry handle loading state reset
        }
    };

    if (activeView === 'AI_ENTRY') {
        return (
            <div className="tickets-container">
                <div className="tickets-view-card ai-view">
                    <AIEntry
                        onBack={() => setSearchParams({})}
                        onSubmit={handleAIEntrySubmit}
                        isAuthenticated={isAuthenticated}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="tickets-container list-view-bg">
            <div className="tickets-view-card list-view">
                <header className="tickets-card-header">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-[#fff1e4] flex items-center justify-center text-[#ff9800]">
                            <AlertCircle size={28} />
                        </div>
                        <div>
                            <h2 className="text-[28px] font-black text-[#1e293b]">Ticket Management</h2>
                            <p className="text-[14px] text-gray-500 font-medium">Track health, transfer, and vaccination tickets</p>
                        </div>
                    </div>
                </header>

                <div className="tickets-card-content">
                    <div className="tickets-stats-grid">
                        <div className={`ticket-stat-box cursor-pointer ${statusFilter === '' ? 'active' : ''}`} onClick={() => { setStatusFilter(''); setPage(1); }}>
                            <span className="stat-label">TOTAL</span>
                            <span className="stat-value">{totalAll}</span>
                        </div>
                        <div className={`ticket-stat-box cursor-pointer ${statusFilter === 'PENDING' ? 'active' : ''}`} onClick={() => { setStatusFilter('PENDING'); setPage(1); }}>
                            <span className="stat-label">PENDING</span>
                            <span className="stat-value">{totalPending}</span>
                        </div>
                        <div className={`ticket-stat-box cursor-pointer ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`} onClick={() => { setStatusFilter('IN_PROGRESS'); setPage(1); }}>
                            <span className="stat-label">IN PROGRESS</span>
                            <span className="stat-value">{totalInProgress}</span>
                        </div>
                        <div className={`ticket-stat-box cursor-pointer ${statusFilter === 'RESOLVED' ? 'active' : ''}`} onClick={() => { setStatusFilter('RESOLVED'); setPage(1); }}>
                            <span className="stat-label">COMPLETED</span>
                            <span className="stat-value">{totalCompleted}</span>
                        </div>
                    </div>

                    <div className="tickets-filter-bar">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search case ID, animal tag..."
                                    className="tickets-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <select
                                className="tickets-select-filter"
                                value={ticketType}
                                onChange={(e) => { setTicketType(e.target.value); setPage(1); }}
                            >
                                <option value="">All Types</option>
                                <option value="HEALTH">Health</option>
                                <option value="VACCINATION">Vaccination</option>
                                <option value="TRANSFER">Transfer</option>
                            </select>

                            <select
                                className="tickets-select-filter"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="APPROVED">Approved</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>

                            <div className="md:w-56 tickets-farm-dropdown">
                                <CustomDropdown
                                    options={[
                                        { value: '', label: 'All Farms' },
                                        ...farms.map(f => ({ value: String(f.id || f.farm_id), label: f.farm_name }))
                                    ]}
                                    value={farmId ? String(farmId) : ''}
                                    onChange={(value) => { setFarmId(value ? Number(value) : undefined); setShedId(undefined); setPage(1); }}
                                    placeholder="All Farms"
                                />
                            </div>

                            <div className="md:w-48">
                                <CustomDropdown
                                    options={[
                                        { value: '', label: 'All Sheds' },
                                        ...sheds.map(s => ({ value: String(s.id || s.shed_id), label: s.shed_name || s.name }))
                                    ]}
                                    value={shedId ? String(shedId) : ''}
                                    onChange={(value) => { setShedId(value ? Number(value) : undefined); setPage(1); }}
                                    placeholder="All Sheds"
                                    disabled={!farmId}
                                />
                            </div>
                        </div>
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

                    <div className="tickets-table-container">
                        <div className="table-scroll-wrapper">
                            <table className="tickets-table">
                                <thead className="sticky top-0 z-10 bg-[#f8fafc]">
                                    <tr>
                                        <th className="w-12 text-center">S.No</th>
                                        <th className="w-28 text-center">Case ID</th>
                                        <th>Animal</th>
                                        <th className="w-24 text-center">Farm ID</th>
                                        <th className="w-24 text-center">Shed ID</th>
                                        <th className="w-24">Type</th>
                                        <th className="w-32">Status</th>
                                        <th className="w-20">Priority</th>
                                        <th className="w-40 text-center">Created</th>
                                        <th>Assigned To</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <TableSkeleton cols={10} rows={10} />
                                    ) : filteredTickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-12 text-center text-gray-400">
                                                <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
                                                <p className="font-bold">No tickets found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTickets.map((ticket: FarmvestTicket, index: number) => {
                                            const sNo = ((pagination?.current_page || 1) - 1) * (pagination?.items_per_page || 15) + index + 1;
                                            return (
                                                <tr key={ticket.id || (ticket as any).ticket_id || `ticket-${index}`} onClick={() => setSelectedTicket(ticket)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <td className="text-center text-gray-400 font-bold text-[13px]">{sNo}</td>
                                                    <td className="font-bold text-[#1e293b] text-[15px]">{ticket.case_id}</td>
                                                    <td>
                                                        <div className="font-bold text-[#1e293b] text-[15px]">{ticket.animal_display_id || ticket.animal_id}</div>
                                                        <div className="text-[11px] text-gray-400 font-medium tracking-tight uppercase">{ticket.animal_tag}</div>
                                                    </td>
                                                    <td className="text-center font-bold text-gray-400">-</td>
                                                    <td className="text-center font-bold text-gray-400">-</td>
                                                    <td><span className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wider ${TYPE_COLORS[ticket.ticket_type] || 'bg-gray-100 text-gray-600'}`}>{ticket.ticket_type}</span></td>
                                                    <td><span className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wider ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-600'}`}>{ticket.status?.replace('_', ' ')}</span></td>
                                                    <td><span className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wider ${PRIORITY_COLORS[ticket.priority] || 'bg-gray-100 text-gray-600'}`}>{ticket.priority}</span></td>
                                                    <td className="text-[14px] text-[#2d3748] font-bold">{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'}</td>
                                                    <td className="font-black text-[#1e293b] text-[13px] uppercase">
                                                        {ticket.assigned_staff_name || 'DOCTOR'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="tickets-pagination-wrapper">
                            <Pagination currentPage={page} totalPages={totalPages} onPageChange={(newPage) => setPage(newPage)} />
                        </div>
                    )}
                </div>
            </div>

            <TicketDetailDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
            <CreateTicketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
};

export default Tickets;
