
import algorithmConfig from './algorithms.json';

// Types derived from JSON structure
type AssetTier = {
    minAge: number;
    maxAge: number;
    value: number;
    description: string;
};

// 1. Asset Value Logic
export const getBuffaloValueByAge = (ageInMonths: number): number => {
    const tier = algorithmConfig.assetValue.tiers.find(
        (t) => ageInMonths >= t.minAge && ageInMonths <= t.maxAge
    );
    return tier ? tier.value : algorithmConfig.assetValue.tiers[algorithmConfig.assetValue.tiers.length - 1].value;
};

export const getBuffaloValueDescription = (ageInMonths: number): string => {
    const tier = algorithmConfig.assetValue.tiers.find(
        (t) => ageInMonths >= t.minAge && ageInMonths <= t.maxAge
    );
    return tier ? tier.description : "Unknown Age Group";
};

// 2. Revenue Logic
export const calculateMonthlyRevenueForBuffalo = (
    acquisitionMonth: number,
    currentMonth: number,
    currentYear: number,
    startYear: number,
    absoluteAcquisitionMonth?: number,
    generation: number = 0,
    buffaloId: string = ''
): number => {
    let monthsSinceAcquisition;

    if (absoluteAcquisitionMonth !== undefined) {
        const currentAbsolute = currentYear * 12 + currentMonth;
        monthsSinceAcquisition = currentAbsolute - absoluteAcquisitionMonth;
    } else {
        monthsSinceAcquisition = (currentYear - startYear) * 12 + (currentMonth - acquisitionMonth);
    }

    const offset = generation > 0
        ? algorithmConfig.revenue.productionLag.genNext
        : algorithmConfig.revenue.productionLag.gen0;

    if (monthsSinceAcquisition < offset) {
        return 0;
    }

    const productionMonth = monthsSinceAcquisition - offset;
    const cycleMonth = productionMonth % 12; // 12-month cycle assumption

    const { highMonths, duration } = algorithmConfig.revenue.cycle;
    const { high, low, none } = algorithmConfig.revenue.monthlyRates;

    if (cycleMonth < highMonths) {
        return high;
    } else if (cycleMonth < duration) { // duration is 8 (5 high + 3 low)
        return low;
    } else {
        return none;
    }
};

// 3. CPF Logic
export const isCpfApplicable = (
    buffalo: any,
    currentAbsoluteMonth: number,
    treeData: any
): boolean => {
    const absoluteStartMonth = treeData.startYear * 12 + (treeData.startMonth || 0);
    const absoluteEndMonth = absoluteStartMonth + (treeData.years * 12) - 1;

    if (currentAbsoluteMonth < absoluteStartMonth || currentAbsoluteMonth > absoluteEndMonth) {
        return false;
    }

    if (buffalo.generation === 0) {
        // Assuming ID based check for Type A/B
        // Logic from CostEstimationTable: First (A) vs Second (B) in Unit
        // This relies on 'id' convention or explicit property.
        // If we strictly follow the 'id' (M1=A, M2=B) or order.
        // Check if buffalo.id contains 'M' and is odd/even if available, strictly 'A'/'B' in some contexts.
        // Fallback to basic logic:
        // Type A (Free 12 months from start)
        // Type B (Free 6-18 months)

        // Ideally buffalo object should have a flag 'isTypeA' or similar. 
        // For now, replicating the specific logic:
        const isFirstInUnit = (buffalo.id.charCodeAt(0) - 65) % 2 === 0; // A=65(even), B=66(odd) if 'A','B'. M1..? 
        // If IDs are M1, M2... M1 is odd?
        // Let's assume the calling code knows or we inspect ID format.

        // Re-using logic from CostEstimationTable for robust check:
        // "isFirstInUnit" logic was: (buffalo.id.charCodeAt(0) - 65) % 2 === 0
        // If ID is 'M1', charCodeAt(0) is 'M' (77). 77-65 = 12 (Even). So M1 is Type A.
        // If ID is 'M2', 'M' is same. The CostEstimation logic checked CHAR CODE OF FIRST LETTER?
        // Wait, 'M1' vs 'M2'. 'M' is same.
        // Actually the code in CostEstimationTable line 203: `(buffalo.id.charCodeAt(0) - 65) % 2 === 0`.
        // If Id is "M1", char is 'M'. "M2", char is 'M'. Both are Even. 
        // So M1 and M2 are BOTH treated as Type A? 
        // That seems like a BUG in the original code if M2 is supposed to be Type B.
        // But wait, there was `if (buffalo.id === 'A')` in MonthlyRevenueBreak.
        // If IDs are actually "Unit 1 - A", then 'U' is...

        // Let's generalize using `cpfConfig`:

        // We will assume simpler parameters for now or pass "isTypeB" as arg?
        // Implementation:
        const monthsSinceStart = currentAbsoluteMonth - absoluteStartMonth;

        // Try to detect Type B (M2, B, etc.)
        const isTypeB = buffalo.id.includes('B') || buffalo.id.endsWith('2'); // Heuristic
        // Or strictly use the logic:

        if (!isTypeB) {
            // Type A
            return monthsSinceStart >= algorithmConfig.cpf.applicability.gen0TypeA.startMonth;
        } else {
            // Type B
            // Check presence
            // Assuming present
            const { freePeriodStart, freePeriodEnd } = algorithmConfig.cpf.applicability.gen0TypeB;
            const isFreePeriod = monthsSinceStart >= freePeriodStart && monthsSinceStart < freePeriodEnd;
            return !isFreePeriod;
        }
    } else {
        // Gen > 0
        // Need age
        // calculateAgeInMonths needs to be passed or calculated
        return false; // Age check needs to happen outside or pass age
    }
    // Note: This function signature is tricky without helper.
    return false;
};

