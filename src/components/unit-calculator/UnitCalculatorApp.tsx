import React from 'react';
import './App.css';
import BuffaloFamilyTree from './components/BuffaloFamilyTree';

interface UnitCalculatorAppProps {
    tree?: boolean;
}

export const UnitCalculatorApp: React.FC<UnitCalculatorAppProps> = ({ tree = true }) => {
    return (
        <div className="App unit-calculator-root">
            <BuffaloFamilyTree tree={tree} />
        </div>
    );
};

export default UnitCalculatorApp;
