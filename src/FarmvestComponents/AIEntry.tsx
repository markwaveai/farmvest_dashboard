import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import './AIEntry.css';

interface AIEntryProps {
    onBack: () => void;
    onSubmit: (data: any) => void;
    isAuthenticated?: boolean;
}

const AIEntry: React.FC<AIEntryProps> = ({ onBack, onSubmit, isAuthenticated = false }) => {
    const [semenType, setSemenType] = useState<'Normal' | 'Sorted'>('Normal');
    const [neckbandId, setNeckbandId] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const refreshDateTime = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strTime = `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
        setDateTime(strTime);
    };

    useEffect(() => {
        refreshDateTime();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!neckbandId) {
            setError('Please enter a Neckband ID');
            return;
        }

        setLoading(true);
        try {
            // Use the current time but ensure it's in the ISO format requested
            const now = new Date();
            const isoDate = now.toISOString().split('.')[0] + 'Z';

            await onSubmit({
                ai_generate_date: isoDate,
                device_id: neckbandId,
                is_ai_generated: false,
                semen_straw_type: semenType.toUpperCase()
            });
            setNeckbandId(''); // Clear input for next entry
            refreshDateTime(); // Refresh time for next entry
        } catch (error: any) {
            console.error('Submission failed:', error);
            setError(error.message || 'Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <header className="ai-card-header">
                {isAuthenticated && (
                    <button className="ai-entry-back-btn" onClick={onBack}>
                        <ChevronLeft size={24} />
                    </button>
                )}
                <h2 style={!isAuthenticated ? { marginRight: 0 } : {}}>AI ENTRY</h2>
            </header>

            <div className="ai-entry-content">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Semen Straw Type</label>
                        <div className="straw-type-toggle">
                            <button
                                type="button"
                                className={`toggle-btn ${semenType === 'Normal' ? 'active' : ''}`}
                                onClick={() => setSemenType('Normal')}
                            >
                                Normal
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${semenType === 'Sorted' ? 'active' : ''}`}
                                onClick={() => setSemenType('Sorted')}
                            >
                                Sorted
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Buffalo Neckband ID</label>
                        <input
                            type="text"
                            className="ai-input"
                            placeholder="Neckband ID"
                            value={neckbandId}
                            onChange={(e) => setNeckbandId(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">AI Date & Time</label>
                        <input
                            type="text"
                            className="ai-input"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
                </form>
            </div>

            <footer className="ai-entry-footer">
                <button className="ai-submit-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </footer>
        </>
    );
};

export default AIEntry;
