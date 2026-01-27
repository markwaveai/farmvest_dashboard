
// Shared calculations and helper functions used across components

export const calculateAgeInMonths = (buffalo: any, targetYear: number, targetMonth: number = 0) => {
    const birthYear = buffalo.birthYear;
    const birthMonth = buffalo.birthMonth || 0;
    const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
    return Math.max(0, totalMonths);
};

export const getBuffaloDetails = (treeData: any) => {
    const buffaloDetails: any = {};
    let buffaloCounter = 1;

    treeData.buffaloes.forEach((buffalo: any) => {
        if (buffalo.generation === 0) {
            const unit = buffalo.unit || 1;
            const buffaloId = `M${buffaloCounter}`;

            buffaloDetails[buffalo.id] = {
                id: buffaloId,
                originalId: buffalo.id,
                generation: buffalo.generation,
                unit: unit,
                acquisitionMonth: buffalo.acquisitionMonth,
                birthYear: treeData.startYear - 5,
                birthMonth: buffalo.birthMonth || 0,
                parentId: buffalo.parentId,
                children: [],
                grandchildren: []
            };
            buffaloCounter++;
        }
    });

    let calfCounter = 1;
    treeData.buffaloes.forEach((buffalo: any) => {
        if (buffalo.generation === 1 && buffalo.isInitialCalf) {
            const unit = buffalo.unit || 1;
            const mother: any = Object.values(buffaloDetails).find((b: any) =>
                b.unit === unit && b.generation === 0
            );

            if (mother) {
                const calfId = `${mother.id}C${calfCounter}`;
                buffaloDetails[buffalo.id] = {
                    id: calfId,
                    originalId: buffalo.id,
                    generation: buffalo.generation,
                    unit: unit,
                    acquisitionMonth: mother.acquisitionMonth,
                    birthYear: treeData.startYear,
                    birthMonth: 0,
                    parentId: mother.originalId,
                    children: [],
                    grandchildren: []
                };
                mother.children.push(buffalo.id);
                calfCounter++;
            }
        }
    });

    treeData.buffaloes.forEach((buffalo: any) => {
        if (buffalo.generation === 1 && !buffalo.isInitialCalf) {
            const parent: any = Object.values(buffaloDetails).find((b: any) => b.originalId === buffalo.parentId);
            if (parent) {
                const childId = `${parent.id}C${parent.children.length + 1}`;
                buffaloDetails[buffalo.id] = {
                    id: childId,
                    originalId: buffalo.id,
                    generation: buffalo.generation,
                    unit: parent.unit,
                    acquisitionMonth: parent.acquisitionMonth,
                    birthYear: buffalo.birthYear,
                    birthMonth: buffalo.birthMonth || 0,
                    parentId: buffalo.parentId,
                    children: [],
                    grandchildren: []
                };
                parent.children.push(buffalo.id);
            }
        } else if (buffalo.generation === 2) {
            const grandparent: any = Object.values(buffaloDetails).find((b: any) =>
                b.children.includes(buffalo.parentId)
            );
            if (grandparent) {
                const grandchildId = `${grandparent.id}GC${grandparent.grandchildren.length + 1}`;
                buffaloDetails[buffalo.id] = {
                    id: grandchildId,
                    originalId: buffalo.id,
                    generation: buffalo.generation,
                    unit: grandparent.unit,
                    acquisitionMonth: grandparent.acquisitionMonth,
                    birthYear: buffalo.birthYear,
                    birthMonth: buffalo.birthMonth || 0,
                    parentId: buffalo.parentId,
                    children: [],
                    grandchildren: []
                };
                grandparent.grandchildren.push(buffalo.id);
            }
        }
    });

    return buffaloDetails;
};

