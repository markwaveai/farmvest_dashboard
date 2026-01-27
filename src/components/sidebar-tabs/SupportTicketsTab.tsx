import React, { useState } from 'react';
import {
    Search,
    Filter,
    MoreHorizontal,
    Ticket,
    Clock,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    Mail
} from 'lucide-react';

interface SupportTicket {
    id: string;
    requestedBy: {
        name: string;
        email: string;
    };
    subject: string;
    createDate: string;
    status: 'Solved' | 'Pending';
}

const mockTickets: SupportTicket[] = [
    { id: '#323534', requestedBy: { name: 'Lindsey Curtis', email: 'demoemail@gmail.com' }, subject: 'Issue with Dashboard Login Access', createDate: '12 Feb, 2027', status: 'Solved' },
    { id: '#323535', requestedBy: { name: 'Kaiya George', email: 'demoemail@gmail.com' }, subject: 'Billing Information Not Updating Properly', createDate: '13 Mar, 2027', status: 'Pending' },
    { id: '#323536', requestedBy: { name: 'Zain Geidt', email: 'demoemail@gmail.com' }, subject: 'Bug Found in Dark Mode Layout', createDate: '19 Mar, 2027', status: 'Pending' },
    { id: '#323537', requestedBy: { name: 'Abram Schleifer', email: 'demoemail@gmail.com' }, subject: 'Request to Add New Integration Feature', createDate: '25 Apr, 2027', status: 'Solved' },
    { id: '#323538', requestedBy: { name: 'Mia Chen', email: 'mia.chen@email.com' }, subject: 'Unable to Reset Password', createDate: '28 Apr, 2027', status: 'Pending' },
    { id: '#323539', requestedBy: { name: 'John Doe', email: 'john.doe@email.com' }, subject: 'Feature Request: Dark Mode', createDate: '30 Apr, 2027', status: 'Solved' },
    { id: '#323540', requestedBy: { name: 'Jane Smith', email: 'jane.smith@email.com' }, subject: 'Error 500 on Dashboard', createDate: '01 May, 2027', status: 'Pending' },
    { id: '#323541', requestedBy: { name: 'Carlos Ruiz', email: 'carlos.ruiz@email.com' }, subject: 'Cannot Download Invoice', createDate: '02 May, 2027', status: 'Solved' },
    { id: '#323542', requestedBy: { name: 'Emily Clark', email: 'emily.clark@email.com' }, subject: 'UI Bug in Mobile View', createDate: '03 May, 2027', status: 'Pending' },
];

const SupportTicketsTab: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
    const [filter, setFilter] = useState<'All' | 'Solved' | 'Pending'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdownId && !(event.target as Element).closest('.dropdown-container')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdownId]);

    const handleMarkAsSolved = (id: string) => {
        setTickets(prev => prev.map(t =>
            t.id === id ? { ...t, status: 'Solved' } : t
        ));
        setActiveDropdownId(null);
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesFilter = filter === 'All' || ticket.status === filter;
        const matchesSearch = ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.requestedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTickets(filteredTickets.map(t => t.id));
        } else {
            setSelectedTickets([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedTickets(prev =>
            prev.includes(id) ? prev.filter(ticketId => ticketId !== id) : [...prev, id]
        );
    };

    return (
        <div className="p-6 bg-[#F8F9FA] min-h-full font-sans">
            {/* Header & Breadcrumbs */}


            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Ticket size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[#1E293B]">5,347</h3>
                        <p className="text-sm text-[#64748B]">Total tickets</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[#1E293B]">1,230</h3>
                        <p className="text-sm text-[#64748B]">Pending tickets</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0] flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[#1E293B]">4,117</h3>
                        <p className="text-sm text-[#64748B]">Solved tickets</p>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="p-6 border-b border-[#E2E8F0]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-[#1E293B]">Support Tickets</h2>
                            <p className="text-sm text-[#64748B]">Your most recent support tickets list</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Filter Tabs */}
                            <div className="flex bg-[#F1F5F9] p-1 rounded-xl">
                                {(['All', 'Solved', 'Pending'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setFilter(tab)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === tab
                                            ? 'bg-white text-[#1E293B] shadow-sm'
                                            : 'text-[#64748B] hover:text-[#1E293B]'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 md:w-64"
                                />
                            </div>

                            {/* Filter Button */}
                            <button className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#1E293B] hover:bg-gray-50 transition-colors">
                                <Filter size={18} />
                                Filter
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F8F9FA]">
                                <th className="p-4 border-b border-[#E2E8F0]">
                                    <input
                                        type="checkbox"
                                        className="rounded border-[#E2E8F0]"
                                        checked={selectedTickets.length > 0 && selectedTickets.length === filteredTickets.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="p-4 border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">Ticket ID</th>
                                <th className="p-4 border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">Requested By</th>
                                <th className="p-4 border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">Subject</th>
                                <th className="p-4 border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">Create Date</th>
                                <th className="p-4 border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                                <th className="p-4 border-b border-[#E2E8F0]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map((ticket, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 border-b border-[#F1F5F9]">
                                        <input
                                            type="checkbox"
                                            className="rounded border-[#E2E8F0]"
                                            checked={selectedTickets.includes(ticket.id)}
                                            onChange={() => handleSelectOne(ticket.id)}
                                        />
                                    </td>
                                    <td className="p-4 border-b border-[#F1F5F9] text-sm font-semibold text-[#1E293B]">{ticket.id}</td>
                                    <td className="p-4 border-b border-[#F1F5F9]">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#1E293B]">{ticket.requestedBy.name}</span>
                                            <span className="text-xs text-[#64748B]">{ticket.requestedBy.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 border-b border-[#F1F5F9] text-sm text-[#475569]">{ticket.subject}</td>
                                    <td className="p-4 border-b border-[#F1F5F9] text-sm text-[#475569]">{ticket.createDate}</td>
                                    <td className="p-4 border-b border-[#F1F5F9]">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${ticket.status === 'Solved'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="p-4 border-b border-[#F1F5F9] text-right relative dropdown-container">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdownId(activeDropdownId === ticket.id ? null : ticket.id);
                                            }}
                                            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors p-1 rounded-full hover:bg-gray-100"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>

                                        {activeDropdownId === ticket.id && (
                                            <div className="absolute right-8 top-8 z-10 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsSolved(ticket.id);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-[#1E293B] hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <CheckCircle2 size={14} className="text-green-600" />
                                                    Mark as Solved
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketsTab;
