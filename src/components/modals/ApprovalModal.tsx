import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setApprovalModal, setSnackbar } from '../../store/slices/uiSlice';
import { approveOrder } from '../../store/slices/ordersSlice';
import './ApprovalModal.css';

const ApprovalModal: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isOpen, unitId } = useAppSelector((state: RootState) => state.ui.modals.approval);
    const { adminMobile, adminRole } = useAppSelector((state: RootState) => state.auth);
    const { adminProfile } = useAppSelector((state: RootState) => state.users);

    const [comment, setComment] = useState('');
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

    const onClose = () => {
        if (isSubmitting) return;
        dispatch(setApprovalModal({ isOpen: false, unitId: null }));
        setComment('');
    };

    const handleApprove = async () => {
        if (!unitId) return;

        setIsSubmitting(true);
        try {
            await dispatch(approveOrder({
                unitId,
                adminMobile,
                comments: comment,
            })).unwrap();

            dispatch(setSnackbar({ message: 'Order approved successfully!', type: 'success' }));
            dispatch(setApprovalModal({ isOpen: false, unitId: null }));
            setComment('');
        } catch (error) {
            console.error('Error approving order:', error);
            dispatch(setSnackbar({ message: 'Failed to approve order.', type: 'error' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`approval-modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="approval-modal-card" onClick={e => e.stopPropagation()}>
                <div className="approval-modal-header">
                    <h3>Approve Order</h3>
                    <p>Are you sure you want to approve this order?</p>
                </div>

                <div className="approval-modal-body">


                    <div className="admin-profile-card">
                        <div className="approved-by-label">Approved By:</div>
                        <div className="admin-info-simple">
                            <div className="admin-name-large">{realName}</div>
                            <div className="admin-mobile-simple">{adminMobile}</div>
                            <div className="admin-role-text">{adminRole || 'Admin'}</div>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>
                            Comment
                        </label>
                        <textarea
                            className="approval-textarea"
                            placeholder="Enter approval comment (optional)..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                </div>

                <div className="approval-modal-footer">
                    <button
                        type="button"
                        className="approval-btn approval-btn-cancel"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="approval-btn approval-btn-submit"
                        onClick={handleApprove}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Approving...' : 'Approve Order'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default ApprovalModal;
