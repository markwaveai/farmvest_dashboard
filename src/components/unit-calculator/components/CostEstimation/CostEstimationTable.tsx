
import React, { useState } from 'react';
import {
    Info,
    Calendar,
    Target,
    TrendingUp,
    Activity,
    PieChart,
    Clock,
    Sprout,
    Calculator
} from 'lucide-react';
import MonthlyRevenueBreak from './MonthlyRevenueBreak';
import RevenueBreakEven from './RevenueBreakEven';
import AssetMarketValue from './AssetMarketValue';
import HerdPerformance from './HerdPerformance';
import AnnualHerdRevenue from './AnnualHerdRevenue';
import BreakEvenTimeline from './BreakEvenTimeline';
import CattleGrowingFund from './CattleGrowingFund';
import CpfCgfCombined from './CpfCgfCombined';
import { formatCurrency, formatNumber } from '../BuffaloFamilyTree/CommonComponents';

const CostEstimationTable = ({
    treeData,
    activeGraph,
    setActiveGraph,
    onBack,
    setHeaderStats
}: {
    treeData: any;
    activeGraph: string;
    setActiveGraph: (val: string) => void;
    onBack: () => void;
    setHeaderStats?: (stats: any) => void;
}) => {
    return <CostEstimationTableContent treeData={treeData} activeGraph={activeGraph} setActiveGraph={setActiveGraph} onBack={onBack} setHeaderStats={setHeaderStats} />;
};

