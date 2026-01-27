import React from 'react';
import { useEmi } from '../../context/EmiContext';
import { Wallet, Calendar, PiggyBank, Briefcase } from 'lucide-react';
import { clsx } from 'clsx';
import HoverGradientStatCard from '../stats/HoverGradientStatCard';
import AssetProjectionCard from './AssetProjectionCard';
import RevenueProjectionCard from './RevenueProjectionCard';

const AcfStatsGrid = () => {
    const {
        acfTotalInvestment,
        acfTenureMonths,
        acfUnits,
        acfTotalBenefit,
        acfCpfBenefit,
        calculateProjectedAssetValue: calculateProjection, // Destructure with alias if needed or direct
        acfProjectionYear,
        setAcfProjectionYear,
        acfRevenueProjectionYear,
        setAcfRevenueProjectionYear,
        formatCurrency
    } = useEmi();

    // Projection Logic for Card
    // Use the new precise calculation matching Buffalo Vis
    const { totalAssetValue: projectedAssetValue, totalBuffaloes: projectedBuffaloCount } =
        calculateProjection ? calculateProjection(acfProjectionYear, acfUnits) : { totalAssetValue: 0, totalBuffaloes: 0 };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            <HoverGradientStatCard
                label="Total Investment"
                value={acfTotalInvestment}
                prefix="₹"
                icon={Wallet}
                color="blue" // Indigo-ish in Flutter
                secondaryText={`${acfTenureMonths} months`}
                formatCurrency={formatCurrency}
            />

            <AssetProjectionCard
                value={projectedAssetValue}
                year={acfProjectionYear}
                onYearChange={setAcfProjectionYear}
                buffaloCount={projectedBuffaloCount}
                formatCurrency={formatCurrency}
            />

            <RevenueProjectionCard
                yearIndex={acfRevenueProjectionYear}
                onYearChange={setAcfRevenueProjectionYear}
                units={acfUnits}
                formatCurrency={formatCurrency}
            />

            <HoverGradientStatCard
                label="Total Savings"
                value={acfTotalBenefit}
                prefix="₹"
                icon="/buffalo_icon.png"
                color="green" // Emerald
                secondaryText={`₹${formatCurrency(acfTotalBenefit - acfCpfBenefit)} Interest + ₹${formatCurrency(acfCpfBenefit)} Free CPF`}
                formatCurrency={formatCurrency}
            />

            <HoverGradientStatCard
                label="Period"
                value={acfTenureMonths}
                prefix=""
                icon={Calendar}
                color="blue" // Amber in Flutter actually
                secondaryText="Months Tenure"
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default AcfStatsGrid;
