import React, { useState } from 'react';
import { farmvestService } from '../services/farmvest_api';
import './AddFarmModal.css';

interface AddFarmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (location: string) => void;
    initialLocation: string;
}

const AddFarmModal: React.FC<AddFarmModalProps> = ({ isOpen, onClose, onSuccess, initialLocation }) => {
    const [farmName, setFarmName] = useState('');
    const [location, setLocation] = useState(initialLocation);
    // const [totalBuffaloes, setTotalBuffaloes] = useState<number | ''>(0); // Removed as per API schema
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!farmName || !location) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await farmvestService.createFarm({
                farm_name: farmName,
                location: location.toUpperCase(),
                is_test: false
            });

            setFarmName('');
            // setTotalBuffaloes('');
            onSuccess(location.toUpperCase());
            onClose();
        } catch (err: any) {
            console.error('Failed to create farm:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to create farm. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-farm-modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="add-farm-modal-content">
                <div className="modal-header">
                    <h2>Add New Farm</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="farmName">Farm Name</label>
                            <input
                                id="farmName"
                                type="text"
                                className="form-input"
                                placeholder="e.g. River Side Farm"
                                value={farmName}
                                onChange={(e) => setFarmName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <select
                                id="location"
                                className="form-select"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            >
                                <option value="KURNOOL">KURNOOL</option>
                                <option value="HYDERABAD">HYDERABAD</option>
                            </select>
                        </div>


                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Farm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFarmModal;
