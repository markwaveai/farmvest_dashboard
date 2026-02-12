import React, { useState } from 'react';
import { farmvestService } from '../services/farmvest_api';
import Snackbar from '../components/common/Snackbar';
import { Trash2, AlertTriangle } from 'lucide-react';

const AccountDeletion: React.FC = () => {
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDeactivate = async () => {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!mobile || !phoneRegex.test(mobile)) {
            setSnackbar({ message: 'Please enter a valid 10-digit mobile number starting with 6-9', type: 'error' });
            return;
        }
        setShowConfirm(true);
    };

    const confirmDeactivation = async () => {
        setShowConfirm(false);
        setLoading(true);
        try {
            await farmvestService.deactivateUser(mobile);
            setSnackbar({ message: `User ${mobile} deactivated successfully`, type: 'success' });
            setMobile('');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to deactivate user';
            setSnackbar({ message: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8 pl-1">
                <h1 className="text-4xl font-extrabold tracking-tight" style={{
                    background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: "'Outfit', 'Inter', sans-serif"
                }}>
                    Farmvest
                </h1>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-50 rounded-full">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Account Deletion</h1>
                        <p className="text-sm text-gray-500">Delete user accounts by mobile number</p>
                    </div>
                </div>

                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Mobile Number
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">+91</span>
                        </div>
                        <input
                            type="text"
                            value={mobile}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setMobile(val);
                            }}
                            className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            placeholder="Enter 10-digit mobile number"
                        />
                    </div>

                    <button
                        onClick={handleDeactivate}
                        disabled={loading || !/^[6-9]\d{9}$/.test(mobile)}
                        className={`mt-6 w-full py-3 px-4 rounded-xl font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2
                            ${loading || !/^[6-9]\d{9}$/.test(mobile)
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}
                    >
                        {loading ? 'Processing...' : 'Delete Account'}
                    </button>
                </div>

                {/* <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                </div> */}
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Deactivation</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to deactivate the user with mobile <strong>+91 {mobile}</strong>?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-900 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeactivation}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Snackbar
                message={snackbar.message}
                type={snackbar.type === 'success' ? 'success' : snackbar.type === 'error' ? 'error' : null}
                onClose={() => setSnackbar({ message: '', type: null })}
            />
        </div>
    );
};

export default AccountDeletion;