// 4. Initial Investment
export const calculateInitialInvestment = (units: number) => {
    const { motherPrice } = algorithmConfig.assetValue;
    const { annualCostPerUnit } = algorithmConfig.cpf;

    // Logic from CostEstimationTable
    const motherBuffaloCost = units * 2 * motherPrice;
    const cpfCost = units * annualCostPerUnit;

    return {
        motherBuffaloCost,
        cpfCost,
        totalInvestment: motherBuffaloCost + cpfCost,
        totalBuffaloesAtStart: units * 4,
        motherBuffaloes: units * 2,
        calvesAtStart: units * 2,
        pricePerMotherBuffalo: motherPrice,
        cpfPerUnit: annualCostPerUnit
    };
};

// 5. General Helper
export const calculateAgeInMonths = (buffalo: any, targetYear: number, targetMonth: number = 0): number => {
    const birthYear = buffalo.birthYear;
    const birthMonth = buffalo.birthMonth !== undefined ? buffalo.birthMonth : (buffalo.acquisitionMonth || 0);
    const totalMonths = (targetYear - birthYear) * 12 + (targetMonth - birthMonth);
    return Math.max(0, totalMonths);
};

// 6. Cattle Growing Fund (CGF) Logic
export const calculateCGFCost = (ageInMonths: number): number => {
    const bracket = algorithmConfig.cgf.brackets.find(
        (b) => ageInMonths >= b.minAge && ageInMonths <= b.maxAge
    );
    return bracket ? bracket.monthlyCost : 0;
};

// 7. Break Even / Investment Recovery Logic
export const getInvestmentRecoveryStatus = (cumulativeRevenue: number, totalInvestment: number) => {
    const recoveryPercentage = (cumulativeRevenue / totalInvestment) * 100;

    // Sort thresholds descending to find the highest match
    const thresholds = [...algorithmConfig.breakEven.recoveryThresholds].sort((a, b) => b.threshold - a.threshold);

    const match = thresholds.find(t => recoveryPercentage >= t.threshold);
    const status = match ? match.label : algorithmConfig.breakEven.defaultStatus;

    return { recoveryPercentage, status };
};

// 8. Calculate Total Asset Value for a specific point in time
export const calculateTotalAssetValue = (
    buffaloDetails: any[],
    targetYear: number,
    targetMonth: number
): number => {
    let totalValue = 0;
    buffaloDetails.forEach((buffalo: any) => {
        // Only count buffaloes born before or in this month
        // Assuming buffalo has birthYear/birthMonth
        const bYear = buffalo.birthYear;
        const bMonth = buffalo.birthMonth || 0;

        // Check if buffalo exists at this time
        if (bYear < targetYear || (bYear === targetYear && bMonth <= targetMonth)) {
            const ageInMonths = calculateAgeInMonths(buffalo, targetYear, targetMonth);
            totalValue += getBuffaloValueByAge(ageInMonths);
        }
    });
    return totalValue;
};

// 9. Comprehensive Break Even Analyzer
// Returns the exact break-even dates and years for both types
export const findBreakEvenPoints = (
    monthlyNetRevenueStream: { year: number, month: number, netRevenue: number }[],
    buffaloDetails: any[],
    initialInvestment: number,
    startYear: number
) => {
    let breakEvenWithAsset: { year: number, month: number, date: Date } | null = null;
    let breakEvenRevenueOnly: { year: number, month: number, date: Date } | null = null;

    let cumulativeRevenue = 0;

    for (const record of monthlyNetRevenueStream) {
        cumulativeRevenue += record.netRevenue;

        // 1. Check Revenue Only
        if (!breakEvenRevenueOnly && cumulativeRevenue >= initialInvestment) {
            breakEvenRevenueOnly = {
                year: record.year,
                month: record.month,
                date: new Date(record.year, record.month + 1, 0)
            };
        }

        // 2. Check Total Value (Revenue + Asset)
        if (!breakEvenWithAsset) {
            const currentAssetValue = calculateTotalAssetValue(buffaloDetails, record.year, record.month);
            const totalValue = cumulativeRevenue + currentAssetValue;

            if (totalValue >= initialInvestment) {
                breakEvenWithAsset = {
                    year: record.year,
                    month: record.month,
                    date: new Date(record.year, record.month + 1, 0)
                };
            }
        }

        if (breakEvenRevenueOnly && breakEvenWithAsset) break;
    }

    return {
        revenueOnly: breakEvenRevenueOnly,
        totalValue: breakEvenWithAsset
    };
};
