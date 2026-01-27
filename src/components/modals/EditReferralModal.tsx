import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setEditReferralModal } from '../../store/slices/uiSlice';
import './EditReferralModal.css';

interface EditReferralModalProps {
    editFormData: {
        mobile: string;
        first_name: string;
        last_name: string;
        refered_by_mobile: string;
        refered_by_name: string;
    };
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

const EditReferralModal: React.FC<EditReferralModalProps> = ({
    editFormData,
    onInputChange,
    onBlur,
    onSubmit
}) => {
    const dispatch = useAppDispatch();
    const { isOpen: showEditModal, user: editingUser } = useAppSelector((state: RootState) => state.ui.modals.editReferral);

    const onClose = () => {
        dispatch(setEditReferralModal({ isOpen: false }));
    };
    if (!showEditModal || !editingUser) return null;

    return (
        <div className="edit-referral-modal-overlay" onClick={onClose}>
            <div className="edit-referral-modal-content" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="edit-referral-close-btn"
                >
                    ×
                </button>
                <h3 className="edit-referral-title">Edit Referral</h3>
                <form onSubmit={onSubmit} className="edit-referral-form">
                    <label className="edit-referral-label">
                        Mobile:
                        <input
                            type="tel"
                            name="mobile"
                            value={editFormData.mobile}
                            disabled
                            className="edit-referral-input edit-referral-input-disabled"
                            placeholder="Mobile number (cannot be changed)"
                        />
                    </label>
                    <label className="edit-referral-label">
                        Role:
                        <input
                            type="text"
                            name="role"
                            value={editingUser.role === 'SpecialCategory' ? 'Special Category' : (editingUser.role || 'Investor')}
                            disabled
                            className="edit-referral-input edit-referral-input-disabled"
                        />
                    </label>
                    <label className="edit-referral-label">
                        First Name:
                        <input
                            type="text"
                            name="first_name"
                            value={editFormData.first_name}
                            onChange={onInputChange}
                            required
                            placeholder="Enter first name"
                            className="edit-referral-input"
                        />
                    </label>
                    <label className="edit-referral-label">
                        Last Name:
                        <input
                            type="text"
                            name="last_name"
                            value={editFormData.last_name}
                            onChange={onInputChange}
                            required
                            placeholder="Enter last name"
                            className="edit-referral-input"
                        />
                    </label>
                    <label className="edit-referral-label">
                        Referred By(Mobile):
                        <input
                            type="tel"
                            name="refered_by_mobile"
                            value={editFormData.refered_by_mobile}
                            onChange={onInputChange}
                            onBlur={onBlur}
                            required
                            placeholder="Enter referrer's mobile"
                            className="edit-referral-input"
                        />
                    </label>
                    <label className="edit-referral-label">
                        Referred By(Name):
                        <input
                            type="text"
                            name="refered_by_name"
                            value={editFormData.refered_by_name}
                            onChange={onInputChange}
                            required
                            placeholder="Enter referrer's name"
                            className="edit-referral-input"
                        />
                    </label>
                    <button type="submit" className="edit-referral-submit-btn">Update</button>
                    <button type="button" onClick={onClose} className="edit-referral-cancel-btn">Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default EditReferralModal;
