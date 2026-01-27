import React from 'react';
import { useEmi } from '../../context/EmiContext';
import { Minus, Plus } from 'lucide-react';

const AcfInputCard = () => {
    const { acfUnits, setAcfUnits, acfMonthlyInstallment, formatCurrency } = useEmi();

    const updateUnits = (newVal: number) => {
        if (newVal >= 1) setAcfUnits(newVal);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-4">How many units do you want?</h3>
            <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0 text-center sm:text-left">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => updateUnits(acfUnits - 1)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all max-[320px]:p-1.5"
                    >
                        <Minus className="w-5 h-5 text-gray-600 max-[320px]:w-4 max-[320px]:h-4" />
                    </button>

                    <div className="w-16 text-center">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">{acfUnits}</span>
                    </div>

                    <button
                        onClick={() => updateUnits(acfUnits + 1)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all max-[320px]:p-1.5"
                    >
                        <Plus className="w-5 h-5 text-gray-600 max-[320px]:w-4 max-[320px]:h-4" />
                    </button>
                </div>

                <div className="hidden sm:block h-12 w-px bg-gray-200"></div>

                <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-medium">Monthly Payment</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary-600">
                        ₹{formatCurrency(acfUnits * acfMonthlyInstallment)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AcfInputCard;
