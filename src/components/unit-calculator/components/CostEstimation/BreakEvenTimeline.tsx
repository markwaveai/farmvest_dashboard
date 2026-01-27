import React from 'react';
import { Info, TrendingUp, Calendar, DollarSign, ArrowUpRight, PieChart, Clock } from 'lucide-react';

const BreakEvenTimeline: React.FC<any> = ({
    treeData,
    breakEvenAnalysis,
    monthNames,
    formatCurrency,
    formatNumber,
    yearRange
}) => {
    // Calculate months to break-even
    const calculateMonthsToBreakEven = (breakEvenDate: any) => {
        if (!breakEvenDate) return null;
        const startDate = new Date(treeData.startYear, treeData.startMonth, treeData.startDay || 1);
        const yearsDiff = breakEvenDate.getFullYear() - startDate.getFullYear();
        const monthsDiff = breakEvenDate.getMonth() - startDate.getMonth();
        return yearsDiff * 12 + monthsDiff;
    };

    const monthsToBreakEvenWithCPF = calculateMonthsToBreakEven(breakEvenAnalysis.exactBreakEvenDateWithCPF);
    const hasBreakEven = !!breakEvenAnalysis.exactBreakEvenDateWithCPF;
    const safeBreakEvenDate = hasBreakEven ? new Date(breakEvenAnalysis.exactBreakEvenDateWithCPF) : null;

    const lastYear = breakEvenAnalysis.breakEvenData.length > 0
        ? breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1].year
        : (treeData.startYear + Math.ceil((treeData.durationMonths || (treeData.years * 12)) / 12) - 1);

    const formattedDateRange = `${monthNames[treeData.startMonth || 0]} ${treeData.startYear} - December ${lastYear}`;

    return (
        <div className="w-full mb-12 space-y-6">
            {/* Simplified Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Initial Investment */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-1 bg-indigo-50 rounded text-indigo-600">
                            <DollarSign size={14} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Invested</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800">{formatCurrency(breakEvenAnalysis.initialInvestment)}</div>
                    <p className="text-[8px] text-slate-500 mt-0.5">Startup capital</p>
                </div>
                {/* Total Net Revenue */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-1 bg-emerald-50 rounded text-emerald-600">
                            <TrendingUp size={14} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Final Revenue</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800">{formatCurrency(breakEvenAnalysis.finalCumulativeRevenueWithCPF)}</div>
                    <p className="text-[8px] text-slate-500 mt-0.5">Milk sales</p>
                </div>
                {/* Time to Break Even */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm group hover:border-violet-200 transition-all">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-1 bg-violet-50 rounded text-violet-600">
                            <Clock size={14} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Break-Even</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                        {hasBreakEven ? `${monthsToBreakEvenWithCPF} Months` : '---'}
                    </div>
                    <p className="text-[8px] text-slate-500 mt-0.5">
                        {hasBreakEven && safeBreakEvenDate
                            ? safeBreakEvenDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : 'Extended'}
                    </p>
                </div>
                {/* Final Asset Value */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm group hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="p-1 bg-blue-50 rounded text-blue-600">
                            <PieChart size={14} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Asset Value</span>
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                        {formatCurrency(breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)}
                    </div>
                    <p className="text-[8px] text-slate-500 mt-0.5">Herd valuation</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Detailed Timeline Table */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                        <h3 className="text-sm font-bold text-slate-800">Yearly Recovery Roadmap</h3>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                    <th className="px-6 py-3">Year</th>
                                    <th className="px-6 py-3 text-right">Annual Net Sales</th>
                                    <th className="px-6 py-3 text-right">Asset Value</th>
                                    <th className="px-6 py-3 text-right">Cumulative Net</th>
                                    <th className="px-6 py-3 text-center">Recovery</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {breakEvenAnalysis.breakEvenData.map((data: any, index: number) => {
                                    const isBreakEven = data.isBreakEvenWithCPF;
                                    return (
                                        <tr key={data.year} className={`group transition-all ${isBreakEven ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}>
                                            <td className="px-6 py-4">
                                                <div className={`relative ${isBreakEven ? 'z-10' : ''}`}>
                                                    <span className="text-sm font-bold text-slate-800">{data.year}</span>
                                                    <span className="block text-[10px] text-slate-400">Y{index + 1}</span>
                                                    {isBreakEven && (
                                                        <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-semibold text-slate-700">{formatCurrency(data.annualRevenueWithCPF)}</span>
                                                <span className="block text-[10px] text-amber-500 font-medium">CPF: -{formatNumber(data.cpfCost)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-medium text-slate-600">{formatCurrency(data.assetValue)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-bold ${isBreakEven ? 'text-emerald-700' : 'text-indigo-600'}`}>{formatCurrency(data.cumulativeRevenueWithCPF + data.assetValue)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="text-[10px] font-bold text-slate-600 mb-1">{data.recoveryPercentageWithCPF.toFixed(0)}%</div>
                                                    <div className="w-20 bg-slate-100 rounded-full h-1">
                                                        <div className={`h-full transition-all duration-500 ${data.recoveryPercentageWithCPF >= 100 ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: `${Math.min(100, data.recoveryPercentageWithCPF)}%` }} />
                                                    </div>
                                                    {isBreakEven && (
                                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter mt-1 animate-pulse">Achieved</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer Summary Bar */}
                    <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-white gap-4">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Final Assets</p>
                                <p className="text-sm font-bold text-indigo-400">
                                    {formatCurrency(breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)}
                                </p>
                            </div>
                            <div className="w-px h-6 bg-slate-700 hidden sm:block" />
                            <div className="text-center">
                                <p className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Total Value</p>
                                <p className="text-sm font-bold text-emerald-400 leading-none">
                                    {formatCurrency(
                                        breakEvenAnalysis.finalCumulativeRevenueWithCPF +
                                        (breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center sm:items-end">
                            <p className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Projected Net ROI</p>
                            <p className="text-xl font-bold text-emerald-400">
                                {((breakEvenAnalysis.finalCumulativeRevenueWithCPF +
                                    (breakEvenAnalysis.breakEvenData[breakEvenAnalysis.breakEvenData.length - 1]?.assetValue || 0)) /
                                    breakEvenAnalysis.initialInvestment * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreakEvenTimeline;
