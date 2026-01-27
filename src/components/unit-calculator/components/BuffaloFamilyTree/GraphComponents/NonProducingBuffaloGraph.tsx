
import React from 'react';
import { BarChart3 } from "lucide-react";
import { formatNumber } from '../CommonComponents';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';

const NonProducingBuffaloGraph = ({ yearlyData }: any) => {
    if (!yearlyData || yearlyData.length === 0) return null;

    // Transform data for bar chart
    const chartData = yearlyData.map((data: any) => ({
        year: data.year,
        'Producing Buffaloes': data.producingBuffaloes,
        'Non-Producing Buffaloes': data.nonProducingBuffaloes,
        totalBuffaloes: data.totalBuffaloes,
        producingPercentage: (data.producingBuffaloes / data.totalBuffaloes) * 100,
        nonProducingPercentage: (data.nonProducingBuffaloes / data.totalBuffaloes) * 100
    }));

    const colors = {
        producing: '#10b981', // Green
        nonProducing: '#f97316', // Orange
        total: '#6366f1' // Indigo
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                    <p className="font-bold text-gray-800 mb-2">Year: {label}</p>
                    {payload.map((entry: any, index: any) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-600">{entry.name}:</span>
                            <span className="font-bold text-gray-800">{formatNumber(entry.value)}</span>
                            {entry.dataKey.includes('Producing') && (
                                <span className="text-sm text-gray-500 ml-2">
                                    ({(entry.dataKey === 'Producing Buffaloes'
                                        ? chartData.find((d: any) => d.year === label)?.producingPercentage
                                        : chartData.find((d: any) => d.year === label)?.nonProducingPercentage
                                    ).toFixed(1)}%)
                                </span>
                            )}
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="font-bold text-gray-800">
                            Total: {formatNumber(chartData.find((d: any) => d.year === label)?.totalBuffaloes)} buffaloes
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-3xl p-4 shadow-md border border-gray-100 w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
                Producing And Non-Producing Buffalo Analysis
            </h3>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        barGap={0}  // No gap between bars in same group
                        barCategoryGap="30%"  // Gap between year groups
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="year"
                            stroke="#4b5563"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#4b5563"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => formatNumber(value)}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                        />
                        <Legend
                            wrapperStyle={{
                                paddingTop: '10px',
                                fontSize: '12px'
                            }}
                        />
                        <Bar
                            dataKey="Producing Buffaloes"
                            name="Producing Buffaloes"
                            fill={colors.producing}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {chartData.map((entry: any, index: any) => (
                                <Cell key={`cell-prod-${index}`} fill={colors.producing} />
                            ))}
                        </Bar>
                        <Bar
                            dataKey="Non-Producing Buffaloes"
                            name="Non-Producing Buffaloes"
                            fill={colors.nonProducing}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {chartData.map((entry: any, index: any) => (
                                <Cell key={`cell-nonprod-${index}`} fill={colors.nonProducing} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default NonProducingBuffaloGraph;
