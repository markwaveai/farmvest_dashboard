import React, { useState } from 'react';
import { farmvestService } from '../services/farmvest_api';
import './AddFarmModal.css'; // Reusing the same CSS for consistency

interface AddShedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: number;
}

const AddShedModal: React.FC<AddShedModalProps> = ({ isOpen, onClose, onSuccess, farmId }) => {
    const [shedId, setShedId] = useState('');
    const [shedName, setShedName] = useState('');
    const [capacity, setCapacity] = useState(300);
    const [cctvUrl, setCctvUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!shedId || !shedName || capacity <= 0) {
            setError('Please fill in all required fields correctly');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await farmvestService.createShed({
                farm_id: farmId,
                shed_id: shedId,
                shed_name: shedName,
                capacity: capacity,
                cctv_url: cctvUrl
            });

            // Reset form
            setShedId('');
            setShedName('');
            setCapacity(300);
            setCctvUrl('');

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create shed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-farm-modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="add-farm-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ position: 'relative' }}>
                    <h2>Add New Shed</h2>
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
                            <label htmlFor="farmId">Farm ID</label>
                            <input
                                id="farmId"
                                type="text"
                                className="form-input"
                                value={farmId}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="shedId">Shed ID *</label>
                            <input
                                id="shedId"
                                type="text"
                                className="form-input"
                                placeholder="e.g. kurnool_shed_01"
                                value={shedId}
                                onChange={(e) => setShedId(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="shedName">Shed Name *</label>
                            <input
                                id="shedName"
                                type="text"
                                className="form-input"
                                placeholder="e.g. Primary Shed"
                                value={shedName}
                                onChange={(e) => setShedName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="capacity">Capacity *</label>
                            <input
                                id="capacity"
                                type="number"
                                className="form-input"
                                value={capacity}
                                onChange={(e) => setCapacity(parseInt(e.target.value))}
                                min="1"
                                disabled // Capacity is fixed to 300
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="cctvUrl">CCTV URL</label>
                            <input
                                id="cctvUrl"
                                type="text"
                                className="form-input"
                                placeholder="Optional"
                                value={cctvUrl}
                                onChange={(e) => setCctvUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Shed'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export { AddShedModal };
