import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { createEmployee } from '../../store/slices/farmvest/employees';
import { farmvestService } from '../../services/farmvest_api';
import { X, Loader2, Landmark, MapPin, User, Mail, Phone, Briefcase, Hash } from 'lucide-react';
import CustomDropdown from '../../components/common/CustomDropdown';
import './AddEmployeeModal.css';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const { createLoading } = useAppSelector((state: RootState) => state.farmvestEmployees);

    const initialFormData = {
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        role: 'FARM_MANAGER',
        location: 'KURNOOL',
        farm_id: '',
        shed_id: '',
        senior_doctor_id: '',
        is_test: false
    };

    const [formData, setFormData] = useState(initialFormData);

    const handleClose = () => {
        setFormData(initialFormData);
        onClose();
    };

    const [locations, setLocations] = useState<string[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [farmsLoading, setFarmsLoading] = useState(false);
    const [sheds, setSheds] = useState<any[]>([]);
    const [shedsLoading, setShedsLoading] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchLocations = async () => {
            try {
                const response = await farmvestService.getLocations();
                let locs: string[] = [];
                if (response && response.data && Array.isArray(response.data.locations)) {
                    locs = response.data.locations;
                } else if (response && Array.isArray(response.locations)) {
                    locs = response.locations;
                } else if (Array.isArray(response)) {
                    locs = response;
                }

                if (locs.length > 0) {
                    setLocations(locs.map(String));
                }
            } catch (err) {
            }
        };
        fetchLocations();
    }, [isOpen]);

    // Fetch farms based on location
    useEffect(() => {
        if (!isOpen) return;

        const fetchFarmsByLocation = async () => {
            setFarmsLoading(true);
            try {
                if (!formData.location) {
                    setFarms([]);
                    setFarmsLoading(false);
                    return;
                }
                // Use getAllFarms with large size to get everything, then filter locally
                // Or we could trust the API to filter by location if we updated it to use params
                const response = await farmvestService.getAllFarms({ size: 1000 });

                let allFarms: any[] = [];
                if (response && (response.status === 200 || response.status === "200")) {
                    allFarms = Array.isArray(response.data) ? response.data : [];
                } else if (Array.isArray(response)) {
                    allFarms = response;
                } else if (response && Array.isArray(response.data)) {
                    allFarms = response.data;
                }

                // Client-side filter (case-insensitive)
                const targetLoc = formData.location.toUpperCase();
                const filteredFarms = allFarms.filter((farm: any) =>
                    farm.location && String(farm.location).toUpperCase() === targetLoc
                );

                setFarms(filteredFarms);

                // Reset farm_id when location changes
                // Only reset if the current farm_id is not valid for the new location (prevent loop if needed, but simple reset is safer for UX)
                setFormData(prev => ({ ...prev, farm_id: '', shed_id: '' }));
                setSheds([]);
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
        if (!isOpen || !formData.farm_id) {
            setSheds([]);
            return;
        }

        const fetchShedsByFarm = async () => {
            setShedsLoading(true);
            try {
                const response = await farmvestService.getAvailableSheds(Number(formData.farm_id));
                // API response might be { status: 200, data: [...] } or just [...]
                // Adjust based on actual API response structure
                const shedList = Array.isArray(response) ? response : (response.data || []);
                setSheds(shedList);

                // Reset shed_id when farm changes
                setFormData(prev => ({ ...prev, shed_id: '' }));
            } catch (error) {
                setSheds([]);
            } finally {
                setShedsLoading(false);
            }
        };

        fetchShedsByFarm();
    }, [formData.farm_id, isOpen]);

    // Fetch doctors if role is ASSISTANT_DOCTOR
    useEffect(() => {
        if (!isOpen || formData.role !== 'ASSISTANT_DOCTOR' || !formData.farm_id) {
            setDoctors([]);
            return;
        }

        const fetchDoctors = async () => {
            setDoctorsLoading(true);
            try {
                // Fetch doctors for the selected farm
                const response = await farmvestService.getEmployees({
                    role: 'DOCTOR',
                    farm_id: Number(formData.farm_id)
                });

                let docList: any[] = [];
                if (Array.isArray(response)) {
                    docList = response;
                } else if (response && Array.isArray(response.data)) {
                    docList = response.data;
                } else if (response && response.users) {
                    docList = response.users;
                } else if (response && response.data && Array.isArray(response.data.employees)) {
                    docList = response.data.employees;
                }

                setDoctors(docList);
            } catch (error) {
                setDoctors([]);
            } finally {
                setDoctorsLoading(false);
            }
        };

        fetchDoctors();
    }, [formData.role, formData.farm_id, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'mobile') {
            // Numeric only and max 10 digits
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const isFormValid = React.useMemo(() => {
        const { first_name, last_name, email, mobile, role, farm_id, shed_id, senior_doctor_id } = formData;

        // Basic fields
        if (!first_name || !last_name || !email || !mobile || mobile.length !== 10 || !farm_id) {
            return false;
        }

        // Role specific
        if (role === 'SUPERVISOR') {
            if (!shed_id) return false;
        }

        if (role === 'ASSISTANT_DOCTOR') {
            if (!senior_doctor_id) return false;
        }

        return true;
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mobile Validation
        if (formData.mobile.length !== 10) {
            alert('Mobile number must be exactly 10 digits.');
            return;
        }

        // 1. Mandatory base payload
        const payload: any = {
            email: formData.email,
            farm_id: Number(formData.farm_id),
            first_name: formData.first_name,
            last_name: formData.last_name,
            mobile: formData.mobile,
            roles: [formData.role], // Send UPPER_SNAKE_CASE directly
            is_test: formData.is_test
        };

        // 2. Add shed_id logic
        // For Farm Level roles (Doctor, Manager), we send explicit 0 to indicate "Whole Farm" (bypassing backend crash if field missing)
        const farmLevelRoles = ['DOCTOR', 'ASSISTANT_DOCTOR', 'FARM_MANAGER'];

        if (formData.shed_id) {
            payload.shed_id = Number(formData.shed_id);
        } else if (farmLevelRoles.includes(formData.role)) {
            // "Total farm will be allocated" -> Use ID 0 to represent Farm Level (no specific shed)
            payload.shed_id = 0;
        }

        // 3. Add senior_doctor_id for Assistant Doctors
        if (formData.role === 'ASSISTANT_DOCTOR') {
            if (!formData.senior_doctor_id) {
                alert('Please select a Senior Doctor for the Assistant Doctor.');
                return;
            }
            payload.senior_doctor_id = Number(formData.senior_doctor_id);
        }

        // 3. Dispatch the creation action
        const result = await dispatch(createEmployee(payload));

        if (createEmployee.fulfilled.match(result)) {
            // Success handshake
            setTimeout(() => {
                handleClose();
            }, 500);
        } else {
            // Debug access to error

            const errorPayload = result.payload as any;
            let errorMessage = 'Error Creating Employee:\n';
            if (errorPayload && errorPayload.detail) {
                errorMessage += JSON.stringify(errorPayload.detail, null, 2);
            } else {
                errorMessage += result.error?.message || 'Unknown Error';
            }
            alert(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`add-employee-overlay ${isOpen ? 'show' : ''}`}>
            <div className="modal-content add-employee-modal">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-badge">
                            <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3>Add New Employee</h3>
                        </div>
                    </div>
                    <button className="close-btn" onClick={handleClose} disabled={createLoading}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group">
                            <label><User size={14} /> First Name *</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter first name"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label><User size={14} /> Last Name *</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter last name"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label><Mail size={14} /> Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. employee@farmvest.com"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label><Phone size={14} /> Mobile Number *</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                placeholder="Enter mobile number"
                                className="form-input"
                                required
                                maxLength={10}
                            />
                        </div>

                        {/* Location Selector */}
                        <div className="form-group">
                            <label><MapPin size={14} /> Location</label>
                            <select
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="" disabled>Select Location</option>
                                {locations.length > 0 ? (
                                    locations.map((loc, index) => (
                                        <option key={index} value={loc}>{loc}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="KURNOOL">KURNOOL</option>
                                        <option value="HYDERABAD">HYDERABAD</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Farm Selector - Loads dynamically based on location */}
                        <div className="form-group">
                            <label><Landmark size={14} /> Select Farm *</label>
                            <div className="relative">
                                <CustomDropdown
                                    placeholder={farmsLoading ? 'Loading farms...' : 'Choose a farm...'}
                                    value={formData.farm_id}
                                    options={farms.map(farm => ({
                                        value: farm.id,
                                        label: farm.farm_name
                                    }))}
                                    onChange={(val) => setFormData(prev => ({ ...prev, farm_id: val }))}
                                    disabled={farmsLoading}
                                />
                                {farmsLoading && (
                                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <Loader2 size={16} className="animate-spin text-blue-500" />
                                    </div>
                                )}
                            </div>
                        </div>


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

                        {/* Conditional Shed ID for Supervisor and Assistant Doctor */}
                        {(formData.role === 'SUPERVISOR' || formData.role === 'ASSISTANT_DOCTOR') && (
                            <div className="form-group animate-fadeIn">
                                <label><Hash size={14} /> Select Shed {formData.role === 'ASSISTANT_DOCTOR' ? '(Optional)' : '*'}</label>
                                <div className="relative">
                                    <select
                                        name="shed_id"
                                        value={formData.shed_id}
                                        onChange={handleInputChange}
                                        required={formData.role === 'SUPERVISOR'}
                                        className="form-select"
                                        disabled={shedsLoading || !formData.farm_id}
                                    >
                                        <option value="">{shedsLoading ? 'Loading sheds...' : 'Choose a shed...'}</option>
                                        {sheds.map(shed => (
                                            <option key={shed.shed_id || shed.id} value={shed.id}>
                                                {shed.shed_name} {shed.shed_id ? `(${shed.shed_id})` : ''}
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
                        )}

                        {/* Conditional Senior Doctor for Assistant Doctor */}
                        {formData.role === 'ASSISTANT_DOCTOR' && (
                            <div className="form-group animate-fadeIn">
                                <label><User size={14} /> Select Senior Doctor *</label>
                                <div className="relative">
                                    <select
                                        name="senior_doctor_id"
                                        value={formData.senior_doctor_id}
                                        onChange={handleInputChange}
                                        required
                                        className="form-select"
                                        disabled={doctorsLoading || !formData.farm_id}
                                    >
                                        <option value="">{doctorsLoading ? 'Loading doctors...' : 'Choose a doctor...'}</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.first_name} {doc.last_name} ({doc.mobile})
                                            </option>
                                        ))}
                                    </select>
                                    {doctorsLoading && (
                                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                            <Loader2 size={16} className="animate-spin text-blue-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                    </div>

                    <div className="form-footer-options mt-6">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_test"
                                checked={formData.is_test}
                                onChange={handleInputChange}
                            />
                            <span>This is a test account</span>
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleClose}
                            disabled={createLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={createLoading || !isFormValid}
                        >
                            {createLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Processing...
                                </>
                            ) : (
                                'Create Employee'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
