import React from 'react';
import BuffaloTree from '../BuffaloTree';
import '../BuffaloTree.css';

const BuffaloTreeTab: React.FC = () => {
    return (
        <div>
            {/* Buffalo Tree tab content */}
            <div className="buffalo-tree-tab-container">
                <h2>Buffalo Family Tree</h2>
                <div className="tree-wrapper">
                    {/* Render BuffaloTree component */}
                    <div id="buffalo-tree-root">
                        <BuffaloTree />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuffaloTreeTab;
