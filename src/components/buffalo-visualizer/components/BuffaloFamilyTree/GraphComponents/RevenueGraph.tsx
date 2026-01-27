
import React from 'react';
import { TrendingUp } from "lucide-react";
import { formatCurrency } from '../CommonComponents';

const RevenueGraph = ({ yearlyData }: any) => {
    if (!yearlyData) return null;

    const maxRevenue = Math.max(...yearlyData.map((d: any) => d.revenue));

    return (
        <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100 w-full">
            <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-center gap-4">
                <TrendingUp className="text-green-500" size={32} />
                Revenue Growth Over Years
            </h3>
            <div className="space-y-6 pl-8 pr-4">
                {yearlyData.map((data: any, index: any) => {
                    const percentage = (data.revenue / maxRevenue) * 100;
                    const growth = index > 0 ? ((data.revenue - yearlyData[index - 1].revenue) / yearlyData[index - 1].revenue * 100) : 0;

                    return (
                        <div key={data.year} className="flex items-center gap-8 p-6 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="w-24 text-xl font-bold text-gray-700 flex-shrink-0">{data.year}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-800 text-lg">{formatCurrency(data.revenue)}</span>
                                    <span className={`font-bold text-lg px-3 py-1 rounded-full ${growth > 0 ? 'bg-green-100 text-green-700' :
                                            growth < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {index > 0 && `${growth > 0 ? '↗ ' : growth < 0 ? '↘ ' : ''}${Math.abs(growth).toFixed(1)}%`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-8 shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 h-8 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-4"
                                        style={{ width: `${percentage}%` }}
                                    >
                                        <span className="text-white text-sm font-bold">{percentage.toFixed(0)}% of peak</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="h-10"></div>
        </div>

    );
};

export default RevenueGraph;
