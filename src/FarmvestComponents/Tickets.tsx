import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { RootState } from '../store';
import { fetchTickets, clearTicketMessages } from '../store/slices/farmvest/tickets';
import { farmvestService } from '../services/farmvest_api';
import { FarmvestTicket } from '../types/farmvest';
import { AlertCircle, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import CreateTicketModal from './CreateTicketModal';
import TicketDetailDrawer from './TicketDetailDrawer';
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
    const { tickets, counts, loading, error, pagination } = useAppSelector((state: RootState) => state.farmvestTickets);

    const [ticketType, setTicketType] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [farmId, setFarmId] = useState<number | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [farms, setFarms] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<FarmvestTicket | null>(null);

    useEffect(() => {
        farmvestService.getAllFarms({ size: 100 }).then(res => {
            if (res && Array.isArray(res.data)) setFarms(res.data);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        dispatch(fetchTickets({
            ticket_type: ticketType || undefined,
            status_filter: statusFilter || undefined,
            farm_id: farmId,
            page,
            size: 15,
        }));
    }, [dispatch, ticketType, statusFilter, farmId, page]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => dispatch(clearTicketMessages()), 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    const healthCounts = counts?.health_tickets || { total: 0, pending: 0, in_progress: 0, completed: 0 };
    const vaccCounts = counts?.vaccination_tickets || { total: 0, pending: 0, in_progress: 0, completed: 0 };
    const totalAll = healthCounts.total + vaccCounts.total;
    const totalPending = healthCounts.pending + vaccCounts.pending;
    const totalInProgress = healthCounts.in_progress + vaccCounts.in_progress;
    const totalCompleted = healthCounts.completed + vaccCounts.completed;

    const filteredTickets = searchQuery
        ? tickets.filter(t =>
            t.case_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.animal_display_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.animal_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : tickets;

    return (
        <div className="tickets-container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="text-amber-500" size={24} />
                        Ticket Management
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Track health, transfer, and vaccination tickets</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 bg-amber-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm"
                >
                    <Plus size={16} /> Create Ticket
                </button>
            </div>

            {/* Stats Cards */}
            <div className="tickets-stats-grid">
                <div className="ticket-stat-card">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{totalAll}</p>
                </div>
                <div className="ticket-stat-card">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">{totalPending}</p>
                </div>
                <div className="ticket-stat-card">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">In Progress</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{totalInProgress}</p>
                </div>
                <div className="ticket-stat-card">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-black text-green-600 mt-1">{totalCompleted}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="tickets-filter-bar">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-gray-400" />
                    <select
                        className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none"
                        value={ticketType}
                        onChange={(e) => { setTicketType(e.target.value); setPage(1); }}
                    >
                        <option value="">All Types</option>
                        <option value="HEALTH">Health</option>
                        <option value="TRANSFER">Transfer</option>
                        <option value="VACCINATION">Vaccination</option>
                    </select>
                </div>
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="APPROVED">Approved</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none"
                    value={farmId || ''}
                    onChange={(e) => { setFarmId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                >
                    <option value="">All Farms</option>
                    {farms.map(f => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
                </select>
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search case ID, animal tag..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-amber-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="tickets-table-container">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500 font-medium">Loading tickets...</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No tickets found</p>
                        <p className="text-xs mt-1">Try adjusting your filters or create a new ticket</p>
                    </div>
                ) : (
                    <table className="tickets-table">
                        <thead>
                            <tr>
                                <th>Case ID</th>
                                <th>Animal</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Created</th>
                                <th>Assigned To</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map(ticket => (
                                <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)}>
                                    <td className="font-bold text-gray-900">{ticket.case_id}</td>
                                    <td>
                                        <div className="font-medium text-gray-800">{ticket.animal_display_id}</div>
                                        <div className="text-[10px] text-gray-400">{ticket.animal_tag}</div>
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
                                        {ticket.assigned_staff_name || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                            Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} total)
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-200 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                disabled={page >= pagination.total_pages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-200 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateTicketModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
            <TicketDetailDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        </div>
    );
};

export default Tickets;
