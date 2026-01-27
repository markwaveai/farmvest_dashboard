
import React, { useState, useRef, useEffect } from "react";
import HeaderControls from './HeaderControls';
import TreeVisualization from './TreeVisualization';
import { formatCurrency, formatNumber, calculateAgeInMonths, getBuffaloValueByAge } from './CommonComponents';
import CostEstimationTable from "../CostEstimation/CostEstimationTable";


export default function BuffaloFamilyTree() {
    // Initialize with current date
    // Initialize with default date: Jan 1, 2026
    const [units, setUnits] = useState(1);
    const [years, setYears] = useState(10);
    const [startYear, setStartYear] = useState(2026);
    const [startMonth, setStartMonth] = useState(0);
    const [startDay, setStartDay] = useState(1);
    const [treeData, setTreeData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [activeGraph, setActiveGraph] = useState("buffaloes");
    const [activeTab, setActiveTab] = useState("familyTree");
    const [headerStats, setHeaderStats] = useState(null);

    const containerRef = useRef<any>(null);
    const treeContainerRef = useRef<any>(null);

    // Get days in month for day selection
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const [daysInMonth, setDaysInMonth] = useState(getDaysInMonth(startYear, startMonth));

    // Update days in month when year or month changes
    useEffect(() => {
        const days = getDaysInMonth(startYear, startMonth);
        setDaysInMonth(days);
        if (startDay > days) {
            setStartDay(1);
        }
    }, [startYear, startMonth]);

    // Load config from local storage on mount
    useEffect(() => {
        try {
            const savedConfig = localStorage.getItem('buffalo_sim_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config.units) setUnits(config.units);
                if (config.years) setYears(config.years);
                if (config.startYear) setStartYear(config.startYear);
                if (config.startMonth !== undefined) setStartMonth(config.startMonth);
                if (config.startDay) setStartDay(config.startDay);

                // Trigger an initial simulation after a short delay to ensure state updates are applied
                setTimeout(() => {
                    setShouldAutoRun(true);
                }, 100);
            }
        } catch (e) {
            console.error("Failed to load simulation config", e);
        }
    }, []);

    const [shouldAutoRun, setShouldAutoRun] = useState(false);

    useEffect(() => {
        if (shouldAutoRun) {
            runSimulation();
            setShouldAutoRun(false);
        }
    }, [shouldAutoRun]);

    // Save only config to local storage whenever it changes
    useEffect(() => {
        try {
            const config = {
                units,
                years,
                startYear,
                startMonth,
                startDay,
                hasSimulation: !!treeData
            };
            localStorage.setItem('buffalo_sim_config', JSON.stringify(config));
        } catch (e) {
            // This is just for config, so it shouldn't fail, but good to have
            console.warn("Failed to save simulation config", e);
        }
    }, [units, years, startYear, startMonth, startDay, treeData]);

    // Staggered revenue configuration
    const revenueConfig = {
        landingPeriod: 2,
        highRevenuePhase: { months: 5, revenue: 9000 },
        mediumRevenuePhase: { months: 3, revenue: 6000 },
        restPeriod: { months: 4, revenue: 0 }
    };

    const calculateMonthlyRevenueForBuffalo = (buffaloId: string, acquisitionMonth: number, currentYear: number, currentMonth: number, absoluteAcquisitionMonth?: number, generation = 0) => {
        let monthsSinceAcquisition;

        if (absoluteAcquisitionMonth !== undefined) {
            const currentAbsolute = currentYear * 12 + currentMonth;
            monthsSinceAcquisition = currentAbsolute - absoluteAcquisitionMonth;
        } else {
            // Fallback for old/legacy data
            monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);
        }

        let offset = 2;
        if (generation > 0) {
            offset = 34; // Standardized for all offspring (Back to 34)
        }

        if (monthsSinceAcquisition < offset) {
            return 0;
        }

        // ... rest is same
        const productionMonths = monthsSinceAcquisition - offset;
        const cyclePosition = productionMonths % 12;

        if (cyclePosition < revenueConfig.highRevenuePhase.months) {
            return revenueConfig.highRevenuePhase.revenue;
        } else if (cyclePosition < revenueConfig.highRevenuePhase.months + revenueConfig.mediumRevenuePhase.months) {
            return revenueConfig.mediumRevenuePhase.revenue;
        } else {
            return revenueConfig.restPeriod.revenue;
        }
    };

    // Calculate annual revenue for herd using precise monthly age checks (>= 36 months for children)
    const calculateAnnualRevenueForHerd = (herd: any[], startYear: number, startMonth: number, currentYear: number) => {
        let annualRevenue = 0;

        // Track mature buffaloes for this year (set of IDs that were mature at any point)
        const matureBuffaloIds = new Set();

        for (let month = 0; month < 12; month++) {
            herd.forEach((buffalo: any) => {
                let isProducing = false;

                if (buffalo.generation === 0) {
                    isProducing = true;
                } else {
                    // Precise age check
                    const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
                    const ageInMonths = ((currentYear - buffalo.birthYear) * 12) + (month - birthMonth);
                    const threshold = 34; // Standardized for all offspring
                    if (ageInMonths >= threshold) {
                        isProducing = true;
                    }
                }

                if (isProducing) {
                    matureBuffaloIds.add(buffalo.id);

                    const revenue = calculateMonthlyRevenueForBuffalo(
                        buffalo.id,
                        buffalo.acquisitionMonth, // Cycle offset
                        currentYear,
                        month,
                        buffalo.absoluteAcquisitionMonth, // Should be passed if available
                        buffalo.generation
                    );

                    annualRevenue += revenue;
                }
            });
        }

        const matureBuffaloes = matureBuffaloIds.size;
        const totalBuffaloes = herd.filter((buffalo: any) => buffalo.birthYear <= currentYear).length;

        return {
            annualRevenue,
            matureBuffaloes,
            totalBuffaloes
        };
    };

    // Calculate total revenue data based on ACTUAL herd growth with staggered cycles
    const calculateRevenueData = (herd: any[], startYear: number, startMonth: number, yearsToSimulate: number, totalMonthsDuration: number) => {
        const yearlyData = [];
        let totalRevenue = 0;
        let totalMatureBuffaloYears = 0;

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        // Calculate the absolute end month index (0-based from start of simulation)
        // 0 = startYear/startMonth.
        // Cutoff is at totalMonthsDuration - 1.
        const absoluteStartMonth = startYear * 12 + startMonth;
        const absoluteEndMonth = absoluteStartMonth + totalMonthsDuration - 1;

        for (let yearOffset = 0; yearOffset < yearsToSimulate; yearOffset++) {
            const currentYear = startYear + yearOffset;

            // Custom annual calculation to support monthly cutoff
            let annualRevenue = 0;
            const matureBuffaloIds = new Set();
            let annualMatureBuffalosCount = 0; // Cumulative for average

            for (let month = 0; month < 12; month++) {
                const currentAbsoluteMonth = currentYear * 12 + month;

                // Skip calculation if before start or after end
                if (currentAbsoluteMonth < absoluteStartMonth || currentAbsoluteMonth > absoluteEndMonth) {
                    continue;
                }

                let monthlyProducingCount = 0;

                herd.forEach((buffalo: any) => {
                    let isProducing = false;

                    if (buffalo.generation === 0) {
                        isProducing = true;
                    } else {
                        const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
                        const ageInMonths = ((currentYear - buffalo.birthYear) * 12) + (month - birthMonth);
                        const threshold = 34; // Standardized for all offspring
                        if (ageInMonths >= threshold) {
                            isProducing = true;
                        }
                    }

                    if (isProducing) {
                        monthlyProducingCount++;
                        matureBuffaloIds.add(buffalo.id);

                        const revenue = calculateMonthlyRevenueForBuffalo(
                            buffalo.id,
                            buffalo.acquisitionMonth,
                            currentYear,
                            month,
                            buffalo.absoluteAcquisitionMonth,
                            buffalo.generation
                        );

                        annualRevenue += revenue;
                    }
                });

                // Track "average" mature buffaloes?
                // Or just max? "matureBuffaloes" in output usually refers to count.
            }

            const matureBuffaloes = matureBuffaloIds.size;
            const totalBuffaloes = herd.filter((buffalo: any) => buffalo.birthYear <= currentYear).length;

            totalRevenue += annualRevenue;
            totalMatureBuffaloYears += matureBuffaloes;

            // Average monthly revenue (spread over valid months? or 12?) using 12 for annual View consistency
            const monthlyRevenuePerBuffalo = matureBuffaloes > 0 ? annualRevenue / (matureBuffaloes * 12) : 0;

            yearlyData.push({
                year: currentYear,
                activeUnits: Math.ceil(totalBuffaloes / 2),
                monthlyRevenue: monthlyRevenuePerBuffalo,
                revenue: annualRevenue,
                totalBuffaloes: totalBuffaloes,
                producingBuffaloes: matureBuffaloes,
                nonProducingBuffaloes: totalBuffaloes - matureBuffaloes,
                startMonth: monthNames[startMonth],
                startDay: startDay,
                startYear: startYear,
                matureBuffaloes: matureBuffaloes
            });
        }

        return {
            yearlyData,
            totalRevenue,
            totalUnits: yearsToSimulate > 0 ? totalMatureBuffaloYears / yearsToSimulate : 0,
            averageAnnualRevenue: yearsToSimulate > 0 ? totalRevenue / yearsToSimulate : 0,
            revenueConfig,
            totalMatureBuffaloYears
        };
    };

    // Simulation logic with staggered acquisition months
    const runSimulation = () => {
        setLoading(true);
        {
            const totalYears = Number(years);
            const herd: any[] = [];

            // Create initial buffaloes (2 per unit) with staggered acquisition
            const offspringCounts: any = {}; // Track number of children for each parent

            for (let u = 0; u < units; u++) {
                // First buffalo - acquired in January
                // Unit 1: A, Unit 2: C, etc.
                const id1 = String.fromCharCode(65 + (u * 2));
                const date1 = new Date(startYear, startMonth, startDay);
                const absAcq1 = startYear * 12 + startMonth;

                herd.push({
                    id: id1,
                    age: 5,
                    mature: true,
                    parentId: null,
                    generation: 0,
                    birthYear: startYear - 5,
                    acquisitionMonth: startMonth,
                    absoluteAcquisitionMonth: absAcq1,
                    unit: u + 1,
                    rootId: id1, // Root ID for lineage tracking
                    startedAt: date1.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
                    birthMonth: startMonth,
                });

                // Second buffalo - acquired in July (6 months later)
                // Unit 1: B, Unit 2: D, etc.
                const id2 = String.fromCharCode(65 + (u * 2) + 1);
                const date2 = new Date(startYear, startMonth + 6, startDay);
                const absAcq2 = startYear * 12 + startMonth + 6;

                herd.push({
                    id: id2,
                    age: 5,
                    mature: true,
                    parentId: null,
                    generation: 0,
                    birthYear: startYear - 5,
                    acquisitionMonth: (startMonth + 6) % 12,
                    absoluteAcquisitionMonth: absAcq2,
                    unit: u + 1,
                    rootId: id2, // Root ID for lineage tracking
                    startedAt: date2.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
                    birthMonth: (startMonth + 6) % 12,
                });
            }

            // Determine duration and calendar range
            // e.g. 10 years defined. Start July 2026.
            // Total Months = 120.
            // End Date = July 2026 + 120 months = June 2036.
            // Calendar Years: 2026, ... 2036 (11 years).

            const totalMonthsDuration = totalYears * 12;
            const endYearValue = startYear + Math.floor((startMonth + totalMonthsDuration - 1) / 12);
            const yearsToSimulate = endYearValue - startYear + 1;

            const absoluteStartMonth = startYear * 12 + startMonth;
            const absoluteEndMonth = absoluteStartMonth + totalMonthsDuration - 1;

            // Simulate years (Calendar Years)
            for (let year = 1; year <= yearsToSimulate; year++) {
                const currentYear = startYear + (year - 1);

                // Get snapshot of current herd including those who just matured
                const currentHerd = [...herd];

                currentHerd.forEach((parent) => {
                    // Logic for Gen 0: Standard Annual Cycle based on acquisitionMonth
                    if (parent.generation === 0) {
                        if (parent.age >= 3) { // Gen 0 starts mature (5), so this is always true
                            const birthMonth = parent.acquisitionMonth;
                            const absoluteBirthMonth = currentYear * 12 + birthMonth;

                            // Check bounds
                            if (absoluteBirthMonth > absoluteEndMonth) return;
                            if (absoluteBirthMonth < absoluteStartMonth) return;

                            // Create Baby
                            if (!offspringCounts[parent.id]) offspringCounts[parent.id] = 0;
                            offspringCounts[parent.id]++;
                            const newId = `${parent.id}${offspringCounts[parent.id]}`;

                            herd.push({
                                id: newId,
                                age: 0,
                                mature: false,
                                parentId: parent.id,
                                birthYear: currentYear,
                                birthMonth: birthMonth, // Explicit birth month
                                acquisitionMonth: birthMonth, // Inherits cycle (for display/grouping)
                                absoluteAcquisitionMonth: absoluteBirthMonth,
                                generation: parent.generation + 1,
                                unit: parent.unit,
                                rootId: parent.rootId,
                            });
                        }
                    }
                    // Logic for Gen > 0: Precise 34-month first cycle, then 12 month interval
                    else {
                        // Calculate if a birth milestone falls in this years range [currentYear*12, currentYear*12 + 11]
                        const yearStartAbs = currentYear * 12;
                        const yearEndAbs = yearStartAbs + 11;

                        const parentBirthAbs = parent.absoluteAcquisitionMonth || (parent.birthYear * 12 + (parent.birthMonth || 0));

                        // Milestones: 34m, 46m, 58m ... (1st at 34, then +12)
                        // Iterate through potential milestones count (k=0, 1, 2...) associated with this parent

                        // We can't infinite loop, but we know the range is bounded by the year.
                        // Milestone = Birth + 34 + (k * 12)

                        // Let's just check if any k satisfies: yearStart <= Milestone <= yearEnd
                        // k = (Milestone - Birth - 34) / 12
                        // We can solve for k. 

                        // Or simpler: iterate reasonable k
                        for (let k = 0; k < 15; k++) { // 15 cycles max (enough for 10-15 years)
                            const milestoneAbs = parentBirthAbs + 32 + (k * 12);

                            if (milestoneAbs >= yearStartAbs && milestoneAbs <= yearEndAbs) {
                                // Valid Birth Event!
                                if (milestoneAbs > absoluteEndMonth) continue;
                                if (milestoneAbs < absoluteStartMonth) continue;

                                const birthMonth = milestoneAbs % 12;

                                // Create Baby
                                if (!offspringCounts[parent.id]) offspringCounts[parent.id] = 0;
                                offspringCounts[parent.id]++;
                                const newId = `${parent.id}${offspringCounts[parent.id]}`;

                                // Check if already added (since we iterate k) - Offspring ID should be unique to parent+k index basically?
                                // Effectively offspringCounts handles uniqueness order.

                                herd.push({
                                    id: newId,
                                    age: 0,
                                    mature: false,
                                    parentId: parent.id,
                                    birthYear: currentYear, // Born in this calendar year
                                    birthMonth: birthMonth,
                                    acquisitionMonth: birthMonth, // Cycle shifts!
                                    absoluteAcquisitionMonth: milestoneAbs,
                                    generation: parent.generation + 1,
                                    unit: parent.unit,
                                    rootId: parent.rootId,
                                });
                            }
                        }
                    }
                });

                // Age all buffaloes
                herd.forEach((b) => {
                    b.age++;
                    if (b.age >= 3) b.mature = true;
                });
            }

            // Calculate revenue data based on ACTUAL herd growth with staggered cycles
            // Correctly pass the Calendar Years count and Total Month Duration
            const revenueData = calculateRevenueData(herd, startYear, startMonth, yearsToSimulate, totalMonthsDuration);

            // Calculate total asset value at the end of simulation
            // endYear must cover the full range, including the partial last year
            const endYear = Math.floor(absoluteEndMonth / 12);
            // The actual end month of the simulation (0-11)
            const endMonthOfSimulation = absoluteEndMonth % 12;

            let totalAssetValue = 0;
            herd.forEach(buffalo => {
                // Calculate age at the specific end month of the simulation
                // Consistent with Table: Use 12 (Jan next year equivalent) if end month is 11 (Dec)
                const targetMonth = (endMonthOfSimulation === 11) ? 12 : endMonthOfSimulation;
                const ageInMonths = calculateAgeInMonths(buffalo, endYear, targetMonth);

                // Only count buffaloes born before or in the last year
                if (buffalo.birthYear <= endYear) {
                    // Double check if buffalo was born after simulation end (shouldn't be in herd, but safety check)
                    const birthAbsolute = buffalo.birthYear * 12 + (buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0));
                    if (birthAbsolute <= absoluteEndMonth) {
                        totalAssetValue += getBuffaloValueByAge(ageInMonths);
                    }
                }
            });

            // --- Calculate Total Financials (Revenue & Net) Matching CostEstimationTable logic ---
            const calculateTotalFinancials = () => {
                const CPF_PER_MONTH = 15000 / 12;
                let totalRevenue = 0;
                let totalCPFCost = 0;
                let totalCaringCost = 0;

                // Calculate monthly revenue for all years
                for (let i = 0; i < totalMonthsDuration; i++) {
                    const absoluteCurrentMonth = (startYear * 12 + startMonth) + i;
                    const currentYear = Math.floor(absoluteCurrentMonth / 12);
                    const currentMonth = absoluteCurrentMonth % 12;

                    let monthlyTotalRevenue = 0;
                    let monthlyTotalCPF = 0;
                    let monthlyTotalCaringCost = 0;

                    const currentAbsolute = currentYear * 12 + currentMonth;

                    herd.forEach(buffalo => {
                        // --- Revenue Logic ---
                        const revenue = calculateMonthlyRevenueForBuffalo(
                            buffalo.id,
                            buffalo.acquisitionMonth,
                            currentYear,
                            currentMonth,
                            buffalo.absoluteAcquisitionMonth,
                            buffalo.generation
                        );

                        if (revenue > 0) {
                            monthlyTotalRevenue += revenue;
                        }

                        // --- CPF Calculation ---
                        let isCpfApplicable = false;

                        // Current absolute month for CPF calc
                        // const currentAbsolute = currentYear * 12 + currentMonth; // Already defined above

                        if (buffalo.generation === 0) {
                            const isFirstInUnit = (buffalo.id.charCodeAt(0) - 65) % 2 === 0;
                            if (isFirstInUnit) {
                                // Type A: Full CPF from start (if present)
                                // Check if buffalo is present (acquired)
                                const isPresent = buffalo.absoluteAcquisitionMonth !== undefined
                                    ? currentAbsolute >= buffalo.absoluteAcquisitionMonth
                                    : true; // Fallback

                                if (isPresent) {
                                    // Type A: Free Period for first 12 months
                                    const absoluteStart = startYear * 12 + startMonth;
                                    const monthsSinceStart = currentAbsolute - absoluteStart;

                                    if (monthsSinceStart >= 12) {
                                        isCpfApplicable = true;
                                    }
                                }
                            } else {
                                // Type B: Free Period Check
                                const isPresentInSimulation = buffalo.absoluteAcquisitionMonth !== undefined
                                    ? currentAbsolute >= buffalo.absoluteAcquisitionMonth
                                    : (currentYear > startYear || (currentYear === startYear && currentMonth >= buffalo.acquisitionMonth));

                                if (isPresentInSimulation) {
                                    const absoluteStart = startYear * 12 + startMonth;
                                    const monthsSinceStart = currentAbsolute - absoluteStart;

                                    // Free Period: July to June of next year (months 6-17 if start is Jan)
                                    // Logic: Start Month + 6 months is acquisition. Free for 1 year.
                                    // Original Code: monthsSinceStart >= 6 && monthsSinceStart < 18
                                    const isFreePeriod = monthsSinceStart >= 6 && monthsSinceStart < 18;
                                    if (!isFreePeriod) {
                                        isCpfApplicable = true;
                                    }
                                }
                            }
                        } else {
                            // Offspring: Pay CPF after 24 months
                            const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
                            const ageInMonths = ((currentYear - buffalo.birthYear) * 12) + (currentMonth - birthMonth);
                            if (ageInMonths >= 24) {
                                isCpfApplicable = true;
                            }
                        }

                        if (isCpfApplicable) {
                            monthlyTotalCPF += CPF_PER_MONTH;
                        }

                        // --- Caring Cost Logic (Matching CattleGrowingFund.jsx) ---
                        if (buffalo.generation > 0) {
                            const birthAbsolute = buffalo.birthYear * 12 + (buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0));

                            if (birthAbsolute <= currentAbsolute) {
                                // Age Calculation: 1-based index (Born Jan, Current Jan = 1st month)
                                const ageInMonths = (currentAbsolute - birthAbsolute) + 1;

                                let monthlyCost = 0;
                                if (ageInMonths > 12 && ageInMonths <= 18) monthlyCost = 1000;      // 13-18m: 6000 total
                                else if (ageInMonths > 18 && ageInMonths <= 24) monthlyCost = 1400; // 19-24m: 8400 total
                                else if (ageInMonths > 24 && ageInMonths <= 30) monthlyCost = 1800; // 25-30m: 10800 total
                                else if (ageInMonths > 30 && ageInMonths <= 36) monthlyCost = 2500; // 31-36m: 15000 total

                                monthlyTotalCaringCost += monthlyCost;
                            }
                        }
                    });

                    totalRevenue += monthlyTotalRevenue;
                    totalCPFCost += monthlyTotalCPF;
                    totalCaringCost += monthlyTotalCaringCost;
                }

                return {
                    totalRevenue: Math.round(totalRevenue),
                    totalNetRevenue: Math.round(totalRevenue - totalCPFCost),
                    totalCaringCost: Math.round(totalCaringCost)
                };
            };

            const { totalRevenue, totalNetRevenue, totalCaringCost } = calculateTotalFinancials();

            // --- Calculate Per-Buffalo Stats for Tooltip ---
            const CPF_PER_MONTH = 15000 / 12; // Define CPF constant

            herd.forEach(buffalo => {
                // 1. Age & Asset Value
                const targetMonth = (endMonthOfSimulation === 11) ? 12 : endMonthOfSimulation;
                const realAgeInMonths = calculateAgeInMonths(buffalo, endYear, targetMonth);

                // For offspring (Gen > 0), revenue logic has a 2-month landing/resting period.
                // We adjust the displayed age to reflect "active" age (Age - 2), clamped to 0.
                let displayAgeInMonths = realAgeInMonths;
                if (buffalo.generation > 0) {
                    displayAgeInMonths = Math.max(0, realAgeInMonths - 2);
                }

                (buffalo as any).ageInMonths = realAgeInMonths;
                (buffalo as any).ageDisplay = `${Math.floor(displayAgeInMonths / 12)}y ${displayAgeInMonths % 12}m`;
                (buffalo as any).currentAssetValue = getBuffaloValueByAge(realAgeInMonths);

                // 2. Grandparent
                if (buffalo.parentId) {
                    const parent = herd.find(p => p.id === buffalo.parentId);
                    (buffalo as any).grandParentId = parent ? parent.parentId : null;
                } else {
                    (buffalo as any).grandParentId = null;
                }

                // 3. Lifetime Revenue & CPF & Net
                let lifetimeRevenue = 0;
                let lifetimeCPF = 0;
                const calcStartYear = Math.max(startYear, buffalo.birthYear);

                for (let y = calcStartYear; y <= endYear; y++) {
                    for (let m = 0; m < 12; m++) {
                        const currentAbsoluteMonth = y * 12 + m;
                        if (currentAbsoluteMonth < absoluteStartMonth || currentAbsoluteMonth > absoluteEndMonth) {
                            continue;
                        }

                        // --- Revenue Logic ---
                        let isRevenueApplicable = true;
                        // For offspring (Gen > 0), revenue only starts after 34 months
                        if (buffalo.generation > 0) {
                            const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
                            const ageAtMonth = ((y - buffalo.birthYear) * 12) + (m - birthMonth);
                            if (ageAtMonth < 34) isRevenueApplicable = false;
                        }

                        let monthlyRevenue = 0;
                        if (isRevenueApplicable) {
                            monthlyRevenue = calculateMonthlyRevenueForBuffalo(
                                buffalo.id,
                                buffalo.acquisitionMonth,
                                y,
                                m,
                                buffalo.absoluteAcquisitionMonth
                            );
                            if (monthlyRevenue > 0) {
                                lifetimeRevenue += monthlyRevenue;
                            }
                        }

                        // --- CPF Calculation ---
                        let isCpfApplicable = false;
                        if (buffalo.generation === 0) {
                            const isFirstInUnit = (buffalo.id.charCodeAt(0) - 65) % 2 === 0;
                            if (isFirstInUnit) {
                                isCpfApplicable = true;
                            } else {
                                // Type B: Free Period Check
                                const currentAbsolute = y * 12 + m;
                                const isPresentInSimulation = buffalo.absoluteAcquisitionMonth !== undefined
                                    ? currentAbsolute >= buffalo.absoluteAcquisitionMonth
                                    : (y > startYear || (y === startYear && m >= buffalo.acquisitionMonth));

                                if (isPresentInSimulation) {
                                    // Free Period: 12 months starting 6 months after simulation start
                                    const absoluteStart = startYear * 12 + startMonth;
                                    const currentAbsolute = y * 12 + m;
                                    const monthsSinceStart = currentAbsolute - absoluteStart;
                                    const isFreePeriod = monthsSinceStart >= 6 && monthsSinceStart < 18;
                                    if (!isFreePeriod) {
                                        isCpfApplicable = true;
                                    }
                                }
                            }
                        } else {
                            const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
                            const ageInMonths = ((y - buffalo.birthYear) * 12) + (m - birthMonth);
                            if (ageInMonths >= 24) {
                                isCpfApplicable = true;
                            }
                        }

                        if (isCpfApplicable) {
                            lifetimeCPF += CPF_PER_MONTH;
                        }
                    }
                }
                (buffalo as any).lifetimeRevenue = lifetimeRevenue;
                (buffalo as any).lifetimeCPF = lifetimeCPF;
                (buffalo as any).lifetimeNet = lifetimeRevenue - lifetimeCPF;
            });



            setTreeData({
                units,
                years,
                startYear,
                startMonth,
                startDay,
                totalBuffaloes: herd.length,
                buffaloes: herd,
                revenueData: revenueData,
                summaryStats: {
                    totalBuffaloes: herd.length,
                    totalRevenue: totalRevenue,
                    totalNetRevenue: totalNetRevenue,
                    totalNetRevenueWithCaring: totalNetRevenue - totalCaringCost,
                    roi: (totalNetRevenue - totalCaringCost) + totalAssetValue,
                    totalAssetValue: totalAssetValue,
                    duration: totalYears
                },
                lineages: {} // Will be populated below
            });

            // Calculate per-lineage stats
            const bioLineages: any = {};
            const founders = herd.filter(b => b.parentId === null);

            founders.forEach(founder => {
                const lineageBuffaloes = herd.filter(b => b.rootId === founder.id);
                const lineageRevenueData = calculateRevenueData(lineageBuffaloes, startYear, startMonth, yearsToSimulate, totalMonthsDuration);

                // Calculate lineage asset value
                let lineageAssetValue = 0;
                lineageBuffaloes.forEach(buffalo => {
                    if (buffalo.birthYear <= endYear) {
                        const targetMonth = (endMonthOfSimulation === 11) ? 12 : endMonthOfSimulation;
                        const ageInMonths = calculateAgeInMonths(buffalo, endYear, targetMonth);
                        lineageAssetValue += getBuffaloValueByAge(ageInMonths);
                    }
                });

                bioLineages[founder.id] = {
                    id: founder.id,
                    unit: founder.unit,
                    count: lineageBuffaloes.length,
                    revenueData: lineageRevenueData,
                    assetValue: lineageAssetValue,
                    buffaloes: lineageBuffaloes
                };
            });

            setTreeData((prev: any) => ({
                ...prev,
                lineages: bioLineages
            }));

            setLoading(false);

            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    };

    // Reset function
    const resetSimulation = () => {
        localStorage.removeItem('buffalo_sim_config');
        localStorage.removeItem('buffalo_tree_data'); // Clean up old large data
        setTreeData(null);
        setUnits(1);
        setYears(10);
        setStartYear(2026);
        setStartMonth(0);
        setStartDay(1);
        setActiveTab("familyTree");
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Zoom controls
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, 2));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, 0.5));
    };

    const handleResetView = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Fit to screen functionality
    const handleFitToScreen = () => {
        if (!containerRef.current || !treeContainerRef.current) return;

        // Reset zoom/position first to get accurate measurements without transform
        // We'll calculate based on the current content size

        const container = containerRef.current;

        // We need to access the inner content wrapper (the one with flex-wrap)
        // The treeContainerRef might be the wrapper that has the transform
        // So we look for the first child which contains the actual nodes
        const content = treeContainerRef.current.firstElementChild;

        if (!content) return;

        const containerRect = container.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();

        // Calculate scale needed to fit width and height with some padding
        const padding = 40;

        // We use the UN-SCALED dimensions for calculation if possible, 
        // but since we might be zoomed in, we reverse the current zoom calculation
        // effectiveWidth = currentRectWidth / currentZoom
        const currentZoom = zoom;
        const effectiveContentWidth = contentRect.width / currentZoom;
        const effectiveContentHeight = contentRect.height / currentZoom;

        const scaleX = (containerRect.width - padding * 2) / effectiveContentWidth;
        const scaleY = (containerRect.height - padding * 2) / effectiveContentHeight;

        // Use the smaller scale to ensure it fits both dimensions, but cap it at 1 (don't zoom in too much for small trees)
        // Also set a minimum zoom to avoid making it too tiny
        const newZoom = Math.min(Math.min(scaleX, scaleY), 1.5); // Allow slight zoom in for small trees
        const constrainedZoom = Math.max(newZoom, 0.2); // Don't go below 0.2

        // Center the content
        // The content will be centered by the parent flex/grid if it's smaller, 
        // but for our transform logic, let's reset position to 0,0 or calculate center if needed.
        // Our CSS transformOrigin is '0 0', so we need to translate to center it.

        const scaledContentWidth = effectiveContentWidth * constrainedZoom;
        const scaledContentHeight = effectiveContentHeight * constrainedZoom;

        const x = (containerRect.width - scaledContentWidth) / 2;
        const y = (containerRect.height - scaledContentHeight) / 2;
        setZoom(constrainedZoom);
        setPosition({ x: x > 0 ? x : 0, y: y > 0 ? y : 0 }); // If negative (shouldn't be if we fit), clamp to 0
    };

    // Drag to pan functionality
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition(prev => ({
            x: prev.x + e.movementX,
            y: prev.y + e.movementY
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    // Toggle Full Screen
    const [isFullScreen, setIsFullScreen] = useState(false);
    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);



    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-900">
            {!isFullScreen && (
                <HeaderControls
                    units={units}
                    setUnits={setUnits}
                    years={years}
                    setYears={setYears}
                    startYear={startYear}
                    setStartYear={setStartYear}
                    startMonth={startMonth}
                    setStartMonth={setStartMonth}
                    startDay={startDay}
                    setStartDay={setStartDay}
                    daysInMonth={daysInMonth}
                    runSimulation={runSimulation}
                    treeData={treeData}
                    resetSimulation={resetSimulation}
                    loading={loading}
                    headerStats={headerStats}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            )}


            {/* Tab Navigation */}


            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "familyTree" ? (
                    <TreeVisualization
                        treeData={treeData}
                        zoom={zoom}
                        containerRef={containerRef}
                        treeContainerRef={treeContainerRef}
                        isFullScreen={isFullScreen}
                        toggleFullScreen={toggleFullScreen}
                        handleFitToScreen={handleFitToScreen}
                    />

                ) : treeData ? (
                    <div className="h-full overflow-auto bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CostEstimationTable
                            treeData={treeData}
                            activeGraph={activeGraph}
                            setActiveGraph={setActiveGraph}
                            onBack={() => setActiveTab("familyTree")}
                            setHeaderStats={setHeaderStats}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-5xl mb-4">📊</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Price Estimation</h2>
                            <p className="text-gray-600">Run a simulation first to see price estimation data</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
