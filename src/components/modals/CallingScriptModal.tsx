"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Headphones,
  Info,
  Copy,
  Check,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { COMPANY_NAME } from "@/config/branding";

interface ScriptCard {
  id: number;
  stepNumber: string;
  badge: string;
  title: string;
  stageGoal: string;
  scriptText: string;
  highlightedText: React.ReactNode;
  coachingTip: string;
}

export const CallingScriptModal: React.FC = () => {
  const { scriptModalOpen, setScriptModalOpen } = useWorkspaceStore();
  const [mounted, setMounted] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [activeStepFilter, setActiveStepFilter] = useState<number | "all">("all");

  const SCRIPT_CARDS: ScriptCard[] = [
    {
      id: 1,
      stepNumber: "01",
      badge: "STEP 01",
      title: "Greeting & Introduction",
      stageGoal: "Identity Confirmation & Trust Hook",
      scriptText: `"Good Morning / Afternoon [Customer Name]! Main ${COMPANY_NAME} se [Your Name] baat kar raha/rahi hu. Kya meri baat [Customer Name] ji se ho rahi hai?"`,
      highlightedText: (
        <span>
          &ldquo;Good Morning / Afternoon{" "}
          <span className="font-bold text-[#0B3A82] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
            [Customer Name]
          </span>
          ! Main <strong className="font-extrabold text-[#0B3A82]">{COMPANY_NAME}</strong> se{" "}
          <span className="font-bold text-[#0B3A82] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
            [Your Name]
          </span>{" "}
          baat kar raha/rahi hu. Kya meri baat{" "}
          <span className="font-bold text-slate-900">[Customer Name]</span> ji se ho
          rahi hai?&rdquo;
        </span>
      ),
      coachingTip:
        "Speak with polite energy and confidence. Pronounce the customer's name with respect before pitching.",
    },
    {
      id: 2,
      stepNumber: "02",
      badge: "STEP 02",
      title: "Understanding Need & Requirement",
      stageGoal: "Problem Discovery & Association Credibility",
      scriptText:
        '"Sir/Ma\'am, humne dekha aapko Personal/Business Loan ki zarurat thi. Hum 40+ Top Banks & NBFCs ke sath associate hain aur aapko Lowest Interest Rate par loan approve karwane me help karte hain."',
      highlightedText: (
        <span>
          &ldquo;Sir/Ma&apos;am, humne dekha aapko{" "}
          <strong className="font-bold text-slate-900">Personal / Business Loan</strong> ki
          zarurat thi. Hum{" "}
          <strong className="font-extrabold text-[#0B3A82] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
            40+ Top Banks &amp; NBFCs
          </strong>{" "}
          ke sath associate hain aur aapko{" "}
          <strong className="font-extrabold text-[#0B3A82]">Lowest Interest Rate</strong> par
          loan approve karwane me assist karte hain.&rdquo;
        </span>
      ),
      coachingTip:
        "Listen actively. Let the borrower express whether they need business expansion, personal funding, or debt consolidation.",
    },
    {
      id: 3,
      stepNumber: "03",
      badge: "STEP 03",
      title: "Pitching Value Offer & Benefits",
      stageGoal: "Fast Digital Processing & Zero Collateral",
      scriptText:
        '"Aapko ₹1 Lakh se ₹1 Crore tak ka unsecured loan bina kisi collateral ke mil sakta hai. Login digital Process se 30 minutes me hoga!"',
      highlightedText: (
        <span>
          &ldquo;Aapko{" "}
          <strong className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ₹1 Lakh se ₹1 Crore
          </strong>{" "}
          tak ka unsecured loan bina kisi collateral (guarantee) ke mil sakta hai. Login{" "}
          <strong className="font-bold text-[#0B3A82]">100% Digital Process</strong> se{" "}
          <strong className="font-bold text-slate-900">30 minutes me complete</strong> hoga!&rdquo;
        </span>
      ),
      coachingTip:
        "Emphasize zero paperwork hassle and no branch visits required. Highlight instant digital underwriting.",
    },
    {
      id: 4,
      stepNumber: "04",
      badge: "STEP 04",
      title: "Document Collection & Immediate Closing",
      stageGoal: "WhatsApp Document Handover & File Login",
      scriptText:
        '"Aap bas PAN Card, Aadhaar Card aur 3 Month Bank Statement WhatsApp par share kar dijiye. Hum abhi aapki file login kar dete hain."',
      highlightedText: (
        <span>
          &ldquo;Aap bas{" "}
          <strong className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
            PAN Card, Aadhaar Card
          </strong>{" "}
          aur{" "}
          <strong className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
            3 Month Bank Statement
          </strong>{" "}
          WhatsApp par share kar dijiye. Hum abhi aapki{" "}
          <strong className="font-extrabold text-[#0B3A82]">file direct bank portal par login</strong>{" "}
          kar dete hain.&rdquo;
        </span>
      ),
      coachingTip:
        "Strike while the iron is hot! Ask the borrower to send the 3 documents immediately on WhatsApp while still on the line.",
    },
  ];

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
        (c) => `${c.title.toUpperCase()}\n${c.scriptText}`
      ).join("\n\n---\n\n");
      navigator.clipboard.writeText(fullScript);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const visibleCards =
    activeStepFilter === "all"
      ? SCRIPT_CARDS
      : SCRIPT_CARDS.filter((c) => c.id === activeStepFilter);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-start sm:items-center justify-center p-3 sm:p-4 md:p-6 py-6 sm:py-8 bg-slate-900/65 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={() => setScriptModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="script-modal-title"
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-auto animate-scale-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Blue Financial Accent Line */}
        <div className="h-2 w-full bg-gradient-to-r from-[#0B3A82] via-[#2563EB] to-[#60A5FA]" />

        <div className="p-5 sm:p-7 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-[#0B3A82] shadow-xs">
                <Headphones size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B3A82] text-[10.5px] font-bold uppercase tracking-wider mb-1 border border-blue-100">
                  <Sparkles size={11} className="text-[#2563EB]" />
                  <span>Executive Conversion Playbook</span>
                </div>
                <h2
                  id="script-modal-title"
                  className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight"
                >
                  Telecaller Calling Script
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#0B3A82] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="Copy all script steps"
              >
                {copiedAll ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-700">Full Script Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy All Steps</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScriptModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close Practice Window"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Step Filter Navigation Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveStepFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeStepFilter === "all"
                    ? "bg-[#0B3A82] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All 4 Steps
              </button>

              {SCRIPT_CARDS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveStepFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeStepFilter === c.id
                      ? "bg-[#0B3A82] text-white shadow-xs"
                      : "bg-blue-50/60 text-[#0B3A82] border border-blue-100 hover:bg-blue-100/60"
                  }`}
                >
                  {c.badge}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyAll}
              className="sm:hidden inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-[#0B3A82] text-[11px] font-bold shrink-0"
            >
              {copiedAll ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedAll ? "Copied" : "Copy All"}</span>
            </button>
          </div>

          {/* Script Cards List */}
          <div className="space-y-4 mb-6 max-h-[58vh] overflow-y-auto pr-1">
            {visibleCards.map((card) => {
              const isCopied = copiedId === card.id;
              return (
                <div
                  key={card.id}
                  className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/40 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all relative group"
                >
                  {/* Step Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="w-7 h-7 rounded-lg bg-[#0B3A82] text-white font-mono font-black text-xs flex items-center justify-center shadow-2xs">
                        {card.stepNumber}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        {card.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0B3A82] border border-blue-100 text-[10px] font-bold">
                        {card.stageGoal}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopySection(card.id, card.scriptText)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50 text-slate-600 hover:text-[#0B3A82] text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer shrink-0"
                      title="Copy this dialog"
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Step</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Speech Bubble / Script Dialog */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-blue-100/90 shadow-2xs mb-3 text-slate-800 text-xs sm:text-[13.5px] leading-relaxed font-normal">
                    {card.highlightedText}
                  </div>

                  {/* Pro Coaching Cue */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/70 text-[#0B3A82] text-[11px] leading-snug font-medium border border-blue-100/80">
                    <Lightbulb size={13} className="text-amber-500 shrink-0" />
                    <span>
                      <strong className="font-bold">Telecaller Cue:</strong> {card.coachingTip}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info size={15} className="text-[#0B3A82] shrink-0" />
              <span>
                Practice this standard flow daily for maximum lead-to-login conversion.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setScriptModalOpen(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0B3A82] hover:bg-[#07295F] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              Close Playbook Window
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
