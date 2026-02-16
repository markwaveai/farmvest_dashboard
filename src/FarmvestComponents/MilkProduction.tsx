import React, { useState, useEffect, useMemo } from 'react';
import { farmvestService } from '../services/farmvest_api';
import { MilkEntry, MilkTiming } from '../types/farmvest';
import { Milk, Filter, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
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

    // Filter States
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');

    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarm, setSelectedFarm] = useState<string>('');

    const [sheds, setSheds] = useState<any[]>([]);
    const [selectedShed, setSelectedShed] = useState<string>('');

    // Fetch Locations (Reused logic from Farms.tsx)
    useEffect(() => {
        const loadLocations = async () => {
            try {
                const response = await farmvestService.getLocations();
                let locs: any[] = [];
                if (response && response.data && Array.isArray(response.data.locations)) locs = response.data.locations;
                else if (response && Array.isArray(response.locations)) locs = response.locations;
                else if (Array.isArray(response)) locs = response;

                if (locs.length > 0) setLocations(locs);
            } catch (err) {
                console.error('Failed to load locations', err);
            }
        };
        loadLocations();
    }, []);

    // Fetch Farms when Location changes
    useEffect(() => {
        if (!selectedLocation || selectedLocation === 'ALL') {
            setFarms([]);
            setSelectedFarm('');
            return;
        }
        const loadFarms = async () => {
            try {
                // API expects location NAME
                const res = await farmvestService.getAllFarms({ location: selectedLocation, size: 100 });
                let farmList = [];
                if (res && Array.isArray(res.farms)) farmList = res.farms;
                else if (res && res.data && Array.isArray(res.data)) farmList = res.data;
                else if (Array.isArray(res)) farmList = res;

                setFarms(farmList);
                setSelectedFarm(''); // Reset farm when location changes
            } catch (err) {
                console.error('Failed to load farms', err);
                setFarms([]);
            }
        };
        loadFarms();
    }, [selectedLocation]);

    // Fetch Sheds when Farm changes
    useEffect(() => {
        if (!selectedFarm) {
            setSheds([]);
            setSelectedShed('');
            return;
        }
        const loadSheds = async () => {
            try {
                const res = await farmvestService.getShedList(Number(selectedFarm));
                let shedList = [];
                if (res && Array.isArray(res.data)) shedList = res.data;
                else if (Array.isArray(res)) shedList = res;

                setSheds(shedList);
                setSelectedShed(''); // Reset shed when farm changes
            } catch (err) {
                console.error('Failed to load sheds', err);
                setSheds([]);
            }
        };
        loadSheds();
    }, [selectedFarm]);

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
                    farm_id: selectedFarm || undefined,
                    shed_id: selectedShed || undefined
                });
                setEntries(res.data || []);
                setTotalPages(res.pagination?.total_pages || 1);
                setTotalItems(res.count || res.pagination?.total_items || 0);
            } else {
                const res = await farmvestService.getMilkEntries({
                    page,
                    size: 15,
                    farm_id: selectedFarm || undefined,
                    shed_id: selectedShed || undefined
                });
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
    }, [page, reportDate, timingFilter, selectedShed, selectedFarm]); // Trigger on filter changes

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
            <div className="milk-filter-bar flex flex-wrap gap-2">
                {/* Location Dropdown */}
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none"
                    value={selectedLocation}
                    onChange={(e) => { setSelectedLocation(e.target.value); setPage(1); }}
                >
                    <option value="">All Locations</option>
                    {locations.map((loc: any, idx) => {
                        const label = loc.name || loc.location || loc;
                        const value = String(label).toUpperCase(); // API expects NAME
                        return <option key={idx} value={value}>{label}</option>
                    })}
                </select>

                {/* Farm Dropdown */}
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none disabled:opacity-50"
                    value={selectedFarm}
                    onChange={(e) => { setSelectedFarm(e.target.value); setPage(1); }}
                    disabled={!selectedLocation || farms.length === 0}
                >
                    <option value="">All Farms</option>
                    {farms.map((farm: any) => (
                        <option key={farm.id || farm.farm_id} value={farm.id || farm.farm_id}>
                            {farm.farm_name || farm.name}
                        </option>
                    ))}
                </select>

                {/* Shed Dropdown */}
                <select
                    className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none disabled:opacity-50"
                    value={selectedShed}
                    onChange={(e) => { setSelectedShed(e.target.value); setPage(1); }}
                    disabled={!selectedFarm || sheds.length === 0}
                >
                    <option value="">All Sheds</option>
                    {sheds.map((shed: any) => (
                        <option key={shed.shed_id || shed.id} value={shed.shed_id || shed.id}>
                            {shed.shed_id} {shed.shed_name ? `- ${shed.shed_name}` : ''}
                        </option>
                    ))}
                </select>

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
                {(reportDate || timingFilter || selectedLocation || selectedFarm || selectedShed) && (
                    <button
                        onClick={() => {
                            setReportDate('');
                            setTimingFilter('');
                            setSelectedLocation('');
                            setSelectedFarm('');
                            setSelectedShed('');
                            setPage(1);
                        }}
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
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${entry.timing === 'MORNING'
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


        </div>
    );
};

export default MilkProduction;
