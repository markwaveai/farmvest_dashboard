
import React, { useEffect, useState } from 'react';
import Xarrow from "react-xarrows";

const lineColors = [
    "#ff9800", // gen 0 → 1
    "#3f51b5",
    "#009688",
    "#e91e63",
    "#f44336",
    "#9c27b0",
    "#4caf50"
];

// Colors array for different generations
export const colors = [
    "bg-gradient-to-br from-amber-400 to-amber-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-red-400 to-red-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-green-400 to-green-600",
];

// Format currency
export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Format number
export const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
};

// Calculate Age in Months
export const calculateAgeInMonths = (buffalo: any, targetYear: number, targetMonth: number = 0) => {
    const birthYear = buffalo.birthYear;
    // Use birthMonth if available, fall back to acquisitionMonth or 0
    const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
    const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
    return Math.max(0, totalMonths);
};

// Get Buffalo Value by Age
// Get Buffalo Value by Age
export const getBuffaloValueByAge = (ageInMonths: number) => {
    if (ageInMonths >= 41) {
        return 175000;
    } else if (ageInMonths >= 35) {
        return 150000;
    } else if (ageInMonths >= 25) {
        return 100000;
    } else if (ageInMonths >= 19) {
        return 40000;
    } else if (ageInMonths >= 13) {
        return 25000;
    } else {
        return 10000;
    }
};

// Build tree function
export const buildTree = (root: any, all: any[]) => {
    return all.filter((b: any) => b.parentId === root.id);
};

// Buffalo Node Component - Updated to accept elementId, parentDisplayName, variant, and tooltipPosition
export const BuffaloNode = ({
    data,
    founder,
    displayName,
    elementId,
    parentDisplayName,
    variant = 'circle',
    tooltipPosition = 'top'
}: {
    data: any;
    founder?: boolean;
    displayName: string;
    elementId: string;
    parentDisplayName?: string;
    variant?: 'circle' | 'pill';
    tooltipPosition?: 'top' | 'right';
}) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const birthMonthName = monthNames[data.acquisitionMonth] || "Jan";

    // Tooltip positioning classes
    const tooltipClasses = tooltipPosition === 'right'
        ? "absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block z-50 w-48 transition-opacity duration-200"
        : "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 w-48 transition-opacity duration-200";

    const arrowClasses = tooltipPosition === 'right'
        ? "absolute top-1/2 right-full -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-slate-800 drop-shadow-sm"
        : "absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800 drop-shadow-sm";

    // Node shape classes
    const nodeShapeClasses = variant === 'pill'
        ? "w-20 h-10 rounded-xl flex-col"
        : "w-12 h-12 rounded-full flex-col";

    return (
        <div id={elementId} className="flex flex-col items-center group relative z-10 hover:z-50">
            {/* Tooltip */}
            <div className={tooltipClasses}>
                <div className="bg-slate-800 text-white text-[11px] rounded-lg p-2 shadow-xl border border-slate-700 relative">
                    <div className="font-bold text-xs mb-1.5 border-b border-slate-600 pb-1.5 text-white">
                        Buffalo {displayName} ({data.ageInMonths >= 34 ? 'Milking' : 'Non-Milking'})
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Age:</span>
                            <span className="font-semibold text-slate-200">{Math.floor(data.ageInMonths / 12)}y {data.ageInMonths % 12}m</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                            <span className="text-slate-400">Lifetime Revenue:</span>
                            <span className="font-bold text-emerald-400">{formatCurrency(data.lifetimeRevenue)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-400">Asset Value:</span>
                            <span className="font-bold text-blue-400">{formatCurrency(data.currentAssetValue)}</span>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className={arrowClasses}></div>
                </div>
            </div>

            <div
                className={`${colors[data.generation % colors.length]}
          ${nodeShapeClasses} flex justify-center items-center
          text-white shadow-md transform transition-all duration-200
          hover:scale-110 border-none cursor-pointer relative`}
            >
                {/* Producing Indicator */}


                <div className="text-[10px] font-bold drop-shadow-md leading-tight text-center px-1">
                    {displayName}
                </div>
                <div className="text-[8px] font-medium opacity-90 bg-black/20 px-1 py-0 rounded-full mt-0.5">
                    {founder ? 'F' : data.birthYear}
                </div>
            </div>
        </div>
    );
};

// Tree Branch Component with Xarrow - FIXED VERSION
export const TreeBranch = ({ parent, all, level = 0, getDisplayName, zoom = 1 }: any) => {
    const kids = buildTree(parent, all);
    const [forceUpdate, setForceUpdate] = useState(0);

    // Force update arrows when zoom changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setForceUpdate(prev => prev + 1);
        }, 50);
        return () => clearTimeout(timer);
    }, [zoom]);

    if (kids.length === 0) return null;

    return (
        <div className="flex flex-col items-center mt-6">
            {/* Connecting line from parent */}
            <div className="h-10 w-0.5 bg-gradient-to-b from-gray-300 to-gray-400"></div>

            <div className="flex flex-wrap gap-6 justify-center items-start relative">
                {kids.map((child: any, index: number) => {
                    const parentId = `buffalo-${parent.id}`;
                    const childId = `buffalo-${child.id}`;

                    return (
                        <div key={`${child.id}-${forceUpdate}`} className="flex flex-col items-center relative">
                            {/* Child Node */}
                            <BuffaloNode
                                data={child}
                                displayName={getDisplayName(child)}
                                parentDisplayName={getDisplayName(parent)}
                                elementId={childId}
                            />

                            {/* Recursive children */}
                            <TreeBranch
                                parent={child}
                                all={all}
                                level={level + 1}
                                getDisplayName={getDisplayName}
                                zoom={zoom}
                            />

                            {/* Line between parent → child - Force update on zoom */}
                            <Xarrow
                                key={`arrow-${parent.id}-${child.id}-${forceUpdate}`}
                                start={parentId}
                                end={childId}
                                color={lineColors[parent.generation % lineColors.length]}
                                strokeWidth={2.5}
                                curveness={0.6}
                                showHead={true}
                                headSize={4}
                                path="smooth"
                                dashness={false}
                                startAnchor="bottom"
                                endAnchor="top"
                                zIndex={10}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
