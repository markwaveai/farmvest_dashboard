import React from 'react';
import './Loader.css';

interface LoaderProps {
    type?: 'spinner' | 'overlay';
    size?: string; // e.g. '40px'
}

const Loader: React.FC<LoaderProps> = ({ type = 'spinner', size }) => {
    if (type === 'overlay') {
        return (
            <div className="loader-overlay">
                <div className="loader-spinner" style={size ? { width: size, height: size } : {}}></div>
            </div>
        );
    }

    return (
        <div className="loader-container">
            <div className="loader-spinner" style={size ? { width: size, height: size } : {}}></div>
        </div>
    );
};

export default Loader;
