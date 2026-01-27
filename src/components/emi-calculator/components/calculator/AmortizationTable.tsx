import React, { useState } from 'react';
import { useEmi } from '../../context/EmiContext';
import { clsx } from 'clsx';
import { Download } from 'lucide-react';

import { utils, writeFile } from 'xlsx';

const AmortizationTable = () => {
    const { schedule, yearlySchedule, formatCurrency } = useEmi();
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'yearly'

    const data = viewMode === 'yearly' ? yearlySchedule : schedule;
    const isYearly = viewMode === 'yearly';

    const handleDownload = () => {
        try {
            console.log("Start Download", { dataLength: data.length, isYearly });
            if (!data || data.length === 0) {
                console.error("No data to export");
                alert("No data to export");
                return;
            }

            const exportData = data.map(row => ({
                [isYearly ? 'Year' : 'Month']: row.month,
                'EMI (Monthly)': row.emi,
                'CPF (Monthly)': row.cpf,
                // 'CGF (Monthly)': row.cgf,
                'Revenue': row.revenue,
                'Payment': row.totalPayment,
                'Debit From Balance': row.debitFromBalance,
                'Balance': row.loanPoolBalance,
                'Profit': row.profit,
                'From Pocket': row.loss,
                'Net Cash': row.netCash
            }));

            console.log("Export Data Prepared", exportData[0]);

            const ws = utils.json_to_sheet(exportData);
            const wb = utils.book_new();
            const sheetName = isYearly ? "Yearly Schedule" : "Monthly Schedule";
            utils.book_append_sheet(wb, ws, sheetName);

            const fileName = isYearly ? "EMI_schedule_yearly.xlsx" : "EMI_schedule_monthly.xlsx";
            writeFile(wb, fileName);
        } catch (error) {
            console.error("Export Failed", error);
            alert("Export Failed: " + (error as any).message);
        }
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex justify-between items-center px-2">
                <div className="flex bg-[#eaebed] p-1.5 rounded-full">
                    <button
                        onClick={() => setViewMode('yearly')}
                        className={clsx(
                            "px-8 py-2.5 rounded-full text-sm font-bold transition-all max-[320px]:px-4 max-[320px]:py-2 max-[320px]:text-xs",
                            viewMode === 'yearly' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Yearly
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={clsx(
                            "px-8 py-2.5 rounded-full text-sm font-bold transition-all max-[320px]:px-4 max-[320px]:py-2 max-[320px]:text-xs",
                            viewMode === 'monthly' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Monthly
                    </button>
                </div>

                <button
                    onClick={handleDownload}
                    className="w-11 h-11 bg-[#eaebed] rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center"
                    title="Download Excel"
                >
                    <Download className="w-[18px] h-[18px] text-gray-700" />
                </button>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto relative custom-scrollbar">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-[#eaebed] text-[12px] font-bold text-gray-700 uppercase sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th className="px-4 py-4 border-r border-gray-300 text-center">{isYearly ? 'Year' : 'Month'}</th>
                                <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap">EMI (Monthly)</th>
                                <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap">CPF (Monthly)</th>
                                {/* <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap">CGF (Monthly)</th> */}
                                <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap">Revenue</th>
                                <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap">Payment</th>
                                <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap leading-tight">Debit From<br />Balance</th>
                                <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap">Balance</th>
                                <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap">Profit</th>
                                <th className="px-4 py-4 border-r border-gray-300 text-center whitespace-nowrap">From Pocket</th>
                                <th className="px-4 py-4 text-center whitespace-nowrap">Net Cash</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.map((row, idx) => {
                                // Matching row highlighting from screenshot (light green for profitable rows in later months)
                                const isProfitable = row.netCash > 0;
                                const rowBg = isProfitable ? "bg-[#e8f5e9]" : "";

                                return (
                                    <tr key={row.month} className={clsx("transition-colors", rowBg, !isProfitable && "hover:bg-gray-50")}>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-bold text-gray-800">{row.month}</td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-medium text-gray-600">{formatCurrency(row.emi)}</td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-medium text-gray-600">{formatCurrency(row.cpf)}</td>
                                        {/* <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-medium text-gray-600">{formatCurrency(row.cgf)}</td> */}
                                        <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-medium text-gray-600">{formatCurrency(row.revenue)}</td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-bold text-gray-700">{formatCurrency(row.totalPayment)}</td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-medium text-gray-600">{formatCurrency(row.debitFromBalance)}</td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-medium text-gray-600">{formatCurrency(row.loanPoolBalance)}</td>
                                        <td className={clsx("px-4 py-3 border-r border-gray-200 text-center text-sm font-bold", isProfitable ? "text-green-600" : "text-gray-600")}>
                                            {formatCurrency(row.profit)}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-center text-sm font-medium text-gray-600">{formatCurrency(row.loss)}</td>
                                        <td className={clsx("px-4 py-3 text-center text-sm font-bold", isProfitable ? "text-green-600" : "text-gray-700")}>
                                            {formatCurrency(row.netCash)}
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
export default AmortizationTable;
