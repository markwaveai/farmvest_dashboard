import React, { useState } from 'react';

const CpfCgfCombined = ({
    treeData,
    buffaloDetails,
    formatCurrency,
    calculateAgeInMonths,
    monthNames,
    startYear,
    endYear,
    endMonth,
    selectedYearIndex
}: any) => {
    // const [selectedYearIndex, setSelectedYearIndex] = useState(0);

    // Helper to resolve Calendar Year/Month from Simulation Year/Month
    const getCalendarDate = (yearIndex: number, monthIndexInSim: number) => {
        const absStart = (startYear * 12 + (treeData.startMonth || 0));
        const absTarget = absStart + (yearIndex * 12) + monthIndexInSim;
        return {
            year: Math.floor(absTarget / 12),
            month: absTarget % 12,
            absMonth: absTarget
        };
    };

    // --- Helper Logic ---

    // 1. CGF Logic (Caring Cost)
    const calculateCgfForMonth = (yearIndex: number, monthIndex: number) => {
        let totalCost = 0;
        const { absMonth: currentAbsoluteMonth } = getCalendarDate(yearIndex, monthIndex);

        // Filter children (Gen > 0)
        Object.values(buffaloDetails as Record<string, any>).forEach((buffalo: any) => {
            if (buffalo.generation > 0) {
                const buffaloAbsoluteBirth = (buffalo.birthYear as number) * 12 + (buffalo.birthMonth as number || 0);

                if (buffaloAbsoluteBirth <= currentAbsoluteMonth) {
                    const ageInMonths = (currentAbsoluteMonth - buffaloAbsoluteBirth) + 1;

                    let monthlyCost = 0;
                    if (ageInMonths > 12 && ageInMonths <= 18) monthlyCost = 1000;
                    else if (ageInMonths > 18 && ageInMonths <= 24) monthlyCost = 1400;
                    else if (ageInMonths > 24 && ageInMonths <= 30) monthlyCost = 1800;
                    else if (ageInMonths > 30 && ageInMonths <= 36) monthlyCost = 2500;

                    totalCost += monthlyCost;
                }
            }
        });
        return totalCost * (treeData.units || 1);
    };

    // 2. CPF Logic
    const isCpfApplicableForMonth = (buffalo: any, yearIndex: number, monthIndex: number) => {
        // Global Limit Check
        const absoluteStart = startYear * 12 + (treeData.startMonth || 0);
        const totalDuration = treeData.durationMonths || (treeData.years * 12);
        const absoluteEnd = absoluteStart + Math.min(120, totalDuration) - 1;
        const { year, month, absMonth: currentAbsolute } = getCalendarDate(yearIndex, monthIndex);

        if (currentAbsolute < absoluteStart || currentAbsolute > absoluteEnd) return false;

        // Gen 0
        if (buffalo.generation === 0) {
            const isFirstInUnit = (buffalo.id.charCodeAt(0) - 65) % 2 === 0; // A, C, E...

            // Presence Check
            const buffaloAbsoluteAcq = (buffalo.absoluteAcquisitionMonth as number) !== undefined
                ? (buffalo.absoluteAcquisitionMonth as number)
                : (startYear * 12 + (buffalo.acquisitionMonth as number || 0)); // Fallback approximation

            if (currentAbsolute < buffaloAbsoluteAcq) return false;

            if (isFirstInUnit) {
                // Type A: Free Period for first 12 months (Sync with global logic)
                const monthsSinceStart = currentAbsolute - absoluteStart;
                if (monthsSinceStart >= 12) {
                    return true;
                }
                return false;
            } else {
                // Type B: Free Period Check (Months 6-17 relative to simulation start)
                const monthsSinceStart = currentAbsolute - absoluteStart;
                const isFreePeriod = monthsSinceStart >= 6 && monthsSinceStart < 18;
                return !isFreePeriod;
            }
        } else {
            // Offspring: Pay >= 24 months
            const ageInMonths = calculateAgeInMonths(buffalo, year, month);
            return ageInMonths >= 24;
        }
    };

    const calculateCpfForMonth = (yearIndex: number, monthIndex: number) => {
        const CPF_PER_MONTH = 15000 / 12;
        let totalCost = 0;

        Object.values(buffaloDetails as Record<string, any>).forEach((buffalo: any) => {
            if (isCpfApplicableForMonth(buffalo, yearIndex, monthIndex)) {
                totalCost += CPF_PER_MONTH;
            }
        });

        return totalCost * (treeData.units || 1);
    };

    // --- Generate Table Data ---
    const tableData = [];
    let yearlyCgf = 0;
    let yearlyCpf = 0;
    let yearlyTotal = 0;

    for (let m = 0; m < 12; m++) {
        // All 12 months in a simulation year are inherently valid unless beyond global end
        const { absMonth, month } = getCalendarDate(selectedYearIndex, m);
        const globalEnd = startYear * 12 + (treeData.startMonth || 0) + (treeData.durationMonths || (treeData.years * 12)) - 1;
        const isValid = absMonth <= globalEnd;

        const cgf = isValid ? calculateCgfForMonth(selectedYearIndex, m) : 0;
        const cpf = isValid ? calculateCpfForMonth(selectedYearIndex, m) : 0;
        const total = cgf + cpf;

        yearlyCgf += cgf;
        yearlyCpf += cpf;
        yearlyTotal += total;

        tableData.push({
            monthName: monthNames[month],
            isValid,
            cgf,
            cpf,
            total
        });
    }

    // --- Cumulative Calculations ---
    let cumulativeCgf = 0;
    let cumulativeCpf = 0;

    for (let yIndex = 0; yIndex <= selectedYearIndex; yIndex++) {
        for (let m = 0; m < 12; m++) {
            const { absMonth } = getCalendarDate(yIndex, m);
            const globalEnd = startYear * 12 + (treeData.startMonth || 0) + (treeData.durationMonths || (treeData.years * 12)) - 1;

            if (absMonth <= globalEnd) {
                cumulativeCgf += calculateCgfForMonth(yIndex, m);
                cumulativeCpf += calculateCpfForMonth(yIndex, m);
            }
        }
    }
    const cumulativeTotal = cumulativeCgf + cumulativeCpf;

    return (
        <div className="w-full mb-6 space-y-2">

            {/* 1. Top Summary Cards - KPI Grid */}
            <div className="flex overflow-x-auto pb-1 gap-1.5 md:grid md:grid-cols-3 md:pb-0 no-scrollbar -mt-2 md:mt-0">
                {/* Cumulative CPF */}
                <div className="flex-none md:flex-1 w-[23%] md:w-full min-w-[85px] bg-white rounded-md p-1 md:p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                    <div>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">Cumul. CPF</p>
                        <h3 className="text-xs md:text-base font-bold text-amber-600 mt-0.5">{formatCurrency(cumulativeCpf)}</h3>
                    </div>
                    <p className="hidden md:block text-[9px] text-slate-400 mt-1">Until Year {selectedYearIndex + 1}</p>
                    <p className="md:hidden text-[7px] text-slate-400 mt-0.5 leading-none">Yr {selectedYearIndex + 1}</p>
                </div>

                {/* Cumulative CGF */}
                <div className="flex-none md:flex-1 w-[23%] md:w-full min-w-[85px] bg-white rounded-md p-1 md:p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                    <div>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">Cumul. CGF</p>
                        <h3 className="text-xs md:text-base font-bold text-rose-600 mt-0.5">{formatCurrency(cumulativeCgf)}</h3>
                    </div>
                    <p className="hidden md:block text-[9px] text-slate-400 mt-1">Until Year {selectedYearIndex + 1}</p>
                    <p className="md:hidden text-[7px] text-slate-400 mt-0.5 leading-none">Yr {selectedYearIndex + 1}</p>
                </div>

                {/* Combined Total */}
                <div className="flex-none md:flex-1 w-[23%] md:w-full min-w-[85px] bg-white rounded-md p-1 md:p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                    <div>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">Total</p>
                        <h3 className="text-xs md:text-base font-bold text-slate-900 mt-0.5">{formatCurrency(cumulativeTotal)}</h3>
                    </div>
                    <p className="hidden md:block text-[9px] text-slate-400 mt-1">Total Investment</p>
                    <p className="md:hidden text-[7px] text-slate-400 mt-0.5 leading-none">Invst</p>
                </div>
            </div>

            {/* 3. Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="py-2 px-2 md:py-4 md:px-6 font-bold border-r border-slate-100 w-1/4 text-[9px] md:text-xs">Month</th>
                                <th className="py-2 px-2 md:py-4 md:px-6 font-bold text-amber-700 text-center border-r border-slate-100 w-1/4 text-[9px] md:text-xs">CPF</th>
                                <th className="py-2 px-2 md:py-4 md:px-6 font-bold text-rose-700 text-center border-r border-slate-100 w-1/4 text-[9px] md:text-xs">CGF</th>
                                <th className="py-2 px-2 md:py-4 md:px-6 font-bold text-slate-800 text-center w-1/4 text-[9px] md:text-xs">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tableData.map((row: any, idx: number) => (
                                <React.Fragment key={idx}>
                                    <tr className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                        <td className="py-2 px-2 md:py-3 md:px-6 font-medium text-slate-900 border-r border-slate-100 bg-slate-50/30 text-[9px] md:text-sm">{row.monthName}</td>
                                        <td className="py-2 px-2 md:py-3 md:px-6 text-center text-amber-700 font-medium border-r border-slate-100 text-[9px] md:text-sm">{row.isValid ? formatCurrency(row.cpf) : '-'}</td>
                                        <td className="py-2 px-2 md:py-3 md:px-6 text-center text-rose-700 font-medium border-r border-slate-100 text-[9px] md:text-sm">{row.isValid ? formatCurrency(row.cgf) : '-'}</td>
                                        <td className="py-2 px-2 md:py-3 md:px-6 text-center text-slate-900 font-bold text-[9px] md:text-sm">{row.isValid ? formatCurrency(row.total) : '-'}</td>
                                    </tr>
                                    {(idx + 1) % 3 === 0 && idx < 11 && (
                                        <tr className="bg-slate-100/30">
                                            <td colSpan={4} className="h-1 p-0"></td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-800 text-white border-t border-slate-700">
                            <tr>
                                <td className="py-2 px-2 md:py-4 md:px-6 font-bold text-right border-r border-slate-700 text-[9px] md:text-sm">Year Total</td>
                                <td className="py-2 px-2 md:py-4 md:px-6 text-center font-bold text-amber-300 border-r border-slate-700 text-[9px] md:text-sm">{formatCurrency(yearlyCpf)}</td>
                                <td className="py-2 px-2 md:py-4 md:px-6 text-center font-bold text-rose-300 border-r border-slate-700 text-[9px] md:text-sm">{formatCurrency(yearlyCgf)}</td>
                                <td className="py-2 px-2 md:py-4 md:px-6 text-center font-bold text-white text-[9px] md:text-sm">{formatCurrency(yearlyTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <div className="text-xs text-center text-slate-400">Shows combined monthly expenses for Cattle Growing Fund (Care) and CPF (Insurance/Fee).</div>
        </div>
    );
};

export default CpfCgfCombined;
