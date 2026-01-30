import React from 'react';
import './CommonShedGrid.css';

interface ShedPosition {
    id?: string | number;
    label: string;
    status: string; // 'Available', 'Occupied', etc.
    meta?: any; // Extra data like animal_id
}

interface CommonShedGridProps {
    positions: ShedPosition[];
    layout: 'row' | 'column'; // 'row' = Horizontal groups (A, B...), 'column' = Vertical columns (R1, R2...)
    groups: string[]; // Labels for the groups (e.g. ['A', 'B'] or ['R1', 'R2'])

    // Optional customization
    onSlotClick?: (position: ShedPosition, e?: React.MouseEvent) => void;
    renderSlot?: (position: ShedPosition) => React.ReactNode;
}

const CommonShedGrid: React.FC<CommonShedGridProps> = ({
    positions,
    layout,
    groups,
    onSlotClick,
    renderSlot
}) => {

    // Helper to get positions for a specific group
    const getPositionsForGroup = (groupLabel: string) => {
        const isSpecialSection = ['Drainage', 'Feed way'].includes(groupLabel);
        if (isSpecialSection) return [];

        if (layout === 'row') {
            // First look for exact prefix match (covers R1, R2, etc. if data matches)
            const directMatch = positions.filter(p => p.label.toUpperCase().startsWith(groupLabel.toUpperCase()));
            if (directMatch.length > 0) return directMatch;

            // Fallback: Mapping R1 to A, R2 to B, etc.
            // We only do this if it looks like an "R" label
            if (groupLabel.toUpperCase().startsWith('R')) {
                const num = parseInt(groupLabel.replace(/\D/g, ''));
                if (!isNaN(num)) {
                    const targetChar = String.fromCharCode(65 + (num - 1)); // R1 -> A
                    return positions.filter(p => p.label.toUpperCase().startsWith(targetChar));
                }
            }
            return [];
        } else {
            // Column Layout logic...
            const groupIndex = groups.indexOf(groupLabel);
            if (groupIndex === -1) return [];

            const targetChar = String.fromCharCode(65 + groupIndex);
            return positions.filter(p => p.label.toUpperCase().startsWith(targetChar));
        }
    };

    return (
        <div className={`common-shed-grid layout-${layout}`}>
            {groups.map((groupLabel, index) => {
                const groupPositions = getPositionsForGroup(groupLabel);
                const isSpecial = groupPositions.length === 0 && ['Drainage', 'Feed way'].includes(groupLabel);

                return (
                    <div key={`${groupLabel}-${index}`} className={`common-shed-group layout-${layout} ${isSpecial ? 'special-section' : ''} section-${groupLabel.toLowerCase().replace(/\s+/g, '-')}`}>
                        <div className={`group-header layout-${layout}`}>
                            {isSpecial ? groupLabel : (layout === 'row' ? `Row ${groupLabel}` : groupLabel)}
                        </div>

                        {!isSpecial && (
                            <div className={`grid-slots-container layout-${layout}`}>
                                {groupPositions.map(pos => {
                                    const isOccupied = pos.status.toLowerCase() !== 'available';
                                    return (
                                        <div
                                            key={pos.label}
                                            className={`common-slot-card ${isOccupied ? 'occupied' : 'available'}`}
                                            onClick={(e) => onSlotClick && onSlotClick(pos, e)}
                                        >
                                            {renderSlot ? renderSlot(pos) : (
                                                <span className="slot-label">{pos.label}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CommonShedGrid;
