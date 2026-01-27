import React, { useState, useEffect, useCallback } from 'react';
import './UserTabs.css';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { Users, TreePine, LogOut, UserCheck, Menu, X, Mail } from 'lucide-react';
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

import {
  createReferralUser,
  setReferralUsers
} from '../../store/slices/usersSlice';
import { fetchEmployees as fetchFarmvestEmployees } from '../../store/slices/farmvest/employees';


// Extracted Components
import ImageNamesModal from '../modals/ImageNamesModal';
import AdminDetailsModal from '../modals/AdminDetailsModal';
import ReferralModal from '../modals/ReferralModal';
import EditReferralModal from '../modals/EditReferralModal';
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
  const [adminReferralCode, setAdminReferralCode] = useState<string>('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    mobile: '',
    first_name: '',
    last_name: '',
    email: '',
    refered_by_mobile: '',
    refered_by_name: '',
    referral_code: '',
    role: 'Investor',
    is_test: 'false',
  });

  const [editFormData, setEditFormData] = useState({
    mobile: '',
    first_name: '',
    last_name: '',
    refered_by_mobile: '',
    refered_by_name: '',
  });

  // UI State from Redux
  const { isSidebarOpen, snackbar } = useAppSelector((state: RootState) => state.ui);
  const { creationRole } = useAppSelector((state: RootState) => state.ui.modals);
  const { editReferral: { user: editingUser } } = useAppSelector((state: RootState) => state.ui.modals);

  // Determine active tab
  const currentPath = location.pathname;
  let activeTab = 'farmvest-employees';
  if (currentPath.includes('/farmvest/employees')) activeTab = 'farmvest-employees';
  else if (currentPath.includes('/farmvest/farms')) activeTab = 'farmvest-farms';
  else if (currentPath.includes('/farmvest/user-activation')) activeTab = 'farmvest-activation';
  else if (currentPath.includes('/support-tickets')) activeTab = 'support-tickets';
  else if (currentPath.includes('/privacy-policy')) activeTab = 'privacy';
  else if (currentPath.includes('/support')) activeTab = 'support';

  const handleChoiceSelection = useCallback((type: 'investor' | 'referral') => {
    setFormData(prev => ({

      ...prev,
      role: type === 'investor' ? 'Investor' : 'Employee',
      refered_by_mobile: adminMobile || '',
      refered_by_name: displayAdminName || '',
      referral_code: adminReferralCode || '',

      is_test: 'false'
    }));
    dispatch(setReferralModalOpen(true));
  }, [adminMobile, displayAdminName, adminReferralCode, dispatch]);

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
      if (user.referral_code) setAdminReferralCode(user.referral_code);
    }
  }, [adminProfile]);

  useEffect(() => {
    if (creationRole) {
      handleChoiceSelection(creationRole === 'Investor' ? 'investor' : 'referral');
      dispatch(setCreationRole(null));
    }
  }, [creationRole, dispatch, handleChoiceSelection]);

  const hasSession = !!adminMobile;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Mobile validation: Only allow numbers and max 10 digits
    if (name === 'mobile') {
      if (value && (!/^\d*$/.test(value) || value.length > 10)) {
        return;
      }
    }

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked ? 'true' : 'false' });
    } else {
      setFormData({ ...formData, [name]: value });
      // Clear error when user types
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Mobile Validation
    if (!formData.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }

    // Name Validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    // Email Validation (Optional but must be valid if present)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'mobile':
        if (!value) error = 'Mobile number is required';
        else if (!/^\d{10}$/.test(value)) error = 'Mobile number must be 10 digits';
        break;
      case 'first_name':
        if (!value.trim()) error = 'First name is required';
        else if (value.length < 2) error = 'First name must be at least 2 characters';
        break;
      case 'last_name':
        if (!value.trim()) error = 'Last name is required';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
    }
    return error;
  };

  const handleReferralFieldBlur = (field: string) => {
    const value = formData[field as keyof typeof formData] || '';
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    if (field === 'mobile' && !error) {
      fetchReferrerDetails(formData.refered_by_mobile, false);
    }
  };

  const fetchReferrerDetails = async (mobile: string, isEditMode: boolean = false) => {
    if (!mobile || mobile.length < 10) return;
    try {
      const response = await axios.get(API_ENDPOINTS.getUserDetails(mobile));
      if (response.data && response.data.user) {
        const user = response.data.user;
        let fullName = '';
        if (user.first_name || user.last_name) {
          fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } else if (user.name) {
          fullName = user.name;
        }

        if (isEditMode) {
          setEditFormData(prev => ({ ...prev, refered_by_name: fullName }));
        } else {
          setFormData(prev => ({ ...prev, refered_by_name: fullName }));
        }
      }
    } catch (error) {
      console.log('Referrer not found or error fetching details');
    }
  };

  const handleEditReferralMobileBlur = () => {
    fetchReferrerDetails(editFormData.refered_by_mobile, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        mobile: formData.mobile,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        referral_code: formData.referral_code,
        role: formData.role,
        refered_by_mobile: formData.refered_by_mobile,
        refered_by_name: formData.refered_by_name,
        isabletoreferr: formData.role === 'Employee' || formData.role === 'SpecialCategory',
        isTestAccount: formData.is_test === 'true',
      };
      const result = await dispatch(createReferralUser(payload)).unwrap();
      if (result.message === 'User already exists') {
        alert('User already exists with this mobile number.');
      } else {
        alert('User created successfully!');
      }
      dispatch(setReferralModalOpen(false));
      setFormData({
        mobile: '',
        first_name: '',
        last_name: '',
        email: '',
        refered_by_mobile: '',
        refered_by_name: '',
        referral_code: '',
        role: 'Investor',
        is_test: 'false',
      });
      setErrors({});
      if (formData.role === 'Employee' || formData.role === 'SpecialCategory') {
        dispatch(fetchFarmvestEmployees());
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error || 'Error creating user. Please try again.');
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(API_ENDPOINTS.updateUser(editingUser.mobile), {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        refered_by_mobile: editFormData.refered_by_mobile,
        refered_by_name: editFormData.refered_by_name,
      });
      alert('User updated successfully!');
      dispatch(setEditReferralModal({ isOpen: false }));
      setEditFormData({
        mobile: '',
        first_name: '',
        last_name: '',
        refered_by_mobile: '',
        refered_by_name: '',
      });
      const refreshResponse = await axios.get(API_ENDPOINTS.getReferrals());
      dispatch(setReferralUsers(refreshResponse.data.users || []));
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    }
  };

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
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', marginLeft: '10px' }}>FarmVest Dashboard</span>
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
            <img src="/header-logo.png" alt="Markwave Logo" className="header-logo-sidebar" style={{ height: '28px' }} />
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
              <button className={`nav-item ${activeTab === 'support-tickets' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); navigate('/support-tickets'); }}>
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
      </div>

      {
        hasSession && (
          <>
            <ReferralModal formData={formData} onInputChange={handleInputChange} onBlur={handleReferralFieldBlur} onSubmit={handleSubmit} adminReferralCode={adminReferralCode} canEditReferralCode={true} errors={errors} />
            <EditReferralModal editFormData={editFormData} onInputChange={handleEditInputChange} onBlur={handleEditReferralMobileBlur} onSubmit={handleEditSubmit} />
            <ImageNamesModal />
            <AdminDetailsModal
              adminName={displayAdminName}
              adminMobile={adminMobile}
              adminRole={adminRole}
              lastLogin={lastLogin}
              presentLogin={presentLogin}
              adminReferralCode={adminReferralCode}
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