import React, { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

import { EmiContext, EmiRow, YearlyRow, AcfRow } from './EmiContext';

// Constants
const CPF_PER_UNIT_YEARLY = 15000.0;
const MARKET_UNIT_VALUE = 350000.0;
const ACF_INSTALLMENT_11_MONTHS = 30000.0;
const ACF_INSTALLMENT_30_MONTHS = 10000.0;

export const EmiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- EMI Calculator State ---
    const [amount, setAmount] = useState(400000); // 4L default
    const [rate, setRate] = useState(12.0);
    const [months, setMonths] = useState(60);
    const [units, setUnits] = useState(1);
    const [cpfEnabled, setCpfEnabled] = useState(true);
    const [cgfEnabled, setCgfEnabled] = useState(false);

    // --- ACF State ---
    const [acfUnits, setAcfUnits] = useState(1);
    const [acfTenureMonths, setAcfTenureMonths] = useState(30); // 11 or 30
    const [acfProjectionYear, setAcfProjectionYear] = useState(1);
    const [acfRevenueProjectionYear, setAcfRevenueProjectionYear] = useState(1);

    // --- Simulation Results State ---
    const [schedule, setSchedule] = useState<EmiRow[]>([]);
    const [yearlySchedule, setYearlySchedule] = useState<YearlyRow[]>([]); // For yearly view

    // Derived Totals
    const [emi, setEmi] = useState(0);
    const [totalPayment, setTotalPayment] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalCpf, setTotalCpf] = useState(0);
    const [totalCgf, setTotalCgf] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [totalLoss, setTotalLoss] = useState(0);
    const [totalNetCash, setTotalNetCash] = useState(0);

    // Asset Values
    const [totalAssetValue, setTotalAssetValue] = useState(0);

    // --- Formatting ---
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
        }).format(value);
    };

    // --- Helpers from Flutter Logic ---

    // Asset Valuation Logic
    const getValuationForAge = (ageInMonths: number) => {
        if (ageInMonths >= 41) return 175000;
        if (ageInMonths >= 35) return 150000;
        if (ageInMonths >= 25) return 100000;
        if (ageInMonths >= 19) return 40000;
        if (ageInMonths >= 13) return 25000;
        return 10000;
    };

    const calculateAgeInMonths = (buffalo: any, targetYear: number, targetMonth: number = 0) => {
        const birthYear = buffalo.birthYear;
        // Use birthMonth if available, fall back to acquisitionMonth or 0
        const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
        const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
        return Math.max(0, totalMonths);
    };

    // CGF Cost Logic
    const getMonthlyCgfForCalfAge = (age: number) => {
        if (age <= 12) return 0; // 0-12 months free
        if (age <= 18) return 1000; // 13-18 months
        if (age <= 24) return 1400; // 19-24 months
        if (age <= 30) return 1800; // 25-30 months
        if (age <= 36) return 2500; // 31-36 months
        return 0;
    };

    // Revenue Logic
    const getRevenueForAdult = (month: number, revenueStartMonth: number) => {
        if (month < revenueStartMonth) return 0;
        const k = month - revenueStartMonth;
        const cyclePos = k % 12;
        if (cyclePos >= 0 && cyclePos <= 4) return 9000; // Peak
        if (cyclePos >= 5 && cyclePos <= 7) return 6000; // Mid
        return 0; // Dry
    };

    const getRevenueForCalf = (month: number, cycleBaseMonth: number) => {
        if (month < cycleBaseMonth) return 0;
        const k = month - cycleBaseMonth;
        const cyclePos = k % 12;
        if (cyclePos <= 1) return 0;
        if (cyclePos <= 6) return 9000;
        if (cyclePos <= 9) return 6000;
        return 0;
    };

    // Simulation Core
    // Generates the schedule array
    const simulateConfig = useCallback((pAmount: number, pRate: number, pLoanMonths: number, pSimMonths: number, pUnits: number, pCpf: boolean, pCgf: boolean) => {

        const principal = pAmount;
        const monthlyRate = pRate / 12 / 100;

        // Use effective units (default to 1) for calculations so user doesn't see zero stats
        const effectiveUnits = pUnits > 0 ? pUnits : 1;

        let emiLocal = 0;
        if (pLoanMonths > 0) {
            if (monthlyRate === 0) {
                emiLocal = principal / pLoanMonths;
            } else {
                const powFactor = Math.pow(1 + monthlyRate, pLoanMonths);
                emiLocal = (principal * monthlyRate * powFactor) / (powFactor - 1);
            }
        }

        let balance = principal;
        const rows: EmiRow[] = [];

        // Capital Requirement Calculation
        const perUnitBase = 350000.0;
        const perUnitCpf = CPF_PER_UNIT_YEARLY;
        const requiredPerUnit = perUnitBase + (pCpf ? perUnitCpf : 0.0);
        const requiredCapital = requiredPerUnit * effectiveUnits;

        // Excess loan amount becomes "Loan Pool" (Working Capital)
        let loanPool = principal > requiredCapital ? (principal - requiredCapital) : 0.0;

        // Simulation Parameters
        const orderMonthBuff1 = 1;
        const orderMonthBuff2 = 7;
        const revenueStartBuff1 = 3;
        const revenueStartBuff2 = 9;

        const calfRevenueStartMonths: number[] = [];
        const calfCpfStartMonths: number[] = [];
        const allBirthMonths: number[] = [];

        // Helper to track births
        const trackBirths = (firstBirthMonth: number) => {
            for (let bm = firstBirthMonth; bm <= pSimMonths; bm += 12) {
                allBirthMonths.push(bm);

                // CPF Start (Direct)
                const cpfStart = bm + 24;
                if (cpfStart <= pSimMonths) calfCpfStartMonths.push(cpfStart);

                // Revenue Start (Direct)
                const revStart = bm + 32;
                if (revStart <= pSimMonths) calfRevenueStartMonths.push(revStart);

                // Grand Births (Gen 2)
                const firstGrandBaby = bm + 32;
                if (firstGrandBaby <= pSimMonths) {
                    for (let gb = firstGrandBaby; gb <= pSimMonths; gb += 12) {
                        allBirthMonths.push(gb);

                        // CPF Start (Grand)
                        const cpfStartGrand = gb + 24;
                        if (cpfStartGrand <= pSimMonths) calfCpfStartMonths.push(cpfStartGrand);

                        // Revenue Start (Grand)
                        const revStartGrand = gb + 32;
                        if (revStartGrand <= pSimMonths) calfRevenueStartMonths.push(revStartGrand);

                        // Gen 3 (Great Grand)
                        const firstGreatGrand = gb + 32;
                        if (firstGreatGrand <= pSimMonths) {
                            for (let ggb = firstGreatGrand; ggb <= pSimMonths; ggb += 12) {
                                allBirthMonths.push(ggb);

                                const cpfStartGGB = ggb + 24;
                                if (cpfStartGGB <= pSimMonths) calfCpfStartMonths.push(cpfStartGGB);

                                const revStartGGB = ggb + 32;
                                if (revStartGGB <= pSimMonths) calfRevenueStartMonths.push(revStartGGB);

                                // Gen 4 (Great Great Grand) - Just in case for 120 months
                                const firstGen4 = ggb + 32;
                                if (firstGen4 <= pSimMonths) {
                                    for (let g4 = firstGen4; g4 <= pSimMonths; g4 += 12) {
                                        allBirthMonths.push(g4);
                                        const cpfStartG4 = g4 + 24;
                                        if (cpfStartG4 <= pSimMonths) calfCpfStartMonths.push(cpfStartG4);
                                        // Revenue gen 4
                                        const revStartG4 = g4 + 32;
                                        if (revStartG4 <= pSimMonths) calfRevenueStartMonths.push(revStartG4);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        trackBirths(orderMonthBuff1);
        trackBirths(orderMonthBuff2);

        const monthlyCpfPerAnimal = CPF_PER_UNIT_YEARLY / 12;

        for (let m = 1; m <= pSimMonths; m++) {
            // EMI applies only within pLoanMonths
            const currentEmi = m <= pLoanMonths ? emiLocal : 0;

            const interestForMonth = balance * monthlyRate;
            let principalForMonth = 0;

            if (m <= pLoanMonths) {
                principalForMonth = currentEmi - interestForMonth;
                if (m === pLoanMonths) principalForMonth = balance; // Close loan
                if (principalForMonth < 0) principalForMonth = 0;
                balance -= principalForMonth;
                if (balance < 0.000001) balance = 0;
            }

            // CGF
            let cgfPerUnit = 0;
            /* if (pCgf) {
                for (const birthMonth of allBirthMonths) {
                    if (m >= birthMonth) {
                        const currentAge = (m - birthMonth) + 1;
                        cgfPerUnit += getMonthlyCgfForCalfAge(currentAge);
                    }
                }
            } */
            const cgf = cgfPerUnit * effectiveUnits;

            // Revenue
            let revenuePerUnit = 0;
            revenuePerUnit += getRevenueForAdult(m, revenueStartBuff1);
            revenuePerUnit += getRevenueForAdult(m, revenueStartBuff2);

            for (const startMonth of calfRevenueStartMonths) {
                revenuePerUnit += getRevenueForCalf(m, startMonth);
            }
            const revenue = revenuePerUnit * effectiveUnits;

            // CPF
            let cpf = 0;
            if (pCpf) {
                if (m > 12) {
                    // Adult CPFs
                    if (m >= orderMonthBuff1) cpf += monthlyCpfPerAnimal * effectiveUnits;
                    if (m >= orderMonthBuff2 + 12) cpf += monthlyCpfPerAnimal * effectiveUnits;


                    // Calf CPFs
                    for (const start of calfCpfStartMonths) {
                        if (m >= start) cpf += monthlyCpfPerAnimal * effectiveUnits;
                    }
                }
            }

            // Payments Logic: Try to pay from Revenue -> Then Loan Pool -> Then Loss (Pocket)
            let emiFromRevenue = revenue >= currentEmi ? currentEmi : revenue;
            let remainingRevenue = revenue - emiFromRevenue;
            let emiFromLoanPool = 0;

            let remainingEmi = currentEmi - emiFromRevenue;
            if (remainingEmi > 0 && loanPool > 0) {
                const take = remainingEmi <= loanPool ? remainingEmi : loanPool;
                emiFromLoanPool = take;
                loanPool -= take;
                remainingEmi -= take;
            }

            let cpfFromRevenue = 0;
            let remainingCpf = cpf;
            if (remainingRevenue > 0 && remainingCpf > 0) {
                const take = remainingRevenue <= remainingCpf ? remainingRevenue : remainingCpf;
                cpfFromRevenue = take;
                remainingRevenue -= take;
                remainingCpf -= take;
            }

            let cpfFromLoanPool = 0;
            if (remainingCpf > 0 && loanPool > 0) {
                const take = remainingCpf <= loanPool ? remainingCpf : loanPool;
                cpfFromLoanPool = take;
                loanPool -= take;
                remainingCpf -= take;
            }

            let cgfFromRevenue = 0;
            let remainingCgf = cgf;
            if (remainingRevenue > 0 && remainingCgf > 0) {
                const take = remainingRevenue <= remainingCgf ? remainingRevenue : remainingCgf;
                cgfFromRevenue = take;
                remainingRevenue -= take;
                remainingCgf -= take;
            }

            let cgfFromLoanPool = 0;
            if (remainingCgf > 0 && loanPool > 0) {
                const take = remainingCgf <= loanPool ? remainingCgf : loanPool;
                cgfFromLoanPool = take;
                loanPool -= take;
                remainingCgf -= take;
            }

            let loss = remainingEmi + remainingCpf + remainingCgf;
            if (loss < 0) loss = 0;

            let profit = remainingRevenue;
            if (profit < 0) profit = 0;
            if (profit > 0) loanPool += profit;

            rows.push({
                month: m,
                emi: currentEmi,
                interest: interestForMonth,
                principal: principalForMonth,
                balance: balance,
                revenue,
                cpf,
                cgf,
                emiFromRevenue,
                emiFromLoanPool,
                cpfFromRevenue,
                cpfFromLoanPool,
                cgfFromRevenue,
                cgfFromLoanPool,
                loanPoolBalance: loanPool,
                profit,
                loss,
                // Add aliases for easier table matching
                totalPayment: currentEmi + cpf + cgf,
                debitFromBalance: emiFromLoanPool + cpfFromLoanPool + cgfFromLoanPool,
                netCash: profit - loss
            });
        }
        return { rows, emi: emiLocal };
    }, []);


    // Herd Simulation for Asset Valuations
    const simulateHerd = useCallback((tenureMonths: number, unitCount: number) => {

        const orderMonthBuff1 = 1;
        const orderMonthBuff2 = 7;

        // Just return list of ages for offspring (for a SINGLE unit).
        const offspringAges: number[] = [];
        const trackOffspring = (startMonth: number) => {
            // Direct 
            for (let bm = startMonth; bm <= tenureMonths; bm += 12) {
                offspringAges.push((tenureMonths - bm) + 1); // Age in months at end

                // Grand
                const firstGrand = bm + 32;
                if (firstGrand <= tenureMonths) {
                    for (let gb = firstGrand; gb <= tenureMonths; gb += 12) {
                        offspringAges.push((tenureMonths - gb) + 1);
                    }
                }
            }
        }
        trackOffspring(orderMonthBuff1);
        trackOffspring(orderMonthBuff2);

        // We return the ages for a SINGLE unit now, to avoid massive array creation crash.
        // multi-unit scaling happens in calculateAssetValueFromSimulation
        return offspringAges;
    }, []);


    const calculateAssetValueFromSimulation = useCallback((singleUnitOffspringAges: number[], pUnits: number) => {
        const effectiveUnits = pUnits > 0 ? pUnits : 1;
        const adultValue = 175000 * 2 * effectiveUnits;

        let singleUnitOffspringValue = 0;
        for (const age of singleUnitOffspringAges) {
            singleUnitOffspringValue += getValuationForAge(age);
        }

        // Total = Adults + (Single Unit Offspring Total * Unit Count)
        return adultValue + (singleUnitOffspringValue * effectiveUnits);
    }, []);


    // Precise Simulation for Asset Valuation (Matching Buffalo Vis)
    const calculateProjectedAssetValue = (targetYearIndex: number, unitCount: number) => {
        // targetYearIndex is 1-based (Year 1, Year 2...)
        // We simulate from now (Year 0) to Year target.

        const startYear = new Date().getFullYear(); // Or fixed 2026? Let's use 2026 to match Vis defaults if needed, but current year is safer.
        // Actually, Buffalo Vis default is 2026. Let's stick to dynamic current year for Calculator context.
        const startMonth = 0; // Jan


        const totalYears = targetYearIndex;
        const herd: any[] = [];
        const offspringCounts: any = {};

        const effectiveUnitCount = unitCount > 0 ? unitCount : 1;

        // 1. Initial Herd Creation
        for (let u = 0; u < effectiveUnitCount; u++) {
            // First buffalo (Jan)
            const id1 = `U${u + 1}A`;
            const absAcq1 = startYear * 12 + startMonth;
            herd.push({
                id: id1,
                age: 5,
                generation: 0,
                birthYear: startYear - 5,
                acquisitionMonth: startMonth,
                absoluteAcquisitionMonth: absAcq1,
                birthMonth: startMonth,
            });

            // Second buffalo (July)
            const id2 = `U${u + 1}B`;
            const absAcq2 = startYear * 12 + startMonth + 6;
            herd.push({
                id: id2,
                age: 5,
                generation: 0,
                birthYear: startYear - 5,
                acquisitionMonth: (startMonth + 6) % 12,
                absoluteAcquisitionMonth: absAcq2,
                birthMonth: (startMonth + 6) % 12,
            });
        }

        // 2. Simulation Loop
        const totalMonthsDuration = totalYears * 12;
        const absoluteStartMonth = startYear * 12 + startMonth;
        const absoluteEndMonth = absoluteStartMonth + totalMonthsDuration - 1;

        // Simulate year by year
        for (let year = 1; year <= totalYears; year++) {
            const currentYear = startYear + (year - 1);

            // Snapshot current herd to iterate safely
            const currentHerd = [...herd];

            currentHerd.forEach(parent => {
                if (parent.generation === 0) {
                    const birthMonth = parent.acquisitionMonth;
                    const absoluteBirthMonth = currentYear * 12 + birthMonth;

                    if (absoluteBirthMonth >= absoluteStartMonth && absoluteBirthMonth <= absoluteEndMonth) {
                        if (!offspringCounts[parent.id]) offspringCounts[parent.id] = 0;
                        offspringCounts[parent.id]++;
                        const newId = `${parent.id}_C${offspringCounts[parent.id]}`;

                        herd.push({
                            id: newId,
                            age: 0,
                            generation: parent.generation + 1,
                            birthYear: currentYear,
                            birthMonth: birthMonth,
                            acquisitionMonth: birthMonth,
                            absoluteAcquisitionMonth: absoluteBirthMonth,
                            parentId: parent.id
                        });
                    }
                } else {
                    // Gen > 0
                    const yearStartAbs = currentYear * 12;
                    const yearEndAbs = yearStartAbs + 11;
                    const parentBirthAbs = parent.absoluteAcquisitionMonth || (parent.birthYear * 12 + (parent.birthMonth || 0));

                    for (let k = 0; k < 15; k++) {
                        const milestoneAbs = parentBirthAbs + 32 + (k * 12); // 32 month gap? Vis says 34 threshold for mature, but calculation loop used 32+k*12 logic? 
                        // Looking at BuffaloFamilyTree:
                        // "const milestoneAbs = parentBirthAbs + 32 + (k * 12);"
                        // Yes, line 394 in index.tsx.

                        if (milestoneAbs >= yearStartAbs && milestoneAbs <= yearEndAbs) {
                            if (milestoneAbs > absoluteEndMonth) continue;
                            if (milestoneAbs < absoluteStartMonth) continue;

                            const birthMonth = milestoneAbs % 12;
                            if (!offspringCounts[parent.id]) offspringCounts[parent.id] = 0;
                            offspringCounts[parent.id]++;
                            const newId = `${parent.id}_C${offspringCounts[parent.id]}`;

                            herd.push({
                                id: newId,
                                age: 0,
                                generation: parent.generation + 1,
                                birthYear: currentYear,
                                birthMonth: birthMonth,
                                acquisitionMonth: birthMonth,
                                absoluteAcquisitionMonth: milestoneAbs,
                                parentId: parent.id
                            });
                        }
                    }
                }
            });
        }

        // 3. Calculate Final Value
        const endYear = startYear + Math.floor((startMonth + totalMonthsDuration - 1) / 12);
        const endMonthOfSimulation = absoluteEndMonth % 12; // 11 usually
        const targetMonth = (endMonthOfSimulation === 11) ? 12 : endMonthOfSimulation; // End of year

        let totalAssetValue = 0;
        herd.forEach(buffalo => {
            if (buffalo.birthYear <= endYear) {
                const birthAbsolute = buffalo.birthYear * 12 + (buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0));
                if (birthAbsolute <= absoluteEndMonth) {
                    const ageInMonths = calculateAgeInMonths(buffalo, endYear, targetMonth);
                    let val = getValuationForAge(ageInMonths);

                    // Logic matching CostEstimationTable: 0-12 months value is 0 in the first year
                    if (targetYearIndex === 1 && ageInMonths <= 12) {
                        val = 0;
                    }

                    totalAssetValue += val;
                }
            }
        });

        return { totalAssetValue, totalBuffaloes: herd.length };
    };



    // Long Term State
    const [totalRevenueLongTerm, setTotalRevenueLongTerm] = useState(0);
    const [totalCpfLongTerm, setTotalCpfLongTerm] = useState(0);
    const [totalCgfLongTerm, setTotalCgfLongTerm] = useState(0);
    const [totalAssetValueLongTerm, setTotalAssetValueLongTerm] = useState(0);
    const [totalNetCashLongTerm, setTotalNetCashLongTerm] = useState(0);
    const [totalAssetValue120, setTotalAssetValue120] = useState(0);

    // --- Effects to Update State ---
    useEffect(() => {
        // 1. Regular Simulation (User defined months, usually 60)
        const { rows, emi: calcEmi } = simulateConfig(amount, rate, months, months, units, cpfEnabled, cgfEnabled);

        setEmi(calcEmi);
        setSchedule(rows);

        // Calculate Totals for Regular Simulation
        const tRev = rows.reduce((acc: number, r: EmiRow) => acc + r.revenue, 0);
        const tCpf = rows.reduce((acc: number, r: EmiRow) => acc + r.cpf, 0);
        const tCgf = rows.reduce((acc: number, r: EmiRow) => acc + r.cgf, 0);
        const tLoss = rows.reduce((acc: number, r: EmiRow) => acc + r.loss, 0);

        // Correct Total Interest calculation
        const tInt = rows.reduce((acc: number, r: EmiRow) => acc + r.interest, 0);
        setTotalInterest(tInt);

        // Correct Cash Flow Logic:
        // Previous logic summed monthly "profit" (surplus) even if that surplus was later consumed by deficits via the Loan Pool.
        // True Net Cash = Total Revenue - Total Outflows (EMI + CPF + CGF)
        const tPayment = calcEmi * months;
        const totalOutflows = tPayment + tCpf + tCgf;
        const realNetCash = tRev - totalOutflows;

        setTotalRevenue(tRev);
        setTotalCpf(tCpf);
        setTotalCgf(tCgf);
        setTotalPayment(tPayment);

        setTotalLoss(tLoss); // "From Pocket" remains correct (sum of required injections)
        setTotalNetCash(realNetCash);

        // Total Profit should reflect the final Net Gain. If negative, it's 0 (or we could show negative).
        // Giving the user "Total Profit" usually implies the positive outcome.
        setTotalProfit(realNetCash > 0 ? realNetCash : 0);

        // Asset Value (Regular)
        const herdAges = simulateHerd(months, units);
        const assetVal = calculateAssetValueFromSimulation(herdAges, units);
        setTotalAssetValue(assetVal);

        // 2. Long Term Simulation (61-120 Months)
        // We run a simulation for 120 months regardless of user loan tenure, to get the future stats.
        // We assume the loan is paid off by month 60 (or whatever user set), but revenue continues.
        // However, `simulateConfig` logic is tied to loan tenure for EMI.
        // For purely Revenue/CPF/Asset projection, we can treat it as a 120 month scenario where loan might end earlier.
        // Actually, let's just run `simulateConfig` with 120 months.
        // The EMI/Loan logic inside might behave weirdly if we just extend pMonths, so let's be careful.
        // If we want purely "Revenue/CPF/Asset" for 61-120, we can run a 120 month sim.

        const longTermMonths = 120; // 10 Years
        const { rows: longrows } = simulateConfig(amount, rate, months, longTermMonths, units, cpfEnabled, cgfEnabled);

        // Filter for months 61 to 120
        const futureRows = longrows.filter(r => r.month > 60 && r.month <= 120);

        const ltRev = futureRows.reduce((acc: number, r: EmiRow) => acc + r.revenue, 0);
        const ltCpf = futureRows.reduce((acc: number, r: EmiRow) => acc + r.cpf, 0);
        const ltCgf = futureRows.reduce((acc: number, r: EmiRow) => acc + r.cgf, 0);

        setTotalRevenueLongTerm(ltRev);
        setTotalCpfLongTerm(ltCpf);
        setTotalCgfLongTerm(ltCgf);
        setTotalNetCashLongTerm(ltRev - ltCpf - ltCgf);

        // Asset Value Growth (61-120 Months) = Value @ 120 - Value @ 60
        const { totalAssetValue: assetVal120 } = calculateProjectedAssetValue(10, units);
        const { totalAssetValue: assetVal60 } = calculateProjectedAssetValue(5, units);
        setTotalAssetValueLongTerm(assetVal120 - assetVal60);
        setTotalAssetValue120(assetVal120);


        // Yearly Schedule Generation (for the regular schedule)
        const yearly: YearlyRow[] = [];
        const numYears = Math.ceil(months / 12);
        for (let i = 0; i < numYears; i++) {
            const start = i * 12;
            const end = Math.min((i + 1) * 12, rows.length);
            const chunk = rows.slice(start, end);

            const yEmi = chunk.reduce((s: number, r: EmiRow) => s + r.emi, 0);
            const yRev = chunk.reduce((s: number, r: EmiRow) => s + r.revenue, 0);
            const yCpf = chunk.reduce((s: number, r: EmiRow) => s + r.cpf, 0);
            const yCgf = chunk.reduce((s: number, r: EmiRow) => s + r.cgf, 0);
            const yProfit = chunk.reduce((s: number, r: EmiRow) => s + r.profit, 0);
            const yLoss = chunk.reduce((s: number, r: EmiRow) => s + r.loss, 0);
            const yPrincipal = chunk.reduce((s: number, r: EmiRow) => s + r.principal, 0);
            const yInterest = chunk.reduce((s: number, r: EmiRow) => s + r.interest, 0);

            const lastBalance = chunk[chunk.length - 1].balance;
            const lastLoanPool = chunk[chunk.length - 1].loanPoolBalance;

            yearly.push({
                month: i + 1, // Year number
                emi: yEmi,
                revenue: yRev,
                cpf: yCpf,
                cgf: yCgf,
                profit: yProfit,
                loss: yLoss,
                principal: yPrincipal,
                interest: yInterest,
                balance: lastBalance, // Balance at end of year
                loanPoolBalance: lastLoanPool,
                totalPayment: yEmi + yCpf + yCgf,
                debitFromBalance: chunk.reduce((s: number, r: EmiRow) => s + (r.emiFromLoanPool + r.cpfFromLoanPool + r.cgfFromLoanPool), 0),

                netCash: yProfit - yLoss
            });
        }
        setYearlySchedule(yearly);

    }, [amount, rate, months, units, cpfEnabled, cgfEnabled, simulateConfig, simulateHerd, calculateAssetValueFromSimulation]);


    // --- ACF Derived Data ---
    const acfMonthlyInstallment = useMemo(() => {
        return acfTenureMonths === 11 ? ACF_INSTALLMENT_11_MONTHS : ACF_INSTALLMENT_30_MONTHS;
    }, [acfTenureMonths]);

    const acfTotalInvestment = useMemo(() => {
        return acfUnits * acfMonthlyInstallment * acfTenureMonths;
    }, [acfUnits, acfMonthlyInstallment, acfTenureMonths]);

    const acfCpfBenefit = useMemo(() => {
        // 11 Months: 1 buffalo free (multiplier 1)
        // 30 Months: 2 buffalo free (multiplier 2)
        const multiplier = acfTenureMonths === 11 ? 1 : 2;
        return acfUnits * CPF_PER_UNIT_YEARLY * multiplier;
    }, [acfUnits, acfTenureMonths]);

    const acfMarketAssetValue = acfUnits * MARKET_UNIT_VALUE;
    const acfTotalBenefit = (acfMarketAssetValue - acfTotalInvestment) + acfCpfBenefit;

    const acfScheduleTotal = useMemo(() => {
        const rows: AcfRow[] = [];
        let cumulative = 0;
        const monthly = acfUnits * acfMonthlyInstallment;
        for (let i = 1; i <= acfTenureMonths; i++) {
            cumulative += monthly;
            rows.push({
                month: i,
                installment: monthly,
                cumulative
            })
        }
        return rows;
    }, [acfUnits, acfMonthlyInstallment, acfTenureMonths]);

    return (
        <EmiContext.Provider value={{
            // EMI State
            amount, setAmount,
            rate, setRate,
            months, setMonths,
            units, setUnits,
            cpfEnabled, setCpfEnabled,
            cgfEnabled, setCgfEnabled,

            // EMI Results
            schedule, yearlySchedule,
            emi, totalPayment, totalInterest,
            totalRevenue, totalCpf, totalCgf,
            totalProfit, totalLoss, totalNetCash,
            totalAssetValue,
            simulateHerd,
            calculateAssetValueFromSimulation,
            calculateProjectedAssetValue, // Export new function

            // Long Term
            totalRevenueLongTerm,
            totalCpfLongTerm,
            totalCgfLongTerm,
            totalAssetValueLongTerm,
            totalNetCashLongTerm,
            totalAssetValue120,


            // ACF State
            acfUnits, setAcfUnits,
            acfTenureMonths, setAcfTenureMonths,
            acfProjectionYear, setAcfProjectionYear,
            acfRevenueProjectionYear, setAcfRevenueProjectionYear,

            // ACF Results
            acfMonthlyInstallment,
            acfTotalInvestment,
            acfTotalBenefit,
            acfCpfBenefit,
            acfSchedule: acfScheduleTotal,

            // Utils
            formatCurrency
        }}>
            {children}
        </EmiContext.Provider>
    );
};
