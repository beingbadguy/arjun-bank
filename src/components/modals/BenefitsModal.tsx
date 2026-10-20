"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Award, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface IncentiveSlab {
  slab: string;
  disbursal: string;
  amt: string;
  highlight?: boolean;
}

const INCENTIVE_SLABS: IncentiveSlab[] = [
  { slab: "SLAB 1", disbursal: "30 Lacs", amt: "₹4,000" },
  { slab: "SLAB 2", disbursal: "40 Lacs", amt: "₹10,000" },
  { slab: "SLAB 3", disbursal: "50 Lacs", amt: "₹15,000" },
  { slab: "SLAB 4", disbursal: "60 Lacs", amt: "₹20,000" },
  { slab: "SLAB 5", disbursal: "70 Lacs", amt: "₹25,000" },
  { slab: "SLAB 6", disbursal: "80 Lacs", amt: "₹30,000" },
  { slab: "SLAB 7", disbursal: "90 Lacs", amt: "₹40,000" },
  { slab: "SLAB 8", disbursal: "100 Lacs", amt: "₹50,000", highlight: true },
];

export const BenefitsModal: React.FC = () => {
  const { benefitsModalOpen, setBenefitsModalOpen } = useWorkspaceStore();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!benefitsModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBenefitsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [benefitsModalOpen, setBenefitsModalOpen]);

  if (!mounted || !benefitsModalOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-start sm:items-center justify-center p-3 sm:p-4 py-6 sm:py-8 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={() => setBenefitsModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="incentive-scheme-title"
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-blue-100 relative my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Blue & White Financial Theme */}
        <div className="flex items-start justify-between pb-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs shrink-0">
              <Award size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  For Telecaller
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Variable Fees
                </span>
              </div>
              <h2
                id="incentive-scheme-title"
                className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5"
              >
                Personal Loan Incentive
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBenefitsModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} className="stroke-[2.2]" />
          </button>
        </div>

        {/* Subtitle description */}
        <div className="mt-3.5 mb-3 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span className="text-slate-500">
            Structure For Variable Fees • Monthly Disbursal Slabs
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
            <Sparkles size={13} />
            <span>8 Active Slabs</span>
          </span>
        </div>

        {/* Incentive Slab Table */}
        <div className="overflow-hidden rounded-xl border border-blue-200 shadow-xs bg-white">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3.5 sm:px-4 border-b border-blue-800">Slab</th>
                <th className="py-2.5 px-3.5 sm:px-4 border-b border-blue-800">Disbursal Target</th>
                <th className="py-2.5 px-3.5 sm:px-4 border-b border-blue-800 text-right">Incentive Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {INCENTIVE_SLABS.map((item, idx) => (
                <tr
                  key={item.slab}
                  className={`transition-colors hover:bg-blue-50/70 ${
                    item.highlight
                      ? "bg-amber-50/80 font-bold"
                      : idx % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50/60"
                  }`}
                >
                  <td className="py-2.5 px-3.5 sm:px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                        item.highlight
                          ? "bg-amber-400 text-blue-950"
                          : "bg-blue-100/80 text-blue-800"
                      }`}
                    >
                      {item.slab}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 sm:px-4 text-slate-800 font-semibold">
                    {item.disbursal}
                  </td>
                  <td className="py-2.5 px-3.5 sm:px-4 text-right">
                    <span
                      className={`font-black ${
                        item.highlight
                          ? "text-emerald-700 text-sm sm:text-base"
                          : "text-blue-700"
                      }`}
                    >
                      {item.amt}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Above Slab per lakh Highlight Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200/80 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-blue-950 font-bold">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Above Slab per lakh</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-700 font-black text-xs sm:text-sm shadow-2xs">
            Rs. 250 (for ARO)
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-[11.5px] text-slate-500 font-normal">
            Calculated on successful loan disbursal.
          </span>
          <button
            type="button"
            onClick={() => setBenefitsModalOpen(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-6 py-2 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
            id="incentive-scheme-got-it-btn"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
