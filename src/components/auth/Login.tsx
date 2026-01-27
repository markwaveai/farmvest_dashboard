import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Smartphone, Lock, CheckCircle, AlertCircle, X, LayoutDashboard, TreePine } from 'lucide-react';
import { API_CONFIG } from '../../config/api';
import { farmvestService } from '../../services/farmvest_api';

interface LoginProps {
  onLogin: (session: { mobile: string; role: string | null }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedDashboard, setSelectedDashboard] = useState<'animalkart' | 'farmvest'>('animalkart');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enterMobile' | 'enterOtp'>('enterMobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [serverOtp, setServerOtp] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

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
    if (selectedDashboard === 'farmvest') {
      setStep('enterOtp');
      setInfo('Please enter the OTP to proceed.');
      return;
    }

    // Animalkart Flow: Send OTP via WhatsApp
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.getBaseUrl();
      const res = await axios.post(`${baseUrl}/otp/send-whatsapp`, {
        mobile,
        appName: 'animalkart_dashboard', // Always animalkart_dashboard for this flow
      });

      if (res.data?.statuscode !== 200) {
        setError(res.data?.message || 'Failed to send OTP');
        return;
      }

      const otpFromServer = res.data?.otp || null;
      setServerOtp(otpFromServer);
      setStep('enterOtp');
      setInfo('OTP sent via WhatsApp.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to send OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter the OTP received on WhatsApp');
      return;
    }

    if (selectedDashboard === 'animalkart') {
      if (!serverOtp) {
        setError('No OTP found from server. Please request a new OTP.');
        return;
      }

      if (otp !== serverOtp) {
        setError('Invalid OTP. Please try again.');
        return;
      }

      const role = 'Animalkart admin';
      const session = { mobile, role };
      window.localStorage.setItem('ak_dashboard_session', JSON.stringify(session));

      handleLoginSuccess(session);
    } else {
      // Farmvest Logic
      setLoading(true);
      setError(null);
      try {
        const data = await farmvestService.staticLogin(mobile, otp);

        // Expecting { access_token, token_type }
        if (data && data.access_token) {
          const role = 'Farmvest admin';
          const session = {
            mobile,
            role,
            access_token: data.access_token,
            token_type: data.token_type || 'Bearer'
          };
          window.localStorage.setItem('ak_dashboard_session', JSON.stringify(session));
          handleLoginSuccess(session);
        } else {
          setError('Login failed: Invalid response from server');
        }
      } catch (e: any) {
        console.error('Farmvest login error:', e);
        setError(e.response?.data?.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
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
              <p className="text-white/90">Welcome to {selectedDashboard === 'animalkart' ? 'AnimalKart' : 'FarmVest'} dashboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Left side: Form Content */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-20 relative bg-white">
        {/* Subtle background element */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="flex justify-start mb-12">
            <img
              src="/login-logo.png"
              alt="AnimalKart Logo"
              className="h-10 object-contain"
              onError={(e) => {
                e.currentTarget.src = "/header-logo-new.png"; // Fallback to another logo if this one is white-on-transparent
              }}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                Welcome back
              </h1>
              <p className="text-gray-500 text-lg">
                Choose your dashboard to continue
              </p>
            </div>

            {/* Dashboard Selection */}
            {step === 'enterMobile' && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setSelectedDashboard('animalkart')}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden group ${selectedDashboard === 'animalkart'
                    ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${selectedDashboard === 'animalkart' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-400 border border-gray-100'
                    }`}>
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <p className={`font-bold text-lg ${selectedDashboard === 'animalkart' ? 'text-blue-900' : 'text-gray-600'}`}>
                    Animalkart
                  </p>
                  <p className="text-xs text-gray-400 font-medium">Core Management</p>

                  {selectedDashboard === 'animalkart' && (
                    <div className="absolute top-3 right-3 text-blue-600">
                      <CheckCircle className="w-5 h-5 fill-blue-600 text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setSelectedDashboard('farmvest')}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden group ${selectedDashboard === 'farmvest'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${selectedDashboard === 'farmvest' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-400 border border-gray-100'
                    }`}>
                    <TreePine className="w-6 h-6" />
                  </div>
                  <p className={`font-bold text-lg ${selectedDashboard === 'farmvest' ? 'text-indigo-900' : 'text-gray-600'}`}>
                    Farmvest
                  </p>
                  <p className="text-xs text-gray-400 font-medium">Investment Portal</p>

                  {selectedDashboard === 'farmvest' && (
                    <div className="absolute top-3 right-3 text-indigo-600">
                      <CheckCircle className="w-5 h-5 fill-indigo-600 text-white" />
                    </div>
                  )}
                </button>
              </div>
            )}

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
                    onChange={(e) => setMobile(e.target.value)}
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
                      onChange={(e) => setOtp(e.target.value)}
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
                    disabled={loading}
                    className={`w-full flex justify-center py-4 px-6 rounded-2xl text-base font-bold text-white transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider ${selectedDashboard === 'animalkart'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                      }`}
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
                      disabled={loading}
                      className="w-full flex justify-center py-4 px-6 rounded-2xl text-base font-bold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
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
            <div className="pt-12 text-center">
              <p className="text-gray-400 text-xs font-medium tracking-widest uppercase">
                @Powered by Markwave
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Visuals */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-gray-100">
        <img
          src="/dashboard_wallpaper.jpeg"
          alt="AnimalKart Background"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 hover:scale-110"
        />
        {/* Modern Glassy Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              {selectedDashboard === 'animalkart'
                ? 'Manage your cattle inventory with ease.'
                : 'Optimize your farm investments efficiently.'}
            </h2>
            <div className={`w-20 h-1.5 rounded-full ${selectedDashboard === 'animalkart' ? 'bg-blue-500' : 'bg-indigo-500'}`}></div>
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
