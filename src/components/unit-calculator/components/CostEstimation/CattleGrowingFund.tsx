import React, { useState, useEffect } from 'react';

const CattleGrowingFund = ({
    treeData,
    buffaloDetails,
    yearlyCPFCost,
    monthlyRevenue,
    yearlyData,
    formatCurrency,
    startYear,
    endYear,
    endMonth,
    selectedYearIndex
}: any) => {
    // const [selectedYearIndex, setSelectedYearIndex] = useState(0); // Controlled by Parent
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Helper to calculate financials for a specific simulation year index (0-9)
    const calculateFinancialsForYear = (yearIndex: number) => {
        const costBrackets = [
            { label: "0-12 months", start: 0, end: 12, cost: 0 },
            { label: "13-18 months", start: 13, end: 18, cost: 6000 },
            { label: "19-24 months", start: 19, end: 24, cost: 8400 },
            { label: "25-30 months", start: 25, end: 30, cost: 10800 },
            { label: "31-36 months", start: 31, end: 36, cost: 15000 },
            { label: " 37+ months", start: 37, end: 999, cost: 0 }
        ];

        const startOfSimulationYear = treeData.startYear;
        const startOfSimulationMonth = treeData.startMonth || 0;

        const absoluteStartMonth = startOfSimulationYear * 12 + startOfSimulationMonth;
        const currentYearAbsoluteStart = absoluteStartMonth + (yearIndex * 12);
        const currentYearAbsoluteEnd = currentYearAbsoluteStart + 11;

        // Identify Children active in this "Simulation Year"
        const activeChildren = Object.values(buffaloDetails as Record<string, any>).filter((b: any) => {
            const birthTotalMonths = (b.birthYear as number) * 12 + (b.birthMonth as number || 0);
            return b.generation > 0 && birthTotalMonths <= currentYearAbsoluteEnd;
        }).sort((a: any, b: any) => a.id.localeCompare(b.id));

        const monthlyData = [];
        const childTotalCosts: Record<string, number> = {};
        const childActiveBrackets: Record<string, Set<string>> = {};
        activeChildren.forEach((c: any) => {
            childTotalCosts[c.id] = 0;
            childActiveBrackets[c.id] = new Set();
        });

        let totalYearlyCaringCost = 0;

        for (let m = 0; m < 12; m++) {
            const currentAbsoluteMonth = currentYearAbsoluteStart + m;
            const currentCalendarMonth = currentAbsoluteMonth % 12;

            const rowData: any = {
                monthName: monthNames[currentCalendarMonth],
                costs: {},
                ages: {}, // Store ages for display
                totalMonthlyCost: 0,
                isValidMonth: currentAbsoluteMonth <= (treeData.startYear * 12 + treeData.startMonth + (treeData.durationMonths || treeData.years * 12))
            };

            if (rowData.isValidMonth) {
                activeChildren.forEach((child: any) => {
                    const buffaloAbsoluteBirth = (child.birthYear as number) * 12 + (child.birthMonth as number || 0);
                    if (buffaloAbsoluteBirth <= currentAbsoluteMonth) {
                        const ageInMonths = (currentAbsoluteMonth - buffaloAbsoluteBirth) + 1;
                        rowData.ages[child.id] = ageInMonths; // Debug: Store age
                        const bracketIndex = costBrackets.findIndex((b: any) => ageInMonths >= b.start && ageInMonths <= b.end);
                        if (bracketIndex !== -1) {
                            const bracket = costBrackets[bracketIndex];
                            const shortLabel = bracket.label.replace(' months', 'm').replace('months', 'm');
                            childActiveBrackets[child.id].add(shortLabel);
                            let duration = bracket.end - bracket.start + 1;
                            if (bracket.end === 999) duration = 12;
                            const monthlyRate = (bracket.cost / duration) * (treeData.units || 1); // Scale by units
                            rowData.costs[child.id] = monthlyRate;
                            rowData.totalMonthlyCost += monthlyRate;
                            childTotalCosts[child.id] = (childTotalCosts[child.id] || 0) + monthlyRate;
                            totalYearlyCaringCost += monthlyRate;
                        } else {
                            rowData.costs[child.id] = 0;
                            // Ensure age is stored even if 0 cost
                            rowData.ages[child.id] = ageInMonths;
                            if (costBrackets[0].cost === 0 && ageInMonths <= 12) {
                                const shortLabel = costBrackets[0].label.replace(' months', 'm').replace('months', 'm');
                                childActiveBrackets[child.id].add(shortLabel);
                            }
                        }
                    } else {
                        rowData.costs[child.id] = null;
                    }
                });
            } else {
                activeChildren.forEach((child: any) => rowData.costs[child.id] = 0);
            }
            monthlyData.push(rowData);
        }

        return { monthlyData, activeChildren, childTotalCosts, totalYearlyCaringCost, childActiveBrackets };
    };

    const { monthlyData, activeChildren, childTotalCosts, totalYearlyCaringCost, childActiveBrackets } = calculateFinancialsForYear(selectedYearIndex);

    // --- Cumulative & Annual Revenue Logic ---
    let totalAnnualRevenue = 0;
    const absStart = (treeData.startYear * 12 + (treeData.startMonth || 0)) + (selectedYearIndex * 12);
    for (let m = 0; m < 12; m++) {
        const abs = absStart + m;
        const y = Math.floor(abs / 12);
        const mo = abs % 12;
        if (monthlyRevenue && monthlyRevenue[y] && monthlyRevenue[y][mo]) {
            totalAnnualRevenue += (monthlyRevenue[y][mo].total || 0);
        }
    }

    const childCumulativeCosts: Record<string, number> = {};
    let totalCumulativeCaringCost = 0;
    let totalCumulativeRevenue = 0;
    activeChildren.forEach((child: any) => { childCumulativeCosts[child.id] = 0; });

    for (let yIndex = 0; yIndex <= selectedYearIndex; yIndex++) {
        const financials = calculateFinancialsForYear(yIndex);
        Object.entries(financials.childTotalCosts).forEach(([id, cost]: [string, any]) => {
            if (childCumulativeCosts[id] !== undefined) {
                childCumulativeCosts[id] += cost;
            } else if (activeChildren.find((c: any) => c.id === id)) {
                childCumulativeCosts[id] = cost;
            }
        });
        totalCumulativeCaringCost += financials.totalYearlyCaringCost;
        const absStartLoop = (treeData.startYear * 12 + (treeData.startMonth || 0)) + (yIndex * 12);
        for (let m = 0; m < 12; m++) {
            const abs = absStartLoop + m;
            const y = Math.floor(abs / 12);
            const mo = abs % 12;
            if (monthlyRevenue && monthlyRevenue[y]) {
                totalCumulativeRevenue += (monthlyRevenue[y][mo]?.total || 0);
            }
        }
    }

    const revenue = totalAnnualRevenue;
    const netValue = revenue - totalYearlyCaringCost;

    return (
        <div className="w-full mb-6 space-y-2">
            {/* Top Stats Cards */}
            <div className="flex overflow-x-auto pb-1 gap-1.5 md:grid md:grid-cols-2 lg:grid-cols-4 md:pb-0 no-scrollbar -mt-2 md:mt-0">
                {/* Annual Caring Cost */}
                <div className="flex-none md:flex-1 w-[23%] md:w-full min-w-[85px] bg-white rounded-md p-1 md:p-2 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between items-center text-center">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">Caring Cost</p>
                    <div className="text-xs md:text-base font-bold text-rose-600 mt-0.5">{formatCurrency(totalYearlyCaringCost)}</div>
                    <p className="hidden md:block text-[9px] text-rose-600/70 mt-0.5 font-bold">{activeChildren.length * (treeData.units || 1)} Active Children ({treeData.units || 1} Units)</p>
                    <p className="md:hidden text-[7px] text-rose-600/70 mt-0.5 font-bold leading-none">{activeChildren.length * (treeData.units || 1)} Active</p>
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-rose-500" />
                </div>
                {/* Annual Revenue */}
                <div className="flex-none md:flex-1 w-[23%] md:w-full min-w-[85px] bg-white rounded-md p-1 md:p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">Revenue</p>
                    <div className="text-xs md:text-base font-bold text-emerald-600 mt-0.5">{formatCurrency(totalAnnualRevenue)}</div>
                    <p className="md:hidden text-[7px] text-emerald-600/70 mt-0.5 bg-emerald-50 inline-block px-1 py-0.5 rounded leading-none">Inc</p>
                    <p className="hidden md:block text-[9px] text-emerald-600/70 mt-0.5 bg-emerald-50 inline-block px-1 py-0.5 rounded">Income</p>
                </div>
                {/* Net Annual */}
                <div className="flex-none md:flex-1 w-[23%] md:w-full min-w-[85px] bg-white rounded-md p-1 md:p-2 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between items-center text-center">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">Net Annual</p>
                    <div className={`text-xs md:text-base font-bold mt-0.5 ${netValue >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(netValue)}</div>
                    <p className="hidden md:block text-[9px] text-slate-400 mt-0.5">Year {selectedYearIndex + 1}</p>
                    <p className="md:hidden text-[7px] text-slate-400 mt-0.5 leading-none">Yr {selectedYearIndex + 1}</p>
                    <div className={`absolute right-0 top-0 bottom-0 w-0.5 ${netValue >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </div>
                {/* Cumulative Net */}
                <div className="flex-none md:flex-1 w-[23%] md:w-full min-w-[85px] bg-white rounded-md p-1 md:p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">Cumul. Net</p>
                    <div className={`text-xs md:text-base font-bold mt-0.5 ${(totalCumulativeRevenue - totalCumulativeCaringCost) >= 0 ? 'text-indigo-600' : 'text-slate-700'}`}>{formatCurrency(totalCumulativeRevenue - totalCumulativeCaringCost)}</div>
                    <p className="hidden md:block text-[9px] text-slate-400 mt-0.5">Inception to Date</p>
                    <p className="md:hidden text-[7px] text-slate-400 mt-0.5 leading-none">Total</p>
                </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col mt-4">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="sticky left-0 bg-slate-50 z-10 p-1 md:p-2 text-left text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 w-16 md:w-24">Month</th>
                                {activeChildren.map(c => (
                                    <th key={c.id} className="p-1 md:p-2 text-center border-r border-slate-200 last:border-r-0 min-w-[60px] md:min-w-[100px]">
                                        <div className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-wider">{c.id}</div>
                                        <div className="flex flex-wrap justify-center gap-0.5 mt-0.5 md:mt-1">
                                            {Array.from(childActiveBrackets[c.id] || []).map((b: any) => (
                                                <span key={b} className="text-[6px] md:text-[8px] bg-indigo-100 text-indigo-700 px-0.5 md:px-1 rounded font-bold uppercase">{b}</span>
                                            ))}
                                        </div>
                                    </th>
                                ))}
                                <th className="p-1 md:p-2 text-right text-[8px] md:text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100/50 min-w-[70px] md:min-w-[110px]">Monthly Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {monthlyData.map((row, idx) => (
                                <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${!row.isValidMonth ? 'opacity-40 grayscale pointer-events-none bg-slate-50/50' : ''}`}>
                                    <td className="sticky left-0 bg-white z-10 p-1 md:p-2 text-[9px] md:text-[11px] font-bold text-slate-700 border-r border-slate-200">{row.monthName}</td>
                                    {activeChildren.map(child => {
                                        const cost = row.costs[child.id];
                                        const age = row.ages[child.id];
                                        return (
                                            <td key={child.id} className="p-1 md:p-2 text-center text-[9px] md:text-[11px] border-r border-slate-200 last:border-r-0 font-medium" title={`Age: ${age} months`}>
                                                {cost === null ? (
                                                    <span className="text-slate-300 font-normal">-</span>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className={cost > 0 ? 'text-slate-900' : 'text-slate-400'}>
                                                            {cost > 0 ? formatCurrency(cost) : '₹0'}
                                                        </span>
                                                        <span className="text-[7px] md:text-[9px] text-slate-400 mt-0 md:mt-0.5">({age}m)</span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-1 md:p-2 text-right text-[9px] md:text-[11px] font-bold text-slate-900 bg-slate-50/30">
                                        {formatCurrency(row.totalMonthlyCost)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-900 border-t border-slate-700">
                                <td className="sticky left-0 bg-slate-900 z-10 p-1 md:p-2 text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider border-r border-slate-700">Annual Total</td>
                                {activeChildren.map(child => (
                                    <td key={child.id} className="p-1 md:p-2 text-center text-[9px] md:text-[11px] font-bold text-white border-r border-slate-700 last:border-r-0">
                                        {formatCurrency(childTotalCosts[child.id] || 0)}
                                    </td>
                                ))}
                                <td className="p-1 md:p-2 text-right text-[9px] md:text-[11px] font-black text-white bg-slate-800">
                                    {formatCurrency(totalYearlyCaringCost)}
                                </td>
                            </tr>
                            <tr className="bg-white border-t border-slate-200">
                                <td className="sticky left-0 bg-white z-10 p-1 md:p-2 text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">Asset Cost</td>
                                {activeChildren.map(child => (
                                    <td key={child.id} className="p-1 md:p-2 text-center text-[9px] md:text-[11px] font-bold text-indigo-600 border-r border-slate-200 last:border-r-0">
                                        {formatCurrency(childCumulativeCosts[child.id] || 0)}
                                    </td>
                                ))}
                                <td className="p-1 md:p-2 text-right text-[9px] md:text-[11px] font-black text-indigo-700 bg-slate-50/50">
                                    {formatCurrency(totalCumulativeCaringCost)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CattleGrowingFund;
