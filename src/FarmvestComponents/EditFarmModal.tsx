import React, { useState, useMemo, useEffect } from 'react';
import { farmvestService } from '../services/farmvest_api';
import './AddFarmModal.css'; // Reusing the same styles

interface EditFarmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (location: string) => void;
    farm: any;
}

const EditFarmModal: React.FC<EditFarmModalProps> = ({ isOpen, onClose, onSuccess, farm }) => {
    const [farmName, setFarmName] = useState('');
    const [location, setLocation] = useState('');
    const [shedCount, setShedCount] = useState<number>(0);
    const [isTest, setIsTest] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locations, setLocations] = useState<string[]>([]);

    useEffect(() => {
        if (farm) {
            setFarmName(farm.farm_name || '');
            setLocation(farm.location || '');
            setShedCount(farm.sheds_count || 0);
            setIsTest(farm.is_test || false);
        }
    }, [farm]);

    useEffect(() => {
        if (isOpen) {
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
                        setLocations(locs.map(l => String(l).toUpperCase()));
                    }
                } catch (err) {
                    console.error("Failed to fetch locations", err);
                }
            };
            fetchLocations();
        }
    }, [isOpen]);

    const isFormValid = useMemo(() => {
        return (
            farmName.trim().length > 0 &&
            location.trim().length > 0 &&
            shedCount >= 0
        );
    }, [farmName, location, shedCount]);

    if (!isOpen || !farm) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!farmName.trim()) {
            setError('Please enter a farm name');
            return;
        }

        if (!location) {
            setError('Please select a location');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await farmvestService.updateFarm(farm.id, {
                farm_name: farmName,
                location: location.toUpperCase(),
                shed_count: Number(shedCount),
                is_test: isTest
            });

            onSuccess(location);
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'object' ? JSON.stringify(err.response.data.detail) : err.response.data.detail)
                : (err.message || 'Failed to update farm. Please try again.');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-farm-modal-overlay">
            <div className="add-farm-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ position: 'relative' }}>
                    <h2>Edit Farm: {farmName}</h2>
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
                        {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}

                        <div className="form-group">
                            <label htmlFor="farmName">Farm Name</label>
                            <input
                                id="farmName"
                                type="text"
                                className="form-input"
                                placeholder="e.g. KUR_F19"
                                value={farmName}
                                onChange={(e) => setFarmName(e.target.value)}
                            />
                        </div>

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
                                min="0"
                                className="form-input"
                                placeholder="e.g. 1"
                                value={shedCount}
                                onChange={(e) => setShedCount(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <input
                                id="isTest"
                                type="checkbox"
                                checked={isTest}
                                onChange={(e) => setIsTest(e.target.checked)}
                                style={{ width: 'auto', cursor: 'pointer' }}
                            />
                            <label htmlFor="isTest" style={{ marginBottom: 0, cursor: 'pointer' }}>Is Test Farm</label>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={loading || !isFormValid}>
                            {loading ? 'Updating...' : 'Update Farm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditFarmModal;
