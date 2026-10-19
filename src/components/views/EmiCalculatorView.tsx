"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  ArrowUpRight,
  Info,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export const EmiCalculatorView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();

  const [loanAmount, setLoanAmount] = useState<number | string>(1000000);
  const [interestRate, setInterestRate] = useState<number | string>(10.5);
  const [tenureYears, setTenureYears] = useState<number | string>(5);
  const [processingFeePercent, setProcessingFeePercent] = useState<number | string>(1);
  const [periodType, setPeriodType] = useState<"yearly" | "monthly">("yearly");
  const [monthlyPage, setMonthlyPage] = useState<number>(1);

  // Currency formatter matching Indian format: ₹10,00,000 without space after ₹
  const formatCurrency = (val: number) => {
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  };

  const calculation = useMemo(() => {
    const P = Number(loanAmount) || 0;
    const annualRate = Number(interestRate) || 0;
    const years = Number(tenureYears) || 0;
    const feePct = Number(processingFeePercent) || 0;

    const r = annualRate / 12 / 100;
    const n = Math.round(years * 12);

    if (P <= 0 || r <= 0 || n <= 0) {
      return {
        emi: 0,
        principal: P,
        totalInterest: 0,
        processingFee: 0,
        totalPayable: P,
        yearlySchedule: [],
        monthlySchedule: [],
      };
    }

    const calculatedEmi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalRepayBeforeFee = calculatedEmi * n;
    const calculatedTotalInterest = totalRepayBeforeFee - P;
    const processingFee = Math.round((P * feePct) / 100);
    const totalPayable = Math.round(totalRepayBeforeFee + processingFee);

    let balance = P;
    const yearly = [];
    const monthly = [];

    for (let yr = 1; yr <= years; yr++) {
      let yrPrincipal = 0;
      let yrInterest = 0;

      for (let m = 1; m <= 12; m++) {
        const monthNum = (yr - 1) * 12 + m;
        if (monthNum > n) break;

        const interestM = balance * r;
        const principalM = calculatedEmi - interestM;
        yrInterest += interestM;
        yrPrincipal += principalM;
        balance -= principalM;

        monthly.push({
          period: monthNum,
          payment: Math.round(calculatedEmi),
          principal: Math.round(principalM),
          interest: Math.round(interestM),
          balance: Math.max(0, Math.round(balance)),
        });
      }

      yearly.push({
        period: yr,
        payment: Math.round(yrPrincipal + yrInterest),
        principal: Math.round(yrPrincipal),
        interest: Math.round(yrInterest),
        balance: Math.max(0, Math.round(balance)),
      });
    }

    return {
      emi: Math.round(calculatedEmi),
      principal: P,
      totalInterest: Math.round(calculatedTotalInterest),
      processingFee,
      totalPayable,
      yearlySchedule: yearly,
      monthlySchedule: monthly,
    };
  }, [loanAmount, interestRate, tenureYears, processingFeePercent]);

  const handleExportCsv = () => {
    const isYearly = periodType === "yearly";
    const data = isYearly ? calculation.yearlySchedule : calculation.monthlySchedule;
    const label = isYearly ? "Year" : "Month";

    let csvContent = `${label},Payment,Principal,Interest,Balance\n`;
    data.forEach((row) => {
      csvContent += `${row.period},${row.payment},${row.principal},${row.interest},${row.balance}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `repayment_schedule_${periodType}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Monthly pagination: 12 months at once with prev & next
  const monthsPerPage = 12;
  const totalMonthlyPages = Math.ceil(calculation.monthlySchedule.length / monthsPerPage) || 1;
  const paginatedMonthlySchedule = calculation.monthlySchedule.slice(
    (monthlyPage - 1) * monthsPerPage,
    monthlyPage * monthsPerPage
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header section */}
      <div className="mb-5 sm:mb-6">
        <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          YOUR WORKSPACE / EMI CALCULATOR
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#17241B] mb-1">
              EMI calculator.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Make the numbers work for your next decision.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-[#829283] hover:text-[#17241B] transition-colors cursor-pointer"
            onClick={() => setActiveTab("overview")}
          >
            <span>Overview</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Top Section: 2 Cards (Left Form & Right Policy Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 sm:gap-5 mb-5 items-stretch">
        {/* Left Card: Build your repayment plan */}
        <div className="bg-white rounded-2xl border border-[#E3EBE0] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calculator size={18} className="text-[#163A2C]" />
              <h2 className="text-sm sm:text-base font-bold text-[#17241B]">
                Build your repayment plan
              </h2>
            </div>
            <p className="text-xs text-[#576558] mb-4 sm:mb-5">
              A few inputs. A complete view of your loan.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMonthlyPage(1);
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 mb-5">
                <div>
                  <label className="block text-[11px] font-medium text-[#17241B] mb-1.5">
                    Loan amount (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-xs md:text-[13px] text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]/20 transition-all font-mono"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="1000000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#17241B] mb-1.5">
                    Annual interest rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    className="w-full h-10 px-3 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-xs md:text-[13px] text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]/20 transition-all font-mono"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="10.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#17241B] mb-1.5">
                    Tenure (years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-full h-10 px-3 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-xs md:text-[13px] text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]/20 transition-all font-mono"
                    value={tenureYears}
                    onChange={(e) => {
                      setTenureYears(e.target.value);
                      setMonthlyPage(1);
                    }}
                    placeholder="5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#17241B] mb-1.5">
                    Processing fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full h-10 px-3 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-xs md:text-[13px] text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]/20 transition-all font-mono"
                    value={processingFeePercent}
                    onChange={(e) => setProcessingFeePercent(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="h-9 px-4 bg-[#163A2C] hover:bg-[#1D4A38] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <span>Calculate EMI</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Card: The small print, made simple */}
        <div className="bg-[#EDF2EA] rounded-2xl border border-[#DEE7DA] p-6 flex flex-col justify-between">
          <div>
            <div className="text-[9.5px] font-bold tracking-wider text-[#6F8270] uppercase mb-2">
              THE SMALL PRINT, MADE SIMPLE
            </div>
            <h3 className="text-xl md:text-[22px] font-bold text-[#17241B] leading-snug mb-3">
              Plan beyond the monthly payment.
            </h3>
            <p className="text-xs text-[#526454] leading-relaxed">
              Interest is calculated each month on the remaining principal. As the balance decreases, more of each payment goes toward your loan.
            </p>
          </div>

          <div className="flex items-start gap-1.5 text-[11px] text-[#617463] mt-6 pt-3 border-t border-[#DEE7DA]/60">
            <Info size={13} className="shrink-0 mt-0.5 text-[#617463]" />
            <span>
              These are estimates. Actual approval, rates and fees depend on the lender&apos;s policy.
            </span>
          </div>
        </div>
      </div>

      {/* Middle Full-Width Banner: Monthly EMI and Breakdown */}
      <div className="bg-[#E7EFE4] rounded-2xl border border-[#D7E3D3] p-5 sm:p-6 md:p-7 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 shadow-2xs">
        <div className="shrink-0">
          <div className="text-[10px] font-bold tracking-wider text-[#697A6A] uppercase mb-1">
            YOUR MONTHLY EMI
          </div>
          <div className="text-2xl sm:text-3xl md:text-[36px] font-bold tracking-tight text-[#17241B] font-sans leading-none">
            {formatCurrency(calculation.emi)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left">
          <div>
            <div className="text-[11px] sm:text-xs text-[#6F8271]">Principal</div>
            <div className="text-xs sm:text-sm md:text-base font-bold text-[#17241B] mt-0.5 font-sans">
              {formatCurrency(calculation.principal)}
            </div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs text-[#6F8271]">Total interest</div>
            <div className="text-xs sm:text-sm md:text-base font-bold text-[#17241B] mt-0.5 font-sans">
              {formatCurrency(calculation.totalInterest)}
            </div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs text-[#6F8271]">Processing fee</div>
            <div className="text-xs sm:text-sm md:text-base font-bold text-[#17241B] mt-0.5 font-sans">
              {formatCurrency(calculation.processingFee)}
            </div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs text-[#6F8271]">Total payable</div>
            <div className="text-xs sm:text-sm md:text-base font-bold text-[#17241B] mt-0.5 font-sans">
              {formatCurrency(calculation.totalPayable)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Amortization Card */}
      <div className="bg-white rounded-2xl border border-[#E3EBE0] p-4 sm:p-6 shadow-2xs mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-bold text-[#17241B]">
            Repayment, step by step.
          </h3>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E3EBE0] bg-white hover:bg-[#F8FAF6] text-xs font-semibold text-[#17241B] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={13} />
            <span className="hidden xs:inline">Export CSV</span>
            <span className="xs:hidden">CSV</span>
          </button>
        </div>

        {/* Toggle Pills: Yearly / Monthly */}
        <div className="flex items-center gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => {
              setPeriodType("yearly");
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              periodType === "yearly"
                ? "bg-[#E5ECE2] text-[#163A2C]"
                : "text-[#576558] hover:text-[#17241B] hover:bg-[#F4F6F1]"
            }`}
          >
            Yearly
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriodType("monthly");
              setMonthlyPage(1);
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              periodType === "monthly"
                ? "bg-[#E5ECE2] text-[#163A2C]"
                : "text-[#576558] hover:text-[#17241B] hover:bg-[#F4F6F1]"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Amortization Table - Horizontally scrollable on mobile */}
        <div className="border border-[#E7EFE4] rounded-xl overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#EFF4ED] border-b border-[#E7EFE4] text-[10px] font-semibold text-[#6E8070] uppercase tracking-wider">
                <th className="py-2.5 px-3.5 font-semibold">{periodType === "yearly" ? "YEAR" : "MONTH"}</th>
                <th className="py-2.5 px-3.5 font-semibold">PAYMENT</th>
                <th className="py-2.5 px-3.5 font-semibold">PRINCIPAL</th>
                <th className="py-2.5 px-3.5 font-semibold">INTEREST</th>
                <th className="py-2.5 px-3.5 font-semibold">BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {(periodType === "yearly" ? calculation.yearlySchedule : paginatedMonthlySchedule).map((row) => (
                <tr
                  key={row.period}
                  className="border-b border-[#EFF4ED] last:border-b-0 hover:bg-[#FBFDFB] transition-colors text-xs font-medium text-[#17241B]"
                >
                  <td className="py-2.5 px-3.5 text-[#17241B] font-mono">{row.period}</td>
                  <td className="py-2.5 px-3.5 font-mono">{formatCurrency(row.payment)}</td>
                  <td className="py-2.5 px-3.5 font-mono">{formatCurrency(row.principal)}</td>
                  <td className="py-2.5 px-3.5 font-mono">{formatCurrency(row.interest)}</td>
                  <td className="py-2.5 px-3.5 font-mono">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Monthly Pagination Bar: 12 months at once with prev & next */}
          {periodType === "monthly" && totalMonthlyPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-[#E7EFE4] text-xs bg-[#FAFBF9]">
              <div className="text-[11.5px] text-[#576558]">
                Showing payments <span className="font-semibold text-[#17241B]">{(monthlyPage - 1) * monthsPerPage + 1}</span> to{" "}
                <span className="font-semibold text-[#17241B]">{Math.min(monthlyPage * monthsPerPage, calculation.monthlySchedule.length)}</span> of{" "}
                <span className="font-semibold text-[#17241B]">{calculation.monthlySchedule.length}</span> months
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={monthlyPage <= 1}
                  onClick={() => setMonthlyPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                <div className="px-3 py-1 bg-white border border-[#E3EBE0] rounded-lg text-xs font-mono text-[#576558] shadow-2xs">
                  Page <strong className="text-[#17241B]">{monthlyPage}</strong> / {totalMonthlyPages}
                </div>

                <button
                  type="button"
                  disabled={monthlyPage >= totalMonthlyPages}
                  onClick={() => setMonthlyPage((p) => Math.min(totalMonthlyPages, p + 1))}
                  className="h-8 px-2.5 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
