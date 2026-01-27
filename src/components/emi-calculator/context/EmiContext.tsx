import React, { createContext, useContext } from 'react';

export interface EmiRow {
    month: number;
    emi: number;
    interest: number;
    principal: number;
    balance: number;
    revenue: number;
    cpf: number;
    cgf: number;
    emiFromRevenue: number;
    emiFromLoanPool: number;
    cpfFromRevenue: number;
    cpfFromLoanPool: number;
    cgfFromRevenue: number;
    cgfFromLoanPool: number;
    loanPoolBalance: number;
    profit: number;
    loss: number;
    totalPayment: number;
    debitFromBalance: number;
    netCash: number;
}

export interface YearlyRow {
    month: number;
    emi: number;
    revenue: number;
    cpf: number;
    cgf: number;
    profit: number;
    loss: number;
    principal: number;
    interest: number;
    balance: number;
    loanPoolBalance: number;
    totalPayment: number;
    debitFromBalance: number;
    netCash: number;
}

export interface AcfRow {
    month: number;
    installment: number;
    cumulative: number;
}

export interface EmiContextType {
    amount: number;
    setAmount: (val: number) => void;
    rate: number;
    setRate: (val: number) => void;
    months: number;
    setMonths: (val: number) => void;
    units: number;
    setUnits: (val: number) => void;
    cpfEnabled: boolean;
    setCpfEnabled: (val: boolean) => void;
    cgfEnabled: boolean;
    setCgfEnabled: (val: boolean) => void;
    schedule: EmiRow[];
    yearlySchedule: YearlyRow[];
    emi: number;
    totalPayment: number;
    totalInterest: number;
    totalRevenue: number;
    totalCpf: number;
    totalCgf: number;
    totalProfit: number;
    totalLoss: number;
    totalNetCash: number;
    totalAssetValue: number;
    // Long Term (61-120 Months)
    totalRevenueLongTerm: number;
    totalCpfLongTerm: number;
    totalCgfLongTerm: number;
    totalAssetValueLongTerm: number;
    totalNetCashLongTerm: number;
    totalAssetValue120: number;
    simulateHerd: (tenure: number, unitCount: number) => number[];
    calculateAssetValueFromSimulation: (ages: number[], units: number) => number;
    calculateProjectedAssetValue: (targetYearIndex: number, unitCount: number) => { totalAssetValue: number, totalBuffaloes: number };
    acfUnits: number;
    setAcfUnits: (val: number) => void;
    acfTenureMonths: number;
    setAcfTenureMonths: (val: number) => void;
    acfProjectionYear: number;
    setAcfProjectionYear: (val: number) => void;
    acfRevenueProjectionYear: number;
    setAcfRevenueProjectionYear: (val: number) => void;
    acfMonthlyInstallment: number;
    acfTotalInvestment: number;
    acfTotalBenefit: number;
    acfCpfBenefit: number;
    acfSchedule: AcfRow[];
    formatCurrency: (val: number) => string;
}

export const EmiContext = createContext<EmiContextType | undefined>(undefined);

export const useEmi = () => {
    const context = useContext(EmiContext);
    if (!context) {
        throw new Error('useEmi must be used within an EmiProvider');
    }
    return context;
};
