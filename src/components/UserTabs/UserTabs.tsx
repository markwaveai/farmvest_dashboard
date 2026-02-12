import React, { useState, useEffect, useCallback } from 'react';
import './UserTabs.css';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { Users, TreePine, LogOut, UserCheck, Menu, X, Mail, PawPrint, LayoutGrid, Briefcase, Package, Trash2 } from 'lucide-react';
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
  else if (currentPath.includes('/farmvest/investors')) activeTab = 'farmvest-investors';
  else if (currentPath.includes('/farmvest/farms')) activeTab = 'farmvest-farms';
  else if (currentPath.includes('/farmvest/user-activation')) activeTab = 'farmvest-activation';
  else if (currentPath.includes('/farmvest/animal-onboarding')) activeTab = 'animal-onboarding';
  else if (currentPath.includes('/farmvest/unallocated-animals')) activeTab = 'unallocated-animals';
  else if (currentPath.includes('/farmvest/investors')) activeTab = 'farmvest-investors';
  else if (currentPath.includes('/farmvest/inventory')) activeTab = 'farmvest-inventory';
  else if (currentPath.includes('/farmvest/buffalo')) activeTab = 'farmvest-buffalo';
  else if (currentPath.includes('/support-tickets')) activeTab = 'support-tickets';
  else if (currentPath.includes('/privacy-policy')) activeTab = 'privacy';
  else if (currentPath.includes('/support')) activeTab = 'support';
  else if (currentPath.includes('/farmvest/account-deletion')) activeTab = 'account-deletion';



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
          {/* Left: Hamburger + Dynamic Title */}
          <div className="flex items-center gap-4">
            <button className="text-gray-500 lg:hidden" onClick={() => dispatch(toggleSidebar())}>
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <img src="/farmvest-logo.png" alt="Logo" className="h-9 w-auto" />
              </div>

              <div className="flex flex-col justify-center">
                <h1 className="text-lg font-bold text-white leading-tight">
                  {activeTab === 'farmvest-employees' && 'FarmVest Employees'}
                  {activeTab === 'farmvest-farms' && 'FarmVest Farms'}
                  {activeTab === 'animal-onboarding' && 'Animal Onboarding'}
                  {activeTab === 'unallocated-animals' && 'Unallocated Animals'}
                  {activeTab === 'farmvest-investors' && 'FarmVest Investors'}
                  {activeTab === 'farmvest-inventory' && 'Farm Inventory'}
                  {activeTab === 'farmvest-buffalo' && 'Buffalo Management'}
                  {activeTab === 'farmvest-activation' && 'User Activation'}
                  {activeTab === 'support' && 'Support Tickets'}
                  {activeTab === 'privacy' && 'Privacy Policy'}
                  {activeTab === 'account-deletion' && 'Account Deletion'}
                </h1>
                <span className="text-[10px] text-gray-300 font-medium leading-none mt-0.5 md:block hidden">
                  {activeTab === 'farmvest-employees' && 'Manage all employees'}
                  {activeTab === 'farmvest-farms' && 'Overview of all farm locations'}
                  {activeTab === 'animal-onboarding' && 'Register new animals'}
                  {activeTab === 'unallocated-animals' && 'Manage shed allocations'}
                  {activeTab === 'farmvest-investors' && 'View all registered investors'}
                  {activeTab === 'farmvest-inventory' && 'Monitor resources and supplies'}
                  {activeTab === 'farmvest-buffalo' && 'Individual asset tracking and logs'}
                  {activeTab === 'farmvest-activation' && 'Activate or deactivate users'}
                  {activeTab === 'support' && 'View and manage tickets'}
                  {activeTab === 'account-deletion' && 'Permanently delete user accounts'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Status + Profile */}
          <div className="header-right">
            <div className="status-pill bg-green-100 border border-green-200 px-4 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse"></div>
              <span className="text-sm font-bold text-green-700">Online</span>
            </div>

            <div onClick={() => dispatch(setShowAdminDetails(true))} className="flex items-center gap-3 cursor-pointer ml-6 pl-6 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{displayAdminName || 'Admin User'}</p>
                <p className="text-xs text-gray-300">{adminRole || 'Administrator'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-900 border-2 border-green-100 shadow-sm overflow-hidden flex items-center justify-center text-white font-bold">
                {/* Placeholder Avatar using Initials */}
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
            <img src="/farmvest-logo.png" alt="farmvest Logo" className="header-logo-sidebar" style={{ height: '35px' }} />
          </div>
          <ul className="sidebar-menu" style={{ marginTop: '10px' }}>
            <li>
              <button className={`nav-item ${activeTab === 'farmvest-farms' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/farms'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <TreePine size={18} />
                  <span className="nav-text">Farms</span>
                </div>
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeTab === 'farmvest-employees' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/employees'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Users size={18} />
                  <span className="nav-text">Employees</span>
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
              <button className={`nav-item ${activeTab === 'farmvest-investors' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/investors'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Briefcase size={18} />
                  <span className="nav-text">Investors</span>
                </div>
              </button>
            </li>
            {/* <li>
              <button className={`nav-item ${activeTab === 'farmvest-inventory' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/inventory'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Package size={18} />
                  <span className="nav-text">Inventory</span>
                </div>
              </button>
            </li> */}
            <li>
              <button className={`nav-item ${activeTab === 'farmvest-buffalo' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/buffalo'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Users size={18} />
                  <span className="nav-text">Buffalo</span>
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
              <button className={`nav-item ${activeTab === 'account-deletion' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/farmvest/account-deletion'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Trash2 size={18} />
                  <span className="nav-text">Account Deletion</span>
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