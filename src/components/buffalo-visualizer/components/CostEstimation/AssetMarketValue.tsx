
import React, { useState, useEffect } from 'react';

const AssetMarketValue = ({
    treeData,
    buffaloDetails,
    calculateAgeInMonths,
    getBuffaloValueByAge,
    getBuffaloValueDescription,
    calculateDetailedAssetValue,
    assetMarketValue,
    formatCurrency,
    isAssetMarketValue = true,
    startYear,
    endYear,
    endMonth,
    yearRange,
    yearlyData,
    monthlyRevenue,
    yearlyCPFCost,
    selectedYear
}: any) => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const startMonthName = monthNames[treeData.startMonth || 0];
    const startDateString = `${startMonthName} ${treeData.startYear}`;

    const endDateString = `December ${endYear}`;

    // const [selectedYear, setSelectedYear] = useState(treeData.startYear); // Controlled by Parent
    const breakdownYear = selectedYear;
    const [selectedAssetData, setSelectedAssetData] = useState<any>(null);
    const [breakdownAssetData, setBreakdownAssetData] = useState<any>(null);
    const [totalBuffaloes, setTotalBuffaloes] = useState(0);

    // Update selected asset data when year changes
    useEffect(() => {
        const assetData = assetMarketValue.find((a: any) => a.year === selectedYear) || assetMarketValue[0];
        setSelectedAssetData(assetData);

        if (assetData) {
            // Calculate total buffaloes from age categories
            let total = 0;
            Object.values(assetData.ageCategories || {}).forEach((category: any) => {
                total += category.count || 0;
            });
            setTotalBuffaloes(total);
        } else {
            // Fallback: calculate from buffaloDetails
            let count = 0;
            Object.values(buffaloDetails).forEach((buffalo: any) => {
                if (selectedYear >= buffalo.birthYear) {
                    count++;
                }
            });
            setTotalBuffaloes(count);
        }
    }, [selectedYear, assetMarketValue, buffaloDetails]);

    // Update breakdown asset data when breakdown year changes
    useEffect(() => {
        const assetData = assetMarketValue.find((a: any) => a.year === breakdownYear) || assetMarketValue[0];
        setBreakdownAssetData(assetData);
    }, [breakdownYear, assetMarketValue]);

    // Age-Based Valuation Breakdown function for selected year
    const calculateDetailedAssetValueForYear = (year: number) => {
        const ageGroups: any = {
            '0-12 months': { count: 0, value: 0, unitValue: 10000 },
            '13-18 months': { count: 0, value: 0, unitValue: 25000 },
            '19-24 months': { count: 0, value: 0, unitValue: 40000 },
            '25-34 months': { count: 0, value: 0, unitValue: 100000 },
            '35-40 months': { count: 0, value: 0, unitValue: 150000 },
            '41+ months': { count: 0, value: 0, unitValue: 175000 }
        };

        let totalValue = 0;
        let totalCount = 0;

        Object.values(buffaloDetails).forEach((buffalo: any) => {
            // Only count buffaloes born before or in the last year/month
            // Determine target month: December (11) for full years, or endMonth for the final year
            // Use 12 (January of next year equivalent) for full years to capture completed year valuation
            const targetMonth = (year === endYear && endMonth !== undefined && endMonth !== 11) ? endMonth : 12;

            if (buffalo.birthYear < year || (buffalo.birthYear === year && (buffalo.birthMonth || 0) <= targetMonth)) {
                const ageInMonths = calculateAgeInMonths(buffalo, year, targetMonth);
                let value = getBuffaloValueByAge(ageInMonths);

                // Override: 0-12 months value is 0 in the first year only
                if (Number(year) === Number(treeData.startYear) && ageInMonths <= 12) {
                    value = 0;
                }

                if (ageInMonths >= 41) {
                    ageGroups['41+ months'].count++;
                    ageGroups['41+ months'].value += value;
                } else if (ageInMonths >= 35) {
                    ageGroups['35-40 months'].count++;
                    ageGroups['35-40 months'].value += value;
                } else if (ageInMonths >= 25) {
                    ageGroups['25-34 months'].count++;
                    ageGroups['25-34 months'].value += value;
                } else if (ageInMonths >= 19) {
                    ageGroups['19-24 months'].count++;
                    ageGroups['19-24 months'].value += value;
                } else if (ageInMonths >= 13) {
                    ageGroups['13-18 months'].count++;
                    ageGroups['13-18 months'].value += value;
                } else {
                    ageGroups['0-12 months'].count++;
                    ageGroups['0-12 months'].value += value;
                }

                totalValue += value;
                totalCount++;
            }
        });

        return { ageGroups, totalValue, totalCount };
    };

    // Helper function to get category count from asset data
    const getCategoryCount = (categoryKey: string, dataSource: any = selectedAssetData) => {
        if (!dataSource || !dataSource.ageCategories) return 0;

        // Try multiple possible key formats
        const keys = [
            categoryKey,
            categoryKey.replace(' (Calves)', ''),
            categoryKey.replace(' (Mother Buffalo)', ''),
            categoryKey.includes('0-6') ? '0-6 months' : undefined,
            categoryKey.includes('60+') ? '60+ months' : undefined
        ].filter(Boolean);

        for (const key of keys) {
            if (key && (dataSource.ageCategories as any)[key]) {
                return (dataSource.ageCategories as any)[key].count || 0;
            }
        }

        return 0;
    };

    // Helper function to get category value from asset data
    const getCategoryValue = (categoryKey: string, dataSource: any = selectedAssetData) => {
        if (!dataSource || !dataSource.ageCategories) return 0;

        const keys = [
            categoryKey,
            categoryKey.replace(' (Calves)', ''),
            categoryKey.replace(' (Mother Buffalo)', ''),
            categoryKey.includes('0-6') ? '0-6 months' : undefined,
            categoryKey.includes('60+') ? '60+ months' : undefined
        ].filter(Boolean);

        for (const key of keys) {
            if (key && (dataSource.ageCategories as any)[key]) {
                return (dataSource.ageCategories as any)[key].value || 0;
            }
        }

        return 0;
    };

    if (isAssetMarketValue) {
        // This is the Asset Market Value component
        if (!selectedAssetData || !breakdownAssetData) {
            return <div>Loading asset data...</div>;
        }

        const detailedValue = calculateDetailedAssetValueForYear(selectedYear);

        return (
            <div className="w-full mb-8 space-y-4">

                {/* 1. Value Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                    <div className="bg-white rounded-md p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Asset Value</p>
                            <h3 className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(detailedValue.totalValue || 0)}</h3>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Year {selectedYear}</p>
                    </div>

                    <div className="bg-white rounded-md p-2 border border-slate-200 shadow-sm flex flex-col justify-between items-center text-center">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Headcount</p>
                            <h3 className="text-base font-bold text-indigo-600 mt-0.5">{detailedValue.totalCount}</h3>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Buffaloes</p>
                    </div>
                </div>

                {/* 2. Age-Based Valuation Breakdown Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-center items-center p-4 border-b border-slate-200">
                        <div className="text-sm font-bold text-slate-700">Age Breakdown</div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                                    <th className="px-6 py-4 font-bold border-r border-slate-100 w-1/5">Age Group</th>
                                    <th className="px-6 py-4 font-bold border-r border-slate-100 text-center w-1/5">Unit Value</th>
                                    <th className="px-6 py-4 font-bold border-r border-slate-100 text-center w-1/5">Count</th>
                                    <th className="px-6 py-4 font-bold border-r border-slate-100 text-center w-1/5">Total Value</th>
                                    <th className="px-6 py-4 font-bold text-center w-1/5">% of Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(detailedValue.ageGroups)
                                    .filter(([_, data]: [string, any]) => data.count > 0)
                                    .map(([ageGroup, data]: [string, any], index: number) => {
                                        // Clean row styling
                                        return (
                                            <tr
                                                key={ageGroup}
                                                className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                            >
                                                <td className="px-6 py-3 font-medium text-slate-900 border-r border-slate-100">
                                                    {ageGroup}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-600 text-center border-r border-slate-100">
                                                    {ageGroup === '0-12 months' && Number(selectedYear) === Number(treeData.startYear) ? formatCurrency(0) : formatCurrency(data.unitValue)}
                                                </td>
                                                <td className="px-6 py-3 font-bold text-slate-700 text-center border-r border-slate-100">
                                                    {data.count}
                                                </td>
                                                <td className="px-6 py-3 font-bold text-emerald-600 text-center border-r border-slate-100">
                                                    {formatCurrency(data.value)}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <span className="text-xs font-semibold text-slate-500 w-10 text-right">
                                                            {detailedValue.totalValue > 0 ? ((data.value / detailedValue.totalValue) * 100).toFixed(1) : 0}%
                                                        </span>
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{ width: `${(data.value / detailedValue.totalValue) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                            <tfoot className="bg-slate-800 text-white">
                                <tr>
                                    <td className="px-6 py-4 font-bold border-r border-slate-700">Total</td>
                                    <td className="px-6 py-4 font-bold text-center border-r border-slate-700">-</td>
                                    <td className="px-6 py-4 font-bold text-center border-r border-slate-700">{detailedValue.totalCount}</td>
                                    <td className="px-6 py-4 font-bold text-emerald-400 text-center border-r border-slate-700">
                                        {formatCurrency(detailedValue.totalValue || 0)}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-center">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* 3. Year-wise Distribution Table (Hidden or Secondary?) */}
                {/* Let's keep it but formatted */}
                <div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Year-wise Age Category Distribution</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-bold border-r border-slate-100">Year</th>
                                        <th className="px-4 py-3 font-bold border-r border-slate-100 text-center">Total</th>
                                        <th className="px-4 py-3 font-medium border-r border-slate-100 text-center text-slate-400">0-12m</th>
                                        <th className="px-4 py-3 font-medium border-r border-slate-100 text-center text-slate-400">13-18m</th>
                                        <th className="px-4 py-3 font-medium border-r border-slate-100 text-center text-slate-400">19-24m</th>
                                        <th className="px-4 py-3 font-medium border-r border-slate-100 text-center text-slate-400">25-34m</th>
                                        <th className="px-4 py-3 font-medium border-r border-slate-100 text-center text-slate-400">35-40m</th>
                                        <th className="px-4 py-3 font-medium border-r border-slate-100 text-center text-slate-400">41+m</th>
                                        <th className="px-4 py-3 font-bold text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assetMarketValue.map((asset: any, yearIndex: number) => (
                                        <tr key={yearIndex} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-100">Year {yearIndex + 1}</td>
                                            <td className="px-4 py-3 font-bold text-center text-slate-800 border-r border-slate-100">{asset.totalBuffaloes}</td>
                                            <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-500">{asset.ageCategories?.['0-12 months']?.count || 0}</td>
                                            <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-500">{asset.ageCategories?.['13-18 months']?.count || 0}</td>
                                            <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-500">{asset.ageCategories?.['19-24 months']?.count || 0}</td>
                                            <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-500">{asset.ageCategories?.['25-34 months']?.count || 0}</td>
                                            <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-500">{asset.ageCategories?.['35-40 months']?.count || 0}</td>
                                            <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-500">{asset.ageCategories?.['41+ months']?.count || 0}</td>
                                            <td className="px-4 py-3 font-bold text-right text-emerald-600">{formatCurrency(asset.totalAssetValue || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 4. Price Schedule Grid */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 border-dashed">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Price Schedule Reference</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {[
                            { age: '0-12m', price: '₹10k', desc: 'Calf' },
                            { age: '13-18m', price: '₹25k', desc: 'Growing' },
                            { age: '19-24m', price: '₹40k', desc: 'Heifer' },
                            { age: '25-34m', price: '₹1.0L', desc: 'Mature' },
                            { age: '35-40m', price: '₹1.5L', desc: 'Prime' },
                            { age: '41+m', price: '₹1.75L', desc: 'Peak/Proven' }
                        ].map((item, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
                                <div className="text-xs font-semibold text-slate-500 mb-0.5">{item.age}</div>
                                <div className="text-sm font-bold text-slate-900">{item.price}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        );
    }

    // Fallback for non-primary view (lines 584+) 
    // ... (Seems unused in CostEstimationTable based on previous view_file, but keeping safe logic)
    const detailedAssetValue = calculateDetailedAssetValue(selectedYear);
    return (
        <div className="w-full text-center p-8 text-slate-500">
            Alternative View Not Configured
        </div>
    );
};

export default AssetMarketValue;
