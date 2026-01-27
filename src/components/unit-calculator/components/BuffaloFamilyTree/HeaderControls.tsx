
import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Calendar, Loader2, ToggleLeft, ToggleRight, LayoutGrid, ChevronDown } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrency, formatLargeCurrency } from './CommonComponents';
import algorithmConfig from '../../algorithms.json';


const HeaderControls = ({
    units,
    setUnits,
    durationMonths,
    setDurationMonths,
    startYear,
    setStartYear,
    startMonth,
    setStartMonth,
    startDay,
    setStartDay,
    daysInMonth,
    runSimulation,
    treeData,
    resetSimulation,
    loading,
    headerStats,
    activeTab,
    setActiveTab,
    isViewRestricted
}: {
    units: number;
    setUnits: (val: number) => void;
    durationMonths: number;
    setDurationMonths: (val: number) => void;
    startYear: number;
    setStartYear: (val: number) => void;
    startMonth: number;
    setStartMonth: (val: number) => void;
    startDay: number;
    setStartDay: (val: number) => void;
    daysInMonth: number;
    runSimulation: () => void;
    treeData: any;
    resetSimulation: () => void;
    loading: boolean;
    headerStats: any;
    activeTab: string;
    setActiveTab: (val: string) => void;
    isViewRestricted?: boolean;
}) => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // Generate days array based on days in month
    const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const [isCGFEnabled, setIsCGFEnabled] = useState(false);

    // Calculate Initial Stats based on Units (Dynamic)
    const motherPrice = algorithmConfig.assetValue.motherPrice;
    const cpfPerUnit = algorithmConfig.cpf.annualCostPerUnit;

    // Per Unit: 2 Mothers + 1 CPF Unit Cost?
    // Logic from CostEstimationTable: motherBuffaloCost = units * 2 * MOTHER_BUFFALO_PRICE
    // cpfCost = units * CPF_PER_UNIT

    const initialBuffaloCost = (units || 0) * 2 * motherPrice;
    const initialCpfCost = (units || 0) * cpfPerUnit;
    const totalInitialInvestment = initialBuffaloCost + initialCpfCost;


    const handleNumberChange = (value: string | number, setter: (val: any) => void) => {
        if (value === '' || isNaN(Number(value))) {
            setter(''); // Allow empty string state for editing
        } else {
            const num = parseInt(value.toString(), 10);
            if (num > 999) setter(999);
            else setter(num);
        }
    };

    const handleBlur = (setter: (val: any) => void, val: any, defaultVal: number = 1) => {
        if (!val || val < 1) {
            setter(defaultVal);
        } else {
            // ensure integer
            setter(Math.floor(Number(val)));
        }
    };

    // Auto-run simulation on inputs change
    useEffect(() => {
        runSimulation();
    }, [units, durationMonths, startYear, startMonth, startDay]);

    return (
        <div className="bg-white border-b border-slate-200 px-2 py-1.5 sm:px-4 sm:py-2 pb-1.5 sm:pb-2 z-[80] relative">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center lg:justify-between gap-1 sm:gap-2">

                {/* Left Section: Configuration & Actions */}
                <div className="flex items-center gap-2 sm:gap-4">

                    {/* Unified Left Card */}
                    <div className="flex items-center bg-white border border-slate-100 rounded-xl px-1 sm:px-2 py-1 shadow-sm h-full min-h-[32px] sm:min-h-[36px]">

                        {/* Units Input */}
                        <div className="flex flex-col items-center px-0.5 sm:px-1 min-w-[2.5rem] sm:min-w-[3rem]">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">Units</span>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    min="1"
                                    max="999"
                                    className="w-10 sm:w-14 bg-transparent text-xs sm:text-sm font-bold text-slate-700 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={units}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Strictly prevent negative values
                                        if (val.includes('-')) return;
                                        handleNumberChange(val, setUnits);
                                    }}
                                    onBlur={() => handleBlur(setUnits, units, 1)}
                                />
                            </div>
                        </div>

                        {/* Start Date Picker */}
                        <div className="flex flex-col items-center px-0.5 sm:px-1 min-w-[3.5rem] sm:min-w-[4rem]">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">Start</span>
                            <div className="relative w-20 sm:w-24 flex justify-center">
                                <DatePicker
                                    selected={new Date(startYear, startMonth, 1)}
                                    onChange={(date: Date | null) => {
                                        if (date) {
                                            setStartYear(date.getFullYear());
                                            setStartMonth(date.getMonth());
                                            setStartDay(1);
                                            setDurationMonths(120); // Reset to 10 years logic
                                        }
                                    }}
                                    minDate={new Date(2026, 0, 1)}
                                    dateFormat="MMM yyyy"
                                    showMonthYearPicker
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-700 cursor-pointer focus:outline-none text-center hover:text-indigo-600 transition-colors"
                                    placeholderText="Select"
                                    onKeyDown={(e) => e.preventDefault()}
                                    popperClassName="!z-[100]"
                                    popperPlacement="bottom-start"
                                />
                            </div>
                        </div>

                        {/* End Date Picker - Month/Year Selection */}
                        <div className="flex flex-col items-center px-0.5 sm:px-1 min-w-[3.5rem] sm:min-w-[4rem]">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">End Date</span>
                            <div className="relative w-20 sm:w-24 flex justify-center">
                                <DatePicker
                                    selected={(() => {
                                        const endDate = new Date(startYear, startMonth + durationMonths - 1); // -1 because duration includes start month
                                        return endDate;
                                    })()}
                                    onChange={(date: Date | null) => {
                                        if (date) {
                                            const selectedYear = date.getFullYear();
                                            const selectedMonth = date.getMonth();

                                            // Diff in months: (SelectedY - StartY)*12 + (SelectedM - StartM) + 1
                                            // +1 because if start Jan, end Jan, that's 1 month duration.
                                            let newDuration = ((selectedYear - startYear) * 12) + (selectedMonth - startMonth) + 1;

                                            // Constants
                                            const MIN_DURATION = 37; // 3 years locking (Earliest exit Jan 2029)
                                            const MAX_DURATION = 120; // 10 years

                                            setDurationMonths(Math.max(MIN_DURATION, Math.min(MAX_DURATION, newDuration)));
                                        }
                                    }}
                                    minDate={new Date(startYear, startMonth + 36)} // 3 years locking (Starts from 37th month)
                                    maxDate={new Date(startYear, startMonth + 119)} // 10 years - 1 month
                                    showMonthYearPicker
                                    dateFormat="MMM yyyy"
                                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-700 cursor-pointer focus:outline-none text-center hover:text-indigo-600 transition-colors"
                                    onKeyDown={(e) => e.preventDefault()}
                                    popperClassName="!z-[100]"
                                    popperPlacement="bottom-start"
                                />
                            </div>
                        </div>

                        {/* Initial Investment & CPF Combined */}
                        <div className="flex flex-col items-center px-0.5 sm:px-1">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">Initial Inv</span>
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-xs sm:text-sm font-black text-slate-800">{formatLargeCurrency(totalInitialInvestment)}</span>
                                <span className="text-[8px] sm:text-[9px] font-bold text-blue-600 mt-0 whitespace-nowrap">CPF: {formatLargeCurrency(initialCpfCost)}</span>
                            </div>
                        </div>

                    </div>
                    {/* Run Button */}

                </div>


                {/* Center Section: View Toggle */}
                {treeData && !isViewRestricted && (
                    <div className="bg-white p-0.5 sm:p-1 rounded-xl border border-slate-100 shadow-sm flex items-center gap-0.5 sm:gap-1">
                        <button
                            className={`px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all duration-200 flex flex-col items-center leading-none gap-0.5 ${activeTab === "familyTree"
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                                }`}
                            onClick={() => setActiveTab("familyTree")}
                        >
                            <span>Tree</span>
                            <span>View</span>
                        </button>
                        <button
                            className={`px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all duration-200 flex flex-col items-center leading-none gap-0.5 ${activeTab === "costEstimation"
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                                }`}
                            onClick={() => setActiveTab("costEstimation")}
                        >
                            <span>Revenue</span>
                            <span>Projections</span>
                        </button>

                    </div>
                )}

                {/* Right Section: Summary Stats */}
                {treeData && treeData.summaryStats && (
                    <div className="flex items-center gap-2 sm:gap-3 bg-white px-1.5 sm:px-2 py-1 rounded-xl border border-slate-100 shadow-sm shrink-0 min-h-[32px] sm:min-h-[36px]">





                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">Buffaloes</span>
                            <span className="text-xs sm:text-sm font-black text-slate-800">{treeData.summaryStats.totalBuffaloes}</span>
                        </div>

                        <div className="w-px h-6 sm:h-8 bg-slate-200" />

                        {/* Asset Value - Added */}
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">Asset Val</span>
                            <span className="text-xs sm:text-sm font-black text-blue-600">{formatLargeCurrency(treeData.summaryStats.totalAssetValue)}</span>
                        </div>

                        <div className="w-px h-6 sm:h-8 bg-slate-200" />

                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">
                                {isCGFEnabled ? "Net (+CPF+CGF)" : "Net (+CPF)"}
                            </span>
                            <span className={`text-xs sm:text-sm font-black ${isCGFEnabled ? 'text-emerald-600' : 'text-emerald-600'}`}>
                                {formatLargeCurrency(isCGFEnabled ? treeData.summaryStats.totalNetRevenueWithCaring : treeData.summaryStats.totalNetRevenue)}
                            </span>
                        </div>

                        {/* CGF Toggle - Integrated */}
                        <button
                            onClick={() => setIsCGFEnabled(!isCGFEnabled)}
                            className={`flex items-center justify-center p-1.5 rounded-full transition-all ${isCGFEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            title={isCGFEnabled ? "Disable CGF Mode" : "Enable CGF Mode"}
                        >
                            <span className="text-[8px] sm:text-[9px] font-bold uppercase mr-1.5">CGF</span>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 relative ${isCGFEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isCGFEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </button>

                        <div className="w-px h-6 sm:h-8 bg-slate-200" />

                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0">Total ROI</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                                {formatLargeCurrency(
                                    (isCGFEnabled ? treeData.summaryStats.totalNetRevenueWithCaring : treeData.summaryStats.totalNetRevenue) +
                                    treeData.summaryStats.totalAssetValue
                                )}
                            </span>
                        </div>




                    </div>
                )}
            </div>
        </div>
    );
};

export default HeaderControls;
