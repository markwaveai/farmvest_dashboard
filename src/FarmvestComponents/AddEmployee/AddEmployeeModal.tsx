import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { createEmployee } from '../../store/slices/farmvest/employees';
import { farmvestService } from '../../services/farmvest_api';
import { X, Loader2, Landmark, MapPin, User, Mail, Phone, Briefcase, Hash } from 'lucide-react';
import './AddEmployeeModal.css';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const { createLoading } = useAppSelector((state: RootState) => state.farmvestEmployees);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        role: 'SUPERVISOR',
        location: 'KURNOOL',
        farm_id: '',
        shed_id: '',
        is_test: false
    });

    const [farms, setFarms] = useState<any[]>([]);
    const [farmsLoading, setFarmsLoading] = useState(false);
    const [sheds, setSheds] = useState<any[]>([]);
    const [shedsLoading, setShedsLoading] = useState(false);

    // Fetch farms based on location
    useEffect(() => {
        if (!isOpen) return;

        const fetchFarmsByLocation = async () => {
            setFarmsLoading(true);
            try {
                const response = await farmvestService.getFarms(formData.location);
                // API might return { status: 200, data: [...] } or just [...]
                const farmList = Array.isArray(response) ? response : (response.data || []);
                setFarms(farmList);

                // Reset farm_id when location changes
                setFormData(prev => ({ ...prev, farm_id: '', shed_id: '' }));
                setSheds([]);
            } catch (error) {
                console.error(`Error loading farms for ${formData.location}:`, error);
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
                console.error(`Error loading sheds for farm ${formData.farm_id}:`, error);
                setSheds([]);
            } finally {
                setShedsLoading(false);
            }
        };

        fetchShedsByFarm();
    }, [formData.farm_id, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Mandatory base payload
        const payload: any = {
            email: formData.email,
            farm_id: Number(formData.farm_id),
            first_name: formData.first_name,
            last_name: formData.last_name,
            mobile: formData.mobile,
            roles: [formData.role],
            is_test: formData.is_test
        };

        // 2. Conditional shed_id for SUPERVISOR
        if (formData.role === 'SUPERVISOR') {
            payload.shed_id = Number(formData.shed_id);
        }

        // 3. Dispatch the creation action
        const result = await dispatch(createEmployee(payload));

        if (createEmployee.fulfilled.match(result)) {
            // Success handshake
            setTimeout(() => {
                onClose();
                // Reset form to defaults
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    mobile: '',
                    role: 'SUPERVISOR',
                    location: 'KURNOOL',
                    farm_id: '',
                    shed_id: '',
                    is_test: false
                });
            }, 500);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="add-employee-overlay">
            <div className="add-employee-modal animate-modalScale">
                <div className="modal-header">
                    <div className="header-title">
                        <div className="icon-badge">
                            <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3>Add New Employee</h3>
                            <p>Register a new member to the FarmVest team</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose} disabled={createLoading}>
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
                            <label><Phone size={14} /> Mobile Number</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                placeholder="Enter mobile number"
                                className="form-input"
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
                                <option value="KURNOOL">KURNOOL</option>
                                <option value="HYDERABAD">HYDERABAD</option>
                            </select>
                        </div>

                        {/* Farm Selector - Loads dynamically based on location */}
                        <div className="form-group">
                            <label><Landmark size={14} /> Select Farm *</label>
                            <div className="relative">
                                <select
                                    name="farm_id"
                                    value={formData.farm_id}
                                    onChange={handleInputChange}
                                    required
                                    className="form-select"
                                    disabled={farmsLoading}
                                >
                                    <option value="">{farmsLoading ? 'Loading farms...' : 'Choose a farm...'}</option>
                                    {farms.map(farm => (
                                        <option key={farm.id} value={farm.id}>
                                            {farm.farm_name}
                                        </option>
                                    ))}
                                </select>
                                {farmsLoading && (
                                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <Loader2 size={16} className="animate-spin text-blue-500" />
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
                                <option value="SUPERVISOR">SUPERVISOR</option>
                                <option value="DOCTOR">DOCTOR</option>
                                <option value="ASSISTANT_DOCTOR">ASSISTANT_DOCTOR</option>
                                <option value="FARM_MANAGER">FARM_MANAGER</option>
                            </select>
                        </div>

                        {/* Conditional Shed ID for Supervisor */}
                        {formData.role === 'SUPERVISOR' && (
                            <div className="form-group animate-fadeIn">
                                <label><Hash size={14} /> Select Shed *</label>
                                <div className="relative">
                                    <select
                                        name="shed_id"
                                        value={formData.shed_id}
                                        onChange={handleInputChange}
                                        required
                                        className="form-select"
                                        disabled={shedsLoading || !formData.farm_id || sheds.length === 0}
                                    >
                                        <option value="">
                                            {!formData.farm_id
                                                ? 'Select a farm first...'
                                                : shedsLoading
                                                    ? 'Loading sheds...'
                                                    : sheds.length === 0
                                                        ? 'No sheds available'
                                                        : 'Choose a shed...'}
                                        </option>
                                        {sheds.map(shed => (
                                            <option key={shed.id} value={shed.id}>
                                                {shed.shed_id}
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
                            onClick={onClose}
                            disabled={createLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={createLoading || !formData.farm_id}
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
