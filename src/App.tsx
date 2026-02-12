import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setSession as setReduxSession } from './store/slices/authSlice';
import { fetchAdminProfile } from './store/slices/usersSlice';
import { RootState } from './store';
import React, { useState, useCallback, useEffect } from 'react';
import UserTabs from './components/UserTabs/UserTabs';
import Login from './components/auth/Login';
import { remoteConfig } from './services/remoteConfigService';

// Public Pages
import FarmvestUserActivationPage from './components/public/FarmvestUserActivationPage';

// Privacy
import PrivacyPolicy from './components/PrivacyPolicy';
import Support from './components/Support';

// Skeletons
import UsersPageSkeleton from './components/common/skeletons/UsersPageSkeleton';
import OrdersPageSkeleton from './components/common/skeletons/OrdersPageSkeleton';

// FarmVest Components (Lazy Loaded)
const FarmVestEmployees = React.lazy(() => import('./FarmvestComponents/Employees'));
const FarmVestFarms = React.lazy(() => import('./FarmvestComponents/Farms'));
const FarmVestFarmDetails = React.lazy(() => import('./FarmvestComponents/FarmDetails'));
const FarmVestEmployeeDetails = React.lazy(() => import('./FarmvestComponents/EmployeeDetailsPage'));
const FarmVestAnimalOnboarding = React.lazy(() => import('./FarmvestComponents/AnimalOnboarding/AnimalOnboarding'));
const FarmVestUnallocatedAnimals = React.lazy(() => import('./FarmvestComponents/UnallocatedAnimals/UnallocatedAnimals'));
const FarmVestInvestors = React.lazy(() => import('./FarmvestComponents/Investors'));
const FarmVestInvestorDetails = React.lazy(() => import('./FarmvestComponents/InvestorDetailsPage'));
const FarmVestInventory = React.lazy(() => import('./FarmvestComponents/Inventory'));
const FarmVestBuffalo = React.lazy(() => import('./FarmvestComponents/Buffalo'));
const FarmVestTickets = React.lazy(() => import('./FarmvestComponents/Tickets'));
const FarmVestLeaveRequests = React.lazy(() => import('./FarmvestComponents/LeaveRequests'));
const FarmVestMilkProduction = React.lazy(() => import('./FarmvestComponents/MilkProduction'));
const FarmVestAccountDeletion = React.lazy(() => import('./FarmvestComponents/AccountDeletion'));
const FarmVestDashboard = React.lazy(() => import('./FarmvestComponents/Dashboard'));

interface Session {
  mobile: string;
  role: string | null;
  name?: string;
  lastLoginTime?: string;
  currentLoginTime?: string;
}



