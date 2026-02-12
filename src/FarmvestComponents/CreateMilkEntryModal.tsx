import React, { useState } from 'react';
import { farmvestService } from '../services/farmvest_api';
import { MilkTiming } from '../types/farmvest';
import { X, Loader2 } from 'lucide-react';
import './MilkProduction.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateMilkEntryModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [timing, setTiming] = useState<MilkTiming>('MORNING');
    const [quantity, setQuantity] = useState('');
    const [animalId, setAnimalId] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    if (!isOpen) return null;

    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = async () => {
        if (!startDate || !endDate || !quantity) {
            setSubmitError('Date range and quantity are required');
            return;
        }
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            setSubmitError('Quantity must be a positive number');
            return;
        }
        setSubmitError('');
        setLoading(true);
        try {
            const payload: any = {
                start_date: startDate,
                end_date: endDate,
                timing,
                quantity: qty,
            };
            if (animalId.trim()) {
                payload.animal_id = parseInt(animalId.trim());
            }
            await farmvestService.createMilkEntry(payload);
            resetForm();
            onSuccess();
        } catch (err: any) {
            setSubmitError(err.response?.data?.detail || err.message || 'Failed to create milk entry');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStartDate('');
        setEndDate('');
        setTiming('MORNING');
        setQuantity('');
        setAnimalId('');
        setSubmitError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <div className="milk-modal-overlay" onClick={handleClose}>
            <div className="milk-modal" onClick={e => e.stopPropagation()}>
                <div className="milk-modal-header">
                    <h2 className="text-lg font-bold text-gray-900">Add Milk Entry</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="milk-modal-body">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Start Date</label>
                            <input
                                type="date"
                                max={today}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">End Date</label>
                            <input
                                type="date"
                                min={startDate || undefined}
                                max={today}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Timing</label>
                    <div className="timing-selector mb-4">
                        <button
                            className={`timing-btn morning ${timing === 'MORNING' ? 'active' : ''}`}
                            onClick={() => setTiming('MORNING')}
                        >
                            Morning
                        </button>
                        <button
                            className={`timing-btn evening ${timing === 'EVENING' ? 'active' : ''}`}
                            onClick={() => setTiming('EVENING')}
                        >
                            Evening
                        </button>
                    </div>

                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Quantity (Liters)</label>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-amber-400"
                        placeholder="e.g. 8.5"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />

                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Animal ID (optional)</label>
                    <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-amber-400"
                        placeholder="Leave empty for shed-level entry"
                        value={animalId}
                        onChange={(e) => setAnimalId(e.target.value)}
                    />

                    {submitError && (
                        <div className="mb-4 p-2 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{submitError}</div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Creating...' : 'Add Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateMilkEntryModal;
