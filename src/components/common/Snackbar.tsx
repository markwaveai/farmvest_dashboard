import React, { useEffect } from 'react';
import './Snackbar.css';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface SnackbarProps {
    message: string | null;
    type: 'success' | 'error' | null;
    onClose: () => void;
    duration?: number;
}

const Snackbar: React.FC<SnackbarProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div
            className={`snackbar-container snackbar-${type} animate-slideInRight`}
            style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                left: 'auto',
                transform: 'none',
                zIndex: 100000,
                width: '350px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
                color: 'white',
                overflow: 'hidden'
            }}

        >
            <div className="snackbar-content" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                {type === 'success' ? (
                    <CheckCircle className="snackbar-icon" size={20} />
                ) : (
                    <AlertCircle className="snackbar-icon" size={20} />
                )}
                <span className="snackbar-message" style={{ fontSize: '0.9rem', fontWeight: '600', flexGrow: 1 }}>{message}</span>
                <button
                    className="snackbar-close"
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', opacity: 0.8 }}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};


export default Snackbar;
