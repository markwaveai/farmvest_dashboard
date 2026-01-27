import React from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">

                {/* Header/Icon Area */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <LogOut className="w-8 h-8 text-red-600 ml-1" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
                    <p className="text-gray-500 text-sm">
                        Are you sure you want to end your session?
                    </p>
                </div>

                {/* Footer / Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 px-4 bg-red-600 border border-transparent rounded-xl text-white font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-lg shadow-red-600/20"
                    >
                        Logout
                    </button>
                </div>

                {/* Close Button absolute top-right */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default LogoutModal;
