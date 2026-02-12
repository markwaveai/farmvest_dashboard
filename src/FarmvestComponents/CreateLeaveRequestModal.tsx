import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { RootState } from '../store';
import { createLeaveRequest } from '../store/slices/farmvest/leaveRequests';
import { LeaveType } from '../types/farmvest';
import { X, Loader2 } from 'lucide-react';
import './LeaveRequests.css';

const LEAVE_TYPES: LeaveType[] = ['CASUAL', 'SICK', 'ANNUAL', 'MATERNITY', 'PATERNITY', 'UNPAID'];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const CreateLeaveRequestModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const { createLoading } = useAppSelector((state: RootState) => state.farmvestLeaveRequests);

    const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitError, setSubmitError] = useState('');

    if (!isOpen) return null;

    const today = new Date().toISOString().split('T')[0];

    const duration = startDate && endDate
        ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 0;

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason.trim()) {
            setSubmitError('All fields are required');
            return;
        }
        if (reason.trim().length < 10) {
            setSubmitError('Reason must be at least 10 characters');
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            setSubmitError('End date must be after start date');
            return;
        }
        setSubmitError('');

        try {
            await dispatch(createLeaveRequest({
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason.trim(),
            })).unwrap();
            resetAndClose();
        } catch (err: any) {
            setSubmitError(typeof err === 'string' ? err : JSON.stringify(err));
        }
    };

    const resetAndClose = () => {
        setLeaveType('CASUAL');
        setStartDate('');
        setEndDate('');
        setReason('');
        setSubmitError('');
        onClose();
    };

    return (
        <div className="leave-modal-overlay" onClick={resetAndClose}>
            <div className="leave-modal" onClick={e => e.stopPropagation()}>
                <div className="leave-modal-header">
                    <h2 className="text-lg font-bold text-gray-900">Request Leave</h2>
                    <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="leave-modal-body">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Leave Type</label>
                    <select
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-amber-400"
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    >
                        {LEAVE_TYPES.map(t => (
                            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                        ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Start Date</label>
                            <input
                                type="date"
                                min={today}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(e.target.value); }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">End Date</label>
                            <input
                                type="date"
                                min={startDate || today}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {duration > 0 && (
                        <div className="mb-4 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                            Duration: {duration} day{duration !== 1 ? 's' : ''}
                        </div>
                    )}

                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Reason</label>
                    <textarea
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-amber-400 mb-1 resize-none"
                        rows={3}
                        placeholder="Describe the reason for leave (min 10 characters)..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={500}
                    />
                    <p className="text-[10px] text-gray-400 mb-4 text-right">{reason.length}/500</p>

                    {submitError && (
                        <div className="mb-4 p-2 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{submitError}</div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={createLoading}
                        className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {createLoading && <Loader2 size={16} className="animate-spin" />}
                        {createLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateLeaveRequestModal;
