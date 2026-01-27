import React, { useState } from 'react';
import { useEmi } from './context/EmiContext';
import { EmiProvider } from './context/EmiProvider';
import MainLayout from './components/layout/MainLayout';
import InputCard from './components/calculator/InputCard';
import ResultCard from './components/calculator/ResultCard';
import ChartsWidget from './components/calculator/ChartsWidget';
import HoverGradientStatCard from './components/stats/HoverGradientStatCard';
import AmortizationTable from './components/calculator/AmortizationTable';
import SimulationSummary from './components/calculator/SimulationSummary';
import AcfScreen from './components/acf/AcfScreen';
import { Percent, Wallet, PiggyBank, TrendingUp, Calculator, Sprout, LayoutGrid } from 'lucide-react';
import { clsx } from 'clsx';

const EmiDashboard = () => {
  const {
    amount,
    totalNetCash,
    totalAssetValue,
    formatCurrency
  } = useEmi();

  const totalReturn = totalNetCash + totalAssetValue;
  const roiPercentage = amount > 0 ? ((totalReturn / amount) * 100).toFixed(1) + '%' : '0.0%';

  return (
    <div className="space-y-8 lg:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Banner Card */}
      <div className="bg-[#f0f2f5] rounded-3xl p-3 lg:p-2 flex items-center space-x-6 lg:space-x-3 border border-gray-100">
        <div className="bg-primary-100 p-4 lg:p-2 rounded-2xl">
          <LayoutGrid className="w-5 h-5 lg:w-4 lg:h-4 text-primary-700" />
        </div>
        <div>
          <h2 className="text-xl lg:text-base font-bold text-gray-900">Crowd Farming Investment</h2>
          <p className="text-gray-500 text-sm lg:text-xs">Get instant loan calculations with detailed payment breakdown</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4">
        <div className="lg:col-span-4">
          <InputCard />
        </div>

        <div className="lg:col-span-3">
          <ResultCard />
        </div>

        <div className="lg:col-span-5">
          {/* Quick Stats Bento Grid */}
          <div className="bg-white rounded-3xl shadow-lg p-4 lg:p-3 h-full flex flex-col border border-gray-50">
            <div className="flex items-center space-x-2 lg:space-x-1.5 mb-4 lg:mb-3">
              <div className="p-1.5 lg:p-1 bg-teal-50 rounded-lg">
                <TrendingUp className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-teal-600" />
              </div>
              <h2 className="text-lg lg:text-sm font-semibold text-gray-900">Quick Stats</h2>
            </div>

            <div className="flex flex-col gap-3 lg:gap-2 flex-grow">
              <div className="w-full">
                <HoverGradientStatCard
                  label="Total Return"
                  value={totalReturn}
                  prefix="₹"
                  icon={Percent}
                  color="green"
                  secondaryText={roiPercentage}
                  isSecondaryBold={true}
                  isLarge={true}
                  formatCurrency={formatCurrency}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <HoverGradientStatCard
                  label="Net Cash Flow"
                  value={totalNetCash}
                  prefix="₹"
                  icon={Wallet}
                  color="blue"
                  formatCurrency={formatCurrency}
                />
                <HoverGradientStatCard
                  label="Projected Asset (0-60 Months)"
                  value={totalAssetValue}
                  prefix="₹"
                  icon="/buffalo_icon.png"
                  color="blue"
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChartsWidget />
      <AmortizationTable />
      <SimulationSummary />
    </div>
  );
};

const AppContent = ({ mode = 'emi' }: { mode?: 'emi' | 'acf' }) => {
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-5 lg:mb-3">
        <h1 className="text-2xl lg:text-xl font-bold text-gray-900 tracking-tight">
          {mode === 'emi' ? 'EMI Calculator' : 'ACF Calculator'}
        </h1>

        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-400 font-mono">v1.0.11</span>
        </div>
      </div>

      {mode === 'emi' ? <EmiDashboard /> : <AcfScreen />}
    </MainLayout>
  );
};

interface NavTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const NavTab: React.FC<NavTabProps> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={clsx(
      "px-4 py-1.5 rounded-full font-semibold text-xs transition-all duration-300",
      active
        ? "bg-white text-black shadow-lg"
        : "text-gray-400 hover:text-white"
    )}
  >
    {label}
  </button>
);

export function EmiCalculatorApp() {
  return (
    <EmiProvider>
      <AppContent mode="emi" />
    </EmiProvider>
  );
}

export function AcfCalculatorApp() {
  return (
    <EmiProvider>
      <AppContent mode="acf" />
    </EmiProvider>
  );
}

export default EmiCalculatorApp;

