import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { farmvestService } from '../services/farmvest_api';
import './FarmDetails.css';
import { AddShedModal } from './AddShedModal';
import { MapPin, ArrowLeft, Plus, Users, Stethoscope } from 'lucide-react';

const FarmDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Initial state from navigation if available
    const initialFarm = location.state?.farm;

    const [farmName, setFarmName] = useState(initialFarm?.farm_name || 'Loading Farm...');
    const [farmLocation, setFarmLocation] = useState(initialFarm?.location || '');
    const [sheds, setSheds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [staff, setStaff] = useState<{ supervisors: any[]; doctors: any[]; assistant_doctors: any[] } | null>(null);
    const [staffLoading, setStaffLoading] = useState(false);

    useEffect(() => {
        fetchSheds();
        fetchStaff();
    }, [id]);

    const fetchStaff = async () => {
        if (!id) return;
        setStaffLoading(true);
        try {
            const res = await farmvestService.getFarmStaff(parseInt(id));
            if (res && res.data) {
                setStaff(res.data);
            }
        } catch {
            // Staff endpoint may not be available for all users
        } finally {
            setStaffLoading(false);
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

            if (shedsList.length > 0) {
            }
            setSheds(shedsList);
        } catch (err: any) {
            // If 404, it means no sheds found - treat as empty list
            if (err.response && err.response.status === 404) {
                setSheds([]);
                setError(null);
            } else {
                setError(err.message || 'Failed to fetch shed details');
            }
        } finally {
            setLoading(false);
        }
    };

    // If farm name wasn't passed, we might update it if the API returned it (not guaranteed by this specific endpoint though)

    const [isAddShedModalOpen, setIsAddShedModalOpen] = useState(false);

    const handleShedClick = (shed: any) => {
        navigate('/farmvest/unallocated-animals', {
            state: {
                farmId: id,
                shedId: shed.id || shed.shed_id,
                fromShedView: true
            }
        });
    };

    return (
        <div className="farm-details-container animate-fadeIn">
            <div className="farm-details-header">
                <div className="flex items-center gap-4">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <ArrowLeft size={14} /> Back to Farms
                    </button>
                    <div className="farm-title-section">
                        <h1>{farmName}</h1>
                        {farmLocation && (
                            <div className="farm-location">
                                <MapPin size={14} className="text-gray-400" />
                                {farmLocation}
                            </div>
                        )}
                    </div>
                </div>
                <div className="farm-header-right-actions">
                    <div className="flex items-center gap-2">
                        <button
                            className="add-shed-btn"
                            onClick={() => {
                                setIsAddShedModalOpen(true);
                            }}
                        >
                            <Plus size={14} /> Add Shed
                        </button>
                    </div>

                    <div className="manager-details-section">
                        <div className="manager-entry">
                            <span className="info-label">Manager Name:</span>
                            <span className="info-value">
                                {initialFarm?.farm_manager_name || initialFarm?.manager_name || (initialFarm?.farm_manager?.name) || '-'}
                            </span>
                        </div>
                        <div className="manager-entry">
                            <span className="info-label">Phone No:</span>
                            <span className="info-value">
                                {initialFarm?.mobile_number || initialFarm?.manager_mobile || initialFarm?.manager_phone || (initialFarm?.farm_manager?.mobile) || '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Loading sheds configuration...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 font-bold">Error loading data</p>
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            ) : sheds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 animate-fadeIn">
                    <div className="text-6xl mb-6">🏘️</div>
                    <h3 className="text-2xl font-extrabold text-gray-800">No Sheds Configured</h3>
                    <p className="mt-3 text-gray-500 font-medium max-w-sm text-center">There are no sheds configured for this farm yet. Click "Add Shed" to get started.</p>
                </div>
            ) : (
                <div className="sheds-grid-container">
                    {sheds.map((shed: any, idx: number) => (
                        <div
                            key={shed.id || idx}
                            className="shed-detail-card card-animate cursor-pointer hover:shadow-lg transition-shadow"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                            onClick={() => handleShedClick(shed)}
                        >
                            <div className="shed-card-header">
                                <div className="shed-identity-group">
                                    <div className="shed-icon-large">🛖</div>
                                    <h3 className="shed-name-title">
                                        {shed.shed_name || shed.name || `Shed Unit ${idx + 1}`}
                                    </h3>
                                    {shed.shed_id && (
                                        <div className="shed-id-badge-inline">
                                            {shed.shed_id}
                                        </div>
                                    )}
                                </div>

                                <div className="shed-supervisor-compact">
                                    <div className="supervisor-entry-compact">
                                        <span className="card-info-label-sm">Supervisor Name:</span>
                                        <span className="card-info-value-sm">
                                            {shed.supervisor_details?.name || shed.supervisor_name || '-'}
                                        </span>
                                    </div>
                                    <div className="supervisor-entry-compact">
                                        <span className="card-info-label-sm">Phone No:</span>
                                        <span className="card-info-value-sm">
                                            {shed.supervisor_details?.mobile || shed.supervisor_mobile || shed.mobile_number || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-divider"></div>

                            <div className="shed-stats">
                                <div className="stat-row">
                                    <span className="stat-label">Capacity</span>
                                    <span className="stat-value text-emerald-600">
                                        {shed.capacity !== undefined ? shed.capacity : '-'}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">Current Buffaloes</span>
                                    <span className="stat-value text-amber-600">
                                        {shed.current_buffaloes !== undefined ? shed.current_buffaloes : '-'}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">Available Positions</span>
                                    <span className="stat-value text-purple-600">
                                        {shed.available_positions !== undefined ? shed.available_positions :
                                            (shed.available_slots !== undefined ? shed.available_slots : '-')}
                                    </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">Status</span>
                                    <span className="stat-value text-blue-600">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {/* Staff Section */}
            {staff && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-gray-400" /> Farm Staff
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {staff.supervisors && staff.supervisors.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Supervisors</h3>
                                <div className="space-y-3">
                                    {staff.supervisors.map((s: any) => (
                                        <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                {(s.name || '?')[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{s.name}</p>
                                                <p className="text-[10px] text-gray-400">{s.mobile} {s.shed_name ? `| ${s.shed_name}` : ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {staff.doctors && staff.doctors.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider flex items-center gap-1">
                                    <Stethoscope size={14} /> Doctors
                                </h3>
                                <div className="space-y-3">
                                    {staff.doctors.map((d: any) => (
                                        <div key={d.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                                {(d.name || '?')[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{d.name}</p>
                                                <p className="text-[10px] text-gray-400">{d.mobile}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {staff.assistant_doctors && staff.assistant_doctors.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-5">
                                <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Assistant Doctors</h3>
                                <div className="space-y-3">
                                    {staff.assistant_doctors.map((a: any) => (
                                        <div key={a.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                                                {(a.name || '?')[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{a.name}</p>
                                                <p className="text-[10px] text-gray-400">{a.mobile}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(!staff.supervisors?.length && !staff.doctors?.length && !staff.assistant_doctors?.length) && (
                            <div className="col-span-full text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
                                <p className="font-medium">No staff assigned to this farm</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AddShedModal
                isOpen={isAddShedModalOpen}
                onClose={() => setIsAddShedModalOpen(false)}
                onSuccess={() => {
                    fetchSheds();
                }}
                farmId={parseInt(id || '0')}
                farmName={farmName}
            />
        </div>
    );
};

export default FarmDetails;
