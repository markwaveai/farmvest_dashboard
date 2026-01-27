import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setShowAdminDetails } from '../../store/slices/uiSlice';
import './AdminDetailsModal.css';

interface AdminDetailsModalProps {
    adminName?: string;
    adminMobile?: string;
    adminRole?: string;
    lastLogin?: string;
    presentLogin?: string;
    adminReferralCode?: string;
    onLogout?: () => void;
}

const AdminDetailsModal: React.FC<AdminDetailsModalProps> = (props) => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state: RootState) => state.ui.showAdminDetails);
    const auth = useAppSelector((state: RootState) => state.auth);

    const adminName = props.adminName || auth.adminName;
    const adminMobile = props.adminMobile || auth.adminMobile;
    const adminRole = props.adminRole || auth.adminRole;
    const lastLogin = props.lastLogin || auth.lastLogin;
    const presentLogin = props.presentLogin || auth.presentLogin;
    const adminReferralCode = props.adminReferralCode;

    const onClose = () => {
        dispatch(setShowAdminDetails(false));
    };
    if (!isOpen) return null;

    return (
        <div onClick={onClose} className="admin-modal-overlay">
            <div
                className="admin-popover admin-modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="admin-modal-close-btn"
                >
                    ×
                </button>
                <div className="admin-modal-header">
                    <div className="admin-avatar">
                        {adminName.charAt(0)}
                    </div>
                    <div className="admin-info">
                        <h2 className="admin-name">{adminName}</h2>
                        <p className="admin-mobile">{adminMobile}</p>
                    </div>
                </div>

                <div className="admin-details-card">
                    <div>
                        <div className="admin-detail-label">Role</div>
                        <div className="admin-detail-value">{adminRole}</div>
                    </div>
                    <div>
                        <div className="admin-detail-label">Referral Code</div>
                        <div className="admin-detail-value font-mono tracking-wider">{adminReferralCode || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="admin-detail-label">Last Login</div>
                        <div className="admin-detail-value">{lastLogin || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="admin-detail-label">Present Login</div>
                        <div className="admin-detail-value">{presentLogin || 'N/A'}</div>
                    </div>
                </div>

                <div className="mt-4 px-4">
                    <button
                        onClick={props.onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        Logout
                    </button>
                </div>

                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>v1.0.1</span>
                </div>
            </div>
        </div>
    );
};

export default AdminDetailsModal;
