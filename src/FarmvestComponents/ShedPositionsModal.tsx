import React, { useEffect, useState } from 'react';
import { farmvestService } from '../services/farmvest_api';
import './ShedPositionsModal.css';

interface ShedPositionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    shedId: number;
    shedName: string;
    capacity: number;
}

interface Position {
    position_name: string; // e.g., "A1", "B1"
    status: string;        // "Available" or "Occupied"
    animal_id?: string;
}

const ShedPositionsModal: React.FC<ShedPositionsModalProps> = ({ isOpen, onClose, shedId, shedName, capacity }) => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && shedId) {
            fetchPositions();
        }
    }, [isOpen, shedId]);

    const fetchPositions = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log(`[ShedPositionsModal] Fetching positions for shedId: ${shedId}`);

            // We fetch the "Occupied" or real status from API
            const data = await farmvestService.getShedPositions(shedId);
            console.log('[ShedPositionsModal] Raw data:', data);

            let apiPositions: Position[] = [];
            if (Array.isArray(data)) {
                apiPositions = data;
            } else if (data && Array.isArray(data.data)) {
                apiPositions = data.data;
            } else if (data && typeof data === 'object') {
                // Handle potential object map if API changed
                apiPositions = Object.values(data).filter((item: any) => item && item.position_name) as Position[];
            }

            console.log('[ShedPositionsModal] Parsed API positions:', apiPositions);

            // Create a Map for easy lookup of API data
            const apiPosMap = new Map();
            apiPositions.forEach(p => {
                if (p.position_name) apiPosMap.set(p.position_name.toUpperCase(), p);
            });

            // Generate the grid based on Capacity (4 columns: A, B, C, D)
            // Rows = Ceil(Capacity / 4)
            const totalRows = Math.ceil(capacity / 4);
            const columns = ['A', 'B', 'C', 'D'];
            const generatedPositions: Position[] = [];

            // We iterate ROW by ROW to match the visual grid (Row 1: A1, B1, C1, D1)
            for (let r = 1; r <= totalRows; r++) {
                for (let c = 0; c < 4; c++) {
                    if (generatedPositions.length >= capacity) break;

                    const colChar = columns[c];
                    const posName = `${colChar}${r}`;

                    // Check if API has info for this slot
                    const apiInfo = apiPosMap.get(posName);

                    // Logic: If API has it, use its status. If not, default to Available.
                    // User requested: "if filled then make them blurr" -> This means Occupied
                    generatedPositions.push({
                        position_name: posName,
                        status: apiInfo ? apiInfo.status : 'Available',
                        animal_id: apiInfo?.animal_id
                    });
                }
            }

            setPositions(generatedPositions);
        } catch (err: any) {
            console.error('Failed to load positions', err);
            // Fallback for error state
            if (capacity > 0) {
                const totalRows = Math.ceil(capacity / 4);
                const columns = ['A', 'B', 'C', 'D'];
                const generatedPositions: Position[] = [];
                for (let r = 1; r <= totalRows; r++) {
                    for (let c = 0; c < 4; c++) {
                        if (generatedPositions.length >= capacity) break;
                        generatedPositions.push({
                            position_name: `${columns[c]}${r}`,
                            status: 'Available',
                        });
                    }
                }
                setPositions(generatedPositions);
            } else {
                setPositions([]);
                setError('Failed to load shed positions.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Group positions by Letter (Row)
    const groupedPositions: { [key: string]: Position[] } = {
        'A': [], 'B': [], 'C': [], 'D': []
    };

    positions.forEach(pos => {
        const letter = pos.position_name.charAt(0).toUpperCase();
        if (groupedPositions[letter]) {
            groupedPositions[letter].push(pos);
        }
    });

    // Helper to render a group
    const renderGroup = (letter: string) => {
        const group = groupedPositions[letter];
        if (!group || group.length === 0) return null;

        return (
            <div key={letter} className="position-row-section">
                <h3 className="row-label">Row {letter}</h3>
                <div className="positions-grid-row">
                    {group.map((pos) => {
                        const isOccupied = pos.status.toLowerCase() !== 'available';
                        return (
                            <div
                                key={pos.position_name}
                                className={`position-card ${isOccupied ? 'occupied' : 'available'}`}
                            >
                                <div className="animal-icon">
                                    {/* Custom Bull Head Icon matching the reference */}
                                    {/* Custom Bull Head Icon matching the reference */}
                                    <div
                                        className="w-8 h-8"
                                        style={{
                                            maskImage: `url(${require('../components/emi-calculator/assets/buffalo_icon.png')})`,
                                            WebkitMaskImage: `url(${require('../components/emi-calculator/assets/buffalo_icon.png')})`,
                                            maskSize: 'contain',
                                            WebkitMaskSize: 'contain',
                                            maskRepeat: 'no-repeat',
                                            WebkitMaskRepeat: 'no-repeat',
                                            maskPosition: 'center',
                                            WebkitMaskPosition: 'center',
                                            backgroundColor: 'currentColor'
                                        }}
                                    />
                                </div>
                                <div className="position-name">{pos.position_name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="shed-modal-overlay" onClick={onClose}>
            <div className="shed-modal-content" onClick={e => e.stopPropagation()}>
                <div className="shed-modal-header">
                    <h2>{shedName}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="shed-modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <svg className="animate-spin h-8 w-8 text-emerald-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p>Loading positions...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>{error}</p>
                            <button onClick={fetchPositions} className="retry-btn">Retry</button>
                        </div>
                    ) : (
                        <div className="positions-vertical-container">
                            {renderGroup('A')}
                            {renderGroup('B')}
                            {renderGroup('C')}
                            {renderGroup('D')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShedPositionsModal;
