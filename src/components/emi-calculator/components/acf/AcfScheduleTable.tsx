import React from 'react';
import { useEmi } from '../../context/EmiContext';

const AcfScheduleTable = () => {
    const { acfSchedule, formatCurrency } = useEmi();

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Payment Schedule</h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-[10px] sm:text-xs">
                    <thead className="bg-[#E9EAF2] sticky top-0">
                        <tr>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-bold text-gray-900 uppercase tracking-wider">Month</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-right font-bold text-gray-900 uppercase tracking-wider">Installment</th>
                            <th className="px-3 sm:px-6 py-2 sm:py-3 text-right font-bold text-gray-900 uppercase tracking-wider">Cumulative</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {acfSchedule.map((row) => (
                            <tr key={row.month} className="hover:bg-[#E9EAF2] transition-colors">
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 font-medium">Month {row.month}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{formatCurrency(row.installment)}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">₹{formatCurrency(row.cumulative)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AcfScheduleTable;
