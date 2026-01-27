import React from 'react';
import { useEmi } from '../../context/EmiContext';
import { Pencil, Landmark, Info, Smartphone } from 'lucide-react';
import { numberToIndianWords } from '../../utils/numberToWords';

const InputCard = () => {
    const {
        amount, setAmount,
        rate, setRate,
        months, setMonths,
        units, setUnits,
        formatCurrency,
        cpfEnabled, setCpfEnabled,
        cgfEnabled, setCgfEnabled
    } = useEmi();

    const [localAmount, setLocalAmount] = React.useState(amount);

    const UNIT_COST = 400000;

    // Sync local amount when global amount changes (e.g., on mount or reset)
    React.useEffect(() => {
        setLocalAmount(amount);
    }, [amount]);

    // Debounce effect: sync local amount to global context after 0.5 seconds
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (localAmount !== amount) {
                setAmount(localAmount);
                // Sync Units: Floor(Amount / 4L)
                const calcUnits = Math.floor(localAmount / UNIT_COST);
                setUnits(calcUnits >= 1 ? calcUnits : 1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localAmount, amount, setAmount, setUnits]);

    const perUnitBase = 350000.0;
    const perUnitCpf = 15000.0;
    const effectiveUnits = units > 0 ? units : 1;
    const requiredBase = perUnitBase * effectiveUnits;
    const requiredCpf = cpfEnabled ? perUnitCpf * effectiveUnits : 0;
    const totalRequired = requiredBase + requiredCpf;
    const surplus = amount - totalRequired;

    return (
        <div className="bg-white rounded-3xl p-4 lg:p-3 space-y-2 lg:space-y-1.5 border border-gray-100 shadow-lg h-full flex flex-col">
            <div className="flex items-center space-x-2 lg:space-x-1.5 mb-1.5 lg:mb-1">
                <div className="p-1.5 lg:p-1 bg-blue-50 rounded-lg">
                    <Pencil className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-blue-600" />
                </div>
                <h2 className="text-lg lg:text-sm font-bold text-gray-800">Loan Details</h2>
            </div>

            {/* Loan Amount */}
            <div className="space-y-0.5">
                <div className="relative">
                    <div className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Loan Amount
                    </div>
                    <div className="flex items-center bg-white border border-gray-300 rounded-xl p-2 lg:p-1.5 shadow-sm">
                        <Landmark className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-gray-400 mr-2" />
                        <span className="text-gray-600 font-bold mr-1 text-sm">₹</span>
                        <input
                            type="text"
                            value={formatCurrency(localAmount)}
                            onChange={(e) => {
                                const valStr = e.target.value.replace(/,/g, '');
                                if (!isNaN(Number(valStr))) {
                                    let val = Number(valStr);
                                    // Limit to 10 Crores
                                    if (val > 100000000) val = 100000000;
                                    setLocalAmount(val);
                                }
                            }}
                            className="bg-transparent border-none focus:outline-none w-full text-gray-800 font-bold text-base"
                        />
                    </div>
                </div>
                {localAmount > 0 && (
                    <div className="text-[10px] sm:text-[11px] font-bold text-primary-600 ml-1 transition-all animate-in fade-in slide-in-from-top-1">
                        {numberToIndianWords(localAmount)} Rupees
                    </div>
                )}
            </div>

            {/* CPF and CGF Group */}
            <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-white rounded-2xl p-2 lg:p-1.5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-0.5">
                        <div className="space-y-0">
                            <p className="text-xs lg:text-[11px] font-bold text-gray-700">CPF</p>
                            <p className="text-[9px] lg:text-[8px] text-gray-400 font-bold">Cattle Protection Fund</p>
                            <p className="text-[9px] lg:text-[8px] text-gray-400">₹15k per unit</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={cpfEnabled}
                                onChange={(e) => setCpfEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5c59cc]"></div>
                        </label>
                    </div>
                </div>

                {/* <div className="bg-white rounded-2xl p-2 lg:p-1.5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-0.5">
                        <div className="space-y-0">
                            <p className="text-xs lg:text-[11px] font-bold text-gray-700">CGF</p>
                            <p className="text-[9px] lg:text-[8px] text-gray-400 font-bold">Cattle Growth Fund</p>
                            <p className="text-[9px] lg:text-[8px] text-gray-400">Growth Fund</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={cgfEnabled}
                                onChange={(e) => setCgfEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f59e0b]"></div>
                        </label>
                    </div>
                </div> */}
            </div>

            {/* Calculation Info Box */}
            <div className="bg-[#ebf0f5] rounded-2xl p-2 lg:p-1.5 flex items-start space-x-1.5">
                <div className="mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <Info className="w-3 h-3 text-blue-600" />
                    </div>
                </div>
                <div className="space-y-0 w-full">
                    <p className="text-[11px] lg:text-[10px] font-bold text-gray-700">
                        ₹{formatCurrency(totalRequired)} = ₹{formatCurrency(requiredBase)} + ₹{formatCurrency(requiredCpf)} <span className="text-gray-400 font-normal">(CPF)</span>
                    </p>
                    <p className="text-[10px] lg:text-[9px] font-medium italic text-green-600">
                        Additional surplus remaining: ₹{formatCurrency(surplus)}
                    </p>
                </div>
            </div>

            {/* Units */}
            <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-tight">Units</label>
                <div className="bg-white border border-gray-100 rounded-2xl p-1.5 lg:p-1 shadow-sm">
                    <input
                        type="number"
                        min={1}
                        value={units || ''}
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                setUnits(0);
                                setAmount(UNIT_COST);
                            }
                            else {
                                let num = Number(val);
                                // Limit units to equivalent of 10 Crores (10Cr / 4L = 250)
                                if (num * UNIT_COST > 100000000) {
                                    num = Math.floor(100000000 / UNIT_COST);
                                }

                                if (!isNaN(num) && num >= 0) {
                                    setUnits(num);
                                    // Sync Amount: Units * 4L
                                    if (num >= 1) {
                                        setAmount(num * UNIT_COST);
                                    }
                                }
                            }
                        }}
                        className="bg-transparent border-none focus:outline-none w-full text-gray-800 font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
                <p className="text-[9px] lg:text-[8px] text-gray-400 font-medium px-1 leading-relaxed">
                    {units || 0} units = ₹{formatCurrency(totalRequired)} (₹{formatCurrency(perUnitBase)} + ₹{formatCurrency(perUnitCpf)} CPF per unit)
                </p>
            </div>

            {/* Interest Rate and Tenure Group */}
            <div className="grid grid-cols-2 gap-1.5 items-start mt-auto">
                <div className="space-y-0.5">
                    <label className="block text-[9px] font-bold text-gray-500 ml-1 uppercase tracking-tight leading-tight">Interest Rate</label>
                    <div className="flex items-center bg-white rounded-2xl p-1.5 lg:p-1 border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <input
                            type="number"
                            min={1}
                            value={rate || ''}
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') setRate(0);
                                else {
                                    const num = Number(val);
                                    if (!isNaN(num) && num >= 0) setRate(num);
                                }
                            }}
                            className="w-full text-sm font-bold text-gray-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-gray-400 font-bold ml-1 text-sm">%</span>
                    </div>
                </div>

                <div className="space-y-0.5">
                    <label className="block text-[9px] font-bold text-gray-500 ml-1 uppercase tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">Loan Tenure</label>
                    <div className="flex items-center bg-white rounded-2xl p-1.5 lg:p-1 border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <input
                            type="number"
                            min={1}
                            value={months || ''}
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') setMonths(0);
                                else {
                                    const num = Number(val);
                                    if (!isNaN(num) && num >= 0) setMonths(num);
                                }
                            }}
                            className="w-full text-sm font-bold text-gray-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-gray-400 font-bold ml-1 text-sm">M</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputCard;
