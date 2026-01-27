import React from 'react';
import { Gem, ChevronLeft, ChevronRight } from 'lucide-react';

interface AssetProjectionCardProps {
    value: number;
    year: number;
    onYearChange: (year: number) => void;
    buffaloCount: number;
    formatCurrency: (val: number) => string;
}

const AssetProjectionCard: React.FC<AssetProjectionCardProps> = ({
    value,
    year,
    onYearChange,
    buffaloCount,
    formatCurrency
}) => {
    
    // Calculate a mock date based on year (Assuming starting from current year)
    const currentYear = new Date().getFullYear();
    const displayYear = currentYear + (year - 1);

    const handlePrev = () => {
        if (year > 1) {
            onYearChange(year - 1);
        }
    };

    const handleNext = () => {
        // Cap at 10 years or similar reasonable limit
        if (year < 10) {
            onYearChange(year + 1);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50">
            {/* Header with Icon and Date Selector */}
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-cyan-200/50 flex items-center justify-center text-cyan-700">
                    <Gem size={24} strokeWidth={2} />
                </div>

                <div className="flex items-center bg-cyan-200/30 rounded-full px-1 py-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className={`p-1 rounded-full hover:bg-cyan-200/50 transition-colors ${year <= 1 ? 'opacity-30 cursor-not-allowed' : 'text-cyan-800'}`}
                        disabled={year <= 1}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <span className="mx-3 text-sm font-semibold text-cyan-900 min-w-[70px] text-center">
                        Jan, {displayYear}
                    </span>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className={`p-1 rounded-full hover:bg-cyan-200/50 transition-colors ${year >= 10 ? 'opacity-30 cursor-not-allowed' : 'text-cyan-800'}`}
                        disabled={year >= 10}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Label */}
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">
                Asset Value
            </h3>

            {/* Value and Count */}
            <div className="flex items-baseline flex-wrap gap-2 mb-4">
                <span className="text-3xl font-bold text-cyan-700">
                    ₹{formatCurrency(value)}
                </span>
                <span className="text-cyan-600 font-medium text-sm">
                    (Buffaloes - {buffaloCount})
                </span>
            </div>

            {/* Badge */}
            <div className="inline-block bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/50 shadow-sm">
                <span className="text-xs font-semibold text-cyan-900">
                    Projected Value
                </span>
            </div>
        </div>
    );
};

export default AssetProjectionCard;
