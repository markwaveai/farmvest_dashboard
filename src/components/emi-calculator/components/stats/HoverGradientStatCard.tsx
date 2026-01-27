import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp } from 'lucide-react';

interface HoverGradientStatCardProps {
    label: string;
    value: number | string;
    prefix?: string;
    icon: any;
    color?: 'blue' | 'green' | 'teal';
    secondaryText?: string;
    isSecondaryBold?: boolean;
    isLarge?: boolean;
    formatCurrency?: (val: number) => string;
}

const HoverGradientStatCard: React.FC<HoverGradientStatCardProps> = ({
    label,
    value,
    prefix = '',
    icon: Icon,
    color = 'blue',
    secondaryText,
    isLarge = false,
    formatCurrency
}) => {
    const formattedValue = typeof value === 'number' && formatCurrency ? formatCurrency(value) : String(value);
    const valueLength = (prefix + formattedValue).length;

    const colorStyles = {
        blue: {
            bg: 'bg-[#e3f2fd]',
            border: 'border-[#bbdefb]',
            text: 'text-[#1976d2]',
            iconBg: 'bg-[#bbdefb]',
        },
        green: {
            bg: 'bg-[#e8f5e9]',
            border: 'border-[#c8e6c9]',
            text: 'text-[#2e7d32]',
            iconBg: 'bg-[#c8e6c9]',
        },
        teal: {
            bg: 'bg-[#e0f2f1]',
            border: 'border-[#b2dfdb]',
            text: 'text-[#00796b]',
            iconBg: 'bg-[#b2dfdb]',
        },
    };

    const theme = colorStyles[color] || colorStyles.blue;

    if (isLarge) {
        // Scaling for Total Return card
        const fontSizeClass = valueLength > 15 ? 'text-lg sm:text-xl' :
            valueLength > 12 ? 'text-xl sm:text-2xl' :
                'text-xl sm:text-3xl';

        return (
            <div className={clsx(
                "group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-md p-4 sm:p-5 flex flex-col justify-between",
                theme.bg, theme.border
            )}>
                <div className="flex justify-between items-start">
                    <div className={clsx(
                        "grid place-items-center rounded-xl w-10 h-10 sm:w-12 sm:h-12",
                        theme.iconBg
                    )}>
                        {typeof Icon === 'string' ? (
                            <img src={Icon} alt="icon" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                        ) : Icon ? (
                            <Icon className={clsx("w-5 h-5 sm:w-7 sm:h-7", theme.text)} />
                        ) : (
                            <TrendingUp className={clsx("w-5 h-5 sm:w-7 sm:h-7", theme.text)} />
                        )}
                    </div>

                    <div className="flex flex-col items-end text-right">
                        <p className="text-[10px] sm:text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-1 leading-none">
                            {label}
                        </p>
                        <div className={clsx("font-black tracking-tighter", fontSizeClass, theme.text)}>
                            {prefix}{formattedValue}
                        </div>
                    </div>
                </div>

                {secondaryText && (
                    <div className="flex justify-between items-baseline mt-4 w-full">
                        <div className="w-24 flex justify-start pl-1">
                            <span className="text-[9px] sm:text-[12px] font-black text-gray-900 leading-tight">
                                Rate of<br />Investment
                            </span>
                        </div>
                        <span className={clsx("text-base sm:text-2xl font-black", theme.text)}>
                            ~ {secondaryText}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // Scaling for smaller cards (Net Cash Flow, Projected Asset)
    const fontSizeClass = valueLength > 13 ? 'text-sm sm:text-base' :
        valueLength > 10 ? 'text-base sm:text-lg' :
            'text-lg sm:text-2xl';

    return (
        <div className={clsx(
            "group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-md p-4 sm:p-5 h-full flex flex-col",
            theme.bg, theme.border
        )}>
            <div className="flex items-start justify-start mb-3 sm:mb-4">
                <div className={clsx(
                    "grid place-items-center rounded-xl w-8 h-8 sm:w-9 sm:h-9",
                    theme.iconBg
                )}>
                    {typeof Icon === 'string' ? (
                        <img src={Icon} alt="icon" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
                    ) : Icon ? (
                        <Icon className={clsx("w-4 h-4 sm:w-5 sm:h-5", theme.text)} />
                    ) : (
                        <TrendingUp className={clsx("w-4 h-4 sm:w-5 sm:h-5", theme.text)} />
                    )}
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-end">
                <p className="font-bold text-gray-500 mb-0.5 text-[10px] sm:text-[11px] uppercase tracking-wider">
                    {label}
                </p>
                <div className="flex items-baseline">
                    <span className={clsx("font-black tracking-tighter truncate w-full", fontSizeClass, theme.text)}>
                        {prefix}{formattedValue}
                    </span>
                </div>
                {secondaryText && (
                    <div className="flex items-baseline mt-1 space-x-1">
                        <span className={clsx("font-black text-xs sm:text-sm", theme.text)}>~ {secondaryText}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HoverGradientStatCard;

