import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setRejectionModal, setSnackbar } from '../../store/slices/uiSlice';
import { rejectOrder } from '../../store/slices/ordersSlice';
import './RejectionModal.css';

const RejectionModal: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isOpen, unitId } = useAppSelector((state: RootState) => state.ui.modals.rejection);
    const { adminMobile, adminRole } = useAppSelector((state: RootState) => state.auth);
    const { adminProfile } = useAppSelector((state: RootState) => state.users);

    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived Name Logic
    const realName = React.useMemo(() => {
        if (adminProfile) {
            const { first_name, last_name, name } = adminProfile;
            if (first_name || last_name) {
                return `${first_name || ''} ${last_name || ''}`.trim();
            }
            if (name) return name;
        }
        return 'Admin';
    }, [adminProfile]);

    // Reset reason when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);

    const onClose = () => {
        if (isSubmitting) return;
        dispatch(setRejectionModal({ isOpen: false, unitId: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedReason = reason.trim();

        if (!trimmedReason || !unitId) return;

        setIsSubmitting(true);
        try {
            await dispatch(rejectOrder({
                unitId,
                adminMobile,
                comments: trimmedReason
            })).unwrap();

            dispatch(setSnackbar({ message: 'Order rejected successfully!', type: 'error' }));
            dispatch(setRejectionModal({ isOpen: false, unitId: null }));
        } catch (error) {
            console.error('Error rejecting order:', error);
            dispatch(setSnackbar({ message: 'Failed to reject order.', type: 'error' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`rejection-modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="rejection-modal-card" onClick={e => e.stopPropagation()}>
                <div className="rejection-modal-header">
                    <h3>Reject Order</h3>
                    <p>Please provide a reason for rejecting this order. This message will be sent to the investor.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="rejection-modal-body">
                        <div className="admin-profile-card">
                            <div className="rejected-by-label">Rejected By:</div>
                            <div className="admin-info-simple">
                                <div className="admin-name-large">{realName}</div>
                                <div className="admin-mobile-simple">{adminMobile}</div>
                                <div className="admin-role-text">{adminRole || 'Admin'}</div>
                            </div>
                        </div>


                        <textarea
                            className="rejection-textarea"
                            placeholder="Type rejection reason here..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isSubmitting}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="rejection-modal-footer">
                        <button
                            type="button"
                            className="rejection-btn rejection-btn-cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rejection-btn rejection-btn-submit"
                            disabled={isSubmitting || !reason.trim()}
                        >
                            {isSubmitting ? 'Rejecting...' : 'Reject Order'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default RejectionModal;
