import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { assignTicket, updateTreatment } from '../store/slices/farmvest/tickets';
import { farmvestService } from '../services/farmvest_api';
import { FarmvestTicket, BuffaloDiseaseEnum } from '../types/farmvest';
import { X, Clock, User, Tag, FileText, Image, Check, ChevronDown, Loader2 } from 'lucide-react';
import './Tickets.css';

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    RESOLVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-50 text-orange-700',
    MEDIUM: 'bg-blue-50 text-blue-700',
    LOW: 'bg-gray-100 text-gray-600',
};

interface Props {
    ticket: FarmvestTicket | null;
    onClose: () => void;
}

const TicketDetailDrawer: React.FC<Props> = ({ ticket, onClose }) => {
    const dispatch = useAppDispatch();
    const [assistants, setAssistants] = useState<any[]>([]);
    const [loadingAssistants, setLoadingAssistants] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isUpdatingTreatment, setIsUpdatingTreatment] = useState(false);
    const [treatmentDescription, setTreatmentDescription] = useState('');
    const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);

    useEffect(() => {
        if (ticket) {
            setTreatmentDescription(ticket.description || '');
            setSelectedDiseases(ticket.disease || []);
            fetchAssistants();
        }
    }, [ticket]);

    const fetchAssistants = async () => {
        setLoadingAssistants(true);
        try {
            const res = await farmvestService.getDoctorAssistants();
            setAssistants(Array.isArray(res) ? res : (res?.data || []));
        } catch {
            setAssistants([]);
        } finally {
            setLoadingAssistants(false);
        }
    };

    const handleAssign = async (assistantId: number) => {
        if (!ticket) return;
        setIsAssigning(true);
        try {
            await dispatch(assignTicket({ ticketId: ticket.id, assistantId })).unwrap();
        } catch {
            // Error managed by Redux state
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUpdateTreatment = async () => {
        if (!ticket) return;
        setIsUpdatingTreatment(true);
        try {
            await dispatch(updateTreatment({
                ticket_id: ticket.id,
                description: treatmentDescription,
                disease: selectedDiseases,
            })).unwrap();
            setIsUpdatingTreatment(false);
        } catch {
            // Error managed by Redux state
        } finally {
            setIsUpdatingTreatment(false);
        }
    };

    if (!ticket) return null;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="ticket-drawer-overlay" onClick={onClose}>
            <div className="ticket-drawer" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">{ticket.case_id}</h2>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${STATUS_COLORS[ticket.status] || ''}`}>
                                    {ticket.status?.replace('_', ' ')}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                                    {ticket.priority}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Animal Info */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Tag size={12} /> Animal Information
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Display ID</span>
                                <span className="font-bold text-amber-600">{ticket.animal_display_id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tag</span>
                                <span className="font-medium">{ticket.animal_tag || '-'}</span>
                            </div>
                            {ticket.parking_id && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Parking ID</span>
                                    <span className="font-medium">{ticket.parking_id}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ticket Details */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={12} /> Ticket Details
                            </h3>
                            {ticket.ticket_type === 'HEALTH' && (
                                <button
                                    onClick={() => setIsUpdatingTreatment(!isUpdatingTreatment)}
                                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700"
                                >
                                    {isUpdatingTreatment ? 'Cancel' : 'Update Treatment'}
                                </button>
                            )}
                        </div>

                        {isUpdatingTreatment ? (
                            <div className="space-y-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Description</label>
                                    <textarea
                                        value={treatmentDescription}
                                        onChange={(e) => setTreatmentDescription(e.target.value)}
                                        className="w-full text-sm border border-gray-200 rounded-lg p-2 outline-none focus:border-amber-400 min-h-[100px]"
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateTreatment}
                                    disabled={isUpdatingTreatment && treatmentDescription === ticket.description}
                                    className="w-full py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loadingAssistants ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Save Treatment Details
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-400 font-bold block mb-0.5">Type</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-700">
                                        {ticket.ticket_type}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 font-bold block mb-0.5">Description</span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{ticket.description}</p>
                                </div>
                                {ticket.disease && ticket.disease.length > 0 && (
                                    <div>
                                        <span className="text-xs text-gray-400 font-bold block mb-1">Diseases</span>
                                        <div className="flex flex-wrap gap-1">
                                            {ticket.disease.map((d, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold">
                                                    {d.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {ticket.ticket_type === 'TRANSFER' && (
                                    <div className="bg-indigo-50 p-3 rounded-lg">
                                        <span className="text-xs text-indigo-600 font-bold">Transfer Direction: {ticket.transfer_direction}</span>
                                        {ticket.source_shed_id && <p className="text-xs text-gray-500 mt-1">From Shed: {ticket.source_shed_id}</p>}
                                        {ticket.destination_shed_id && <p className="text-xs text-gray-500">To Shed: {ticket.destination_shed_id}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Images */}
                    {ticket.images && ticket.images.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Image size={12} /> Images
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {ticket.images.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noreferrer"
                                        className="block aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80">
                                        <img src={url} alt={`Ticket ${i + 1}`} className="w-full h-full object-cover" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assignment */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <User size={12} /> Assignment
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center text-sm mb-3">
                                <span className="text-gray-500 font-medium">Assigned Staff</span>
                                <span className="font-bold text-gray-900">{ticket.assigned_staff_name || 'Unassigned'}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block">Assign to Assistant</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium outline-none appearance-none cursor-pointer focus:border-amber-400 disabled:opacity-50"
                                        disabled={loadingAssistants || isAssigning}
                                        onChange={(e) => handleAssign(Number(e.target.value))}
                                        value={ticket.assistant_doctor_id || ''}
                                    >
                                        <option value="">Select Assistant Doctor</option>
                                        {assistants.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                                {isAssigning && (
                                    <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold animate-pulse">
                                        <Loader2 size={10} className="animate-spin" /> Assigning task...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Clock size={12} /> Timeline
                        </h3>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-gray-700">Created</p>
                                    <p className="text-[10px] text-gray-500">{formatDate(ticket.created_at)}</p>
                                </div>
                            </div>
                            {ticket.modified_at && ticket.modified_at !== ticket.created_at && (
                                <div className="flex gap-3 items-start">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Last Modified</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(ticket.modified_at)}</p>
                                    </div>
                                </div>
                            )}
                            {ticket.approved_at && (
                                <div className="flex gap-3 items-start">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Approved</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(ticket.approved_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailDrawer;
