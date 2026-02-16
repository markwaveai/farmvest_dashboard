import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store';
import { updateEmployee } from '../store/slices/farmvest/employees';
import { farmvestService } from '../services/farmvest_api';
import { X, Loader2, Landmark, MapPin, Briefcase, Hash, Save, User } from 'lucide-react';
import CustomDropdown from '../components/common/CustomDropdown';
import './AddEmployee/AddEmployeeModal.css'; // Reuse existing employee modal styles

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
    onSuccess?: () => void;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, employee, onSuccess }) => {
    const dispatch = useAppDispatch();
    const { updateLoading } = useAppSelector((state: RootState) => state.farmvestEmployees);

    const [formData, setFormData] = useState({
        role: '',
        location: '',
        farm_id: '',
        shed_id: '',
        senior_doctor_id: '',
        doctor_id: '',
    });
    const [fullDetails, setFullDetails] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const [locations, setLocations] = useState<string[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [farmsLoading, setFarmsLoading] = useState(false);
    const [sheds, setSheds] = useState<any[]>([]);
    const [shedsLoading, setShedsLoading] = useState(false);

    // Initialize and Fetch latest data from API
    useEffect(() => {
        if (isOpen && employee) {
            const fetchDetails = async () => {
                setDetailsLoading(true);
                try {
                    const empId = employee.id || employee.user_id;
                    const response = await farmvestService.getEmployeeDetailsById(String(empId));
                    const details = response.data || response;

                    if (details) {
                        setFullDetails(details);
                        setFormData({
                            role: details.roles?.[0] || details.role || employee.roles?.[0] || 'FARM_MANAGER',
                            location: details.location || employee.location || '',
                            farm_id: String(details.farm_id || details.farm?.id || employee.farm_id || ''),
                            shed_id: String(details.shed_id || details.shed?.id || employee.shed_id || ''),
                            senior_doctor_id: String(details.senior_doctor_id || ''),
                            doctor_id: String(details.doctor_id || (details.doctor_details && details.doctor_details[0]?.doctor_id) || ''),
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch employee details", err);
                    // Fallback to prop data
                    setFormData({
                        role: employee.roles?.[0] || employee.role || 'FARM_MANAGER',
                        location: employee.location || '',
                        farm_id: String(employee.farm_id || employee.farm?.id || ''),
                        shed_id: String(employee.shed_id || employee.shed?.id || ''),
                        senior_doctor_id: '',
                        doctor_id: '',
                    });
                } finally {
                    setDetailsLoading(false);
                }
            };
            fetchDetails();
        }
    }, [isOpen, employee]);

    // Fetch doctors if role is ASSISTANT_DOCTOR
    useEffect(() => {
        if (!isOpen || formData.role !== 'ASSISTANT_DOCTOR' || !formData.farm_id) {
            setDoctors([]);
            return;
        }

        const fetchDoctors = async () => {
            setDoctorsLoading(true);
            try {
                const response = await farmvestService.getEmployees({
                    role: 'DOCTOR',
                    farm_id: Number(formData.farm_id)
                });

                let docList: any[] = [];
                if (Array.isArray(response)) docList = response;
                else if (response && Array.isArray(response.data)) docList = response.data;
                else if (response && response.users) docList = response.users;

                setDoctors(docList.map(doc => ({
                    ...doc,
                    business_id: doc.user_id || doc.id || doc.employee_id
                })));
            } catch (error) {
                setDoctors([]);
            } finally {
                setDoctorsLoading(false);
            }
        };

        fetchDoctors();
    }, [formData.role, formData.farm_id, isOpen]);

    const [fetchingDocId, setFetchingDocId] = useState(false);

    const fetchDoctorId = async (userId: string) => {
        setFetchingDocId(true);
        try {
            const response = await farmvestService.getEmployeeDetailsById(userId);
            const details = response.data || response;
            if (details && details.doctor_details && details.doctor_details.length > 0) {
                const docId = details.doctor_details[0].doctor_id;
                setFormData(prev => ({ ...prev, doctor_id: String(docId) }));
            } else if (details && details.user_id) {
                const docId = (details.doctor_details && details.doctor_details[0]?.doctor_id) || details.doctor_id;
                if (docId) setFormData(prev => ({ ...prev, doctor_id: String(docId) }));
            }
        } catch (error) {
            console.error("Failed to fetch doctor details", error);
        } finally {
            setFetchingDocId(false);
        }
    };

    // Fetch locations
    useEffect(() => {
        if (!isOpen) return;
        const fetchLocations = async () => {
            try {
                const response = await farmvestService.getLocations();
                let locs: any[] = [];
                if (response && response.data && Array.isArray(response.data.locations)) {
                    locs = response.data.locations;
                } else if (response && Array.isArray(response.locations)) {
                    locs = response.locations;
                } else if (Array.isArray(response)) {
                    locs = response;
                }
                setLocations(locs.map(l =>
                    (typeof l === 'object' ? (l.name || l.location || '') : String(l)).toUpperCase()
                ));
            } catch (err) {
                console.error("Failed to fetch locations", err);
            }
        };
        fetchLocations();
    }, [isOpen]);

    // Fetch farms based on location
    useEffect(() => {
        if (!isOpen || !formData.location) return;

        const fetchFarmsByLocation = async () => {
            setFarmsLoading(true);
            try {
                const response = await farmvestService.getAllFarms({
                    location: formData.location,
                    sort_by: 2,
                    page: 1,
                    size: 100
                });

                let farmList: any[] = [];
                if (response && (response.status === 200 || response.status === "200")) {
                    farmList = Array.isArray(response.data) ? response.data : [];
                } else if (Array.isArray(response)) {
                    farmList = response;
                } else if (response && Array.isArray(response.data)) {
                    farmList = response.data;
                } else if (response && Array.isArray(response.farms)) {
                    farmList = response.farms;
                }
                setFarms(farmList);
            } catch (error) {
                setFarms([]);
            } finally {
                setFarmsLoading(false);
            }
        };

        fetchFarmsByLocation();
    }, [formData.location, isOpen]);

    // Fetch sheds based on farm_id
    useEffect(() => {
        if (!isOpen || !formData.farm_id || formData.farm_id === '0') {
            setSheds([]);
            return;
        }

        const fetchShedsByFarm = async () => {
            setShedsLoading(true);
            try {
                const response = await farmvestService.getAvailableSheds(Number(formData.farm_id));
                const shedList = Array.isArray(response) ? response : (response.data || []);
                setSheds(shedList);
            } catch (error) {
                setSheds([]);
            } finally {
                setShedsLoading(false);
            }
        };

        fetchShedsByFarm();
    }, [formData.farm_id, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));

        if (name === 'location') {
            setFormData(prev => ({ ...prev, farm_id: '', shed_id: '' }));
        }
        if (name === 'farm_id') {
            setFormData(prev => ({ ...prev, shed_id: '' }));
        }
        if (name === 'role' && value === 'ADMIN') {
            // Keep location/farm if they exist for optional assignment
        }
        if (name === 'senior_doctor_id') {
            if (value) fetchDoctorId(value);
            else setFormData(prev => ({ ...prev, doctor_id: '' }));
        }
    };

    const isFormValid = React.useMemo(() => {
        if (formData.role === 'ADMIN') return true;

        // Other roles require location and farm
        if (!formData.location || !formData.farm_id) return false;

        // Supervisor requires shed
        if (formData.role === 'SUPERVISOR' && !formData.shed_id) return false;

        return true;
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            user_id: Number(employee.id || employee.user_id),
            role: formData.role,
            farm_id: Number(formData.farm_id) || 0,
            shed_id: Number(formData.shed_id) || 0,
            senior_doctor_id: formData.role === 'ASSISTANT_DOCTOR' ? (Number(formData.senior_doctor_id) || 0) : 0,
            doctor_id: (formData.role === 'ASSISTANT_DOCTOR' && formData.doctor_id) ? Number(formData.doctor_id) : 0
        };

        const result = await dispatch(updateEmployee(payload));

        if (updateEmployee.fulfilled.match(result)) {
            if (onSuccess) onSuccess();
            onClose();
        } else {
            alert(result.payload || 'Failed to update assignment');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`add-employee-overlay show`}>
            <div className="modal-content add-employee-modal">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-badge">
                            <Briefcase size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3>Edit Employee Assignment</h3>
                            <p className="text-xs text-gray-500">{employee.first_name} {employee.last_name}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose} disabled={updateLoading}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        {/* Location Selector */}
                        <div className="form-group">
                            <label><MapPin size={14} /> Location {formData.role === 'ADMIN' && '(Optional)'}</label>
                            <select
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={`form-select ${touched.location && !formData.location && formData.role !== 'ADMIN' ? 'border-red-500' : ''}`}
                            >
                                <option value="" disabled>Select Location</option>
                                {locations.map((loc, index) => (
                                    <option key={index} value={loc}>{loc}</option>
                                ))}
                            </select>
                            {touched.location && !formData.location && formData.role !== 'ADMIN' && (
                                <span className="text-[10px] text-red-500 mt-1 font-bold">Location is required</span>
                            )}
                        </div>

                        {/* Farm Selector */}
                        <div className="form-group">
                            <label><Landmark size={14} /> Select Farm {formData.role === 'ADMIN' ? '(Optional)' : '*'}</label>
                            <div className="relative">
                                <CustomDropdown
                                    placeholder={farmsLoading ? 'Loading farms...' : 'Choose a farm...'}
                                    value={formData.farm_id}
                                    options={farms.map(farm => ({
                                        value: farm.farm_id || farm.id,
                                        label: farm.farm_name
                                    }))}
                                    onChange={(val) => setFormData(prev => ({ ...prev, farm_id: String(val), shed_id: '' }))}
                                    disabled={farmsLoading || (!formData.location && formData.role !== 'ADMIN')}
                                />
                                {formData.farm_id && formData.farm_id !== '0' && (
                                    <div className="mt-2 text-[10px] font-bold text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 flex justify-between items-center">
                                        <span className="uppercase tracking-wider">Farm ID:</span>
                                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{formData.farm_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div className="form-group">
                            <label><Briefcase size={14} /> Primary Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="FARM_MANAGER">FARM_MANAGER</option>
                                <option value="SUPERVISOR">SUPERVISOR</option>
                                <option value="DOCTOR">DOCTOR</option>
                                <option value="ASSISTANT_DOCTOR">ASSISTANT_DOCTOR</option>
                            </select>
                        </div>

                        {/* Shed Selector */}
                        <div className="form-group">
                            <label><Hash size={14} /> Select Shed (Optional)</label>
                            <div className="relative">
                                <select
                                    name="shed_id"
                                    value={formData.shed_id}
                                    onChange={handleInputChange}
                                    className="form-select"
                                    disabled={shedsLoading || !formData.farm_id || formData.farm_id === '0'}
                                >
                                    <option value="0">Whole Farm (No specific shed)</option>
                                    {sheds.map(shed => (
                                        <option key={shed.id || shed.shed_id} value={shed.id || shed.shed_id}>
                                            {shed.shed_name}
                                        </option>
                                    ))}
                                </select>
                                {shedsLoading && (
                                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <Loader2 size={16} className="animate-spin text-blue-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Senior Doctor for Assistant Doctor */}
                        {formData.role === 'ASSISTANT_DOCTOR' && (
                            <div className="form-group">
                                <label><User size={14} /> Senior Doctor</label>
                                <div className="relative">
                                    <select
                                        name="senior_doctor_id"
                                        value={formData.senior_doctor_id}
                                        onChange={handleInputChange}
                                        className="form-select"
                                        disabled={doctorsLoading || !formData.farm_id}
                                    >
                                        <option value="">{doctorsLoading ? 'Loading doctors...' : 'Choose a doctor...'}</option>
                                        {doctors.map(doc => (
                                            <option key={doc.business_id || doc.id} value={doc.business_id}>
                                                {doc.first_name} {doc.last_name} ({doc.mobile})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {formData.doctor_id && (
                                    <div className="mt-2 text-[10px] font-bold text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 flex justify-between items-center animate-fadeIn">
                                        <span className="uppercase tracking-wider">Generated Doctor ID:</span>
                                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">#{formData.doctor_id}</span>
                                    </div>
                                )}
                                {fetchingDocId && (
                                    <div className="mt-1 text-[10px] text-blue-500 flex items-center gap-1">
                                        <Loader2 size={10} className="animate-spin" />
                                        <span>Fetching business identity...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-actions mt-8">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={updateLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={updateLoading || !isFormValid}
                        >
                            {updateLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployeeModal; // Exported as default name matching previous reference
