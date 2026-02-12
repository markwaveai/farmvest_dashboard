import React, { useState, useEffect, useMemo } from 'react';
import { farmvestService } from '../services/farmvest_api';
import { MilkEntry, MilkTiming } from '../types/farmvest';
import { Milk, Plus, Filter, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import CreateMilkEntryModal from './CreateMilkEntryModal';
import './MilkProduction.css';

const MilkProduction: React.FC = () => {
    const [entries, setEntries] = useState<MilkEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [timingFilter, setTimingFilter] = useState<string>('');
    const [reportDate, setReportDate] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchEntries = async () => {
        setLoading(true);
        setError(null);
        try {
            if (reportDate) {
                const res = await farmvestService.getMilkReport({
                    report_date: reportDate,
                    timing: timingFilter || undefined,
                    page,
                    size: 15,
                });
                setEntries(res.data || []);
                setTotalPages(res.pagination?.total_pages || 1);
                setTotalItems(res.count || res.pagination?.total_items || 0);
            } else {
                const res = await farmvestService.getMilkEntries({ page, size: 15 });
                setEntries(res.data || []);
                setTotalPages(res.pagination?.total_pages || 1);
                setTotalItems(res.count || res.pagination?.total_items || 0);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch milk entries');
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [page, reportDate, timingFilter]);

    const stats = useMemo(() => {
        const total = entries.reduce((sum, e) => sum + (e.quantity || 0), 0);
        const morning = entries.filter(e => e.timing === 'MORNING').reduce((sum, e) => sum + (e.quantity || 0), 0);
        const evening = entries.filter(e => e.timing === 'EVENING').reduce((sum, e) => sum + (e.quantity || 0), 0);
        return { total: total.toFixed(1), morning: morning.toFixed(1), evening: evening.toFixed(1), count: entries.length };
    }, [entries]);

    const filteredEntries = timingFilter && !reportDate
        ? entries.filter(e => e.timing === timingFilter)
        : entries;

    return (
        <div className="milk-container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Milk className="text-amber-500" size={24} />
                        Milk Production
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Track and manage daily milk production records</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 bg-amber-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm"
                >
                    <Plus size={16} /> Add Entry
                </button>
            </div>

            {/* Stats */}
            <div className="milk-stats-grid">
                <div className="milk-stat-card">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Production</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{stats.total} L</p>
                </div>
                <div className="milk-stat-card">
                    <p className="text-xs font-bold text-amber-500 uppercase">Morning</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">{stats.morning} L</p>
                </div>
                <div className="milk-stat-card">
                    <p className="text-xs font-bold text-indigo-500 uppercase">Evening</p>
                    <p className="text-2xl font-black text-indigo-600 mt-1">{stats.evening} L</p>
                </div>
                <div className="milk-stat-card">
                    <p className="text-xs font-bold text-gray-400 uppercase">Entries</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{totalItems}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="milk-filter-bar">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-gray-400" />
                    <input
                        type="date"
                        className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none"
                        value={reportDate}
                        onChange={(e) => { setReportDate(e.target.value); setPage(1); }}
                    />
                </div>
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none"
                    value={timingFilter}
                    onChange={(e) => { setTimingFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Timings</option>
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                </select>
                {(reportDate || timingFilter) && (
                    <button
                        onClick={() => { setReportDate(''); setTimingFilter(''); setPage(1); }}
                        className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            {/* Table */}
            <div className="milk-table-container">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500 font-medium">Loading milk entries...</p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <BarChart3 size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No milk entries found</p>
                        <p className="text-xs mt-1">Add a new entry to start tracking production</p>
                    </div>
                ) : (
                    <table className="milk-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date Range</th>
                                <th>Timing</th>
                                <th>Quantity</th>
                                <th>Animal ID</th>
                                <th>Farm / Shed</th>
                                <th>Entry Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map(entry => (
                                <tr key={entry.id}>
                                    <td className="font-bold text-gray-800">#{entry.id}</td>
                                    <td className="text-xs text-gray-600">
                                        {entry.start_date ? new Date(entry.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                                        {' - '}
                                        {entry.end_date ? new Date(entry.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                                    </td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                            entry.timing === 'MORNING'
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-indigo-50 text-indigo-700'
                                        }`}>
                                            {entry.timing}
                                        </span>
                                    </td>
                                    <td className="font-bold text-gray-900">{entry.quantity} L</td>
                                    <td className="text-xs text-gray-500">{entry.animal_id || 'Shed-level'}</td>
                                    <td className="text-xs text-gray-500">
                                        Farm {entry.farm_id} / Shed {entry.shed_id}
                                    </td>
                                    <td className="text-xs text-gray-400">
                                        {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Page {page} of {totalPages} ({totalItems} total)</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-200">
                                <ChevronLeft size={14} />
                            </button>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-200">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateMilkEntryModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => { setShowCreateModal(false); fetchEntries(); }}
            />
        </div>
    );
};

export default MilkProduction;
