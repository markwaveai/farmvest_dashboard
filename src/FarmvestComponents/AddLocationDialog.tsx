import React, { useState, useMemo } from 'react';
import { farmvestService } from '../services/farmvest_api';
import './AddFarmModal.css'; // Reusing styles

export interface AddLocationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddLocationDialog: React.FC<AddLocationDialogProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [prefix, setPrefix] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFormValid = useMemo(() => {
        return name.trim().length > 0 && prefix.trim().length > 0;
    }, [name, prefix]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !prefix) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await farmvestService.createLocation({
                name: name.trim().toUpperCase(),
                prefix: prefix.trim().toUpperCase()
            });

            setName('');
            setPrefix('');
            onSuccess();
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'object' ? JSON.stringify(err.response.data.detail) : err.response.data.detail)
                : (err.message || 'Failed to create location. Please try again.');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-farm-modal-overlay">
            <div className="add-farm-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ position: 'relative' }}>
                    <h2>Add New Location</h2>
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
                            <label htmlFor="name">Location Name</label>
                            <input
                                id="name"
                                type="text"
                                className="form-input"
                                placeholder="e.g. KURNOOL"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="prefix">Prefix</label>
                            <input
                                id="prefix"
                                type="text"
                                className="form-input"
                                placeholder="e.g. KUR"
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={loading || !isFormValid}>
                            {loading ? 'Adding...' : 'Add Location'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLocationDialog;
