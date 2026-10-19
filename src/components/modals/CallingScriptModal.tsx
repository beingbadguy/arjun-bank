"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Headphones, Info, Copy, Check } from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface ScriptCard {
  id: number;
  stepNumber: string;
  title: string;
  borderColor: string;
  bgColor: string;
  titleColor: string;
  scriptText: string;
  highlightedText?: React.ReactNode;
}

const SCRIPT_CARDS: ScriptCard[] = [
  {
    id: 1,
    stepNumber: "1",
    title: "1. GREETING & INTRODUCTION",
    borderColor: "border-[#2563EB]",
    bgColor: "bg-[#EFF6FF]",
    titleColor: "text-[#1D4ED8]",
    scriptText:
      '"Good Morning / Afternoon [Customer Name]! Main Fast Credit se [Your Name] baat kar raha/rahi hu. Kya meri baat [Customer Name] ji se ho rahi hai?"',
    highlightedText: (
      <span>
        &ldquo;Good Morning / Afternoon [Customer Name]! Main{" "}
        <strong className="font-bold text-gray-900">Fast Credit</strong> se [Your
        Name] baat kar raha/rahi hu. Kya meri baat [Customer Name] ji se ho rahi
        hai?&rdquo;
      </span>
    ),
  },
  {
    id: 2,
    stepNumber: "2",
    title: "2. UNDERSTANDING NEED",
    borderColor: "border-[#F59E0B]",
    bgColor: "bg-[#FFFBEB]",
    titleColor: "text-[#D97706]",
    scriptText:
      '"Sir/Ma\'am, humne dekha aapko Personal/Business Loan ki zarurat thi. Hum 40+ Top Banks & NBFCs ke sath associate hain aur aapko Lowest Interest Rate par loan approve karwane me help karte hain."',
    highlightedText: (
      <span>
        &ldquo;Sir/Ma&apos;am, humne dekha aapko Personal/Business Loan ki
        zarurat thi. Hum 40+ Top Banks &amp; NBFCs ke sath associate hain aur
        aapko Lowest Interest Rate par loan approve karwane me help karte
        hain.&rdquo;
      </span>
    ),
  },
  {
    id: 3,
    stepNumber: "3",
    title: "3. PITCHING OFFER",
    borderColor: "border-[#10B981]",
    bgColor: "bg-[#ECFDF5]",
    titleColor: "text-[#059669]",
    scriptText:
      '"Aapko ₹1 Lakh se ₹1 Crore tak ka unsecured loan bina kisi collateral ke mil sakta hai. Login digital Process se 30 minutes me hoga!"',
    highlightedText: (
      <span>
        &ldquo;Aapko{" "}
        <strong className="font-bold text-gray-900">₹1 Lakh se ₹1 Crore</strong>{" "}
        tak ka unsecured loan bina kisi collateral ke mil sakta hai. Login
        digital Process se 30 minutes me hoga!&rdquo;
      </span>
    ),
  },
  {
    id: 4,
    stepNumber: "4",
    title: "4. DOCUMENT COLLECTION & CLOSING",
    borderColor: "border-[#8B5CF6]",
    bgColor: "bg-[#F5F3FF]",
    titleColor: "text-[#7C3AED]",
    scriptText:
      '"Aap bas PAN Card, Aadhaar Card aur 3 Month Bank Statement WhatsApp par share kar dijiye. Hum abhi aapki file login kar dete hain."',
    highlightedText: (
      <span>
        &ldquo;Aap bas PAN Card, Aadhaar Card aur 3 Month Bank Statement WhatsApp
        par share kar dijiye. Hum abhi aapki file login kar dete hain.&rdquo;
      </span>
    ),
  },
];

export const CallingScriptModal: React.FC = () => {
  const { scriptModalOpen, setScriptModalOpen } = useWorkspaceStore();
  const [mounted, setMounted] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!scriptModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setScriptModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scriptModalOpen, setScriptModalOpen]);

  if (!mounted || !scriptModalOpen) return null;

  const handleCopySection = (id: number, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyAll = () => {
    if (navigator.clipboard) {
      const fullScript = SCRIPT_CARDS.map(
        (c) => `${c.title}\n${c.scriptText}`
      ).join("\n\n");
      navigator.clipboard.writeText(fullScript);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={() => setScriptModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="script-modal-title"
    >
      <div
        className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-7 max-w-2xl w-full shadow-2xl border border-gray-100 my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching screenshot */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="text-[#E02424] flex items-center justify-center">
              <Headphones size={22} className="stroke-[2.2]" />
            </div>
            <h2
              id="script-modal-title"
              className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight"
            >
              Standard Calling Script for Telecallers
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Copy all script steps"
            >
              {copiedAll ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700">All Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy All</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setScriptModalOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close Practice Window"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 4 Cards matching Image 2 */}
        <div className="space-y-3 sm:space-y-3.5 mb-6 max-h-[60vh] overflow-y-auto pr-0.5">
          {SCRIPT_CARDS.map((card) => {
            const isCopied = copiedId === card.id;
            return (
              <div
                key={card.id}
                className={`border-l-4 ${card.borderColor} ${card.bgColor} rounded-r-xl p-3.5 sm:p-4 relative transition-all group`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${card.titleColor}`}
                  >
                    {card.title}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySection(card.id, card.scriptText)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-white/70 text-gray-500 hover:text-gray-900 transition-all cursor-pointer text-xs flex items-center gap-1"
                    title="Copy section"
                  >
                    {isCopied ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
                <p className="text-xs sm:text-[13px] md:text-sm text-gray-800 leading-relaxed font-normal">
                  {card.highlightedText}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer Bar matching screenshot */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Info size={15} className="text-gray-400 shrink-0" />
            <span>Practice this script daily for best conversion rate.</span>
          </div>

          <button
            type="button"
            onClick={() => setScriptModalOpen(false)}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0B3A82] hover:bg-[#07295F] text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            Close Practice Window
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
