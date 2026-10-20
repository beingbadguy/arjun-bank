"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Headphones,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import {
  PROCESS_MANAGER_NAME,
  PROCESS_MANAGER_PHONE,
  COMPANY_NAME,
} from "@/config/branding";

export const SupportDeskModal: React.FC = () => {
  const { supportModalOpen, setSupportModalOpen } = useWorkspaceStore();
  const [mounted, setMounted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!supportModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSupportModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [supportModalOpen, setSupportModalOpen]);

  if (!mounted || !supportModalOpen) return null;

  const rawPhone = PROCESS_MANAGER_PHONE.replace(/\s+/g, "");

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-start sm:items-center justify-center p-3 sm:p-4 py-6 sm:py-8 bg-slate-900/65 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={() => setSupportModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-desk-title"
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 relative my-auto animate-scale-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-[#0B3A82] via-[#2563EB] to-[#10B981]" />

        <div className="p-5 sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-[#0B3A82] shadow-xs">
                <Headphones size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[#0B3A82] text-[10.5px] font-bold uppercase tracking-wider mb-1 border border-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Operations Concierge</span>
                </div>
                <h2
                  id="support-desk-title"
                  className="text-lg sm:text-xl font-black text-slate-900 tracking-tight"
                >
                  Process Support Desk
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSupportModalOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close Support Desk"
            >
              <X size={18} />
            </button>
          </div>

          {/* Process Manager Officer Hero Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border border-slate-200/90 shadow-2xs mb-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0B3A82] to-[#2563EB] text-white flex items-center justify-center font-black text-base tracking-wider shadow-xs">
                    AG
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs"
                    title="Active Now"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight truncate">
                      {PROCESS_MANAGER_NAME}
                    </h3>
                    <UserCheck size={14} className="text-[#2563EB] shrink-0" />
                  </div>
                  <div className="text-[11.5px] font-semibold text-slate-500 truncate">
                    Senior Process &amp; Underwriting Manager
                  </div>
                </div>
              </div>

              <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold">
                Online
              </span>
            </div>

            {/* Contact & Hours Info Grid */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              {/* Phone Row */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#0B3A82] shrink-0" />
                  <span className="text-slate-500 font-medium">Direct Line:</span>
                  <a
                    href={`tel:${rawPhone}`}
                    className="font-mono font-bold text-slate-900 hover:text-[#0B3A82] hover:underline transition-colors"
                  >
                    {PROCESS_MANAGER_PHONE}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy direct phone number"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Working Hours Row */}
              <div className="flex items-center justify-between px-2.5 py-1.5 text-slate-600 text-[11.5px]">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  <span>Support Hours:</span>
                  <strong className="text-slate-800">9:30 AM – 6:30 PM (IST)</strong>
                </div>
                <span className="text-[10.5px] font-medium text-slate-400">
                  Mon – Sat
                </span>
              </div>
            </div>
          </div>

          {/* Primary Quick Actions (Call & WhatsApp) */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <a
              href={`tel:${rawPhone}`}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0B3A82] to-[#1E40AF] hover:from-[#082C64] hover:to-[#172554] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Phone size={14} className="stroke-[2.5] text-white" />
              <span className="text-white">Call Directly</span>
            </a>

            <a
              href={`https://wa.me/${rawPhone.replace("+", "")}?text=Hi%20Arjun,%20I%20need%20urgent%20support%20with%20Loan%20Operations%20at%20${encodeURIComponent(
                COMPANY_NAME
              )}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <MessageSquare size={14} className="stroke-[2.5] text-white" />
              <span className="text-white">WhatsApp Chat</span>
            </a>
          </div>

          {/* Assistance Guidance Notice */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100/80 text-[11.5px] text-slate-600 leading-relaxed mb-5 flex items-start gap-2">
            <ShieldCheck size={15} className="text-[#0B3A82] shrink-0 mt-0.5" />
            <span>
              For rapid file login escalations or policy deviations, please share the{" "}
              <strong className="text-slate-800">Customer Name</strong> and{" "}
              <strong className="text-slate-800">Application Number</strong> on WhatsApp.
            </span>
          </div>

          {/* Refined Footer Button */}
          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSupportModalOpen(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Close Support Desk
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
