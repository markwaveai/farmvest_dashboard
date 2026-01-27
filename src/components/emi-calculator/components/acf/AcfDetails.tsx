import React from 'react';
import { useEmi } from '../../context/EmiContext';
import { Check, Info, Calendar, CheckCircle2, CircleDollarSign, Clock, AlertCircle, IndianRupee } from 'lucide-react';
import { clsx } from 'clsx';
import { TrendingUp as TrendingUpIcon } from 'lucide-react';

const AcfDetails = () => {
    const {
        acfUnits,
        acfTenureMonths,
        acfTotalInvestment,
        formatCurrency,
        acfCpfBenefit
    } = useEmi();

    // Derived values for display
    // Using 3.5L per unit as the "Market Price" reference to show the discount/bonus context
    const marketPricePerUnit = 350000;
    const totalMarketPrice = acfUnits * marketPricePerUnit;

    // Asset Value for display (using 4.2L derived from image ratio or context, 
    // but let's stick to a logical "Projected Value" which is usually higher than cost)
    // The image shows 4,20,000 asset value for 3,00,000 investment. That's 1.4x
    const projectedAssetValue = acfTotalInvestment * 1.4;

    const cpfRate = 15000;
    const cpfTotalValue = acfCpfBenefit;

    return (
        <div className="space-y-6 mt-8">
            {/* ACF Option Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-blue-100">
                {/* Header */}
                <div className="bg-blue-900 px-4 sm:px-6 py-3 sm:py-4">
                    <h3 className="text-white font-bold text-base sm:text-lg text-center">ACF Option</h3>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

                    {/* Asset Value */}
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="mt-1">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 fill-green-50" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm sm:text-base text-gray-900">Asset Value</p>
                            <p className="text-gray-500 font-medium text-sm sm:text-base">{formatCurrency(projectedAssetValue)}</p>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="mt-1">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 fill-green-50" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-sm sm:text-base text-gray-900">Pricing</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 line-through text-xs sm:text-sm">{formatCurrency(totalMarketPrice)}</span>
                                        <span className="text-green-600 font-bold text-base sm:text-lg">{formatCurrency(acfTotalInvestment)}</span>
                                    </div>
                                </div>
                                <BonusBadge />
                            </div>
                        </div>
                    </div>

                    {/* CPF */}
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="mt-1">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 fill-green-50" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-sm sm:text-base text-gray-900">CPF</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-gray-500 text-xs sm:text-sm">
                                            {acfUnits} x {formatCurrency(cpfRate)} = {formatCurrency(acfUnits * cpfRate)} (x{acfTenureMonths === 30 ? '2' : '1'} terms)
                                        </span>
                                        <span className="text-green-600 font-bold text-base sm:text-lg">₹0*</span>
                                    </div>
                                </div>
                                <BonusBadge />
                            </div>
                        </div>
                    </div>

                    {/* Fixed Rate */}
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="mt-1">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 fill-green-50" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-sm sm:text-base text-gray-900">Fixed Rate</p>
                                    <p className="text-gray-500 text-xs sm:text-sm">The Unit price is fixed for the complete tenure</p>
                                </div>
                                <BonusBadge />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* PCC Note */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-orange-700 text-xs sm:text-sm font-medium">
                    Note: A 4% Pre-Closure Charge (PCC) is applicable on the paid amount if the plan is closed before the end of the tenure.
                </p>
            </div>

            {/* Revenue Timeline */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 sm:mb-8">
                    <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                        <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900">Revenue Timeline</h3>
                        <p className="text-[10px] sm:text-xs text-gray-500">Key milestones for your investment</p>
                    </div>
                </div>

                <div className="relative pl-3 sm:pl-4 space-y-6 sm:space-y-8">
                    {/* Vertical Line */}
                    <div className="absolute left-[23px] sm:left-[27px] top-3 bottom-3 w-0.5 bg-gray-100" />

                    {/* Step 1 */}
                    <TimelineItem
                        icon={Calendar}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-500"
                        label={`Months 1-${acfTenureMonths}`}
                        title="Monthly Payments"
                        description="Regular investment period"
                    />

                    {/* Step 2 */}
                    <TimelineItem
                        icon={CheckCircle2}
                        iconBg="bg-green-50"
                        iconColor="text-green-500"
                        label={`Month ${acfTenureMonths}`}
                        title="Payment Complete"
                        description="Full investment realized"
                    />

                    {/* Step 3 */}
                    <TimelineItem
                        icon={IndianRupee}
                        iconBg="bg-orange-50"
                        iconColor="text-orange-500"
                        label={`Month ${acfTenureMonths + 1}`}
                        title="Revenue Starts"
                        description="Immediate returns begin"
                    />
                </div>
            </div>
        </div>
    );
};

const BonusBadge = () => (
    <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded text-[10px] font-bold text-yellow-700 uppercase tracking-wide whitespace-nowrap shrink-0">
        <span>✨ BONUS</span>
    </div>
);

interface TimelineItemProps {
    icon: any;
    iconBg: string;
    iconColor: string;
    label: string;
    title: string;
    description: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ icon: Icon, iconBg, iconColor, label, title, description }) => (
    <div className="relative flex items-start gap-3 sm:gap-4">
        <div className={clsx("relative z-10 p-1.5 sm:p-2 rounded-full ring-4 ring-white", iconBg)}>
            <Icon className={clsx("w-4 h-4 sm:w-5 sm:h-5", iconColor)} />
        </div>
        <div>
            <span className={clsx("text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded mb-1 inline-block", iconBg, iconColor)}>
                {label}
            </span>
            <h4 className="font-bold text-sm sm:text-base text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </div>
);

export default AcfDetails;
