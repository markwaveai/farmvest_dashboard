
import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Calendar, Loader2, ToggleLeft, ToggleRight, LayoutGrid, ChevronDown } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrency } from './CommonComponents';


const HeaderControls = ({
    units,
    setUnits,
    years,
    setYears,
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
    setActiveTab
}: {
    units: number;
    setUnits: (val: number) => void;
    years: number;
    setYears: (val: number) => void;
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
}) => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // Generate days array based on days in month
    const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const [isCGFEnabled, setIsCGFEnabled] = useState(false);

    // Handle number input changes to prevent showing 0 when empty
    const handleNumberChange = (value: string | number, setter: (val: any) => void) => {
        if (value === '' || isNaN(Number(value))) {
            setter('');
        } else {
            const num = parseInt(value.toString(), 10);
            setter(num);
        }
    };

    // Auto-run simulation on inputs change
    useEffect(() => {
        runSimulation();
    }, [units, years, startYear, startMonth, startDay]);

    return (
        <div className="bg-white border-b border-slate-200 px-4 py-3 pb-8 z-[80] relative">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* Left Section: Configuration & Actions */}
                <div className="flex items-center gap-4">

                    {/* Configuration Group */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm">

                        {/* Units Input */}
                        <div className="flex items-center gap-1 px-1 py-1 border-r border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Units</span>
                            <input
                                type="number"
                                min="1"
                                max="1"
                                disabled
                                className="w-8 bg-transparent text-sm font-semibold text-slate-700 text-center focus:outline-none"
                                value={units || 1}
                            />
                        </div>

                        {/* Start Date Picker */}
                        <div className="flex items-center gap-1 px-1 py-1 border-r border-slate-200 relative">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start</span>
                            <div className="relative w-24">
                                <DatePicker
                                    selected={new Date(startYear, startMonth, 1)}
                                    onChange={(date: Date | null) => {
                                        if (date) {
                                            setStartYear(date.getFullYear());
                                            setStartMonth(date.getMonth());
                                            setStartDay(1);
                                        }
                                    }}
                                    minDate={new Date(2026, 0, 1)}
                                    dateFormat="MMM yyyy"
                                    showMonthYearPicker
                                    className="w-full bg-transparent text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none text-center"
                                    placeholderText="Select"
                                    onKeyDown={(e) => e.preventDefault()}
                                    popperClassName="!z-[100]"
                                    popperPlacement="bottom-start"
                                />
                            </div>
                        </div>

                        {/* Years Input */}
                        <div className="flex items-center gap-1 px-1 py-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Years</span>
                            <input
                                type="number"
                                min="4"
                                max="10"
                                className="w-12 bg-white/50 border border-slate-200 rounded px-1 text-sm font-semibold text-slate-700 text-center focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                value={years || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setYears(NaN); // Allow empty while typing
                                    } else {
                                        let num = parseInt(val, 10);
                                        if (!isNaN(num)) {
                                            // Clamp between 1-10
                                            if (num > 10) num = 10;
                                            if (num < 4) num = 4;
                                            setYears(num);
                                        }
                                    }
                                }}
                                placeholder="4-10"
                            />
                        </div>
                    </div>

                    {/* Run Button */}

                </div>

                {/* Center Section: View Toggle */}
                {treeData && (
                    <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1 shadow-inner">
                        <button
                            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-md transition-all duration-200 flex items-center gap-1.5 ${activeTab === "familyTree"
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50'
                                }`}
                            onClick={() => setActiveTab("familyTree")}
                        >
                            Tree View
                        </button>
                        <button
                            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-md transition-all duration-200 flex items-center gap-1.5 ${activeTab === "costEstimation"
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50'
                                }`}
                            onClick={() => setActiveTab("costEstimation")}
                        >
                            Revenue Projections
                        </button>

                    </div>
                )}

                {/* Right Section: Summary Stats */}
                {treeData && treeData.summaryStats && (
                    <div className="flex items-center gap-4 bg-white px-3 py-1 rounded-xl border border-slate-100 shadow-sm">

                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Buffaloes</span>
                            <span className="text-sm font-black text-slate-800">{treeData.summaryStats.totalBuffaloes}</span>
                        </div>

                        <div className="w-px h-8 bg-slate-200" />

                        {/* Asset Value - Added */}
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Asset Val</span>
                            <span className="text-sm font-black text-blue-600">{formatCurrency(treeData.summaryStats.totalAssetValue)}</span>
                        </div>

                        <div className="w-px h-8 bg-slate-200" />

                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                {isCGFEnabled ? "Net (+CGF)" : "Net Rev"}
                            </span>
                            <span className={`text-sm font-black ${isCGFEnabled ? 'text-emerald-600' : 'text-emerald-600'}`}>
                                {formatCurrency(isCGFEnabled ? treeData.summaryStats.totalNetRevenueWithCaring : treeData.summaryStats.totalNetRevenue)}
                            </span>
                        </div>

                        {/* CGF Toggle - Integrated */}
                        <button
                            onClick={() => setIsCGFEnabled(!isCGFEnabled)}
                            className={`flex items-center justify-center p-1.5 rounded-full transition-all ${isCGFEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            title={isCGFEnabled ? "Disable CGF Mode" : "Enable CGF Mode"}
                        >
                            <span className="text-[9px] font-bold uppercase mr-1.5">CGF</span>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 relative ${isCGFEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isCGFEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </button>

                        <div className="w-px h-8 bg-slate-200" />

                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total ROI</span>
                            <span className="text-sm font-black text-slate-900">
                                {formatCurrency(
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