const CostEstimationTableContent = ({
    treeData: propTreeData,
    activeGraph,
    setActiveGraph,
    onBack,
    setHeaderStats
}: {
    treeData: any;
    activeGraph: string;
    setActiveGraph: (val: string) => void;
    onBack: () => void;
    setHeaderStats?: (stats: any) => void;
}) => {
    const [activeTab, setActiveTab] = useState("Monthly Revenue Break");
    const [cpfToggle, setCpfToggle] = useState("withCPF");
    const [globalYearIndex, setGlobalYearIndex] = useState(0);

    if (!propTreeData?.revenueData) {
        return (
            <div className="fixed inset-0 bg-white z-50 overflow-auto flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="text-2xl text-red-500 mb-4">Revenue data not available</div>
                    <button
                        onClick={onBack}
                        className="bg-red-500 text-white px-6 py-3 rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const treeData = propTreeData;
    const startYear = treeData.startYear;
    const startMonth = treeData.startMonth;

    const { yearlyData, totalRevenue, totalUnits, totalMatureBuffaloYears } = treeData.revenueData;

    // Shared calculation functions
    const calculateAgeInMonths = (buffalo: any, targetYear: number, targetMonth: number = 0) => {
        const birthYear = buffalo.birthYear;
        // Use birthMonth if available (from getBuffaloDetails), fall back to acquisitionMonth or 0
        const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
        const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
        return Math.max(0, totalMonths);
    };

    const getBuffaloDetails = () => {
        const buffaloDetails: any = {};

        // First pass: Create all buffalo entries
        treeData.buffaloes.forEach((buffalo: any) => {
            // Determine acquisition/birth month logic
            // For Gen 0, acquisitionMonth is set.
            // For Gen > 0, we can use birthMonth if available or inherit from parent acquisition if consistent.
            // In the new treeData, acquisitionMonth is passed down.

            const birthMonth = buffalo.generation === 0
                ? (buffalo.acquisitionMonth || 0)
                : (buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0));

            // Normalize data types for safer consumption
            const gen = Number(buffalo.generation);
            const acqMonth = Number(buffalo.acquisitionMonth || 0);
            const absAcq = buffalo.absoluteAcquisitionMonth !== undefined
                ? Number(buffalo.absoluteAcquisitionMonth)
                : (Number(treeData.startYear) * 12 + acqMonth); // robust fallback

            buffaloDetails[buffalo.id] = {
                id: buffalo.id,
                name: buffalo.name || buffalo.id,
                originalId: buffalo.id,
                generation: gen,
                unit: buffalo.unit,
                acquisitionMonth: acqMonth,
                absoluteAcquisitionMonth: absAcq,
                birthYear: Number(buffalo.birthYear),
                birthMonth: Number(birthMonth),
                parentId: buffalo.parentId,
                children: [],
                grandchildren: []
            };
        });

        // Second pass: Link relationships
        treeData.buffaloes.forEach((buffalo: any) => {
            if (buffalo.parentId && buffaloDetails[buffalo.parentId]) {
                const parent = buffaloDetails[buffalo.parentId];
                parent.children.push(buffalo.id);

                // If parent is a child (generation 1), then this buffalo is a grandchild (generation 2)
                // We also want to link it to the grandparent for CostEstimationTable structure if needed,
                // though the current code only explicitly tracks grandchildren for the grandparent object?
                // The original code was: grandparent.grandchildren.push(buffalo.id)

                if (parent.generation === 1) {
                    const grandparent = buffaloDetails[parent.parentId];
                    if (grandparent) {
                        grandparent.grandchildren.push(buffalo.id);
                    }
                }
            }
        });

        return buffaloDetails;
    };

    const calculateMonthlyRevenueForBuffalo = (acquisitionMonth: number, currentMonth: number, currentYear: number, startYear: number, absoluteAcquisitionMonth?: number, generation = 0, buffaloId = '') => {
        let monthsSinceAcquisition;

        if (absoluteAcquisitionMonth !== undefined) {
            const currentAbsolute = currentYear * 12 + currentMonth;
            monthsSinceAcquisition = currentAbsolute - absoluteAcquisitionMonth;
        } else {
            monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);
        }

        let offset = 2;
        if (generation > 0) {
            offset = 34; // Standardized for all offspring
        }

        if (monthsSinceAcquisition < offset) {
            return 0;
        }

        const productionMonth = monthsSinceAcquisition - offset;
        const cycleMonth = productionMonth % 12;

        if (cycleMonth < 5) {
            return 9000;
        } else if (cycleMonth < 8) {
            return 6000;
        } else {
            return 0;
        }
    };

    const calculateYearlyCPFCost = () => {
        const buffaloDetails = getBuffaloDetails();
        const cpfCostByYear: any = {};
        const cpfCostByMonth: any = {}; // { year: { month: cost } }

        const CPF_PER_MONTH = 15000 / 12;

        const totalSimMonths = Math.min(120, treeData.durationMonths || (treeData.years * 12));
        const absoluteStart = treeData.startYear * 12 + (treeData.startMonth || 0);
        const absoluteEnd = absoluteStart + totalSimMonths - 1;
        const endYearVal = Math.floor(absoluteEnd / 12);
        const durationYears = endYearVal - treeData.startYear + 1;

        for (let year = treeData.startYear; year < treeData.startYear + durationYears; year++) {
            let totalCPFCost = 0;
            cpfCostByMonth[year] = {};

            for (let month = 0; month < 12; month++) {
                let monthlyTotalCPF = 0;

                // Calculate for Unit 1 only, then multiply by total units
                // Since buffaloDetails only contains Unit 1 buffaloes (as per scaledTreeData logic)
                const unitBuffaloes = Object.values(buffaloDetails).filter((buffalo: any) => buffalo.unit === 1);
                let monthsWithCPF = 0;
                let buffaloesPayingCPF = 0;

                unitBuffaloes.forEach((buffalo: any) => {
                    // Cutoff Logic
                    const currentAbsoluteMonth = year * 12 + month;
                    const absoluteStartMonth = treeData.startYear * 12 + treeData.startMonth;
                    const absoluteEndMonth = absoluteStartMonth + (treeData.durationMonths || (treeData.years * 12)) - 1;

                    if (currentAbsoluteMonth < absoluteStartMonth || currentAbsoluteMonth > absoluteEndMonth) {
                        return;
                    }

                    let isCpfApplicable = false;

                    if (buffalo.generation === 0) {
                        const isFirstInUnit = (buffalo.id.charCodeAt(0) - 65) % 2 === 0;

                        if (isFirstInUnit) {
                            // Type A: Free Period for first 12 months
                            const absoluteStart = treeData.startYear * 12 + treeData.startMonth;
                            const monthsSinceStart = currentAbsoluteMonth - absoluteStart;

                            if (monthsSinceStart >= 12) {
                                isCpfApplicable = true;
                            }
                        } else {
                            // Type B: Free Period Check
                            const startYear = treeData.startYear;
                            const isPresentInSimulation = buffalo.absoluteAcquisitionMonth !== undefined
                                ? currentAbsoluteMonth >= buffalo.absoluteAcquisitionMonth
                                : (year > startYear || (year === startYear && month >= buffalo.acquisitionMonth));

                            if (isPresentInSimulation) {
                                const absoluteStart = treeData.startYear * 12 + treeData.startMonth;
                                const monthsSinceStart = currentAbsoluteMonth - absoluteStart;
                                const isFreePeriod = monthsSinceStart >= 6 && monthsSinceStart < 18;

                                if (!isFreePeriod) {
                                    isCpfApplicable = true;
                                }
                            }
                        }
                    } else if (buffalo.generation >= 1) {
                        const ageInMonths = calculateAgeInMonths(buffalo, year, month);
                        if (ageInMonths >= 24) {
                            isCpfApplicable = true;
                        }
                    }

                    if (isCpfApplicable) {
                        buffaloesPayingCPF++;
                    }
                });

                monthlyTotalCPF += buffaloesPayingCPF * CPF_PER_MONTH * treeData.units; // Scale by units

                cpfCostByMonth[year][month] = monthlyTotalCPF;
                totalCPFCost += monthlyTotalCPF;
            }

            cpfCostByYear[year] = Math.round(totalCPFCost);
        }

        return { byYear: cpfCostByYear, byMonth: cpfCostByMonth };
    };

    const { byYear: yearlyCPFCost, byMonth: monthlyCPFCost } = calculateYearlyCPFCost();

    const calculateYearlyDataWithCPF = () => {
        return yearlyData.map((yearData: any) => {
            const cpfCost = yearlyCPFCost[yearData.year] || 0;
            const revenueWithoutCPF = yearData.revenue;
            const revenueWithCPF = revenueWithoutCPF - cpfCost;

            return {
                ...yearData,
                cpfCost,
                revenueWithoutCPF,
                revenueWithCPF
            };
        });
    };

    const yearlyDataWithCPF = calculateYearlyDataWithCPF();

    const calculateCumulativeRevenueData = () => {
        const cumulativeData: any[] = [];
        let cumulativeRevenueWithoutCPF = 0;
        let cumulativeRevenueWithCPF = 0;

        yearlyDataWithCPF.forEach((yearData: any, index: number) => {
            cumulativeRevenueWithoutCPF += yearData.revenueWithoutCPF;
            cumulativeRevenueWithCPF += yearData.revenueWithCPF;

            cumulativeData.push({
                ...yearData,
                cumulativeRevenueWithCPF: cumulativeRevenueWithCPF,
                cumulativeCPFCost: cumulativeRevenueWithoutCPF - cumulativeRevenueWithCPF
            });
        });

        return cumulativeData;
    };

    const cumulativeYearlyData = calculateCumulativeRevenueData();

    const getBuffaloValueByAge = (ageInMonths: number) => {
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

    const getBuffaloValueDescription = (ageInMonths: number) => {
        if (ageInMonths >= 41) {
            return "41+ months (Peak/Proven - ₹1,75,000)";
        } else if (ageInMonths >= 35) {
            return "35-40 months (Prime - ₹1,50,000)";
        } else if (ageInMonths >= 25) {
            return "25-34 months (Mature - ₹1,00,000)";
        } else if (ageInMonths >= 19) {
            return "19-24 months (Heifer - ₹40,000)";
        } else if (ageInMonths >= 13) {
            return "13-18 months (Growing - ₹25,000)";
        } else {
            return "0-12 months (Calf - ₹10,000)";
        }
    };

    const MOTHER_BUFFALO_PRICE = 175000;
    const CPF_PER_UNIT = 15000;

    const calculateInitialInvestment = () => {
        const motherBuffaloCost = treeData.units * 2 * MOTHER_BUFFALO_PRICE;
        const cpfCost = treeData.units * CPF_PER_UNIT;
        return {
            motherBuffaloCost,
            cpfCost,
            totalInvestment: motherBuffaloCost + cpfCost,
            totalBuffaloesAtStart: treeData.units * 4,
            motherBuffaloes: treeData.units * 2,
            calvesAtStart: treeData.units * 2,
            pricePerMotherBuffalo: MOTHER_BUFFALO_PRICE,
            cpfPerUnit: CPF_PER_UNIT
        };
    };

    const initialInvestment = calculateInitialInvestment();



    const calculateDetailedMonthlyRevenue = () => {
        const buffaloDetails = getBuffaloDetails();
        const monthlyRevenue: any = {};
        const investorMonthlyRevenue: any = {};
        const buffaloValuesByYear: any = {};

        const totalSimMonths = Math.min(120, treeData.durationMonths || (treeData.years * 12));
        const absoluteStart = treeData.startYear * 12 + (treeData.startMonth || 0);
        const absoluteEnd = absoluteStart + totalSimMonths - 1;
        const endYearVal = Math.floor(absoluteEnd / 12);
        const durationYears = endYearVal - treeData.startYear + 1;

        for (let year = treeData.startYear; year < treeData.startYear + durationYears; year++) {
            monthlyRevenue[year] = {};
            investorMonthlyRevenue[year] = {};
            buffaloValuesByYear[year] = {};

            for (let month = 0; month < 12; month++) {
                monthlyRevenue[year][month] = {
                    total: 0,
                    buffaloes: {}
                };
                investorMonthlyRevenue[year][month] = 0;
            }
        }

        Object.values(buffaloDetails).forEach((buffalo: any) => {
            for (let year = treeData.startYear; year < treeData.startYear + durationYears; year++) {
                const ageInMonths = calculateAgeInMonths(buffalo, year, 11);

                if (!buffaloValuesByYear[year][buffalo.id]) {
                    buffaloValuesByYear[year][buffalo.id] = {
                        ageInMonths: ageInMonths,
                        value: getBuffaloValueByAge(ageInMonths),
                        description: getBuffaloValueDescription(ageInMonths)
                    };
                }

                // Revenue Logic
                // For Gen 0 (Mothers): Revenue based on acquisitionMonth
                // For Gen 1/2 (Children): Revenue starts when they mature (e.g. 3 years / 36 months)

                let shouldCalculateRevenue = false;
                if (buffalo.generation === 0) {
                    shouldCalculateRevenue = true;
                } else {
                    // For children, checking strictly year is not enough as M2C1 is born mid-year.
                    // We check if they are at least 36 months old in this year (at some point).
                    // Actually, we should check per month.
                    shouldCalculateRevenue = true; // We will check inside the monthly loop
                }

                if (shouldCalculateRevenue) {
                    for (let month = 0; month < 12; month++) {
                        // Cutoff Logic
                        const currentAbsoluteMonth = year * 12 + month;
                        const absoluteStartMonth = treeData.startYear * 12 + treeData.startMonth;
                        const absoluteEndMonth = absoluteStartMonth + (treeData.durationMonths || (treeData.years * 12)) - 1;

                        if (currentAbsoluteMonth < absoluteStartMonth || currentAbsoluteMonth > absoluteEndMonth) {
                            continue;
                        }

                        // Precise age check for children
                        if (buffalo.generation > 0) {
                            const ageAtMonth = calculateAgeInMonths(buffalo, year, month);
                            const threshold = 34; // Standardized for all offspring
                            if (ageAtMonth < threshold) continue;
                        }

                        const revenue = calculateMonthlyRevenueForBuffalo(
                            buffalo.acquisitionMonth,
                            month,
                            year,
                            treeData.startYear,
                            buffalo.absoluteAcquisitionMonth,
                            buffalo.generation,
                            buffalo.id
                        );

                        if (revenue > 0) {
                            monthlyRevenue[year][month].total += revenue;
                            monthlyRevenue[year][month].buffaloes[buffalo.id] = revenue;
                            // Investor Revenue is Total across all units. BuffaloDetails is 1 unit, so we MUST scale.
                            investorMonthlyRevenue[year][month] += revenue * treeData.units;
                        }
                    }
                }
            }
        });

        return { monthlyRevenue, investorMonthlyRevenue, buffaloDetails, buffaloValuesByYear };
    };

    const { monthlyRevenue, investorMonthlyRevenue, buffaloDetails, buffaloValuesByYear } = calculateDetailedMonthlyRevenue();

    const calculateBreakEvenAnalysis = () => {
        const breakEvenData = [];
        let breakEvenYearWithCPF = null;
        let breakEvenMonthWithCPF = null;
        let exactBreakEvenDateWithCPF = null;

        let revenueBreakEvenYearWithCPF: any = null;
        let revenueBreakEvenMonthWithCPF = null;
        let revenueExactBreakEvenDateWithCPF = null;

        // Helper to calculate total asset value for a specific point in time
        const calculateTotalAssetValueForMonth = (targetYear: number, targetMonth: number) => {
            let totalValue = 0;
            Object.values(buffaloDetails as Record<string, any>).forEach((buffalo: any) => {
                // Only count buffaloes born before or in this month
                if (buffalo.birthYear < targetYear || (buffalo.birthYear === targetYear && (buffalo.birthMonth || 0) <= targetMonth)) {
                    const ageInMonths = calculateAgeInMonths(buffalo, targetYear, targetMonth);
                    totalValue += getBuffaloValueByAge(ageInMonths);
                }
            });
            // Scale by units because buffaloDetails represents a single unit's herd
            return totalValue * treeData.units;
        };

        // Helper to get calendar date from simulation index
        const getCalendarDate = (simYearIndex: number, simMonthIndex: number) => {
            const absStart = (treeData.startYear * 12 + (treeData.startMonth || 0));
            const absTarget = absStart + (simYearIndex * 12) + simMonthIndex;
            return {
                year: Math.floor(absTarget / 12),
                month: absTarget % 12,
                absMonth: absTarget
            };
        };

        // Calculate Simulation-Year based data
        const simulationYears = Math.ceil((treeData.durationMonths || (treeData.years * 12)) / 12);
        let cumulativeRevenueWithCPF = 0;

        // We need to track break-even precisely monthly, but aggregate yearly for table

        // 1. Precise Break Even Check (Monthly Stream)
        let tempCumulativeForBreakEven = 0;
        const initialInv = initialInvestment.totalInvestment;

        for (let simYear = 0; simYear < simulationYears; simYear++) {
            for (let m = 0; m < 12; m++) {
                const { year, month } = getCalendarDate(simYear, m);

                // Revenue
                const rev = investorMonthlyRevenue[year]?.[month] || 0;

                // CPF Cost (Approx monthly allocation or lookup?)
                // MonthlyRevenueBreak calculates explicit monthly CPF.
                // Here we can use CPF_PER_MONTH = 15000/12 = 1250 constant for simplicity as per other components
                // Or use isCpfApplicable logic?
                // For simplicity and consistency with "Annual = 15000", we assume 1250/month is the standard distribution
                // unless we want to be super precise with "Free Period".
                // Given the user wants "Year 1 = 15000", uniform is safest for the Aggregate.
                // However, precise "Free Period" logic (Month 6-18) makes Month 6-17 cost 0. 
                // Which reduces Year 1 cost.
                // Let's use the explicit check if possible, or approximate.
                // The User's previous screenshot showed Year 1 CPF = 15000 (implied target).
                // So we use standard monthly cost.
                const cpf = 15000 / 12;

                tempCumulativeForBreakEven += (rev - cpf);

                // Revenue Only Break Even
                // Note: Logic in previous code separated Revenue Only vs Total Value.
                // We will stick to the Total Value check for "Break Even".
                // But wait, the previous code had 'revenueBreakEven' and 'breakEven'(Asset+Rev).

                // Let's replicate refined logic:
            }
        }

        // Re-implementing the Loop with Simulation Year Aggregation for Table Data
        let runningCumulativeRevenue = 0;

        // Asset Value Calculation Helper (Projected at end of Sim Year)
        const calculateAssetAtSimYearEnd = (simYear: number) => {
            const { year, month } = getCalendarDate(simYear, 11);
            return calculateTotalAssetValueForMonth(year, month);
        };

        // 1. Precise Break Even Check (Monthly Stream)
        // Run this FIRST so we know the Break Even Year for the table flags
        let cumRev = 0;


        // We iterate ONE continuous stream of months for exact dates
        const totalMonths = treeData.durationMonths || (simulationYears * 12);
        for (let absM = 0; absM < totalMonths; absM++) {
            const simY = Math.floor(absM / 12);
            const simM = absM % 12;
            const { year, month } = getCalendarDate(simY, simM);

            const rev = investorMonthlyRevenue[year]?.[month] || 0;
            /* CPF */
            const cpf = monthlyCPFCost[year]?.[month] || 0;

            cumRev += (rev - cpf);

            // --- Total Value Break Even Check (Asset + Revenue) ---
            const currentAssetValue = calculateTotalAssetValueForMonth(year, month);
            const currentTotalValue = cumRev + currentAssetValue;

            if (currentTotalValue >= initialInv && !exactBreakEvenDateWithCPF) {
                breakEvenYearWithCPF = year;
                breakEvenMonthWithCPF = month;
                exactBreakEvenDateWithCPF = new Date(year, month + 1, 0); // End of month
                // If break even happens in month 0 (Jan), this date will be Jan 31st.
            }

            // --- Revenue Only Break Even Check ---
            if (cumRev >= initialInv && !revenueBreakEvenYearWithCPF) {
                revenueBreakEvenYearWithCPF = year;
                revenueBreakEvenMonthWithCPF = month;
                // Date logic...
                const d = new Date(year, month + 1, 0);
                revenueExactBreakEvenDateWithCPF = d;
            }
        }

        // 2. Table Data Aggregation
        let tableRevenueBreakEvenYearWithCPF: any = null;

        for (let i = 0; i < simulationYears; i++) {
            let annualRevenue = 0;
            let annualCPF = 0;

            // Sum 12 months
            for (let m = 0; m < 12; m++) {
                const { year, month } = getCalendarDate(i, m);
                /* Revenue */
                const rev = investorMonthlyRevenue[year]?.[month] || 0;
                annualRevenue += rev;
                /* CPF */
                const cpfMonth = monthlyCPFCost[year]?.[month] || 0;
                annualCPF += cpfMonth;
            }

            const annualNet = annualRevenue - annualCPF;
            runningCumulativeRevenue += annualNet;

            const yearEndAsset = calculateAssetAtSimYearEnd(i);
            const totalValue = runningCumulativeRevenue + yearEndAsset;

            // Check Break Even (Asset + Rev) - Total Value
            // Use the precise year calculated from the monthly loop
            let isBE = false;
            if (breakEvenYearWithCPF === (treeData.startYear + i)) {
                isBE = true;
            }

            // If we somehow missed it (fallback) or for logic completeness:
            if (totalValue >= initialInv && !breakEvenYearWithCPF) {
                breakEvenYearWithCPF = treeData.startYear + i;
                isBE = true;
            }

            // Check Revenue Break Even (Table Consistent)
            if (runningCumulativeRevenue >= initialInv && !tableRevenueBreakEvenYearWithCPF) {
                tableRevenueBreakEvenYearWithCPF = treeData.startYear + i;
            }

            // Stats
            const recPct = (totalValue / initialInv) * 100;
            const revOnlyPct = (runningCumulativeRevenue / initialInv) * 100; // Recalculate precisely

            let status = "In Progress";
            if (recPct >= 100) status = "✔ Break-Even";
            else if (recPct >= 75) status = "75% Recovered";
            else if (recPct >= 50) status = "50% Recovered";

            breakEvenData.push({
                year: treeData.startYear + i,
                annualRevenueWithCPF: annualNet, // Net Rev
                cpfCost: annualCPF,
                cumulativeRevenueWithCPF: runningCumulativeRevenue,
                assetValue: yearEndAsset,
                totalValueWithCPF: totalValue,

                recoveryPercentageWithCPF: recPct,
                revenueOnlyPercentageWithCPF: revOnlyPct,
                statusWithCPF: status,
                revenueOnlyStatusWithCPF: 'In Progress',
                isBreakEvenWithCPF: isBE,
                isRevenueBreakEvenWithCPF: tableRevenueBreakEvenYearWithCPF === (treeData.startYear + i), // Correctly Flag Row based on Table Data
                totalBuffaloes: 0,
                matureBuffaloes: 0
            });
        }

        return {
            breakEvenData,
            breakEvenYearWithCPF,
            breakEvenMonthWithCPF,
            exactBreakEvenDateWithCPF,
            revenueBreakEvenYearWithCPF: revenueBreakEvenYearWithCPF, // Use precise calendar year
            revenueBreakEvenMonthWithCPF,
            revenueExactBreakEvenDateWithCPF,
            initialInvestment: initialInvestment.totalInvestment,
            finalCumulativeRevenueWithCPF: breakEvenData.length > 0 ? breakEvenData[breakEvenData.length - 1].cumulativeRevenueWithCPF : 0
        };
    };


    const breakEvenAnalysis = calculateBreakEvenAnalysis();

    const calculateAssetMarketValue = () => {
        const assetValues: any[] = [];
        // Correctly calculate end year including partial years (same as index.jsx)
        const totalMonthsDuration = Math.min(120, treeData.durationMonths || (treeData.years * 12));
        const endYear = treeData.startYear + Math.floor((treeData.startMonth + totalMonthsDuration - 1) / 12);

        const absoluteStartMonth = treeData.startYear * 12 + treeData.startMonth;
        const absoluteEndMonth = absoluteStartMonth + totalMonthsDuration - 1;
        const endMonthOfSimulation = absoluteEndMonth % 12;

        for (let year = treeData.startYear; year <= endYear; year++) {
            let totalAssetValue = 0;

            // Determine target month: December (11) for full years, or endMonthOfSimulation for the final year
            // Use 12 (January of next year equivalent) for full years to capture completed year valuation
            // If it is the end year AND endMonthOfSimulation is 11 (Dec), use 12 to treat it as a full completed year
            const targetMonth = (year === endYear && endMonthOfSimulation !== 11) ? endMonthOfSimulation : 12;

            const ageCategories: any = {
                '0-12 months': { count: 0, value: 0 },
                '13-18 months': { count: 0, value: 0 },
                '19-24 months': { count: 0, value: 0 },
                '25-34 months': { count: 0, value: 0 },
                '35-40 months': { count: 0, value: 0 },
                '41+ months': { count: 0, value: 0 }
            };

            Object.values(buffaloDetails).forEach((buffalo: any) => {
                // Only count buffaloes born before or in the last year/month
                if (buffalo.birthYear < year || (buffalo.birthYear === year && (buffalo.birthMonth || 0) <= targetMonth)) {
                    const ageInMonths = calculateAgeInMonths(buffalo, year, targetMonth);
                    let value = getBuffaloValueByAge(ageInMonths);

                    // Override: 0-12 months value is 0 in the first year only
                    if (year === treeData.startYear && ageInMonths <= 12) {
                        value = 0;
                    }

                    totalAssetValue += value;

                    if (ageInMonths >= 41) {
                        ageCategories['41+ months'].count++;
                        ageCategories['41+ months'].value += value;
                    } else if (ageInMonths >= 35) {
                        ageCategories['35-40 months'].count++;
                        ageCategories['35-40 months'].value += value;
                    } else if (ageInMonths >= 25) {
                        ageCategories['25-34 months'].count++;
                        ageCategories['25-34 months'].value += value;
                    } else if (ageInMonths >= 19) {
                        ageCategories['19-24 months'].count++;
                        ageCategories['19-24 months'].value += value;
                    } else if (ageInMonths >= 13) {
                        ageCategories['13-18 months'].count++;
                        ageCategories['13-18 months'].value += value;
                    } else {
                        ageCategories['0-12 months'].count++;
                        ageCategories['0-12 months'].value += value;
                    }
                }
            });

            const yearData = yearlyData.find((d: any) => d.year === year);

            // Scale by units as buffaloDetails contains only unit 1
            const scaledTotalAssetValue = totalAssetValue * treeData.units;

            // Scale age categories
            const scaledAgeCategories: any = {};
            Object.keys(ageCategories).forEach(key => {
                scaledAgeCategories[key] = {
                    count: ageCategories[key].count * treeData.units,
                    value: ageCategories[key].value * treeData.units
                };
            });

            assetValues.push({
                year: year,
                totalBuffaloes: (yearData?.totalBuffaloes || 0), // Already scaled in yearlyData
                ageCategories: scaledAgeCategories,
                totalAssetValue: scaledTotalAssetValue,
                motherBuffaloes: scaledAgeCategories['41+ months'].count
            });
        }

        return assetValues;
    };

    const assetMarketValue = calculateAssetMarketValue();

    const calculateDetailedAssetValue = (year: any) => {
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
            if (year >= buffalo.birthYear) {
                const ageInMonths = calculateAgeInMonths(buffalo, year, 11);
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

        // Do not scale by units again
        const scaledTotalValue = totalValue;
        const scaledTotalCount = totalCount;

        const scaledAgeGroups: any = {};
        Object.keys(ageGroups).forEach(key => {
            scaledAgeGroups[key] = {
                ...ageGroups[key]
            };
        });

        return { ageGroups: scaledAgeGroups, totalValue: scaledTotalValue, totalCount: scaledTotalCount };
    };

    const calculateCumulativeRevenueUntilYear = (unit: number, selectedYear: number) => {
        const cumulativeRevenue: any = {};
        const unitBuffaloes = Object.values(buffaloDetails as Record<string, any>).filter((buffalo: any) => buffalo.unit === unit);

        unitBuffaloes.forEach((buffalo: any) => {
            let total = 0;
            for (let year = treeData.startYear; year <= selectedYear; year++) {
                for (let month = 0; month < 12; month++) {
                    total += monthlyRevenue[year]?.[month]?.buffaloes[buffalo.id] || 0;
                }
            }
            cumulativeRevenue[buffalo.id] = total;
        });

        return cumulativeRevenue;
    };

    const calculateTotalCumulativeRevenueUntilYear = (unit: number, selectedYear: number) => {
        const cumulativeRevenue = calculateCumulativeRevenueUntilYear(unit, selectedYear);
        return Object.values(cumulativeRevenue as Record<string, any>).reduce((sum: number, revenue: any) => sum + (revenue as number), 0);
    };

    // Calculate dynamic year ranges
    // Calculate precise calendar years duration
    // For Data Generation, we need full calendar years
    const totalSimMonths = Math.min(120, treeData.durationMonths || (treeData.years * 12));
    const absoluteStart = treeData.startYear * 12 + (treeData.startMonth || 0);
    const absoluteEnd = absoluteStart + totalSimMonths - 1;
    const endYearVal = Math.floor(absoluteEnd / 12);
    const durationYears = endYearVal - treeData.startYear + 1;

    // For Dropdown Display, we use Simulation Years (12-month chunks)
    const simulationYearsCount = Math.ceil(totalSimMonths / 12);

    // const startYear = treeData.startYear; // startYear is already in scope from state
    const endYear = startYear + durationYears - 1;
    const yearRange = `${startYear}-${endYear}`;

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const TAB_CONFIG = [
        { id: "Monthly Revenue Break", icon: Calendar, label: "Monthly Revenue" },
        { id: "Revenue Break Even", icon: Target, label: "Break Even Analysis" },
        { id: "Asset Market Value", icon: TrendingUp, label: "Asset Valuation" },
        { id: "Herd Performance", icon: Activity, label: "Herd Performance" },
        { id: "Annual Herd Revenue", icon: PieChart, label: "Annual Revenue" },
        { id: "Break Even Timeline", icon: Clock, label: "Break Even Timeline" },
        { id: "Cattle Growing Fund", icon: Sprout, label: "Annual Caring Cost" },
        { id: "CPF + CGF", icon: Calculator, label: "CPF + CGF Analysis" }
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden relative bg-slate-50">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm">
                <div className="flex flex-col items-center justify-center py-0.5 md:py-2 max-w-7xl mx-auto gap-0.5">
                    {/* Tabs - Single Row, Scroll if needed but hidden bar */}
                    <div className="flex items-center justify-start md:justify-center gap-1 overflow-x-auto w-full px-1 md:px-2 py-0.5 no-scrollbar whitespace-nowrap">
                        {TAB_CONFIG.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                  flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all duration-200 border flex-shrink-0
                                  ${isActive
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300'
                                        }
                                `}
                                >
                                    <Icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{tab.label}</span>
                                </button>

                            );
                        })}
                    </div>

                    {["Monthly Revenue Break", "Cattle Growing Fund", "CPF + CGF", "Asset Market Value"].includes(activeTab) && (
                        <div className="flex items-center gap-1.5 md:gap-3 px-1 md:px-4 py-0 md:py-2 md:border-l border-slate-200 shrink-0 w-full justify-center">
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Year</span>
                            <select
                                value={globalYearIndex}
                                onChange={(e) => setGlobalYearIndex(Number(e.target.value))}
                                className="bg-white border border-slate-200 text-slate-700 text-[10px] md:text-xs font-bold rounded-lg px-2 py-1 md:px-2 md:py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                            >
                                {Array.from({ length: simulationYearsCount }).map((_, i) => {
                                    // Calculate month range for this SIMULATION year (12-month chunk)
                                    const simYearStartAbs = absoluteStart + (i * 12);
                                    const simYearEndAbs = Math.min(absoluteEnd, simYearStartAbs + 11);

                                    const startMonthName = monthNames[simYearStartAbs % 12].slice(0, 3);
                                    const endMonthName = monthNames[simYearEndAbs % 12].slice(0, 3);

                                    const startYearNum = Math.floor(simYearStartAbs / 12);
                                    const endYearNum = Math.floor(simYearEndAbs / 12);

                                    return (
                                        <option key={i} value={i}>
                                            {startMonthName} {startYearNum} - {endMonthName} {endYearNum} (Year {i + 1})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50 transition-all duration-300 relative">

                {/* Dashboard Header */}


                <div className="w-full max-w-7xl mx-auto px-2 md:px-8 pt-4 md:pt-8 pb-24 md:pb-8">



                    <div className='w-full'>
                        {activeTab === "Monthly Revenue Break" && (
                            <MonthlyRevenueBreak
                                key={`${activeTab}-${treeData.startYear}-${treeData.startMonth}`}
                                treeData={treeData}
                                buffaloDetails={buffaloDetails}
                                monthlyRevenue={monthlyRevenue}
                                calculateAgeInMonths={calculateAgeInMonths}
                                calculateCumulativeRevenueUntilYear={calculateCumulativeRevenueUntilYear}
                                calculateTotalCumulativeRevenueUntilYear={calculateTotalCumulativeRevenueUntilYear}
                                monthNames={monthNames}
                                formatCurrency={formatCurrency}
                                setHeaderStats={setHeaderStats}
                                selectedYearIndex={globalYearIndex}
                            />
                        )}

                        {activeTab === "Break Even Timeline" && (
                            <BreakEvenTimeline
                                key={`${activeTab}-${treeData.startYear}-${treeData.startMonth}`}
                                treeData={treeData}
                                breakEvenAnalysis={breakEvenAnalysis}
                                cpfToggle={cpfToggle}
                                setCpfToggle={setCpfToggle}
                                monthNames={monthNames}
                                formatCurrency={formatCurrency}
                                formatNumber={formatNumber}
                            />
                        )}

                        {activeTab === "Cattle Growing Fund" && (
                            <CattleGrowingFund
                                key={`${activeTab}-${treeData.startYear}-${treeData.startMonth}`}
                                treeData={treeData}
                                buffaloDetails={buffaloDetails}
                                yearlyCPFCost={yearlyCPFCost}
                                monthlyRevenue={monthlyRevenue}
                                yearlyData={yearlyData}
                                formatCurrency={formatCurrency}
                                startYear={startYear}
                                endYear={treeData.startYear + Math.floor((treeData.startMonth + (treeData.durationMonths || treeData.years * 12) - 1) / 12)}
                                endMonth={(treeData.startMonth + (treeData.durationMonths || treeData.years * 12) - 1) % 12}
                                selectedYearIndex={globalYearIndex}
                            />
                        )}

                        {activeTab === "CPF + CGF" && (
                            <CpfCgfCombined
                                key={`${activeTab}-${treeData.startYear}-${treeData.startMonth}`}
                                treeData={treeData}
                                buffaloDetails={buffaloDetails}
                                formatCurrency={formatCurrency}
                                calculateAgeInMonths={calculateAgeInMonths}
                                monthNames={monthNames}
                                startYear={startYear}
                                endYear={treeData.startYear + Math.floor((treeData.startMonth + (treeData.durationMonths || treeData.years * 12) - 1) / 12)}
                                endMonth={(treeData.startMonth + (treeData.durationMonths || treeData.years * 12) - 1) % 12}
                                selectedYearIndex={globalYearIndex}
                            />
                        )}


                        {activeTab === "Revenue Break Even" && (
                            <RevenueBreakEven
                                key={`${activeTab}-${treeData.startYear}-${treeData.startMonth}`}
                                treeData={treeData}
                                initialInvestment={initialInvestment}
                                yearlyCPFCost={yearlyCPFCost}
                                breakEvenAnalysis={breakEvenAnalysis}
                                cpfToggle={cpfToggle}
                                setCpfToggle={setCpfToggle}
                                formatCurrency={formatCurrency}
                                // Pass the revenue-only break-even dates
                                revenueBreakEvenYearWithCPF={breakEvenAnalysis.revenueBreakEvenYearWithCPF}
                                revenueBreakEvenMonthWithCPF={breakEvenAnalysis.revenueBreakEvenMonthWithCPF}
                                revenueExactBreakEvenDateWithCPF={breakEvenAnalysis.revenueExactBreakEvenDateWithCPF}
                                selectedYearIndex={globalYearIndex}
                            />
                        )}

                        {activeTab === "Asset Market Value" && (
                            <AssetMarketValue
                                key={`${activeTab}-${treeData.startYear}-${treeData.startMonth}`}
                                treeData={treeData}
                                buffaloDetails={buffaloDetails}
                                calculateAgeInMonths={calculateAgeInMonths}
                                getBuffaloValueByAge={getBuffaloValueByAge}
                                getBuffaloValueDescription={getBuffaloValueDescription}
                                calculateDetailedAssetValue={calculateDetailedAssetValue}
                                assetMarketValue={assetMarketValue}
                                formatCurrency={formatCurrency}
                                startYear={startYear}
                                endYear={treeData.startYear + Math.floor((treeData.startMonth + (treeData.durationMonths || treeData.years * 12) - 1) / 12)}
                                endMonth={(treeData.startYear * 12 + treeData.startMonth + (treeData.durationMonths || treeData.years * 12) - 1) % 12}
                                yearRange={yearRange}
                                yearlyData={yearlyData}
                                monthlyRevenue={monthlyRevenue}
                                yearlyCPFCost={yearlyCPFCost}
                                selectedYear={startYear + globalYearIndex} // Added missing prop
                                selectedYearIndex={globalYearIndex}
                            />
                        )}

                        {activeTab === "Herd Performance" && (
                            <HerdPerformance
                                key={`${activeTab}-${treeData.startYear}-${treeData.startMonth}`}
                                yearlyData={yearlyData}
                                monthlyRevenue={monthlyRevenue}
                                selectedYearIndex={globalYearIndex}
                                activeGraph={activeGraph}
                                setActiveGraph={setActiveGraph}
                                startYear={startYear}
                                endYear={endYear}
                                yearRange={yearRange}
                                breakEvenAnalysis={breakEvenAnalysis}
                                assetMarketValue={assetMarketValue}
                            />
                        )}

                        {activeTab === "Annual Herd Revenue" && (
                            <AnnualHerdRevenue
                                cumulativeYearlyData={cumulativeYearlyData}
                                assetMarketValue={assetMarketValue}
                                formatCurrency={formatCurrency}
                                formatNumber={formatNumber}
                                treeData={treeData}
                                startYear={startYear}
                                endYear={endYear}
                                yearRange={yearRange}
                            />
                        )}
                    </div>

                    {/* CPF Explanation Note - Sticky Footer */}
                    {/* CPF Explanation Note - Sticky Footer */}
                    <div className="mt-4 md:mt-8 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-2 md:p-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 md:p-4 flex gap-2 md:gap-3 shadow-sm items-start md:items-center">
                            <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0 mt-0.5 md:mt-0" aria-hidden="true" />
                            <div>
                                <h3 className="text-xs md:text-sm font-semibold text-blue-900 leading-tight md:leading-normal">Cattle Protection Fund (CPF): Income Guarantee & Asset Security</h3>
                                <p className="mt-0.5 md:mt-1 text-[10px] md:text-sm text-blue-700 leading-tight md:leading-relaxed">
                                    Your income is guaranteed through the Cattle Protection Fund. This safety measure secures your animals,
                                    decreases revenue risk, and ensures growing assets. It is a vital step for long-term stability.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};


export default CostEstimationTable;
