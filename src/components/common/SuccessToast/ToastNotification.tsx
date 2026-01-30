import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import './ToastNotification.css';

interface SuccessToastProps {
    message: string;
    onClose: () => void;
    isVisible: boolean;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message, onClose, isVisible }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="success-toast-container">
            <div className="success-toast-content">
                <CheckCircle2 size={24} color="#ffffff" />
                <span className="success-toast-message">{message}</span>
                <button onClick={onClose} className="success-toast-close">
                    <X size={18} color="#ffffff" />
                </button>
            </div>
        </div>
    );
};

export default SuccessToast;
