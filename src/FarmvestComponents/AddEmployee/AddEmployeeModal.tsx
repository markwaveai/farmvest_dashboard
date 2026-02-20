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
        role: '',
        location: '',
        farm_id: '',
        shed_id: '',
        senior_doctor_id: '',
        doctor_id: '',
        is_test: false
    };

    const [formData, setFormData] = useState(initialFormData);
    const [mobileError, setMobileError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateEmail = (email: string) => {
        // Enforce @gmail.com domain
        const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!email) return 'Email is required';
        if (!regex.test(email)) return 'Please enter a valid @gmail.com address';
        return '';
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        if (name === 'email') {
            setEmailError(validateEmail(value));
        }
    };
    const handleClose = () => {
        setFormData(initialFormData);
        setMobileError('');
        setEmailError('');
        setTouched({});
        setSubmitError('');
        onClose();
    };

    const [locations, setLocations] = useState<string[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [farmsLoading, setFarmsLoading] = useState(false);
    const [sheds, setSheds] = useState<any[]>([]);
    const [shedsLoading, setShedsLoading] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

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

                if (locs.length > 0) {
                    setLocations(locs.map(l =>
                        (typeof l === 'object' ? (l.name || l.location || '') : String(l)).toUpperCase()
                    ));
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
                // Fetch farms filtered by location directly from API
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

                // Reset farm_id when location changes
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
                // Fallback or if already a doctor object
                const docId = (details.doctor_details && details.doctor_details[0]?.doctor_id) || details.doctor_id;
                if (docId) setFormData(prev => ({ ...prev, doctor_id: String(docId) }));
            }
        } catch (error) {
            console.error("Failed to fetch doctor details", error);
        } finally {
            setFetchingDocId(false);
        }
    };

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

                // Map to ensure we have business IDs (user_id) for the value
                const mappedDocs = docList.map(doc => ({
                    ...doc,
                    // Use user_id (business ID) if available, otherwise fallback
                    business_id: doc.user_id || doc.id || doc.employee_id
                }));

                setDoctors(mappedDocs);
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

            // Phone Validation Patterns
            if (numericValue && numericValue.length > 0) {
                if (!/^[6-9]/.test(numericValue)) {
                    setMobileError('Mobile number must start with 6, 7, 8, or 9');
                } else if (numericValue.length < 10) {
                    setMobileError('Mobile number must be exactly 10 digits');
                } else {
                    setMobileError('');
                }
            } else {
                setMobileError('');
            }
        } else if (name === 'role') {
            setFormData(prev => ({ ...prev, [name]: value }));
            if (value === 'ADMIN') {
                // Keep location/farm if they exist, just clear role-specific sub-selections
                setFormData(prev => ({ ...prev, senior_doctor_id: '' }));
            } else if (value !== 'ASSISTANT_DOCTOR') {
                setFormData(prev => ({ ...prev, senior_doctor_id: '' }));
            }
        } else if (name === 'first_name' || name === 'last_name') {
            // Remove numbers
            const textValue = value.replace(/[0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: textValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
            if (name === 'email' && touched.email) {
                setEmailError(validateEmail(value));
            }
            if (name === 'senior_doctor_id') {
                if (value) fetchDoctorId(value);
                else setFormData(prev => ({ ...prev, doctor_id: '' }));
            }
        }
        setSubmitError('');
    };

    const isFormValid = React.useMemo(() => {
        const { first_name, last_name, email, mobile, role, farm_id, shed_id, senior_doctor_id } = formData;

        // Basic fields
        const phoneRegex = /^[6-9]\d{9}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!first_name || !last_name || !email || !emailRegex.test(email) || !mobile || !phoneRegex.test(mobile) || !role) {
            return false;
        }

        // Admin role doesn't require farm or location
        if (role === 'ADMIN') return true;

        // Other roles require farm_id
        if (!farm_id) return false;

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
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(formData.mobile)) {
            setSubmitError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
            return;
        }

        // 1. EXACT payload structure as requested
        const payload: any = {
            email: formData.email,
            farm_id: Number(formData.farm_id) || 0,
            first_name: formData.first_name,
            last_name: formData.last_name,
            is_test: !!formData.is_test,
            mobile: formData.mobile,
            roles: [formData.role],
            shed_id: Number(formData.shed_id) || 0,
        };

        // Only send senior_doctor_id if it is a valid ID (> 0)
        // This avoids backend crashes caused by passing 0 or null to strict lookups
        if (formData.senior_doctor_id && formData.senior_doctor_id !== '0') {
            payload.senior_doctor_id = Number(formData.senior_doctor_id);
            if (formData.doctor_id) {
                payload.doctor_id = Number(formData.doctor_id);
            }
        }

        // 3. Dispatch the creation action
        const result = await dispatch(createEmployee(payload));

        if (createEmployee.fulfilled.match(result)) {
            setSubmitError('');
            // Success handshake
            setTimeout(() => {
                handleClose();
            }, 500);
        } else {
            const errorPayload = result.payload as any;
            let errorMessage = '';

            if (errorPayload && errorPayload.detail) {
                if (Array.isArray(errorPayload.detail)) {
                    errorMessage = errorPayload.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
                } else if (typeof errorPayload.detail === 'string') {
                    errorMessage = errorPayload.detail;
                } else if (typeof errorPayload.detail === 'object') {
                    // Handle key-value pair errors (e.g. { "email": "Email already exists" })
                    errorMessage = Object.entries(errorPayload.detail)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                } else {
                    errorMessage = String(errorPayload.detail);
                }
            } else if (typeof errorPayload === 'string') {
                errorMessage = errorPayload;
            } else {
                errorMessage = result.error?.message || 'A server error occurred';
            }

            // Cleanup the message for the user: remove technical FastAPI crash details
            if (errorMessage.includes('HTTPException')) {
                errorMessage = 'Server validation failed. Please ensure the Email/Mobile are unique and all fields are correct.';
            }

            setSubmitError(errorMessage);
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

                {submitError && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                        <div className="text-red-600 text-sm font-medium">
                            {submitError}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group">
                            <label><User size={14} /> First Name *</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                required
                                placeholder="Enter first name"
                                className={`form-input ${touched.first_name && !formData.first_name ? 'border-red-500' : ''}`}
                            />
                            {touched.first_name && !formData.first_name && (
                                <span className="text-[10px] text-red-500 mt-1 font-bold">First name is required</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label><User size={14} /> Last Name *</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                required
                                placeholder="Enter last name"
                                className={`form-input ${touched.last_name && !formData.last_name ? 'border-red-500' : ''}`}
                            />
                            {touched.last_name && !formData.last_name && (
                                <span className="text-[10px] text-red-500 mt-1 font-bold">Last name is required</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label><Mail size={14} /> Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                required
                                placeholder="e.g. employee@farmvest.com"
                                className={`form-input ${(touched.email && emailError) ? 'border-red-500' : ''}`}
                            />
                            {touched.email && emailError && (
                                <span className="text-[10px] text-red-500 mt-1 font-bold">{emailError}</span>
                            )}
                        </div>
                        <div className="form-group">
                            <label><Phone size={14} /> Mobile Number *</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                placeholder="Enter mobile number"
                                className={`form-input ${mobileError || (touched.mobile && !formData.mobile) ? 'border-red-500' : ''}`}
                                required
                                maxLength={10}
                            />
                            {mobileError && (
                                <span className="text-[10px] text-red-500 mt-1 font-bold animate-fadeIn">
                                    {mobileError}
                                </span>
                            )}
                        </div>


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
                            {touched.location && !formData.location && formData.role !== 'ADMIN' && (
                                <span className="text-[10px] text-red-500 mt-1 font-bold">Location is required</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label><Landmark size={14} /> Select Farm {formData.role === 'ADMIN' ? '(Optional)' : '*'}</label>
                            <div className="relative" onBlur={() => formData.role !== 'ADMIN' && setTouched(prev => ({ ...prev, farm_id: true }))}>
                                <CustomDropdown
                                    placeholder={farmsLoading ? 'Loading farms...' : 'Choose a farm...'}
                                    value={formData.farm_id}
                                    options={farms.map(farm => ({
                                        value: farm.farm_id || farm.id,
                                        label: farm.farm_name
                                    }))}
                                    onChange={(val) => {
                                        setFormData(prev => ({ ...prev, farm_id: val }));
                                        setTouched(prev => ({ ...prev, farm_id: true }));
                                    }}
                                    disabled={farmsLoading}
                                    className={`${touched.farm_id && !formData.farm_id && formData.role !== 'ADMIN' ? 'border-red-500' : ''}`}
                                />
                                {touched.farm_id && !formData.farm_id && formData.role !== 'ADMIN' && (
                                    <span className="text-[10px] text-red-500 mt-1 font-bold block">Farm is required</span>
                                )}

                                {formData.farm_id && (
                                    <div className="mt-2 text-[10px] font-bold text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 flex justify-between items-center animate-fadeIn">
                                        <span className="uppercase tracking-wider">Farm ID:</span>
                                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{formData.farm_id}</span>
                                    </div>
                                )}
                                {farmsLoading && (
                                    <div className="absolute right-8 top-5 transform -translate-y-1/2">
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
                                onBlur={handleBlur}
                                className={`form-select ${touched.role && !formData.role ? 'border-red-500' : ''}`}
                            >
                                <option value="" disabled>Select Role</option>
                                <option value="FARM_MANAGER">FARM_MANAGER</option>
                                <option value="SUPERVISOR">SUPERVISOR</option>
                                <option value="DOCTOR">DOCTOR</option>
                                <option value="ASSISTANT_DOCTOR">ASSISTANT_DOCTOR</option>
                            </select>
                            {touched.role && !formData.role && (
                                <span className="text-[10px] text-red-500 mt-1 font-bold">Role is required</span>
                            )}
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
                                        onBlur={handleBlur}
                                        required={formData.role === 'SUPERVISOR'}
                                        className={`form-select ${touched.shed_id && !formData.shed_id && formData.role === 'SUPERVISOR' ? 'border-red-500' : ''}`}
                                        disabled={shedsLoading || !formData.farm_id}
                                    >
                                        <option value="">{shedsLoading ? 'Loading sheds...' : 'Choose a shed...'}</option>
                                        {sheds.map(shed => (
                                            <option key={shed.shed_id || shed.id} value={shed.shed_id || shed.id}>
                                                {shed.shed_name} {shed.shed_id ? `(${shed.shed_id})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {touched.shed_id && !formData.shed_id && formData.role === 'SUPERVISOR' && (
                                        <span className="text-[10px] text-red-500 mt-1 font-bold">Shed is required for Supervisor</span>
                                    )}
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
                                        onBlur={handleBlur}
                                        required
                                        className={`form-select ${touched.senior_doctor_id && !formData.senior_doctor_id ? 'border-red-500' : ''}`}
                                        disabled={doctorsLoading || !formData.farm_id}
                                    >
                                        <option value="">{doctorsLoading ? 'Loading doctors...' : 'Choose a doctor...'}</option>
                                        {doctors.map(doc => (
                                            <option key={doc.business_id || doc.id} value={doc.business_id}>
                                                {doc.first_name} {doc.last_name} ({doc.mobile})
                                            </option>
                                        ))}
                                    </select>
                                    {touched.senior_doctor_id && !formData.senior_doctor_id && (
                                        <span className="text-[10px] text-red-500 mt-1 font-bold">Senior Doctor is required</span>
                                    )}
                                    {doctorsLoading && (
                                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                            <Loader2 size={16} className="animate-spin text-blue-500" />
                                        </div>
                                    )}
                                </div>

                                {formData.doctor_id && (
                                    <div className="mt-2 text-[10px] font-bold text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 flex justify-between items-center animate-fadeIn">
                                        <span className="uppercase tracking-wider">Doctor ID:</span>
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
