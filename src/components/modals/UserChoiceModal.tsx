import React from 'react';
import { UserPlus, Users, X } from 'lucide-react';
import './UserChoiceModal.css';

interface UserChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: 'investor' | 'referral') => void;
}

const UserChoiceModal: React.FC<UserChoiceModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="choice-modal-overlay">
            <div className="choice-modal-content">
                <div className="choice-modal-header">
                    <h3 className="choice-modal-title">Select Account Type</h3>
                    <button onClick={onClose} className="choice-modal-close">
                        <X size={20} />
                    </button>
                </div>

                <p className="choice-modal-subtitle">Choose the type of account you want to create</p>

                <div className="choice-modal-options">
                    <button
                        className="choice-option-card investor"
                        onClick={() => onSelect('investor')}
                    >
                        <div className="option-icon-container">
                            <UserPlus size={32} />
                        </div>
                        <div className="option-text">
                            <span className="option-title">Investor</span>
                            <span className="option-desc">Create a new investor account</span>
                        </div>
                    </button>

                    <button
                        className="choice-option-card employee"
                        onClick={() => onSelect('referral')}
                    >
                        <div className="option-icon-container">
                            <Users size={32} />
                        </div>
                        <div className="option-text">
                            <span className="option-title">Employee</span>
                            <span className="option-desc">Create a new employee/admin account</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserChoiceModal;
