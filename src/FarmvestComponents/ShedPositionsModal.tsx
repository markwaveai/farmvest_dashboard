import React, { useEffect, useState } from 'react';
import { farmvestService } from '../services/farmvest_api';
import './ShedPositionsModal.css';
import { Camera } from 'lucide-react';

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

    // Group positions by Row Letter (A, B, C, D)
    const groupedPositions: Record<string, Position[]> = { A: [], B: [], C: [], D: [] };

    // Sort positions by number (A1, A2, A10) to ensure order
    const sortPositions = (a: Position, b: Position) => {
        const numA = parseInt(a.position_name.slice(1));
        const numB = parseInt(b.position_name.slice(1));
        return numA - numB;
    };

    positions.forEach(pos => {
        const letter = pos.position_name.charAt(0).toUpperCase();
        if (groupedPositions[letter]) {
            groupedPositions[letter].push(pos);
        }
    });

    Object.keys(groupedPositions).forEach(key => {
        groupedPositions[key].sort(sortPositions);
    });

    const renderRow = (letter: string, rowLabel: string) => {
        // Chunk positions into groups of 4
        const rowPositions = groupedPositions[letter];
        const chunks = [];
        for (let i = 0; i < rowPositions.length; i += 4) {
            chunks.push(rowPositions.slice(i, i + 4));
        }

        return (
            <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3">{rowLabel}</h4>
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide px-2">
                    {chunks.map((chunk, groupIndex) => (
                        <div key={groupIndex} className="flex flex-col items-center">
                            {/* Camera Overhead */}
                            <div className="mb-2 flex flex-col items-center animate-pulse">
                                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shadow-sm z-10">
                                    <Camera size={14} className="text-blue-600" />
                                </div>
                                <div className="h-3 w-0.5 bg-blue-200 -mt-1"></div>
                                <div className="w-full h-0.5 bg-blue-200"></div>
                            </div>

                            {/* Group of 4 Slots */}
                            <div className="flex gap-2 bg-gray-50/50 p-2 rounded-xl border border-dashed border-gray-200 relative pt-3">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-blue-200"></div>
                                {chunk.map((pos) => {
                                    const isOccupied = pos.status.toLowerCase() !== 'available';
                                    return (
                                        <div key={pos.position_name} className="flex-shrink-0 flex flex-col items-center">
                                            <div className={`
                                                w-14 h-14 border rounded-lg flex flex-col items-center justify-center bg-white shadow-sm transition-all
                                                ${isOccupied ? 'opacity-50 grayscale' : 'border-gray-200'}
                                            `}>
                                                <img
                                                    src="/buffalo_green_icon.png"
                                                    alt="Buffalo"
                                                    className="w-6 h-6 object-contain mb-1"
                                                />
                                                <span className="text-[10px] font-bold text-gray-400">{pos.position_name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const Separator = ({ label }: { label: string }) => (
        <div className="w-full bg-white border border-gray-100 rounded-lg py-3 mb-6 shadow-sm flex items-center justify-center">
            <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">{label}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#f8f9fa] w-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-8 py-5 bg-white border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{shedName}</h2>
                        <p className="text-sm text-gray-500">Layout View • {capacity} Capacity</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading layout...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-red-500">
                            <p className="mb-4 text-center max-w-md">{error}</p>
                            <button onClick={fetchPositions} className="px-4 py-2 bg-white border border-red-200 rounded-lg shadow-sm hover:bg-red-50 text-sm font-bold">Retry</button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Separator label="DRAINAGE" />
                            {renderRow('A', 'Row R1')}

                            <Separator label="FEED WAY" />
                            {renderRow('B', 'Row R2')}

                            <Separator label="DRAINAGE" />
                            {renderRow('C', 'Row R3')}

                            <Separator label="FEED WAY" />
                            {renderRow('D', 'Row R4')}

                            <Separator label="DRAINAGE" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShedPositionsModal;
