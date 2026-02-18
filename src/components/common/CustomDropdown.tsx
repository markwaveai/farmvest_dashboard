import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomDropdown.css';

interface CustomDropdownProps {
    options: { value: string | number; label: string }[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    className?: string;
    hideIcon?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, placeholder, disabled, className, hideIcon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div className={`custom-dropdown-container ${className || ''}`} ref={dropdownRef}>
            <div
                className={`custom-dropdown-trigger ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                {!hideIcon && (
                    <ChevronDown
                        size={20}
                        color="#9CA3AF"
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease-in-out'
                        }}
                    />
                )}
            </div>
            {isOpen && !disabled && (
                <div className="custom-dropdown-menu">
                    {options.length > 0 ? (
                        options.map((opt) => (
                            <div
                                key={opt.value}
                                className={`custom-dropdown-item ${String(opt.value) === String(value) ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(String(opt.value));
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                            </div>
                        ))
                    ) : (
                        <div className="custom-dropdown-item" style={{ cursor: 'default', color: '#9CA3AF' }}>
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
