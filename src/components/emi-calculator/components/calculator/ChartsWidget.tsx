import React, { useMemo } from 'react';
import { useEmi } from '../../context/EmiContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Sector } from 'recharts';
import { Download } from 'lucide-react';
import { clsx } from 'clsx';

const ChartsWidget = () => {
    const { amount, totalPayment, totalInterest, months, emi, formatCurrency, yearlySchedule } = useEmi();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartWidget
                    amount={amount}
                    totalPayment={totalPayment}
                    totalInterest={totalInterest}
                    formatCurrency={formatCurrency}
                />
                <BarChartWidget
                    months={months}
                    emi={emi}
                    yearlySchedule={yearlySchedule}
                    formatCurrency={formatCurrency}
                />
            </div>
        </div>
    );
};

interface PieChartWidgetProps {
    amount: number;
    totalPayment: number;
    totalInterest: number;
    formatCurrency: (val: number) => string;
}

interface ChartDataPoint {
    name: string;
    value: number;
    color: string;
    percentage: number;
    [key: string]: any;
}

const PieChartWidget: React.FC<PieChartWidgetProps> = ({ amount, totalPayment, totalInterest, formatCurrency }) => {
    const [hoveredData, setHoveredData] = React.useState<ChartDataPoint | null>(null);
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

    const interestPercentage = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;
    const principalPercentage = totalPayment > 0 ? (amount / totalPayment) * 100 : 0;

    const data: ChartDataPoint[] = [
        { name: 'Principal', value: amount, color: '#42a5f5', percentage: principalPercentage },
        { name: 'Interest', value: totalInterest, color: '#ef5350', percentage: interestPercentage },
    ];

    const renderActiveShape = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, percent } = props;
        const RADIAN = Math.PI / 180;
        const midAngle = (startAngle + endAngle) / 2;
        // Move label out slightly to follow the expansion (+6 padding)
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + 3;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 6}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    stroke="#fff"
                    strokeWidth={2}
                />
                <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[12px] font-black pointer-events-none"
                    style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))' }}
                >
                    {`${(percent * 100).toFixed(1)}%`}
                </text>
            </g>
        );
    };

    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } = props;

        // Hide static label for the hovered slice so renderActiveShape can handle its expanded position
        if (index === activeIndex) return null;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[12px] font-black pointer-events-none"
                style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))' }}
            >
                {`${(percent * 100).toFixed(1)}%`}
            </text>
        );
    };

    const clearHover = () => {
        setHoveredData(null);
        setActiveIndex(null);
    };

    return (
        <div
            className="bg-white rounded-3xl shadow-lg p-8 h-full min-h-[480px] flex flex-col transition-all duration-300"
            onMouseLeave={clearHover}
        >
            <h3 className="text-xl font-bold text-gray-800 mb-8 font-mono tracking-tight">Payment Breakdown</h3>
            <div className="flex-grow relative min-h-[350px]" onMouseLeave={clearHover}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart onMouseLeave={clearHover}>
                        <Pie
                            {...({
                                activeIndex: activeIndex !== null ? activeIndex : undefined,
                                activeShape: renderActiveShape,
                            } as any)}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={135}
                            paddingAngle={0}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                            labelLine={false}
                            label={renderCustomizedLabel}
                            onMouseEnter={(_, index) => {
                                setHoveredData(data[index]);
                                setActiveIndex(index);
                            }}
                            onMouseLeave={clearHover}
                            stroke="#fff"
                            strokeWidth={2}
                            animationDuration={250}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="#fff"
                                    strokeWidth={2}
                                    onMouseLeave={clearHover}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <span className="text-[11px] text-gray-400 font-bold mb-0.5 uppercase tracking-widest">
                        {hoveredData ? hoveredData.name : 'Total'}
                    </span>
                    <span className="text-[22px] font-black text-gray-900 tracking-tight">
                        ₹{(hoveredData ? hoveredData.value : totalPayment).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                </div>
            </div>

            <div className="flex justify-center space-x-12 mt-6">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-[#ef5350]"></div>
                    <span className="text-xs font-bold text-gray-500">Interest: {interestPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-[#42a5f5]"></div>
                    <span className="text-xs font-bold text-gray-500">Principal: {principalPercentage.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

interface BarChartWidgetProps {
    months: number;
    emi: number;
    yearlySchedule: any[];
    formatCurrency: (val: number) => string;
}

const BarChartWidget: React.FC<BarChartWidgetProps> = ({ months, emi, yearlySchedule, formatCurrency }) => {
    const [barSize, setBarSize] = React.useState(32);

    React.useEffect(() => {
        const updateBarSize = () => {
            setBarSize(window.innerWidth <= 320 ? 20 : 32);
        };

        updateBarSize();
        window.addEventListener('resize', updateBarSize);
        return () => window.removeEventListener('resize', updateBarSize);
    }, []);

    const data = useMemo(() => {
        // Use yearlySchedule if available, otherwise fallback
        if (yearlySchedule && yearlySchedule.length > 0) {
            return yearlySchedule.map((row) => ({
                name: `Y${row.month}`,
                amount: row.emi,
                cpf: row.cpf,
                cgf: row.cgf,
                fill: (row.month - 1) % 2 === 0 ? '#42a5f5' : '#009688'
            }));
        }

        const years = Math.ceil(months / 12);
        const chartData = [];

        for (let i = 0; i < years; i++) {
            const monthsInYear = Math.min(12, months - (i * 12));
            const yearlyTotal = emi * monthsInYear;

            chartData.push({
                name: `Y${i + 1}`,
                amount: yearlyTotal,
                cpf: 0,
                cgf: 0,
                fill: i % 2 === 0 ? '#42a5f5' : '#009688'
            });
        }
        return chartData;
    }, [months, emi, yearlySchedule]);

    const formatCompact = (value: number) => {
        if (value >= 100000) return (value / 100000).toFixed(1) + 'L';
        if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
        return String(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-md rounded-xl text-left">
                    <p className="text-gray-500 text-xs font-bold mb-1">{label}</p>
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold text-gray-800">
                            Yearly EMI : <span className="font-mono">₹{formatCurrency(data.amount)}</span>
                        </p>
                        {data.cpf > 0 && (
                            <p className="text-xs font-semibold text-gray-600">
                                CPF : <span className="font-mono">₹{formatCurrency(data.cpf)}</span>
                            </p>
                        )}
                        {/* {data.cgf > 0 && (
                            <p className="text-xs font-semibold text-gray-600">
                                CGF : <span className="font-mono">₹{formatCurrency(data.cgf)}</span>
                            </p>
                        )} */}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 font-mono tracking-tight">Yearly Overview</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="5 5" stroke="#e5e7eb" vertical={true} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'semibold' }}
                            tickFormatter={formatCompact}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                        <Bar
                            dataKey="amount"
                            radius={[8, 8, 0, 0]}
                            barSize={barSize}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartsWidget;

