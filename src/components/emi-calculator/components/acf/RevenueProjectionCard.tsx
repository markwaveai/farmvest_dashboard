import React, { useMemo } from 'react';
import { IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react';

interface RevenueProjectionCardProps {
    yearIndex: number; // 1-based index (1 = 2026, 2 = 2027...)
    onYearChange: (year: number) => void;
    units: number;
    formatCurrency: (val: number) => string;
}

// Data provided by the user (Per Unit assumption)
const REVENUE_DATA = [
    { year: 2026, revenue: 99000, cpf: 0 },
    { year: 2027, revenue: 103500, cpf: 22500 },
    { year: 2028, revenue: 91500, cpf: 52500 },
    { year: 2029, revenue: 187500, cpf: 82500 },
    { year: 2030, revenue: 278500, cpf: 117500 },
    { year: 2031, revenue: 393000, cpf: 180000 },
    { year: 2032, revenue: 603500, cpf: 272500 },
    { year: 2033, revenue: 897500, cpf: 407500 },
    { year: 2034, revenue: 1344000, cpf: 615000 },
    { year: 2035, revenue: 2039000, cpf: 925000 },
];

const RevenueProjectionCard: React.FC<RevenueProjectionCardProps> = ({
    yearIndex,
    onYearChange,
    units,
    formatCurrency
}) => {
    
    // Ensure yearIndex is within bounds (1 to 10)
    const validYearIndex = Math.max(1, Math.min(yearIndex, 10));
    const dataIndex = validYearIndex - 1;
    
    const entry = REVENUE_DATA[dataIndex] || REVENUE_DATA[0];
    const displayYear = entry.year;

    const totalRevenue = entry.revenue * units;
    const totalCpf = entry.cpf * units;

    const handlePrev = () => {
        if (validYearIndex > 1) {
            onYearChange(validYearIndex - 1);
        }
    };

    const handleNext = () => {
        if (validYearIndex < 10) {
            onYearChange(validYearIndex + 1);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50">
            {/* Header with Icon and Date Selector */}
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-violet-200/50 flex items-center justify-center text-violet-700">
                    <IndianRupee size={24} strokeWidth={2} />
                </div>

                <div className="flex items-center bg-violet-200/30 rounded-full px-1 py-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className={`p-1 rounded-full hover:bg-violet-200/50 transition-colors ${validYearIndex <= 1 ? 'opacity-30 cursor-not-allowed' : 'text-violet-800'}`}
                        disabled={validYearIndex <= 1}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <span className="mx-3 text-sm font-semibold text-violet-900 min-w-[70px] text-center">
                        Jan, {displayYear}
                    </span>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className={`p-1 rounded-full hover:bg-violet-200/50 transition-colors ${validYearIndex >= 10 ? 'opacity-30 cursor-not-allowed' : 'text-violet-800'}`}
                        disabled={validYearIndex >= 10}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Label */}
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">
                Projected Revenue
            </h3>

            {/* Value and CPF */}
            <div className="flex flex-col gap-1 mb-2">
                <span className="text-3xl font-bold text-violet-700">
                    ₹{formatCurrency(totalRevenue)}
                </span>
                
                {/* Secondary Info similar to Asset Card's buffalo count, but showing CPF */}
                 <div className="flex items-center gap-2">
                     <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-200/50 text-violet-800">
                        CPF: ₹{formatCurrency(totalCpf)}
                    </span>
                 </div>
            </div>

            {/* Badge */}
            {/* <div className="inline-block bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/50 shadow-sm mt-2">
                <span className="text-xs font-semibold text-violet-900">
                    Revenue Projection
                </span>
            </div> */}
        </div>
    );
};

export default RevenueProjectionCard;