export const getBuffaloValueByAge = (ageInMonths: number) => {
    if (ageInMonths >= 60) return 175000;
    else if (ageInMonths >= 48) return 150000;
    else if (ageInMonths >= 40) return 100000;
    else if (ageInMonths >= 36) return 50000;
    else if (ageInMonths >= 30) return 50000;
    else if (ageInMonths >= 24) return 35000;
    else if (ageInMonths >= 18) return 25000;
    else if (ageInMonths >= 12) return 12000;
    else if (ageInMonths >= 6) return 6000;
    else return 3000;
};

export const calculateMonthlyRevenueForBuffalo = (acquisitionMonth: number, currentMonth: number, currentYear: number, startYear: number) => {
    const monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);
    if (monthsSinceAcquisition < 2) return 0;

    const productionMonth = monthsSinceAcquisition - 2;
    const cycleMonth = productionMonth % 12;

    if (cycleMonth < 5) return 9000;
    else if (cycleMonth < 8) return 6000;
    else return 0;
};

export const calculateYearlyCPFCost = (treeData: any, buffaloDetails: any, calculateAgeInMonths: (buffalo: any, y: number, m: number) => number) => {
    const cpfCostByYear: any = {};

    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
        let totalCPFCost = 0;

        for (let unit = 1; unit <= treeData.units; unit++) {
            let unitCPFCost = 0;

            const unitBuffaloes = Object.values(buffaloDetails).filter((buffalo: any) => buffalo.unit === unit);

            unitBuffaloes.forEach((buffalo: any) => {
                if (buffalo.id === 'M1') {
                    unitCPFCost += 13000;
                }
                else if (buffalo.id === 'M2') {
                    // No CPF
                }
                else if (buffalo.generation === 1 || buffalo.generation === 2) {
                    const ageInMonths = calculateAgeInMonths(buffalo, year, 11);
                    if (ageInMonths >= 36) {
                        unitCPFCost += 13000;
                    }
                }
            });

            totalCPFCost += unitCPFCost;
        }

        cpfCostByYear[year] = totalCPFCost;
    }

    return cpfCostByYear;
};

export const calculateInitialInvestment = (treeData: any) => {
    const MOTHER_BUFFALO_PRICE = 175000;
    const CPF_PER_UNIT = 13000;
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

export const calculateDetailedMonthlyRevenue = (
    treeData: any,
    buffaloDetails: any,
    calculateMonthlyRevenueForBuffalo: (acq: number, curM: number, curY: number, startY: number) => number,
    calculateAgeInMonths: (b: any, y: number, m: number) => number,
    getBuffaloValueByAge: (age: number) => number
) => {
    const monthlyRevenue: any = {};
    const investorMonthlyRevenue: any = {};
    const buffaloValuesByYear: any = {};

    for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
        monthlyRevenue[year] = {};
        investorMonthlyRevenue[year] = {};
        buffaloValuesByYear[year] = {};

        for (let month = 0; month < 12; month++) {
            monthlyRevenue[year][month] = { total: 0, buffaloes: {} };
            investorMonthlyRevenue[year][month] = 0;
        }
    }

    Object.values(buffaloDetails).forEach((buffalo: any) => {
        for (let year = treeData.startYear; year <= treeData.startYear + treeData.years; year++) {
            const ageInMonths = calculateAgeInMonths(buffalo, year, 11);

            if (!buffaloValuesByYear[year][buffalo.id]) {
                buffaloValuesByYear[year][buffalo.id] = {
                    ageInMonths: ageInMonths,
                    value: getBuffaloValueByAge(ageInMonths)
                };
            }

            if (year >= buffalo.birthYear + 3) {
                for (let month = 0; month < 12; month++) {
                    const revenue = calculateMonthlyRevenueForBuffalo(
                        buffalo.acquisitionMonth,
                        month,
                        year,
                        treeData.startYear
                    );

                    if (revenue > 0) {
                        monthlyRevenue[year][month].total += revenue;
                        monthlyRevenue[year][month].buffaloes[buffalo.id] = revenue;
                        investorMonthlyRevenue[year][month] += revenue;
                    }
                }
            }
        }
    });

    return { monthlyRevenue, investorMonthlyRevenue, buffaloDetails, buffaloValuesByYear };
};
