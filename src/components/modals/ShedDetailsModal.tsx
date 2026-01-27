
import React from 'react';
import './ShedDetailsModal.css';

interface ShedDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    farmName: string;
    shedCount: number | null;
    loading: boolean;
    error: string | null;
    shedsData?: any;
}

const ShedDetailsModal: React.FC<ShedDetailsModalProps> = ({
    isOpen,
    onClose,
    farmName,
    shedCount,
    loading,
    error,
    shedsData
}) => {
    if (!isOpen) return null;

    // Helper to normalize sheds data into an array
    const getShedsList = () => {
        if (!shedsData) return [];
        if (Array.isArray(shedsData)) return shedsData;
        if (shedsData.data && Array.isArray(shedsData.data)) return shedsData.data;
        // If it's an object where values are sheds
        if (typeof shedsData === 'object') {
            return Object.values(shedsData);
        }
        return [];
    };

    const shedsList = getShedsList();
    // Use shedCount as fallback if list is empty but count is > 0 (though unlikely with new API)
    const displayCount = shedsList.length > 0 ? shedsList.length : (shedCount || 0);

    return (
        <div className={`shed-modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="shed-modal-card" onClick={e => e.stopPropagation()}>
                <div className="shed-modal-header">
                    <h3>{farmName}</h3>
                    <p>Farm Overview & Shed Statistics</p>
                </div>

                <div className="shed-modal-body">
                    {loading ? (
                        <div className="shed-loader">
                            <svg className="animate-spin h-8 w-8 text-emerald-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Fetching details...</span>
                        </div>
                    ) : error ? (
                        <div className="shed-error">
                            <p>Unable to load data</p>
                            <span className="text-xs opacity-75">{error}</span>
                        </div>
                    ) : shedsList.length > 0 ? (
                        <>
                            <div className="mb-4 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded inline-block">
                                Total Valid Sheds: {displayCount}
                            </div>
                            <div className="shed-grid">
                                {shedsList.map((shed: any, idx: number) => (
                                    <div key={shed.id || idx} className="shed-card">
                                        <div className="shed-icon">🏠</div>
                                        <div className="shed-name">{shed.shed_id || shed.name || `Shed ${idx + 1}`}</div>
                                        {shed.capacity && (
                                            <div className="text-xs text-gray-500">Cap: {shed.capacity}</div>
                                        )}
                                        {/* Fallback for simple string if API returns strings */}
                                        {typeof shed === 'string' && <div className="shed-name">{shed}</div>}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="empty-sheds">
                            No sheds available for this farm.
                        </div>
                    )}
                </div>

                <div className="shed-modal-footer">
                    <button className="shed-btn-close" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ShedDetailsModal;
