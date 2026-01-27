import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import './DeleteEmployeeModal.css';

interface DeleteEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    employeeName: string;
    employeeRole: string;
    loading: boolean;
}

const DeleteEmployeeModal: React.FC<DeleteEmployeeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    employeeName,
    employeeRole,
    loading
}) => {
    if (!isOpen) return null;

    return (
        <div className="delete-modal-overlay">
            <div className="delete-modal-content animate-modalScale">
                <div className="delete-modal-header">
                    <div className="warning-icon-bg">
                        <AlertTriangle className="text-red-600" size={24} />
                    </div>
                    <button className="close-x-btn" onClick={onClose} disabled={loading}>
                        <X size={20} />
                    </button>
                </div>

                <div className="delete-modal-body">
                    <h3>Confirm Deletion</h3>
                    <p>Are you sure you want to delete <strong>{employeeName}</strong>?</p>
                    <div className="role-tag-display">
                        <span className="role-label">Designation:</span>
                        <span className="role-value">{employeeRole}</span>
                    </div>
                    <p className="warning-note">This action cannot be undone. All data associated with this employee will be permanently removed.</p>
                </div>

                <div className="delete-modal-actions">
                    <button className="cancel-btn" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button className="confirm-delete-btn" onClick={onConfirm} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Deleting...
                            </>
                        ) : (
                            'Yes, Delete Employee'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteEmployeeModal;
