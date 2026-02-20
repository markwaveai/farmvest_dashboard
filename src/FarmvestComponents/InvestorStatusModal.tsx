import React from 'react';
import { X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import './InvestorStatusModal.css';

interface InvestorStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    investorName: string;
    currentStatus: number; // 1 for active, 0 for inactive
    loading: boolean;
}

const InvestorStatusModal: React.FC<InvestorStatusModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    investorName,
    currentStatus,
    loading
}) => {
    if (!isOpen) return null;

    const isActivating = currentStatus !== 1; // If not active (1), we are activating
    const actionText = isActivating ? 'Activate' : 'Deactivate';

    return (
        <div className="status-modal-overlay">
            <div className="status-modal-content animate-modalScale">
                <div className="status-modal-header">
                    <div className={`status-icon-bg ${isActivating ? 'activate' : 'deactivate'}`}>
                        {isActivating ? (
                            <CheckCircle2 size={24} />
                        ) : (
                            <AlertTriangle size={24} />
                        )}
                    </div>
                    <button className="close-x-btn" onClick={onClose} disabled={loading}>
                        <X size={20} />
                    </button>
                </div>

                <div className="status-modal-body">
                    <h3>Confirm {actionText}</h3>
                    <p>Are you sure you want to <strong>{actionText.toLowerCase()}</strong> the investor account for <strong>{investorName}</strong>?</p>

                    <div className="investor-info-display">
                        <div className="info-row">
                            <span className="info-label">Investor:</span>
                            <span className="info-value">{investorName}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Current Status:</span>
                            <span className="info-value" style={{ color: currentStatus === 1 ? '#16a34a' : '#ef4444' }}>
                                {currentStatus === 1 ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    <p className={`status-note ${isActivating ? 'activate' : 'deactivate'}`}>
                        {isActivating
                            ? "The investor will regain access to their account immediately."
                            : "The investor will lose access to their account immediately."}
                    </p>
                </div>

                <div className="status-modal-actions">
                    <button className="cancel-btn" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className={`confirm-status-btn ${isActivating ? 'activate' : 'deactivate'}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Processing...
                            </>
                        ) : (
                            `Yes, ${actionText}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvestorStatusModal;
