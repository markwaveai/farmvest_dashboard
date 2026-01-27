import React from 'react';
import { useEmi } from '../../context/EmiContext';
import {
    Wallet,
    CreditCard,
    Calendar,
    PawPrint,
    Sprout,
    TrendingUp,
    AlertCircle,
    Banknote,
    IndianRupee
} from 'lucide-react';
import { clsx } from 'clsx';

interface GenericCardProps {
    label: React.ReactNode;
    value: number;
    colorClass: string;
    borderClass: string;
    icon: any;
    iconColorClass: string;
    shadowClass: string;
    prefix?: string;
}

const GenericCard: React.FC<GenericCardProps> = ({ label, value, colorClass, borderClass, icon: Icon, iconColorClass, shadowClass, prefix = "₹" }) => {
    const { formatCurrency } = useEmi();
    const formattedValue = formatCurrency(value);

    // Scale font size based on length
    // 1 Cr = 1,00,00,000 (9 chars + commas) => ~11-13 chars
    const isLarge = formattedValue.length > 9;
    const isVeryLarge = formattedValue.length > 12;
    const isSuperLarge = formattedValue.length > 15;

    return (
        <div className={clsx(
            "p-3 sm:p-4 rounded-[20px] flex flex-row items-center gap-3 sm:gap-4 h-[90px] transition-all hover:scale-[1.02] border relative overflow-hidden",
            colorClass,
            borderClass,
            shadowClass
        )}>
            <div className={clsx(
                "grid place-items-center rounded-xl bg-white/60 backdrop-blur-md shadow-sm w-10 h-10 shrink-0",
                iconColorClass
            )}>
                {typeof Icon === 'string' ? (
                    <img src={Icon} alt="icon" className="w-5 h-5 object-contain" />
                ) : (
                    <Icon className="w-5 h-5 opacity-90" />
                )}
            </div>

            <div className="flex flex-col min-w-0 relative z-10">
                <div className="text-[11px] sm:text-[13px] font-semibold text-gray-900 tracking-tight leading-tight mb-0.5 truncate">{label}</div>
                <div className={clsx(
                    "font-extrabold tracking-tighter flex items-baseline gap-0.5",
                    isSuperLarge ? "text-[11px] sm:text-[13px]" :
                        isVeryLarge ? "text-[13px] sm:text-[15px]" :
                            isLarge ? "text-[15px] sm:text-[18px]" :
                                "text-[18px] sm:text-[22px]"
                )}>
                    <span className={clsx(
                        "font-bold opacity-70",
                        isVeryLarge ? "text-[9px] sm:text-[11px]" : "text-[11px] sm:text-[13px]"
                    )}>{prefix}</span>
                    <span className="truncate">{formattedValue}</span>
                </div>
            </div>
        </div>
    );
};

interface SummaryRowProps {
    label: string;
    value: number | string;
    formatCurrency: (val: number) => string;
    hidePrefix?: boolean;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ label, value, formatCurrency, hidePrefix = false }) => (
    <div className="flex justify-between items-center py-0.5">
        <span className="text-[15px] font-medium text-gray-500">{label}</span>
        <span className="text-[15px] text-gray-900 font-bold">
            {!hidePrefix && <span className="mr-0.5">₹</span>}
            {typeof value === 'number' ? formatCurrency(value) : value}
        </span>
    </div>
);

