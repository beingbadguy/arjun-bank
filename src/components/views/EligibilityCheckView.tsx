"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  ArrowUpRight,
  Info,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface EmiFactorOption {
  id: string;
  label: string;
  tenureYears: number;
  emiPerLakh: number;
}

const EMI_FACTORS: EmiFactorOption[] = [
  { id: "5yr", label: "5 years - ₹2,300 per lakh", tenureYears: 5, emiPerLakh: 2300 },
  { id: "6yr", label: "6 years - ₹1,950 per lakh", tenureYears: 6, emiPerLakh: 1950 },
  { id: "7yr", label: "7 years - ₹1,820 per lakh", tenureYears: 7, emiPerLakh: 1820 },
  { id: "4yr", label: "4 years - ₹2,630 per lakh", tenureYears: 4, emiPerLakh: 2630 },
  { id: "3yr", label: "3 years - ₹3,320 per lakh", tenureYears: 3, emiPerLakh: 3320 },
];

export const EligibilityCheckView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();

  const [netSalary, setNetSalary] = useState<number | string>(75000);
  const [foirPercent, setFoirPercent] = useState<number | string>(50);
  const [existingEmi, setExistingEmi] = useState<number | string>(10000);
  const [selectedFactorId, setSelectedFactorId] = useState<string>("5yr");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  const selectedFactor = useMemo(() => {
    return EMI_FACTORS.find((f) => f.id === selectedFactorId) || EMI_FACTORS[0];
  }, [selectedFactorId]);

  // Eligibility Calculation Logic (FOIR + EMI per lakh)
  const calculation = useMemo(() => {
    const salary = Number(netSalary) || 0;
    const foir = Number(foirPercent) || 0;
    const existing = Number(existingEmi) || 0;

    const maxAllowableEmi = (salary * foir) / 100;
    const disposableEmi = Math.max(0, maxAllowableEmi - existing);

    const eligibleLoan =
      selectedFactor.emiPerLakh > 0
        ? Math.round((disposableEmi / selectedFactor.emiPerLakh) * 100000)
        : 0;

    const currentObligationRatio =
      salary > 0 ? Math.round((existing / salary) * 100) : 0;

    return {
      maxAllowableEmi: Math.round(maxAllowableEmi),
      disposableEmi: Math.round(disposableEmi),
      eligibleLoan,
      currentObligationRatio,
    };
  }, [netSalary, foirPercent, existingEmi, selectedFactor]);

  const handleCheckEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    setHasCalculated(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Top Breadcrumb & Title */}
      <div className="mb-5 sm:mb-6">
        <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          YOUR WORKSPACE / ELIGIBILITY CHECK
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-[27px] font-semibold tracking-tight text-[#17241B] mb-1">
              Eligibility check.
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

      {/* Main 2-Column Grid Matching Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 sm:gap-6 mb-6 sm:mb-8 items-start">
        {/* Left Column: Estimate Your Loan Eligibility */}
        <div className="bg-white rounded-2xl border border-[#E3EBE0] p-5 sm:p-6 md:p-7 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[#163A2C]">
              <FileText size={18} className="text-[#163A2C]" />
            </div>
            <h2 className="text-sm sm:text-[15.5px] font-semibold text-[#17241B]">
              Estimate your loan eligibility
            </h2>
          </div>
          <p className="text-xs text-[#576558] mb-4 sm:mb-5">
            Calculate available EMI capacity using your monthly income.
          </p>

          <form onSubmit={handleCheckEligibility}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 mb-5">
              {/* Field 1: Monthly net salary */}
              <div>
                <label className="block text-[11.5px] font-medium text-[#17241B] mb-1.5">
                  Monthly net salary (₹)
                </label>
                <input
                  type="number"
                  className="w-full h-10 px-3 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-xs md:text-[13px] text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]/20 transition-all font-mono"
                  value={netSalary}
                  onChange={(e) => setNetSalary(e.target.value)}
                  placeholder="75000"
                  required
                />
              </div>

              {/* Field 2: FOIR (%) */}
              <div>
                <label className="block text-[11.5px] font-medium text-[#17241B] mb-1.5">
                  FOIR (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="80"
                  className="w-full h-10 px-3 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-xs md:text-[13px] text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]/20 transition-all font-mono"
                  value={foirPercent}
                  onChange={(e) => setFoirPercent(e.target.value)}
                  placeholder="50"
                  required
                />
              </div>

              {/* Field 3: Existing monthly EMIs */}
              <div>
                <label className="block text-[11.5px] font-medium text-[#17241B] mb-1.5">
                  Existing monthly EMIs (₹)
                </label>
                <input
                  type="number"
                  className="w-full h-10 px-3 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-xs md:text-[13px] text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]/20 transition-all font-mono"
                  value={existingEmi}
                  onChange={(e) => setExistingEmi(e.target.value)}
                  placeholder="10000"
                />
              </div>

              {/* Field 4: Custom Tenure / EMI factor Dropdown */}
              <div className="relative">
                <label className="block text-[11.5px] font-medium text-[#17241B] mb-1.5">
                  Tenure / EMI factor
                </label>

                {/* Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full h-10 px-3 border rounded-lg bg-white text-xs md:text-[13px] text-[#17241B] flex items-center justify-between text-left transition-all cursor-pointer ${
                    isDropdownOpen
                      ? "border-[#163A2C] ring-1 ring-[#163A2C]/20"
                      : "border-[#E3EBE0] hover:border-[#CAD8C7]"
                  }`}
                >
                  <span className="truncate">{selectedFactor.label}</span>
                  <ChevronDown
                    size={15}
                    className={`text-[#829283] transition-transform duration-200 shrink-0 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu matching screenshot */}
                {isDropdownOpen && (
                  <div className="absolute top-[105%] left-0 right-0 z-30 bg-white border border-[#CAD8C7] rounded-lg shadow-lg overflow-hidden py-1 animate-fade-in">
                    {EMI_FACTORS.map((factor) => {
                      const isSelected = factor.id === selectedFactorId;
                      return (
                        <button
                          key={factor.id}
                          type="button"
                          onClick={() => {
                            setSelectedFactorId(factor.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#185ADB] text-white font-medium"
                              : "text-[#17241B] hover:bg-[#F2F6F0]"
                          }`}
                        >
                          <span>{factor.label}</span>
                          {isSelected && <CheckCircle2 size={13} className="text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="h-9 px-4 bg-[#163A2C] hover:bg-[#1D4A38] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <span>Check eligibility</span>
                <ArrowUpRight size={13} />
              </button>

              {hasCalculated && (
                <span className="text-[11.5px] text-[#196D29] font-medium flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 size={12} />
                  <span>Calculated with {selectedFactor.label.split(" - ")[0]} policy</span>
                </span>
              )}
            </div>
          </form>

          {/* Results Summary Box */}
          <div className="mt-6 pt-5 border-t border-[#EEF3EC]">
            <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
              ESTIMATED LOAN CAPACITY
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3.5">
              <span className="text-2xl md:text-[28px] font-bold font-mono text-[#163A2C]">
                ₹ {calculation.eligibleLoan.toLocaleString("en-IN")}
              </span>
              <span className="text-[11.5px] text-[#576558] font-medium">
                (Approx. {(calculation.eligibleLoan / 100000).toFixed(2)} Lakhs)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-[#FAFBF9] border border-[#E7EFE4] rounded-lg">
                <div className="text-[10px] font-medium text-[#829283] uppercase">
                  Disposable EMI
                </div>
                <div className="text-sm font-bold font-mono text-[#163A2C] mt-0.5">
                  ₹ {calculation.disposableEmi.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-[#576558] mt-0.5">Available for new loan</div>
              </div>

              <div className="p-2.5 bg-[#FAFBF9] border border-[#E7EFE4] rounded-lg">
                <div className="text-[10px] font-medium text-[#829283] uppercase">
                  Max Permitted EMI
                </div>
                <div className="text-sm font-bold font-mono text-[#163A2C] mt-0.5">
                  ₹ {calculation.maxAllowableEmi.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-[#576558] mt-0.5">{foirPercent}% of Net Salary</div>
              </div>

              <div className="p-2.5 bg-[#FAFBF9] border border-[#E7EFE4] rounded-lg">
                <div className="text-[10px] font-medium text-[#829283] uppercase">
                  Current FOIR Burden
                </div>
                <div className="text-sm font-bold font-mono text-[#163A2C] mt-0.5">
                  {calculation.currentObligationRatio}%
                </div>
                <div className="text-[10px] text-[#576558] mt-0.5">Existing EMIs share</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: "THE SMALL PRINT, MADE SIMPLE" Card */}
        <div className="bg-[#EBF3E8] border border-[#DCE6D8] rounded-2xl p-6 md:p-7 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#728574] uppercase mb-2">
              THE SMALL PRINT, MADE SIMPLE
            </div>

            <h3 className="text-lg md:text-[21px] font-semibold tracking-tight text-[#17241B] mb-2 leading-snug">
              Room for your next step.
            </h3>

            <p className="text-xs text-[#4E5E50] leading-relaxed mb-6">
              FOIR is the share of your income available for all monthly debt payments. Existing EMIs are deducted before estimating a new loan.
            </p>
          </div>

          <div className="pt-3.5 border-t border-[#D5E1D2] flex items-start gap-2 text-[11px] text-[#5D6F5F] leading-snug">
            <Info size={14} className="shrink-0 mt-0.5 text-[#5D6F5F]" />
            <span>
              These are estimates. Actual approval, rates and fees depend on the lender&apos;s policy.
            </span>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-[#ECEFE9] text-[11px] text-[#829283]">
        <div className="flex items-center gap-1.5 font-medium text-[#576558]">
          <span className="w-4 h-4 rounded-sm bg-[#163A2C] text-[#DCE8D7] flex items-center justify-center font-bold text-[9px] font-mono">
            ag.
          </span>
          <span>
            Arjun Grewal <span className="opacity-50 mx-1">/</span> Loan Operations
          </span>
        </div>
        <div>Made for a more considered workflow.</div>
      </footer>
    </div>
  );
};
