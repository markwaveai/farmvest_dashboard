import React, { useEffect, useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store';
import { fetchTickets, fetchTicketStats, clearTicketMessages } from '../store/slices/farmvest/tickets';
import { farmvestService } from '../services/farmvest_api';
import { FarmvestTicket } from '../types/farmvest';
import { AlertCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import TicketDetailDrawer from './TicketDetailDrawer';
import Pagination from '../components/common/Pagination';
import TableSkeleton from '../components/common/TableSkeleton';
import CustomDropdown from '../components/common/CustomDropdown';
import './Tickets.css';

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    APPROVED: 'bg-green-50 text-green-700',
    RESOLVED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
};

const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-50 text-orange-700',
    MEDIUM: 'bg-blue-50 text-blue-700',
    LOW: 'bg-gray-100 text-gray-600',
};

const TYPE_COLORS: Record<string, string> = {
    HEALTH: 'bg-rose-50 text-rose-700',
    TRANSFER: 'bg-indigo-50 text-indigo-700',
    VACCINATION: 'bg-teal-50 text-teal-700',
};

const Tickets: React.FC = () => {
    const dispatch = useAppDispatch();
    const { tickets, counts, stats, loading, error, pagination } = useAppSelector((state: RootState) => state.farmvestTickets);

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

    useEffect(() => {
        farmvestService.getAllFarms({ size: 100 }).then(res => {
            // Robustly handle various farm data structures
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

    // Fetch List Data
    useEffect(() => {
        dispatch(fetchTickets({
            ticket_type: ticketType || undefined,
            status_filter: statusFilter || undefined,
            transfer_direction: transferDirection || undefined,
            farm_id: farmId,
            shed_id: shedId,
            page,
            size: 15,
        }));
    }, [dispatch, ticketType, statusFilter, transferDirection, farmId, shedId, page]);

    // Fetch Stats Data (Independent of Status Filter & Page)
    useEffect(() => {
        dispatch(fetchTicketStats({
            ticket_type: ticketType || undefined,
            transfer_direction: transferDirection || undefined,
            farm_id: farmId,
            shed_id: shedId,
        }));
    }, [dispatch, ticketType, transferDirection, farmId, shedId]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => dispatch(clearTicketMessages()), 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    const activeCounts: any = stats || counts;

    // Hyper-robust helper to find counts in various structures
    const getSubCounts = (key: string) => {
        if (!activeCounts) return null;
        const val = activeCounts[key] ||
            activeCounts[key.toLowerCase()] ||
            activeCounts[key.replace('_', '')] ||
            activeCounts[key.replace('Tickets', '_tickets')] ||
            activeCounts[key.replace('_tickets', 'Tickets')];

        // Ensure we don't pick up the ARRAY of tickets as counts
        // If it's an array and doesn't have a 'total' property that is NOT its length, it's probably the list
        if (Array.isArray(val) && val.length > 0 && val[0].case_id) return null;

        return val;
    };

    const healthCounts = getSubCounts('health_tickets') || (activeCounts && !Array.isArray(activeCounts) ? activeCounts : null) || { total: 0, pending: 0, in_progress: 0, completed: 0 };
    const vaccCounts = getSubCounts('vaccination_tickets') || { total: 0, pending: 0, in_progress: 0, completed: 0 };
    const transferCounts = getSubCounts('transfer_tickets') || { total: 0, pending: 0, in_progress: 0, completed: 0 };

    // Helper to safely sum counts which might be camelCase, snake_case, or suffix with _count
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

    // Calculate Totals safely using getCount helper
    // If ticketType is selected, we might want to only show those, but usually summary shows ALL
    let totalAll = getCount(healthCounts, 'total') + getCount(vaccCounts, 'total') + getCount(transferCounts, 'total');

    // Fallback for totalAll: If 0, try to use pagination total or root total from activeCounts
    if (totalAll === 0) {
        totalAll = pagination?.total_items ||
            getCount(activeCounts, 'total') ||
            getCount(activeCounts, 'total_tickets') ||
            getCount(activeCounts, 'total_count') ||
            tickets.length; // FINAL FALLBACK: If we see data in table, total must be at least that
    }

    // Local fallbacks from the visible tickets array (useful if server stats are broken/missing)
    // Use case-insensitive matching and support numeric statuses for maximum robustness
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

    const totalPending = Math.max(
        (getCount(healthCounts, 'pending') +
            getCount(vaccCounts, 'pending') +
            getCount(transferCounts, 'pending') ||
            getCount(activeCounts, 'pending') ||
            getCount(activeCounts, 'pending_count')),
        localPendingCount
    );

    const totalInProgress = Math.max(
        (getCount(healthCounts, 'in_progress') +
            getCount(vaccCounts, 'in_progress') +
            getCount(transferCounts, 'in_progress') ||
            getCount(activeCounts, 'in_progress') ||
            getCount(activeCounts, 'in_progress_count')),
        localInProgressCount
    );

    const totalCompleted = Math.max(
        ((getCount(healthCounts, 'completed') || getCount(healthCounts, 'resolved')) +
            (getCount(vaccCounts, 'completed') || getCount(vaccCounts, 'resolved')) +
            (getCount(transferCounts, 'completed') || getCount(transferCounts, 'resolved')) ||
            getCount(activeCounts, 'completed') ||
            getCount(activeCounts, 'resolved') ||
            getCount(activeCounts, 'completed_count')),
        localCompletedCount
    );



    const filteredTickets = useMemo(() => {
        let result = tickets;

        // Search Filter (Always apply locally)
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

        // ONLY apply local Farm/Shed fallback if tickets doesn't seem to be server-filtered correctly
        // Or if the user hasn't selected anything (to avoid issues)
        // If we have filters but the count is high, maybe the server ignored it
        const isServerFiltered = tickets.every(t =>
            (!farmId || Number(t.farm_id) === farmId || Number(t.farm?.id) === farmId) &&
            (!shedId || Number(t.shed_id) === shedId || Number(t.shed?.id) === shedId)
        );

        if (!isServerFiltered && (farmId || shedId)) {
            if (farmId) {
                result = result.filter(t =>
                    Number(t.farm_id) === farmId ||
                    Number(t.farm?.id) === farmId
                );
            }

            if (shedId) {
                result = result.filter(t =>
                    Number(t.shed_id) === shedId ||
                    Number(t.shed?.id) === shedId
                );
            }
        }

        return result;
    }, [tickets, searchQuery, farmId, shedId]);

    return (
        <div className="tickets-container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="text-amber-500" size={24} />
                        Ticket Management
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Track health, transfer, and vaccination tickets</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="tickets-stats-grid">
                <div
                    className={`ticket-stat-box cursor-pointer ${statusFilter === '' ? 'active ring-2 ring-gray-100 shadow-sm' : ''}`}
                    onClick={() => { setStatusFilter(''); setPage(1); }}
                >
                    <span className="stat-label">Total</span>
                    <span className="stat-value">{totalAll}</span>
                </div>
                <div
                    className={`ticket-stat-box cursor-pointer ${statusFilter === 'PENDING' ? 'active ring-2 ring-amber-50 shadow-sm' : ''}`}
                    onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
                >
                    <span className="stat-label text-amber-500">Pending</span>
                    <span className="stat-value text-amber-600">{totalPending}</span>
                </div>
                <div
                    className={`ticket-stat-box cursor-pointer ${statusFilter === 'IN_PROGRESS' ? 'active ring-2 ring-blue-50 shadow-sm' : ''}`}
                    onClick={() => { setStatusFilter('IN_PROGRESS'); setPage(1); }}
                >
                    <span className="stat-label text-blue-500">In Progress</span>
                    <span className="stat-value text-blue-600">{totalInProgress}</span>
                </div>
                <div
                    className={`ticket-stat-box cursor-pointer ${statusFilter === 'RESOLVED' ? 'active ring-2 ring-green-50 shadow-sm' : ''}`}
                    onClick={() => { setStatusFilter('RESOLVED'); setPage(1); }}
                >
                    <span className="stat-label text-green-500">Completed</span>
                    <span className="stat-value text-green-600">{totalCompleted}</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="tickets-filter-bar">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search case ID, animal tag..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-amber-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-1.5 outline-none appearance-none"
                    value={ticketType}
                    onChange={(e) => {
                        setTicketType(e.target.value);
                        setTransferDirection('');
                        setPage(1);
                    }}
                >
                    <option value="">All Types</option>
                    <option value="HEALTH">Health</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="VACCINATION">Vaccination</option>
                </select>
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-1.5 outline-none appearance-none"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="APPROVED">Approved</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
                <div className="flex items-center gap-2 px-2 py-1 bg-gray-50/50 rounded-xl border border-gray-100">
                    <CustomDropdown
                        options={[
                            { value: '', label: 'All Farms' },
                            ...farms.map(f => {
                                const id = f.id || f.farm_id;
                                return { value: String(id), label: f.farm_name };
                            })
                        ]}
                        value={farmId ? String(farmId) : ''}
                        onChange={(value) => {
                            setFarmId(value ? Number(value) : undefined);
                            setShedId(undefined);
                            setPage(1);
                        }}
                        placeholder="All Farms"
                        className="min-w-[110px] tickets-farm-dropdown"
                        hideIcon={true}
                    />
                </div>
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-1.5 outline-none disabled:opacity-50 appearance-none"
                    value={shedId || ''}
                    disabled={!farmId}
                    onChange={(e) => { setShedId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                >
                    <option value="">All Sheds</option>
                    {sheds.map(s => <option key={s.id || s.shed_id} value={s.id || s.shed_id}>{s.shed_name || s.name}</option>)}
                </select>
                {ticketType === 'TRANSFER' && (
                    <select
                        className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-1.5 outline-none appearance-none"
                        value={transferDirection}
                        onChange={(e) => { setTransferDirection(e.target.value); setPage(1); }}
                    >
                        <option value="">Both Directions</option>
                        <option value="IN">Transfer IN</option>
                        <option value="OUT">Transfer OUT</option>
                    </select>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="tickets-table-container">
                <div className="table-scroll-wrapper">
                    <table className="tickets-table">
                        <thead className="sticky top-0 z-10 bg-[#f8fafc]">
                            <tr>
                                <th className="w-16 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">S.No</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Case ID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Animal</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Farm ID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Shed ID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
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
                                        <p className="text-xs mt-1">Try adjusting your filters or create a new ticket</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket: FarmvestTicket, index: number) => {
                                    // Calculate S.No based on pagination
                                    const sNo = ((pagination?.current_page || 1) - 1) * (pagination?.items_per_page || 15) + index + 1;
                                    return (
                                        <tr
                                            key={ticket.id || (ticket as any).ticket_id || `ticket-${index}`}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="text-gray-500 font-medium text-xs">{sNo}</td>
                                            <td className="font-bold text-gray-900">{ticket.case_id}</td>
                                            <td>
                                                <div className="font-medium text-gray-800">{ticket.animal_display_id}</div>
                                                <div className="text-[10px] text-gray-400">{ticket.animal_tag}</div>
                                            </td>
                                            <td className="text-xs">
                                                {ticket.farm_id || ticket.farm?.id ? (
                                                    <>
                                                        <div className="font-bold text-gray-700">
                                                            {ticket.farm_id || ticket.farm?.id}
                                                        </div>
                                                        {(ticket.farm_name || ticket.farm?.farm_name) && (
                                                            <div className="text-[10px] text-gray-400 font-medium">
                                                                {ticket.farm_name || ticket.farm?.farm_name}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-center font-bold text-gray-400">-</div>
                                                )}
                                            </td>
                                            <td className="text-xs">
                                                {ticket.ticket_type === 'TRANSFER' ? (
                                                    <div className="flex flex-col gap-1">
                                                        {ticket.source_shed_id && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] bg-red-50 text-red-500 px-1 rounded font-bold">SRC</span>
                                                                <span className="font-bold text-gray-700">{ticket.source_shed_id}</span>
                                                            </div>
                                                        )}
                                                        {ticket.destination_shed_id && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] bg-green-50 text-green-500 px-1 rounded font-bold">DST</span>
                                                                <span className="font-bold text-gray-700">{ticket.destination_shed_id}</span>
                                                            </div>
                                                        )}
                                                        {!ticket.source_shed_id && !ticket.destination_shed_id && (
                                                            ticket.shed_id || ticket.shed?.id ? (
                                                                <span className="font-bold text-gray-700">{ticket.shed_id || ticket.shed?.id}</span>
                                                            ) : (
                                                                <div className="text-center font-bold text-gray-400">-</div>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    ticket.shed_id || ticket.shed?.id ? (
                                                        <>
                                                            <div className="font-bold text-gray-700">
                                                                {ticket.shed_id || ticket.shed?.id}
                                                            </div>
                                                            {(ticket.shed_name || ticket.shed?.shed_name) && (
                                                                <div className="text-[10px] text-gray-400 font-medium">
                                                                    {ticket.shed_name || ticket.shed?.shed_name}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="text-center font-bold text-gray-400">-</div>
                                                    )
                                                )}
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${TYPE_COLORS[ticket.ticket_type] || 'bg-gray-100 text-gray-600'}`}>
                                                    {ticket.ticket_type}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {ticket.status?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${PRIORITY_COLORS[ticket.priority] || 'bg-gray-100 text-gray-600'}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="text-xs text-gray-500">
                                                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                                            </td>
                                            <td className="text-xs text-gray-600 font-medium">
                                                {ticket.assigned_staff_name ? (
                                                    ticket.assigned_staff_name
                                                ) : (
                                                    <div className="text-center font-bold text-gray-400">-</div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination && pagination.total_pages > 1 && (
                <div className="flex-none mt-2 px-4 pb-2 flex justify-end">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.total_pages}
                        onPageChange={(newPage) => setPage(newPage)}
                    />
                </div>
            )}



            <TicketDetailDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        </div>
    );
};

export default Tickets;
