import React from 'react';
import './App.css';
import BuffaloFamilyTree from './components/BuffaloFamilyTree';

export const BuffaloVisualizerApp: React.FC = () => {
    return (
        <div className="App buffalo-visualizer-root">
            <BuffaloFamilyTree />
        </div>
    );
};

export default BuffaloVisualizerApp;