function App() {
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      await remoteConfig.fetchConfig();
      setConfigLoaded(true);
    };
    initApp();
  }, []);

  const [session, setSession] = useState<Session | null>(() => {
    const saved = window.localStorage.getItem('ak_dashboard_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        window.localStorage.removeItem('ak_dashboard_session');
      }
    }
    return null;
  });
  const dispatch = useAppDispatch();
  const { adminProfile } = useAppSelector((state: RootState) => state.users);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session) {
      dispatch(setReduxSession({
        adminMobile: session.mobile,
        adminName: session.name || 'Admin',
        adminRole: session.role || 'Admin',
        lastLogin: session.lastLoginTime || 'First Login',
        presentLogin: session.currentLoginTime || new Date().toLocaleString(),
      }));

      // Fetch admin profile if not already loaded to prevent repeated API calls
      // Skip for specific test user causing 500 errors or Farmvest admins not in Animalkart DB
      // Fetch admin profile if not already loaded to prevent repeated API calls
      // Skip for specific test user causing 500 errors or Farmvest admins not in Animalkart DB
      if (!adminProfile && session.mobile !== '9876543210') {
        dispatch(fetchAdminProfile(session.mobile));
      } else if (adminProfile) {
        // Sync Logic:
        // Only update if the current session role is invalid/missing, OR if the profile role is actually 'better' or 'authorized'.
        // PROBLEM FIX: The profile returns 'SpecialCategory' but login returns 'ADMIN'. We must NOT overwrite 'ADMIN' with 'SpecialCategory'.

        const currentRole = session.role;
        const profileRole = adminProfile.role;

        // Check if current role is already a "Super Role" that shouldn't be overwritten by a weak profile role
        const isCurrentRoleAdmin = currentRole && (
          currentRole.toLowerCase() === 'admin' ||
          currentRole.toLowerCase() === 'super admin' ||
          currentRole.toLowerCase() === 'farmvest admin'
        );

        // If we are already Admin in session, and profile says something else (like SpecialCategory), IGNORE profile role.
        if (isCurrentRoleAdmin && profileRole && profileRole.toLowerCase() !== 'admin') {
          console.log(`Maintaining session role '${currentRole}' despite profile role '${profileRole}'`);
        }
        else if (profileRole && currentRole !== profileRole) {
          const updatedSession = {
            ...session,
            role: profileRole,
            name: adminProfile.name || adminProfile.full_name || session.name
          };

          // Verify if this new role is actually authorized. If not, don't sync it if we are currently authorized!
          const wouldBeAuthorized = AUTHORIZED_ROLES.includes(profileRole.toLowerCase());
          const currentlyAuthorized = currentRole && AUTHORIZED_ROLES.includes(currentRole.toLowerCase());

          if (currentlyAuthorized && !wouldBeAuthorized) {
            console.log(`Skipping sync: Profile role '${profileRole}' is not authorized, keeping authorized session role '${currentRole}'`);
          } else if (JSON.stringify(updatedSession) !== JSON.stringify(session)) {
            console.log('Syncing adminProfile to session:', updatedSession);
            setSession(updatedSession);
            window.localStorage.setItem('ak_dashboard_session', JSON.stringify(updatedSession));
          }
        }
      }
    }
  }, [dispatch, session, adminProfile]);

  const handleLogin = useCallback((s: Session) => {
    // Determine last login (from previous session or current if new)
    const prevSessionStr = window.localStorage.getItem('ak_dashboard_session');
    let lastLoginTime = new Date().toLocaleString();

    if (prevSessionStr) {
      try {
        const prevSession = JSON.parse(prevSessionStr);
        if (prevSession.currentLoginTime) {
          lastLoginTime = prevSession.currentLoginTime;
        }
      } catch (e) { }
    }

    const newSession = {
      ...s,
      currentLoginTime: new Date().toLocaleString(),
      lastLoginTime: lastLoginTime
    };

    window.localStorage.setItem('ak_dashboard_session', JSON.stringify(newSession));
    setSession(newSession);
    dispatch(setReduxSession({
      adminMobile: newSession.mobile,
      adminName: newSession.name || 'Admin',
      adminRole: newSession.role || 'Admin',
      lastLogin: newSession.lastLoginTime || 'First Login',
      presentLogin: newSession.currentLoginTime || new Date().toLocaleString(),
    }));

    // Default path for Farmvest
    const defaultPath = '/farmvest/farms';

    // Navigate to origin or default
    const from = (location.state as any)?.from?.pathname;
    const targetPath = from && from !== '/login' ? from : defaultPath;

    navigate(targetPath, { replace: true });
  }, [dispatch, location.state, navigate]);

  const handleLogout = () => {
    window.localStorage.removeItem('ak_dashboard_session');
    setSession(null);
  };

  console.log('Current Session:', session);
  console.log('Session Role:', session?.role); // DEBUG LOG
  console.log('Normalized Role:', session?.role?.toLowerCase()); // DEBUG LOG

  const AUTHORIZED_ROLES = [
    'admin',
    'super admin',
    'farmvest admin',
    'farm_manager', 'farm manager',
    'supervisor',
    'doctor',
    'assistant_doctor', 'assistant doctor',
    'assistant_doctor', 'assistant doctor', // duplications for safety
    'farm_manager', 'farm manager',
    'supervisor'
  ];

  const checkAdmin = () => {
    if (!session?.role) return false;
    const role = session.role.toLowerCase();
    const isAuth = AUTHORIZED_ROLES.includes(role);
    console.log(`Checking role '${role}' against authorized list. Result: ${isAuth}`); // DEBUG LOG
    return isAuth;
  };

  const isAdmin = checkAdmin();

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={
          session ? <Navigate to="/farmvest/farms" replace /> : <Login onLogin={handleLogin} />
        } />

        {/* FarmVest Routes */}
        <Route path="/farmvest/employees" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestEmployees />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/employees/:id" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestEmployeeDetails />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/farms" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<OrdersPageSkeleton />}>
              <FarmVestFarms />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/farms/:id" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<OrdersPageSkeleton />}>
              <FarmVestFarmDetails />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/animal-onboarding" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestAnimalOnboarding />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/unallocated-animals" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestUnallocatedAnimals />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/investors" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestInvestors />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/investors/:id" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestInvestorDetails />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/inventory" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestInventory />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/buffalo" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestBuffalo />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/tickets" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestTickets />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/leave-requests" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestLeaveRequests />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/milk-production" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestMilkProduction />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/dashboard" element={
          <ProtectedRoute session={session} isAdmin={isAdmin} handleLogout={handleLogout}>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <FarmVestDashboard />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/farmvest/account-deletion" element={
          <ConditionalLayoutWrapper session={session} handleLogout={handleLogout}>
            <FarmVestAccountDeletion />
          </ConditionalLayoutWrapper>
        } />

        <Route path="/farmvest/user-activation" element={
          <ConditionalLayoutWrapper session={session} handleLogout={handleLogout}>
            <FarmvestUserActivationPage />
          </ConditionalLayoutWrapper>
        } />

        {/* Privacy Policy */}
        <Route path="/privacy-policy" element={
          <ConditionalLayoutWrapper session={session} handleLogout={handleLogout}>
            <PrivacyPolicy />
          </ConditionalLayoutWrapper>
        } />

        {/* Support Page */}
        <Route path="/support" element={
          <ConditionalLayoutWrapper session={session} handleLogout={handleLogout}>
            <Support />
          </ConditionalLayoutWrapper>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={session ? "/farmvest/farms" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={session ? "/farmvest/farms" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

const ProtectedRoute = ({ children, session, isAdmin, handleLogout }: { children: React.ReactNode, session: Session | null, isAdmin: boolean, handleLogout: () => void }) => {
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // Simplified check for Farmvest Dashboard
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Access Restricted</h2>
        <p style={{ marginBottom: 0 }}>Only authorized Admin users can access this dashboard. Please login with an Admin mobile.</p>
        <button onClick={handleLogout} style={{ marginTop: '1rem', padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>
    );
  }

  return (
    <UserTabs
      adminMobile={session.mobile}
      adminName={session.name}
      adminRole={session.role || undefined}
      lastLogin={session.lastLoginTime}
      presentLogin={session.currentLoginTime}
      onLogout={handleLogout}
    >
      {children}
    </UserTabs>
  );
};

const ConditionalLayoutWrapper = ({ children, session, handleLogout }: { children: React.ReactNode, session: Session | null, handleLogout: () => void }) => {
  const location = useLocation();

  // Dashboard paths that should show layout if logged in
  const dashboardPaths = [
    '/farmvest/user-activation',
    '/farmvest/account-deletion',
    '/privacy-policy',
    '/support'
  ];

  const isDashboardPath = dashboardPaths.some(path => location.pathname.startsWith(path));
  const shouldShowLayout = (location.state?.fromDashboard || isDashboardPath) && session;

  if (shouldShowLayout) {
    return (
      <UserTabs
        adminMobile={session?.mobile}
        adminName={session?.name}
        adminRole={session?.role || undefined}
        lastLogin={session?.lastLoginTime}
        presentLogin={session?.currentLoginTime}
        onLogout={handleLogout}
      >
        {children}
      </UserTabs>
    );
  }

  return <>{children}</>;
};

export default App;
