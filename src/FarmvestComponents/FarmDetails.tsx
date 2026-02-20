import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { farmvestService } from '../services/farmvest_api';
import './FarmDetails.css';
import { MapPin, ArrowLeft, Users, Stethoscope, UserCheck, Shield } from 'lucide-react';

const FarmDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const initialFarm = location.state?.farm;

    const [farmName] = useState(initialFarm?.farm_name || 'Loading Farm...');
    const [farmLocation] = useState(initialFarm?.location || '');
    const [sheds, setSheds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [staff, setStaff] = useState<{ supervisors: any[]; doctors: any[]; assistant_doctors: any[] } | null>(null);

    useEffect(() => {
        fetchSheds();
        fetchStaff();
    }, [id]);

    const fetchStaff = async () => {
        if (!id) return;
        try {
            const res = await farmvestService.getFarmStaff(parseInt(id));
            if (res && res.data) {
                setStaff(res.data);
            }
        } catch {
            // Staff endpoint might fail
        }
    };

    const fetchSheds = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await farmvestService.getShedList(parseInt(id));
            let shedsList: any[] = [];
            if (Array.isArray(data)) {
                shedsList = data;
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.data)) {
                    shedsList = data.data;
                } else if (Object.keys(data).length > 0) {
                    shedsList = Object.values(data);
                }
            }
            setSheds(shedsList);
        } catch (err: any) {
            if (err.response && err.response.status === 404) {
                setSheds([]);
            } else {
                setError(err.message || 'Failed to fetch shed details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShedClick = (shed: any) => {
        navigate('/farmvest/unallocated-animals', {
            state: {
                farmId: id,
                shedId: shed.id || shed.shed_id,
                fromShedView: true
            }
        });
    };

    const helperJoinNames = (staffList: any[]) => {
        if (!staffList || staffList.length === 0) return '-';
        return staffList.map(s => s.name).join(', ');
    };

    return (
        <div className="farm-details-container animate-fadeIn">
            {/* 1. Header Section */}
            <div className="farm-details-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mb-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="back-button shrink-0" onClick={() => navigate(-1)}>
                        <ArrowLeft size={14} /> <span className="hidden xs:inline">Back to Farms</span>
                    </button>
                    <div className="farm-title-section min-w-0">
                        <h1 className="truncate font-bold">{farmName}</h1>
                        {farmLocation && (
                            <div className="farm-location flex items-center gap-1 text-gray-500 text-sm">
                                <MapPin size={12} />
                                <span className="truncate">{farmLocation}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="farm-header-right-actions w-full sm:w-auto">
                    <div className="manager-details-section sm:border-l sm:border-gray-200 sm:pl-6 flex flex-col gap-y-1 text-[10px] sm:text-xs">
                        <div className="manager-entry flex flex-row items-baseline gap-1.5 min-w-0">
                            <span className="info-label text-gray-400 font-medium whitespace-nowrap">Manager name :</span>
                            <span className="info-value font-bold truncate text-gray-800">
                                {initialFarm?.farm_manager_name || initialFarm?.manager_name || '-'}
                            </span>
                        </div>
                        <div className="manager-entry flex flex-row items-baseline gap-1.5 min-w-0">
                            <span className="info-label text-gray-400 font-medium whitespace-nowrap">Phone no :</span>
                            <span className="info-value font-bold truncate text-gray-800">
                                {initialFarm?.mobile_number || initialFarm?.manager_mobile || '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Detailed Staff Section */}
            {!loading && (
                <div className="mb-5">
                    <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Users size={16} className="text-gray-400" /> Farm Staff
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Supervisors */}
                        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Supervisors</h3>
                            <div className="space-y-2">
                                {staff?.supervisors && staff.supervisors.length > 0 ? (
                                    staff.supervisors.map((s: any) => (
                                        <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-[10px]">{(s.name || '?')[0]}</div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{s.name}</p>
                                                <p className="text-[10px] text-gray-400">{s.mobile}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[10px] text-gray-400 italic p-2 bg-gray-50 shadow-sm rounded-lg border border-dashed border-gray-100 text-center">
                                        No supervisor assigned
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Doctors */}
                        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest flex items-center gap-1.5"><Stethoscope size={12} /> Doctors</h3>
                            <div className="space-y-2">
                                {staff?.doctors && staff.doctors.length > 0 ? (
                                    staff.doctors.map((d: any) => (
                                        <div key={d.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-[10px]">{(d.name || '?')[0]}</div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{d.name}</p>
                                                <p className="text-[10px] text-gray-400">{d.mobile}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[10px] text-gray-400 italic p-2 bg-gray-50 shadow-sm rounded-lg border border-dashed border-gray-100 text-center">
                                        No doctor assigned
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assistant Doctors */}
                        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Assistant Doctors</h3>
                            <div className="space-y-2">
                                {staff?.assistant_doctors && staff.assistant_doctors.length > 0 ? (
                                    staff.assistant_doctors.map((a: any) => (
                                        <div key={a.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                                            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-black text-[10px]">{(a.name || '?')[0]}</div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">{a.name}</p>
                                                <p className="text-[10px] text-gray-400">{a.mobile}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[10px] text-gray-400 italic p-2 bg-gray-50 shadow-sm rounded-lg border border-dashed border-gray-100 text-center">
                                        No assistant doctor assigned
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Sheds Section (Main Data) */}
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                🏠 Sheds Configuration
            </h2>

            {loading ? (
                <div className="loading-container py-20 flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Loading sheds configuration...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-6">
                    <p className="text-sm text-red-700 font-bold">Error loading data</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
            ) : sheds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    <div className="text-6xl mb-6">🏘️</div>
                    <h3 className="text-2xl font-extrabold text-gray-800">No Sheds Configured</h3>
                </div>
            ) : (
                <div className="sheds-grid-container pb-10">
                    {sheds.map((shed: any, idx: number) => (
                        <div
                            key={shed.id || idx}
                            className="shed-detail-card card-animate cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handleShedClick(shed)}
                        >
                            <div className="shed-card-header">
                                <div className="shed-identity-group shrink-0">
                                    <div className="shed-icon-large">🛖</div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="card-info-label-sm whitespace-nowrap">Farm:</span>
                                            <h3 className="shed-name-title truncate lowercase">{farmName}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="shed-supervisor-compact ml-auto">
                                    <div className="supervisor-entry-compact">
                                        <span className="card-info-label-sm">Supervisor:</span>
                                        <span className="card-info-value-sm truncate">{shed.supervisor_details?.name || shed.supervisor_name || '-'}</span>
                                    </div>
                                    <div className="supervisor-entry-compact">
                                        <span className="card-info-label-sm">Phone:</span>
                                        <span className="card-info-value-sm truncate">{shed.supervisor_details?.mobile || shed.supervisor_mobile || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-divider my-3"></div>
                            <div className="shed-stats">
                                <div className="stat-row flex justify-between">
                                    <span className="stat-label">Shed Name</span>
                                    <span className="stat-value">{shed.shed_name || shed.name || `Unit ${idx + 1}`}</span>
                                </div>
                                <div className="stat-row flex justify-between">
                                    <span className="stat-label">Capacity</span>
                                    <span className="stat-value text-emerald-600">{shed.capacity || '-'}</span>
                                </div>
                                <div className="stat-row flex justify-between">
                                    <span className="stat-label">Current Buffaloes</span>
                                    <span className="stat-value text-amber-600">{shed.current_buffaloes || '0'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FarmDetails;
