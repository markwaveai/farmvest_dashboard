import React from 'react';

const RevenueBreakEven: React.FC<any> = ({
    treeData,
    initialInvestment,
    yearlyCPFCost,
    breakEvenAnalysis,
    cpfToggle,
    setCpfToggle,
    formatCurrency,
    revenueBreakEvenYearWithoutCPF,
    revenueBreakEvenMonthWithoutCPF,
    revenueBreakEvenYearWithCPF,
    revenueBreakEvenMonthWithCPF,
    revenueExactBreakEvenDateWithoutCPF,
    revenueExactBreakEvenDateWithCPF
}) => {
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    // Calculate revenue-only break-even summary
    const calculateRevenueBreakEvenSummary = () => {
        const summary = {
            withoutCPF: {
                year: revenueBreakEvenYearWithoutCPF,
                month: revenueBreakEvenMonthWithoutCPF,
                date: revenueExactBreakEvenDateWithoutCPF,
                monthsToBreakEven:
                    revenueBreakEvenYearWithoutCPF && revenueBreakEvenMonthWithoutCPF !== null
                        ? (revenueBreakEvenYearWithoutCPF - treeData.startYear) * 12 +
                        revenueBreakEvenMonthWithoutCPF -
                        (treeData.startMonth || 0) +
                        1
                        : null,
                totalInvestment: initialInvestment.totalInvestment
            },
            withCPF: {
                year: revenueBreakEvenYearWithCPF,
                month: revenueBreakEvenMonthWithCPF,
                date: revenueExactBreakEvenDateWithCPF,
                monthsToBreakEven:
                    revenueBreakEvenYearWithCPF && revenueBreakEvenMonthWithCPF !== null
                        ? (revenueBreakEvenYearWithCPF - treeData.startYear) * 12 +
                        revenueBreakEvenMonthWithCPF -
                        (treeData.startMonth || 0) +
                        1
                        : null,
                totalInvestment: initialInvestment.totalInvestment
            }
        };
        return summary;
    };

    const revenueBreakEvenSummary = calculateRevenueBreakEvenSummary();

    const startMonthName = monthNames[treeData.startMonth || 0];
    const startDateString = `${startMonthName} ${treeData.startYear}`;

    // Function to calculate investment recovery status based on cumulative revenue
    const calculateInvestmentRecoveryStatus = (cumulativeRevenue: number, totalInvestment: number, isRevenueBreakEven: boolean) => {
        const recoveryPercentage = (cumulativeRevenue / totalInvestment) * 100;
        let status = "";
        if (isRevenueBreakEven || recoveryPercentage >= 100) {
            status = "Break-Even Achieved ✓";
        } else if (recoveryPercentage >= 75) {
            status = "75% Recovered";
        } else if (recoveryPercentage >= 50) {
            status = "50% Recovered";
        } else if (recoveryPercentage >= 25) {
            status = "25% Recovered";
        } else {
            status = "In Progress";
        }
        return { recoveryPercentage, status };
    };

    return (
        <div className="w-full mb-6 space-y-2">
            {/* Context Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Initial Investment */}
                <div className="bg-white rounded-md p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Initial Investment</p>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(initialInvestment.totalInvestment)}</h3>
                    </div>
                    <div className="mt-1 text-[9px] text-slate-400 text-center">
                        {initialInvestment.totalBuffaloesAtStart} buffaloes + CPF
                    </div>
                </div>
                {/* Break Even Status */}
                <div className="bg-white rounded-md p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Break-Even Point</p>
                        {revenueBreakEvenSummary.withCPF.date ? (
                            <div className="flex flex-col items-center">
                                <h3 className="text-base font-bold text-emerald-700 mt-0.5">
                                    {monthNames[revenueBreakEvenSummary.withCPF.date.getMonth()]} {revenueBreakEvenSummary.withCPF.date.getFullYear()}
                                </h3>
                                <p className="text-[9px] text-emerald-600 mt-0.5 font-semibold px-1 py-0.5 bg-emerald-50 rounded inline-block">
                                    {revenueBreakEvenSummary.withCPF.monthsToBreakEven} Months
                                </p>
                            </div>
                        ) : (
                            <h3 className="text-base font-bold text-slate-400 mt-0.5">Not Projected</h3>
                        )}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                </div>
                {/* Unit Cost */}
                <div className="bg-white rounded-md p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Unit Cost</p>
                        <h3 className="text-base font-bold text-slate-800 mt-0.5">{formatCurrency(initialInvestment.motherBuffaloCost)}</h3>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 text-center">Mothers (Gen 0)</p>
                </div>
                {/* Initial CPF */}
                <div className="bg-white rounded-md p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Initial CPF</p>
                        <h3 className="text-base font-bold text-slate-800 mt-0.5">{formatCurrency(initialInvestment.cpfCost)}</h3>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 text-center">First Year Coverage</p>
                </div>
            </div>
            {/* Break-Even Analysis Table */}
            <div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 w-1/4 text-center">Year</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 text-center w-1/4">Net Annual Revenue</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 text-center w-1/4">Cumulative Net</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[25%] text-center">Investment Recovery</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {breakEvenAnalysis.breakEvenData.map((data: any, index: number) => {
                                const annualRevenue = data.annualRevenueWithCPF;
                                const cumulativeRevenue = data.cumulativeRevenueWithCPF;
                                const isRevenueBreakEven = data.isRevenueBreakEvenWithCPF;
                                const { recoveryPercentage, status } = calculateInvestmentRecoveryStatus(
                                    cumulativeRevenue,
                                    initialInvestment.totalInvestment,
                                    isRevenueBreakEven
                                );
                                return (
                                    <tr key={data.year} className={`hover:bg-slate-50 transition-colors ${isRevenueBreakEven ? 'bg-emerald-50/50' : 'bg-white'}`}>
                                        <td className="px-6 py-4 border-r border-slate-100 text-sm text-center">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">
                                                    {(() => {
                                                        const startM = treeData.startMonth || 0;
                                                        const rowStartTotalMonths = startM + index * 12;
                                                        const rowEndTotalMonths = rowStartTotalMonths + 11;
                                                        const startY = treeData.startYear + Math.floor(rowStartTotalMonths / 12);
                                                        const endY = treeData.startYear + Math.floor(rowEndTotalMonths / 12);
                                                        const startMonthName = monthNames[rowStartTotalMonths % 12].substring(0, 3);
                                                        const endMonthName = monthNames[rowEndTotalMonths % 12].substring(0, 3);
                                                        return `${startMonthName} ${startY} - ${endMonthName} ${endY}`;
                                                    })()}
                                                </span>
                                                {isRevenueBreakEven && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Break-Even</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-slate-100 text-right">
                                            <div className="font-bold text-slate-700">{formatCurrency(annualRevenue)}</div>
                                            <div className="text-xs text-slate-400 mt-1">Net of CPF</div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-slate-100 text-right">
                                            <div className={`font-bold ${isRevenueBreakEven ? 'text-emerald-600' : 'text-blue-600'}`}>{formatCurrency(cumulativeRevenue)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${recoveryPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(recoveryPercentage, 100)}%` }} />
                                                </div>
                                                <div className="text-xs font-bold text-slate-600 min-w-[40px] text-right">{recoveryPercentage.toFixed(0)}%</div>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-400">{status}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RevenueBreakEven;
