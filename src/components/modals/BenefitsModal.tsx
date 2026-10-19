"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

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
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={() => setBenefitsModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="incentive-scheme-title"
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <h2
            id="incentive-scheme-title"
            className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight"
          >
            Incentive Scheme
          </h2>
          <button
            type="button"
            onClick={() => setBenefitsModalOpen(false)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={19} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-2 text-[#334155] text-[14.5px] sm:text-[15px] leading-relaxed font-normal">
          <p>Tier 1: 5-10 Disbursals = 2% Bonus</p>
          <p>Tier 2: 10-20 Disbursals = 5% Bonus + Laptop Allowance</p>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setBenefitsModalOpen(false)}
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold px-6 py-2 rounded-2xl shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
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
