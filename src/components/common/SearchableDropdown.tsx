import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import './SearchableDropdown.css';

interface SearchableDropdownProps {
    options: { value: string | number; label: string }[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder, disabled, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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

    // Filter options
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div className={`searchable-dropdown-container ${className || ''}`} ref={dropdownRef}>
            <div
                className={`searchable-dropdown-trigger ${disabled ? 'disabled' : ''}`}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        if (!isOpen) setSearchTerm(''); // Reset search on open
                    }
                }}
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown
                    size={20}
                    color="#9CA3AF"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease-in-out'
                    }}
                />
            </div>
            {isOpen && !disabled && (
                <div className="searchable-dropdown-menu">
                    <div className="searchable-dropdown-search">
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={14} className="text-gray-400 absolute left-2" style={{ left: '8px' }} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ paddingLeft: '28px' }}
                            />
                        </div>
                    </div>
                    <div className="searchable-dropdown-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`searchable-dropdown-item ${String(opt.value) === String(value) ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(String(opt.value));
                                        setIsOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="searchable-dropdown-item no-results">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
