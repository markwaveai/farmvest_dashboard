import React, { useState, useEffect, useCallback } from 'react';
import './UserTabs.css';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { Users, TreePine, LogOut, UserCheck, Menu, X, Mail, PawPrint, LayoutGrid } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  toggleSidebar,
  setSidebarOpen,
  setShowAdminDetails,
  setReferralModalOpen,
  setEditReferralModal,
  setCreationRole,
  setSnackbar,
} from '../../store/slices/uiSlice';


import { fetchEmployees as fetchFarmvestEmployees } from '../../store/slices/farmvest/employees';


// Extracted Components
import ImageNamesModal from '../modals/ImageNamesModal';
import AdminDetailsModal from '../modals/AdminDetailsModal';
import RejectionModal from '../modals/RejectionModal';
import ApprovalModal from '../modals/ApprovalModal';
import LogoutModal from '../modals/LogoutModal';
import Snackbar from '../common/Snackbar';

interface UserTabsProps {
  adminMobile?: string;
  adminName?: string;
  adminRole?: string;
  lastLogin?: string;
  presentLogin?: string;
  onLogout?: () => void;
  children: React.ReactNode;
}

const UserTabs: React.FC<UserTabsProps> = ({ adminMobile, adminName, adminRole, lastLogin, presentLogin, onLogout, children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Local State
  const [displayAdminName, setDisplayAdminName] = useState(adminName);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    mobile: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'Investor',
    is_test: 'false',
  });

  // UI State from Redux
  const { isSidebarOpen, snackbar } = useAppSelector((state: RootState) => state.ui);

  // Determine active tab
  const currentPath = location.pathname;
  let activeTab = 'farmvest-employees';
  if (currentPath.includes('/farmvest/employees')) activeTab = 'farmvest-employees';
  else if (currentPath.includes('/farmvest/farms')) activeTab = 'farmvest-farms';
  else if (currentPath.includes('/farmvest/user-activation')) activeTab = 'farmvest-activation';
  else if (currentPath.includes('/farmvest/animal-onboarding')) activeTab = 'animal-onboarding';
  else if (currentPath.includes('/farmvest/unallocated-animals')) activeTab = 'unallocated-animals';
  else if (currentPath.includes('/support-tickets')) activeTab = 'support-tickets';
  else if (currentPath.includes('/privacy-policy')) activeTab = 'privacy';
  else if (currentPath.includes('/support')) activeTab = 'support';



  useEffect(() => {
    if (window.innerWidth <= 768) {
      dispatch(setSidebarOpen(false));
    } else {
      dispatch(setSidebarOpen(true));
    }

    const handleResize = () => {
      if (window.innerWidth <= 768) {
        dispatch(setSidebarOpen(false));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const { adminProfile } = useAppSelector((state: RootState) => state.users);

  useEffect(() => {
    if (adminProfile) {
      const user = adminProfile;
      let fullName = '';
      if (user.first_name || user.last_name) {
        fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      } else if (user.name) {
        fullName = user.name;
      }
      if (fullName) setDisplayAdminName(fullName);
    }
  }, [adminProfile]);

  const hasSession = !!adminMobile;



  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => dispatch(setSidebarOpen(false))} />

      {hasSession && (
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button className="sidebar-toggle-btn" onClick={() => dispatch(toggleSidebar())}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <img src="/header-logo.png" alt="Markwave Logo" className="header-logo" />

          </div>

          <div className="header-right">
            <div className="status-pill">
              <div className="status-dot-green"></div>
              <span className="status-text">Online</span>
            </div>
            <div onClick={() => dispatch(setShowAdminDetails(true))} className="admin-header-profile">
              <div className="admin-name-container">
                <span className="admin-name-text">{displayAdminName}</span>
              </div>
              <div className="avatar-circle admin-avatar-small">
                {displayAdminName ? displayAdminName.substring(0, 2).toUpperCase() : 'AD'}
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="layout-body">
        <nav className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`} onClick={() => dispatch(toggleSidebar())}>
          <div className="sidebar-header">
            <button className="sidebar-close-btn-mobile" onClick={(e) => { e.stopPropagation(); dispatch(setSidebarOpen(false)); }}>
              <X size={20} />
            </button>
            <img src="/header-logo.png" alt="Markwave Logo" className="header-logo-sidebar" style={{ height: '35px' }} />
          </div>
          <ul className="sidebar-menu" style={{ marginTop: '10px' }}>
            <li>
              <button className={`nav-item ${activeTab === 'farmvest-employees' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/employees'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Users size={18} />
                  <span className="nav-text">Employees</span>
                </div>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'farmvest-farms' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/farms'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <TreePine size={18} />
                  <span className="nav-text">Farms</span>
                </div>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'farmvest-activation' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/user-activation'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <UserCheck size={18} />
                  <span className="nav-text">User Activation</span>
                </div>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'animal-onboarding' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/animal-onboarding'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <PawPrint size={18} />
                  <span className="nav-text">Animal Onboarding</span>
                </div>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'unallocated-animals' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/unallocated-animals'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <LayoutGrid size={18} />
                  <span className="nav-text">Unallocated Animals</span>
                </div>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'support' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/support'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Mail size={18} />
                  <span className="nav-text">Support Ticket</span>
                </div>
              </button>
            </li>
          </ul>

          {hasSession && (
            <div className="sidebar-footer">
              <button className="nav-item logout" onClick={(e) => { e.stopPropagation(); setIsLogoutModalOpen(true); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LogOut size={18} />
                  <span className="nav-text">Logout</span>
                </div>
              </button>
            </div>
          )}
        </nav>

        <main className="main-content">
          {children}
        </main>
      </div >

      {
        hasSession && (
          <>
            <ImageNamesModal />
            <AdminDetailsModal
              adminName={displayAdminName}
              adminMobile={adminMobile}
              adminRole={adminRole}
              lastLogin={lastLogin}
              presentLogin={presentLogin}
              onLogout={() => {
                dispatch(setShowAdminDetails(false));
                setIsLogoutModalOpen(true);
              }}
            />
            <RejectionModal />
            <ApprovalModal />
            <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={onLogout!} />
            <Snackbar
              message={snackbar.message}
              type={snackbar.type as 'success' | 'error' | null}
              onClose={() => dispatch(setSnackbar({ message: null, type: null }))}
            />
          </>
        )
      }
    </div >
  );
};

export default UserTabs;