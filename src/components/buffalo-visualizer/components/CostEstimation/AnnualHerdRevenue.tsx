
import React from 'react';
import { Calendar, Users, DollarSign, ArrowUpRight, Wallet } from 'lucide-react';

const AnnualHerdRevenue = ({
    cumulativeYearlyData,
    assetMarketValue,
    formatCurrency,
    formatNumber,
    treeData,
    startYear,
    endYear,
    yearRange
}: any) => {
    return (
        <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Wallet className="text-indigo-600" size={20} />
                            Annual Revenue Analysis
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Projected net revenue after CPF deductions
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 shadow-sm">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{yearRange}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-slate-400" />
                                        Year
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Users size={16} className="text-slate-400" />
                                        Herd Size
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <DollarSign size={16} className="text-slate-400" />
                                        Net Revenue
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {cumulativeYearlyData.map((data: any, index: number) => {
                                const annualRevenue = data.revenueWithCPF;
                                const prevRevenue = index > 0 ? cumulativeYearlyData[index - 1].revenueWithCPF : 0;
                                const growthRate = index > 0 && prevRevenue > 0
                                    ? ((annualRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
                                    : 0;

                                return (
                                    <tr key={data.year} className="hover:bg-indigo-50/30 transition-colors duration-150">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{data.year}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                {formatNumber(data.totalBuffaloes)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-emerald-700 text-base">
                                                    {formatCurrency(annualRevenue)}
                                                </span>

                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-slate-400">
                                                        CPF: -{formatNumber(data.cpfCost)}
                                                    </span>
                                                    {Number(growthRate) > 0 && (
                                                        <span className="flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                            <ArrowUpRight size={10} className="mr-0.5" />
                                                            {growthRate}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                        {/* Footer Summary */}
                        <tfoot className="bg-slate-900 border-t border-slate-900">
                            <tr>
                                <td className="px-6 py-4">
                                    <div className="text-white text-sm font-medium">Total Duration</div>
                                    <div className="text-slate-400 text-xs">{treeData.years} Years</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="text-white text-sm font-medium">Final Herd</div>
                                    <div className="text-slate-400 text-xs text-center">
                                        {formatNumber(cumulativeYearlyData[cumulativeYearlyData.length - 1]?.totalBuffaloes || 0)} Buffaloes
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-emerald-400 text-lg font-bold">
                                        {formatCurrency(cumulativeYearlyData.reduce((sum: number, data: any) => sum + data.revenueWithCPF, 0))}
                                    </div>
                                    <div className="text-slate-400 text-xs">Total Net Revenue</div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnnualHerdRevenue;