const SimulationSummary = () => {
    const {
        formatCurrency,
        totalRevenue,
        totalPayment,
        totalCpf,
        totalCgf,
        totalProfit,
        totalLoss,
        totalNetCash,
        totalAssetValue,
        amount,
        totalInterest,
        emi,
        rate,

        cgfEnabled,
        months,
        totalRevenueLongTerm,
        totalCpfLongTerm,
        totalCgfLongTerm,
        totalAssetValueLongTerm,
        totalNetCashLongTerm,
        totalAssetValue120,
    } = useEmi();

    // Specific logic: If CGF is enabled, show 0 to the user as requested.
    const displayCgf = !cgfEnabled ? 0 : totalCgf;

    return (
        <div className="space-y-12 mt-12 px-2 pb-8">
            {/* Summary Grid - Responsive across all breakpoints */}
            {/* 0-60 Months Row */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 pb-0.5 mb-2 border-b border-gray-100">Projected 0-60 Months</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    <GenericCard
                        label="Revenue (0-60 Months)"
                        value={totalRevenue}
                        colorClass="bg-[#E8F5E9] text-[#2E7D32]" // Green
                        borderClass="border-[#A5D6A7]"
                        shadowClass="shadow-[0_4px_15px_rgb(46,125,50,0.1)]"
                        icon={IndianRupee}
                        iconColorClass="text-[#2E7D32]"
                    />
                    <GenericCard
                        label={
                            <div className="flex flex-col">
                                <span>Total Payment</span>
                                <span className="text-[10px] sm:text-[11px] font-medium opacity-90 leading-tight">(EMI+CPF)</span>
                            </div>
                        }
                        value={totalPayment + totalCpf}
                        colorClass="bg-[#FFF3E0] text-[#EF6C00]" // Orange
                        borderClass="border-[#FFE0B2]"
                        shadowClass="shadow-[0_4px_15px_rgb(239,108,0,0.1)]"
                        icon={CreditCard}
                        iconColorClass="text-[#EF6C00]"
                    />
                    <GenericCard
                        label="Loan Paid"
                        value={totalPayment}
                        colorClass="bg-[#F3E5F5] text-[#7B1FA2]" // Purple
                        borderClass="border-[#E1BEE7]"
                        shadowClass="shadow-[0_4px_15px_rgb(123,31,162,0.1)]"
                        icon={Calendar}
                        iconColorClass="text-[#7B1FA2]"
                    />
                    <GenericCard
                        label="CPF (0-60 Months)"
                        value={totalCpf}
                        colorClass="bg-[#FFFDE7] text-[#FBC02D]" // Yellow
                        borderClass="border-[#FFF9C4]"
                        shadowClass="shadow-[0_4px_15px_rgb(251,192,45,0.1)]"
                        icon={PawPrint}
                        iconColorClass="text-[#FBC02D]"
                    />
                    {/* <GenericCard
                        label="CGF (0-60 Months)"
                        value={displayCgf}
                        colorClass="bg-[#EFEBE9] text-[#5D4037]" // Brown
                        borderClass="border-[#D7CCC8]"
                        shadowClass="shadow-[0_4px_15px_rgb(93,64,55,0.1)]"
                        icon={Sprout}
                        iconColorClass="text-[#5D4037]"
                    /> */}
                    <GenericCard
                        label="Total Profit"
                        value={totalProfit}
                        colorClass="bg-[#E3F2FD] text-[#1565C0]" // Blue
                        borderClass="border-[#BBDEFB]"
                        shadowClass="shadow-[0_4px_15px_rgb(21,101,192,0.1)]"
                        icon={TrendingUp}
                        iconColorClass="text-[#1565C0]"
                    />
                    <GenericCard
                        label="From Pocket"
                        value={totalLoss}
                        colorClass="bg-[#FFEBEE] text-[#C62828]" // Red
                        borderClass="border-[#FFCDD2]"
                        shadowClass="shadow-[0_4px_15px_rgb(198,40,40,0.1)]"
                        icon={AlertCircle}
                        iconColorClass="text-[#C62828]"
                    />
                    <GenericCard
                        label="Net Cash"
                        value={totalNetCash}
                        colorClass="bg-[#E0F2F1] text-[#00695C]" // Teal
                        borderClass="border-[#B2DFDB]"
                        shadowClass="shadow-[0_4px_15px_rgb(0,105,92,0.1)]"
                        icon={Banknote}
                        iconColorClass="text-[#00695C]"
                    />
                    <GenericCard
                        label="Asset Value (0-60 Months)"
                        value={totalAssetValue}
                        colorClass="bg-[#E8EAF6] text-[#283593]" // Indigo
                        borderClass="border-[#C5CAE9]"
                        shadowClass="shadow-[0_4px_15px_rgb(40,53,147,0.1)]"
                        icon="/buffalo_icon.png"
                        iconColorClass="text-[#283593]"
                    />
                </div>
            </div>

            {/* 61-120 Months Row */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 pb-0.5 mb-2 border-b border-gray-100">Projected 61-120 Months</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    <GenericCard
                        label="Revenue (61-120 Months)"
                        value={totalNetCashLongTerm}
                        colorClass="bg-[#E8F5E9] text-[#2E7D32]"
                        borderClass="border-[#A5D6A7]"
                        shadowClass="shadow-[0_4px_15px_rgb(46,125,50,0.1)]"
                        icon={IndianRupee}
                        iconColorClass="text-[#2E7D32]"
                    />
                    <GenericCard
                        label="CPF (61-120 Months)"
                        value={totalCpfLongTerm}
                        colorClass="bg-[#FFFDE7] text-[#FBC02D]"
                        borderClass="border-[#FFF9C4]"
                        shadowClass="shadow-[0_4px_15px_rgb(251,192,45,0.1)]"
                        icon={PawPrint}
                        iconColorClass="text-[#FBC02D]"
                    />
                    {/* <GenericCard
                    label="CGF (61-120 Months)"
                    value={!cgfEnabled ? 0 : totalCgfLongTerm}
                    colorClass="bg-[#EFEBE9] text-[#5D4037]"
                    borderClass="border-[#D7CCC8]"
                    shadowClass="shadow-[0_4px_15px_rgb(93,64,55,0.1)]"
                    icon={Sprout}
                    iconColorClass="text-[#5D4037]"
                /> */}

                    <GenericCard
                        label="Asset Value (61-120 Months)"
                        value={totalAssetValueLongTerm}
                        colorClass="bg-[#E8EAF6] text-[#283593]"
                        borderClass="border-[#C5CAE9]"
                        shadowClass="shadow-[0_4px_15px_rgb(40,53,147,0.1)]"
                        icon="/buffalo_icon.png"
                        iconColorClass="text-[#283593]"
                    />
                </div>
            </div>

            {/* 10 Year Summary Row */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 pb-0.5 mb-2 border-b border-gray-100">10 Year Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    <GenericCard
                        label="10 Years Total Revenue"
                        value={totalProfit + totalNetCashLongTerm}
                        colorClass="bg-[#E8F5E9] text-[#2E7D32]"
                        borderClass="border-[#A5D6A7]"
                        shadowClass="shadow-[0_4px_15px_rgb(46,125,50,0.1)]"
                        icon={IndianRupee}
                        iconColorClass="text-[#2E7D32]"
                    />
                    <GenericCard
                        label="Total Asset Value (10 Years)"
                        value={totalAssetValue120}
                        colorClass="bg-[#E8EAF6] text-[#283593]"
                        borderClass="border-[#C5CAE9]"
                        shadowClass="shadow-[0_4px_15px_rgb(40,53,147,0.1)]"
                        icon="/buffalo_icon.png"
                        iconColorClass="text-[#283593]"
                    />
                </div>
            </div>

            {/* Loan Summary Section - Stylized to match requested image */}
            <div className="bg-[#F1F3F5] rounded-[24px] p-6 border border-gray-200/50 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Loan Summary</h3>
                <div className="space-y-2">
                    <SummaryRow label="Total Loan Amount" value={amount} formatCurrency={formatCurrency} />
                    <SummaryRow label="Total Interest" value={totalInterest} formatCurrency={formatCurrency} />
                    <SummaryRow label="Loan Paid" value={totalPayment} formatCurrency={formatCurrency} />

                    <div className="h-[1px] bg-gray-300 my-4" />

                    <SummaryRow label="Monthly Payment" value={emi} formatCurrency={formatCurrency} />
                    <SummaryRow label="Loan Tenure" value={months} formatCurrency={(v: number) => `${v} months`} hidePrefix />
                    <SummaryRow label="Interest Rate" value={rate} formatCurrency={(v: number) => `${v}% per year`} hidePrefix />
                </div>
            </div>
        </div>
    );
};

export default SimulationSummary;
