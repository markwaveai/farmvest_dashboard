import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Smartphone, Lock, CheckCircle, AlertCircle, X, LayoutDashboard, TreePine } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { farmvestService } from '../../services/farmvest_api';

interface LoginProps {
  onLogin: (session: { mobile: string; role: string | null }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  /* Removed selectedDashboard state */
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enterMobile' | 'enterOtp'>('enterMobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showEnvPrompt, setShowEnvPrompt] = useState(false);
  const [envPassword, setEnvPassword] = useState('');
  const [showModeSelection, setShowModeSelection] = useState(false);
  const currentEnv = localStorage.getItem('farmvest_env_mode') || 'live';

  useEffect(() => {
    const saved = window.localStorage.getItem('ak_dashboard_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.mobile) {
          onLogin({ mobile: parsed.mobile, role: parsed.role || null });
        }
      } catch {
        // ignore invalid
      }
    }
  }, [onLogin]);

  const sendOtp = async () => {
    if (!mobile || mobile.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }

    // Clear previous states
    setError(null);
    setInfo(null);

    // Farmvest Flow: Skip OTP API call, go directly to OTP entry
    setStep('enterOtp');
    setInfo('Please enter the OTP to proceed.');
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter the OTP received on WhatsApp');
      return;
    }

    // Farmvest Logic
    setLoading(true);
    setError(null);
    try {
      const data = await farmvestService.staticLogin(mobile, otp);

      // Expecting { access_token, token_type }
      if (data && data.access_token) {
        console.log('Login API Response:', data);
        let role = data.role || (data.user && data.user.role);
        const name = data.name || (data.user && data.user.name) || 'Admin';

        // Helper to extract role if it comes as an array (roles: [...]) or inside user object
        const rolesArray = data.roles || (data.user && data.user.roles);

        if (!role && rolesArray && Array.isArray(rolesArray)) {
          console.log('Parsing roles array:', rolesArray);
          // Normalize roles to uppercase for comparison
          const r = rolesArray.map((x: string) => String(x).toUpperCase());

          // Prioritize roles
          if (r.includes('ADMIN') || r.includes('SUPER_ADMIN')) role = 'ADMIN';
          else if (r.includes('FARMVEST_ADMIN') || r.includes('FARMVEST ADMIN')) role = 'FARMVEST ADMIN';
          else if (r.includes('FARM_MANAGER')) role = 'FARM_MANAGER';
          else if (r.includes('SUPERVISOR')) role = 'SUPERVISOR';
          else if (r.includes('DOCTOR')) role = 'DOCTOR';
          else if (r.includes('ASSISTANT_DOCTOR')) role = 'ASSISTANT_DOCTOR';
          else role = rolesArray[0]; // Fallback to first role
        }

        const session = {
          mobile,
          role, // Dynamic role from API
          name,
          access_token: data.access_token,
          token_type: data.token_type || 'Bearer'
        };
        window.localStorage.setItem('ak_dashboard_session', JSON.stringify(session));
        handleLoginSuccess(session);
      } else {
        setError('Login failed: Invalid response from server');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (session: any) => {
    // Show success snackbar
    setShowSnackbar(true);

    // Delay actual login to show snackbar
    setTimeout(() => {
      onLogin(session);
    }, 2000);
  };

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleWelcomeTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const newCount = clickCount + 1;
    if (newCount >= 5) {
      setShowEnvPrompt(true);
      setClickCount(0);
    } else {
      setClickCount(newCount);
      timerRef.current = setTimeout(() => setClickCount(0), 2000);
    }
  };

  const handleEnvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (envPassword === '5963') {
      setShowModeSelection(true);
      setError(null);
    } else {
      setError('Invalid environment password');
      setShowEnvPrompt(false);
      setEnvPassword('');
    }
  };

  const handleModeSelect = (mode: 'dev' | 'live') => {
    localStorage.setItem('farmvest_env_mode', mode);
    window.location.reload();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white font-sans overflow-hidden">
      {/* Success Snackbar */}
      {showSnackbar && (
        <div className="fixed top-10 right-1/2 translate-x-1/2 md:translate-x-0 md:right-10 z-[100] animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(22,163,74,0.3)] flex items-center gap-4 border border-green-500/50 backdrop-blur-sm">
            <div className="bg-white/20 p-2 rounded-full">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg">Success!</p>
              <p className="text-white/90">Welcome to Dashboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Left side: Form Content */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-20 relative bg-white overflow-hidden">
        {/* Subtle background element - Modern accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo Section */}
          <div className="flex justify-center mb-5 transform transition-transform duration-500 hover:scale-105">
            <img
              src="/farmvest-logo.png"
              alt="FarmVest Logo"
              className="h-24 object-contain"
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1
                className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight cursor-pointer select-none"
                onClick={handleWelcomeTap}
              >
                Welcome back
              </h1>
              <p className="text-gray-500 text-lg font-medium">
                Sign in to manage your farm assets
              </p>
              {currentEnv === 'dev' && (
                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-widest mt-2 border border-amber-200">
                  Development Mode
                </div>
              )}
            </div>

            {showEnvPrompt && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      {showModeSelection ? 'Select Environment' : 'Environment Switch'}
                    </h2>
                    <button onClick={() => { setShowEnvPrompt(false); setShowModeSelection(false); setEnvPassword(''); }} className="p-2 hover:bg-gray-100 rounded-full">
                      <X size={20} />
                    </button>
                  </div>

                  {!showModeSelection ? (
                    <form onSubmit={handleEnvSubmit} className="space-y-4">
                      <p className="text-sm text-gray-500">Enter security code to switch environment mode.</p>
                      <input
                        autoFocus
                        type="password"
                        value={envPassword}
                        onChange={(e) => setEnvPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter password..."
                      />
                      <button
                        type="submit"
                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                      >
                        Verify
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 mb-4">Choose the environment mode you want to switch to.</p>
                      <button
                        onClick={() => handleModeSelect('dev')}
                        className="w-full py-4 px-6 rounded-xl text-base font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard size={20} />
                        Dev_mode
                      </button>

                      <button
                        onClick={() => handleModeSelect('live')}
                        className="w-full py-4 px-6 rounded-xl text-base font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <TreePine size={20} />
                        Live
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dashboard Selection Removed */}

            {/* Error/Info Messages */}
            {error && (
              <div className="flex items-center gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {info && (
              <div className="flex items-center gap-3 text-green-600 text-sm bg-green-50 p-4 rounded-xl border border-green-100 animate-in fade-in zoom-in duration-300">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{info}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Mobile Input Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Mobile Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                    <Smartphone className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobile(val);
                    }}
                    disabled={step === 'enterOtp'}
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>

              {/* OTP Field - Rendered when step is enterOtp */}
              {step === 'enterOtp' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Verification Code</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(val);
                      }}
                      className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-200 tracking-[0.5em] text-center text-xl font-bold"
                      placeholder="••••••"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 space-y-4">
                {step === 'enterMobile' ? (
                  <button
                    onClick={sendOtp}
                    disabled={loading || mobile.length !== 10}
                    className={`w-full flex justify-center py-4 px-6 rounded-2xl text-base font-bold text-white transition-all duration-300 shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_40px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-blue-600`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : 'Submit'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={verifyOtp}
                      disabled={loading || otp.length !== 6}
                      className="w-full flex justify-center py-4 px-6 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 hover:shadow-[0_15px_30px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                      {loading ? 'Verifying...' : 'Enter OTP'}
                    </button>

                    <button
                      onClick={() => {
                        setStep('enterMobile');
                        setOtp('');
                        setError(null);
                        setInfo(null);
                      }}
                      className="w-full py-2 text-sm font-semibold text-gray-400 hover:text-blue-600 transition-colors duration-200"
                    >
                      Change Mobile Number
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase">
                  Powered by Markwave AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Visuals */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-gray-100">
        <img
          src="/dashboard_wallpaper.png"
          alt="AnimalKart Background"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 hover:scale-110"
        />
        {/* Modern Glassy Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Optimize your farm investments efficiently.
            </h2>
            <div className={`w-20 h-1.5 rounded-full bg-indigo-500`}></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-in {
          animation: fadeIn 0.4s ease-out;
        }
        .fade-in {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Login;
