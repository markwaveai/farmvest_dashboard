import React from 'react';
import { useEmi } from '../../context/EmiContext';
import AcfInputCard from './AcfInputCard';
import AcfStatsGrid from './AcfStatsGrid';
import AcfScheduleTable from './AcfScheduleTable';
import AcfDetails from './AcfDetails';
import { Info } from 'lucide-react';
import { clsx } from 'clsx';

const AcfScreen = () => {
    const { acfTenureMonths, setAcfTenureMonths } = useEmi();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-900">Affordable Crowd Farming</h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2">Invest small, earn big with crowd-funded farming units.</p>
            </div>

            {/* Tenure Selection */}
            <div className="flex space-x-4">
                <TenureButton
                    label="30 Months"
                    selected={acfTenureMonths === 30}
                    onClick={() => setAcfTenureMonths(30)}
                />
                <TenureButton
                    label="11 Months"
                    selected={acfTenureMonths === 11}
                    onClick={() => setAcfTenureMonths(11)}
                />
            </div>

            <AcfInputCard />
            <AcfStatsGrid />

            <AcfScheduleTable />
            <AcfDetails />
        </div>
    );
};


interface TenureButtonProps {
    label: string;
    selected: boolean;
    onClick: () => void;
}

const TenureButton: React.FC<TenureButtonProps> = ({ label, selected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold transition-all shadow-sm max-[320px]:px-4 max-[320px]:py-2 max-[320px]:text-xs",
                selected
                    ? "bg-primary-600 text-white shadow-primary-200"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
        >
            {label}
        </button>
    );
};

export default AcfScreen;
