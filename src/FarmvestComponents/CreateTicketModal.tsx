import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { RootState } from '../store';
import { createTicket } from '../store/slices/farmvest/tickets';
import { farmvestService } from '../services/farmvest_api';
import { TicketType, TicketPriority, BuffaloDiseaseEnum } from '../types/farmvest';
import { X, Search, Loader2 } from 'lucide-react';
import './Tickets.css';

const COMMON_DISEASES: BuffaloDiseaseEnum[] = [
    'ANESTRUS', 'REPEAT_BREEDING_SYNDROME', 'METRITIS', 'ENDOMETRITIS', 'RETAINED_PLACENTA', 'OVARIAN_CYSTS', 'ABORTION',
    'MASTITIS', 'CLINICAL_MASTITIS', 'SUBCLINICAL_MASTITIS', 'TEAT_INJURY', 'UDDER_EDEMA',
    'MILK_FEVER', 'KETOSIS', 'ACIDOSIS', 'MINERAL_DEFICIENCY', 'ANEMIA',
    'FOOT_AND_MOUTH_DISEASE', 'HEMORRHAGIC_SEPTICEMIA', 'BLACK_QUARTER', 'BRUCELLOSIS', 'TUBERCULOSIS', 'JOHNES_DISEASE',
    'INTERNAL_PARASITES', 'EXTERNAL_PARASITES', 'TRYPANOSOMIASIS',
    'BLOAT', 'INDIGESTION', 'DIARRHEA', 'RUMEN_IMPACTION',
    'FOOT_ROT', 'LAMINITIS', 'OVERGROWN_HOOVES', 'LAMENESS',
    'FEVER', 'RESPIRATORY_INFECTION', 'HEAT_STRESS'
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const CreateTicketModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const { createLoading } = useAppSelector((state: RootState) => state.farmvestTickets);

    const [ticketType, setTicketType] = useState<TicketType>('HEALTH');
    const [animalQuery, setAnimalQuery] = useState('');
    const [animalResults, setAnimalResults] = useState<any[]>([]);
    const [selectedAnimalId, setSelectedAnimalId] = useState('');
    const [selectedAnimalFarmId, setSelectedAnimalFarmId] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
    const [diseases, setDiseases] = useState<BuffaloDiseaseEnum[]>([]);
    const [transferDirection, setTransferDirection] = useState<'IN' | 'OUT'>('IN');
    const [sourceShedId, setSourceShedId] = useState<string>('');
    const [destinationShedId, setDestinationShedId] = useState<string>('');
    const [sheds, setSheds] = useState<any[]>([]);
    const [imageUrl, setImageUrl] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (selectedAnimalFarmId) {
            farmvestService.getShedList(selectedAnimalFarmId).then(res => {
                setSheds(Array.isArray(res) ? res : (res?.data || []));
            }).catch(() => setSheds([]));
        } else {
            setSheds([]);
        }
    }, [selectedAnimalFarmId]);

    if (!isOpen) return null;

    const handleSearch = async (query: string) => {
        setAnimalQuery(query);
        if (query.length < 2) { setAnimalResults([]); return; }
        setSearchLoading(true);
        try {
            const res = await farmvestService.searchAnimal(query);
            const data = Array.isArray(res) ? res : (res?.data || []);
            setAnimalResults(data.slice(0, 8));
        } catch { setAnimalResults([]); }
        finally { setSearchLoading(false); }
    };

    const toggleDisease = (d: BuffaloDiseaseEnum) => {
        setDiseases(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    };

    const handleSubmit = async () => {
        if (!selectedAnimalId || !description.trim()) {
            setSubmitError('Animal ID and description are required');
            return;
        }
        setSubmitError('');
        const payload: any = {
            animal_id: selectedAnimalId,
            description: description.trim(),
            priority,
        };
        if (ticketType === 'HEALTH' && diseases.length > 0) {
            payload.disease = diseases;
        }
        if (ticketType === 'TRANSFER') {
            payload.transfer_direction = transferDirection;
            if (sourceShedId) payload.source_shed_id = parseInt(sourceShedId);
            if (destinationShedId) payload.destination_shed_id = parseInt(destinationShedId);
        }
        if (imageUrl.trim()) {
            payload.image_url = imageUrl.trim();
        }

        try {
            await dispatch(createTicket({ ticketType, payload })).unwrap();
            resetAndClose();
        } catch (err: any) {
            setSubmitError(typeof err === 'string' ? err : JSON.stringify(err));
        }
    };

    const resetAndClose = () => {
        setTicketType('HEALTH');
        setAnimalQuery('');
        setAnimalResults([]);
        setSelectedAnimalId('');
        setDescription('');
        setPriority('MEDIUM');
        setDiseases([]);
        setTransferDirection('IN');
        setSourceShedId('');
        setDestinationShedId('');
        setImageUrl('');
        setSubmitError('');
        onClose();
    };

    return (
        <div className="ticket-modal-overlay" onClick={resetAndClose}>
            <div className="ticket-modal" onClick={e => e.stopPropagation()}>
                <div className="ticket-modal-header">
                    <h2 className="text-lg font-bold text-gray-900">Create Ticket</h2>
                    <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="ticket-modal-body">
                    {/* Ticket Type */}
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Ticket Type</label>
                    <div className="ticket-type-selector">
                        {(['HEALTH', 'TRANSFER', 'VACCINATION'] as TicketType[]).map(t => (
                            <button
                                key={t}
                                className={`ticket-type-btn ${ticketType === t ? 'active' : ''}`}
                                onClick={() => setTicketType(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Animal Search */}
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Animal</label>
                    <div className="relative mb-4">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by RFID, ear tag, or animal ID..."
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400"
                            value={animalQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searchLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                        {animalResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                {animalResults.map((a: any, i: number) => (
                                    <button
                                        key={i}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50"
                                        onClick={() => {
                                            setSelectedAnimalId(a.rfid_tag || a.rfid_tag_number || a.animal_id || a.id?.toString() || '');
                                            setSelectedAnimalFarmId(a.farm_id || a.farm?.id || null);
                                            setAnimalQuery(a.rfid_tag || a.rfid_tag_number || a.animal_id || '');
                                            setAnimalResults([]);
                                        }}
                                    >
                                        <span className="font-bold text-amber-600">{a.rfid_tag || a.rfid_tag_number || a.animal_id}</span>
                                        {a.breed_name && <span className="text-gray-400 ml-2 text-xs">{a.breed_name}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedAnimalId && (
                        <div className="mb-4 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg font-bold">
                            Selected: {selectedAnimalId}
                        </div>
                    )}

                    {/* Description */}
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                    <textarea
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-amber-400 mb-4 resize-none"
                        rows={3}
                        placeholder="Describe the issue..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {/* Priority */}
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Priority</label>
                    <select
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>

                    {/* Conditional: HEALTH diseases */}
                    {ticketType === 'HEALTH' && (
                        <>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Diseases (select applicable)</label>
                            <div className="disease-checklist mb-4">
                                {COMMON_DISEASES.map(d => (
                                    <div
                                        key={d}
                                        className={`disease-item ${diseases.includes(d) ? 'selected' : ''}`}
                                        onClick={() => toggleDisease(d)}
                                    >
                                        <input type="checkbox" checked={diseases.includes(d)} readOnly className="rounded" />
                                        <span>{d.replace(/_/g, ' ')}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Conditional: TRANSFER direction */}
                    {ticketType === 'TRANSFER' && (
                        <>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Transfer Direction</label>
                            <div className="flex gap-2 mb-4">
                                {(['IN', 'OUT'] as const).map(dir => (
                                    <button
                                        key={dir}
                                        className={`flex-1 py-2 rounded-lg border-2 font-bold text-sm transition-all ${transferDirection === dir
                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                            : 'border-gray-200 text-gray-500'
                                            }`}
                                        onClick={() => setTransferDirection(dir)}
                                    >
                                        Transfer {dir}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Source Shed</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                                        value={sourceShedId}
                                        onChange={(e) => setSourceShedId(e.target.value)}
                                    >
                                        <option value="">Select Source</option>
                                        {sheds.map(s => <option key={s.id || s.shed_id} value={s.id || s.shed_id}>{s.shed_name || s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Destination Shed</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400"
                                        value={destinationShedId}
                                        onChange={(e) => setDestinationShedId(e.target.value)}
                                    >
                                        <option value="">Select Destination</option>
                                        {sheds.map(s => <option key={s.id || s.shed_id} value={s.id || s.shed_id}>{s.shed_name || s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Image URL */}
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Image URL (optional)</label>
                    <input
                        type="url"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-amber-400"
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                    />

                    {submitError && (
                        <div className="mb-4 p-2 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{submitError}</div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={createLoading}
                        className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {createLoading && <Loader2 size={16} className="animate-spin" />}
                        {createLoading ? 'Creating...' : 'Create Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTicketModal;
