import React, { useState, useMemo } from 'react';
import { farmvestService } from '../services/farmvest_api';
import './AddFarmModal.css';

interface AddFarmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (location: string) => void;
    initialLocation: string;
}

const AddFarmModal: React.FC<AddFarmModalProps> = ({ isOpen, onClose, onSuccess, initialLocation }) => {
    const [location, setLocation] = useState('');
    const [shedCount, setShedCount] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFormValid = useMemo(() => {
        return (
            location.trim().length > 0 &&
            shedCount > 0
        );
    }, [location, shedCount]);


    // Fetch locations logic...
    const [locations, setLocations] = useState<string[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            const fetchLocations = async () => {
                try {
                    const response = await farmvestService.getLocations();
                    let locs: string[] = [];
                    // Handle various response structures
                    if (response && response.data && Array.isArray(response.data.locations)) {
                        locs = response.data.locations;
                    } else if (response && Array.isArray(response.locations)) {
                        locs = response.locations;
                    } else if (Array.isArray(response)) {
                        locs = response;
                    }

                    if (locs.length > 0) {
                        setLocations(locs.map(l => String(l).toUpperCase()));
                        // Set default if current location not in list
                        if (location && !locs.map(l => String(l).toUpperCase()).includes(location.toUpperCase())) {
                            // keep current or default to first
                        }
                    }
                } catch (err) {
                }
            };
            fetchLocations();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!location || shedCount < 1) {
            setError('Please fill in all fields correctly');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await farmvestService.createFarm({
                location: location.toUpperCase(),
                shed_count: Number(shedCount),
                is_test: false
            });

            setShedCount(1);
            onSuccess(location);
            onClose();
        } catch (err: any) {
            // Display detailed error for debugging
            const errorMessage = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'object' ? JSON.stringify(err.response.data.detail) : err.response.data.detail)
                : (err.message || 'Failed to create farm. Please try again.');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-farm-modal-overlay">
            <div className="add-farm-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* ... header ... */}
                <div className="modal-header" style={{ position: 'relative' }}>
                    <h2>Add New Farm</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            right: '20px',
                            top: '20px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#000',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 20
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <select
                                id="location"
                                className="form-select"
                                value={location}
                                onChange={(e) => setLocation(e.target.value.toUpperCase())}
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

                        <div className="form-group">
                            <label htmlFor="shedCount">Shed Count</label>
                            <input
                                id="shedCount"
                                type="number"
                                min="1"
                                className="form-input"
                                placeholder="e.g. 1"
                                value={shedCount}
                                onChange={(e) => setShedCount(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={loading || !isFormValid}>
                            {loading ? 'Creating...' : 'Create Farm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFarmModal;
