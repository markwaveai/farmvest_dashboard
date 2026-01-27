import React from 'react';
import { useEmi } from '../../context/EmiContext';
import { LayoutGrid, TrendingUp, CreditCard, Calendar, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

const ResultCard = () => {
    const {
        emi,
        totalPayment,
        totalInterest,
        months,
        units,
        cpfEnabled,
        formatCurrency,
        totalNetCash, // Using this to check if calculation occurred
    } = useEmi();

    const cpfPerUnitYearly = 15000.0;
    const year2MonthlyCpf = cpfEnabled ? (cpfPerUnitYearly / 12) * (units > 0 ? units : 1) : 0;
    const displayMonthlyPayment = emi; // Flutter screenshot shows EMI as main Monthly Payment

    return (
        <div className="bg-white rounded-3xl p-4 lg:p-3 border border-gray-100 shadow-lg h-full flex flex-col">
            <div className="flex items-center space-x-2 lg:space-x-1.5 mb-2 lg:mb-1.5">
                <div className="p-1.5 lg:p-1 bg-[#f0f9f1] rounded-lg">
                    <LayoutGrid className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-[#4caf50]" />
                </div>
                <h2 className="text-lg lg:text-sm font-bold text-gray-800">EMI Results</h2>
            </div>

            <div className="bg-[#ebf0f5] rounded-3xl p-5 lg:p-3 mb-4 lg:mb-3 text-center sm:text-left">
                <p className="text-xs lg:text-[10px] font-bold text-gray-400 mb-1.5 lg:mb-1">Monthly Payment</p>
                <div className={clsx(
                    "font-black text-[#3f51b5] leading-tight mb-1.5 lg:mb-1",
                    formatCurrency(displayMonthlyPayment).length > 13 ? "text-[18px] lg:text-[16px]" :
                        formatCurrency(displayMonthlyPayment).length > 10 ? "text-[22px] lg:text-[18px]" :
                            "text-[28px] lg:text-[22px]"
                )}>
                    ₹{formatCurrency(displayMonthlyPayment)}
                </div>
                <p className="text-xs lg:text-[10px] font-bold text-gray-400">
                    Monthly EMI: {formatCurrency(emi)}
                </p>
            </div>

            <div className="space-y-5  px-1 flex-grow mt-3">
                <ResultRow
                    label="Total Interest"
                    value={formatCurrency(totalInterest)}
                    icon={TrendingUp}
                />

                <ResultRow
                    label="Total Payment"
                    value={formatCurrency(totalPayment)}
                    icon={CreditCard}
                />

                <ResultRow
                    label="Loan Tenure"
                    value={`${months} Months`}
                    icon={Calendar}
                />

                <ResultRow
                    label="Year 2+ Monthly CPF"
                    value={formatCurrency(year2MonthlyCpf)}
                    icon={ShieldCheck}
                />
            </div>
        </div>
    );
};

interface ResultRowProps {
    label: string;
    value: string;
    icon: any;
}

const ResultRow: React.FC<ResultRowProps> = ({ label, value, icon: Icon }) => {
    return (
        <div className="flex items-end justify-between">
            <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#ebf0f5] flex items-center justify-center mt-0.5 shrink-0">
                    <Icon className="w-4 h-4 text-[#3f51b5]" />
                </div>
                <span className="text-[13px] font-bold text-gray-500 leading-tight">{label}:</span>
            </div>
            <span className="text-[14px] font-black text-gray-800 leading-none pb-0.5">{value}</span>
        </div>
    );
};

export default ResultCard;
