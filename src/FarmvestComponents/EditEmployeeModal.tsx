import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { RootState } from '../store';
import { updateEmployee } from '../store/slices/farmvest/employees';
import { farmvestService } from '../services/farmvest_api';
import { X, Loader2 } from 'lucide-react';

const ROLES = ['FARM_MANAGER', 'SUPERVISOR', 'DOCTOR', 'ASSISTANT_DOCTOR'];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
    onSuccess?: () => void;
}

const EditEmployeeModal: React.FC<Props> = ({ isOpen, onClose, employee, onSuccess }) => {
    const dispatch = useAppDispatch();
    const { updateLoading } = useAppSelector((state: RootState) => state.farmvestEmployees);

    const [role, setRole] = useState('');
    const [farmId, setFarmId] = useState<number | ''>('');
    const [shedId, setShedId] = useState<number | ''>('');
    const [farms, setFarms] = useState<any[]>([]);
    const [sheds, setSheds] = useState<any[]>([]);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (isOpen && employee) {
            const empRole = Array.isArray(employee.roles) ? employee.roles[0] : (employee.role || '');
            setRole(empRole.toUpperCase().replace(/\s+/g, '_'));
            setFarmId('');
            setShedId('');
            setSubmitError('');
        }
    }, [isOpen, employee]);

    useEffect(() => {
        if (isOpen) {
            farmvestService.getAllFarms({ size: 100 }).then(res => {
                if (res && Array.isArray(res.data)) setFarms(res.data);
            }).catch(() => {});
        }
    }, [isOpen]);

    useEffect(() => {
        if (farmId) {
            farmvestService.getShedsByFarm(Number(farmId)).then(res => {
                if (res && Array.isArray(res.data)) setSheds(res.data);
            }).catch(() => setSheds([]));
        } else {
            setSheds([]);
            setShedId('');
        }
    }, [farmId]);

    if (!isOpen || !employee) return null;

    const handleSubmit = async () => {
        if (!role || !farmId) {
            setSubmitError('Role and Farm are required');
            return;
        }
        if (role === 'SUPERVISOR' && !shedId) {
            setSubmitError('Shed is required for Supervisors');
            return;
        }
        setSubmitError('');

        const userId = employee.id || employee.user_id;
        const payload: any = { user_id: userId, role, farm_id: Number(farmId) };
        if (role === 'SUPERVISOR' && shedId) {
            payload.shed_id = Number(shedId);
        }

        try {
            await dispatch(updateEmployee(payload)).unwrap();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setSubmitError(typeof err === 'string' ? err : JSON.stringify(err));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Edit Assignment</h2>
                        <p className="text-xs text-gray-500">{employee.first_name} {employee.last_name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Role</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="">Select Role</option>
                            {ROLES.map(r => (
                                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Farm</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                            value={farmId}
                            onChange={(e) => setFarmId(e.target.value ? Number(e.target.value) : '')}
                        >
                            <option value="">Select Farm</option>
                            {farms.map(f => (
                                <option key={f.id} value={f.id}>{f.farm_name} ({f.location})</option>
                            ))}
                        </select>
                    </div>

                    {role === 'SUPERVISOR' && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Shed</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                value={shedId}
                                onChange={(e) => setShedId(e.target.value ? Number(e.target.value) : '')}
                                disabled={!farmId}
                            >
                                <option value="">Select Shed</option>
                                {sheds.map(s => (
                                    <option key={s.id} value={s.id}>{s.shed_name || s.shed_id}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {submitError && (
                        <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{submitError}</div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={updateLoading}
                        className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {updateLoading && <Loader2 size={16} className="animate-spin" />}
                        {updateLoading ? 'Updating...' : 'Update Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
