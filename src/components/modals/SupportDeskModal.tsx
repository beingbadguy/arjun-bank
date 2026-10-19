"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Phone, MessageSquare, Copy, Check } from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

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

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText("+919968584137");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={() => setSupportModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-desk-title"
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            id="support-desk-title"
            className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight"
          >
            Support Desk
          </h2>
          <button
            type="button"
            onClick={() => setSupportModalOpen(false)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close Support Desk"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content details exactly as styled in Support Desk */}
        <div className="space-y-1.5 text-gray-600 text-[15px] sm:text-base leading-relaxed mb-6">
          <div className="text-gray-500 font-medium">
            Process Manager :  Arjun Grewal
          </div>


          <div className=" flex flex-wrap items-center gap-2">
            <span className="text-gray-600 font-normal">Contact:</span>
            <a
              href="tel:+919968584137"
              className="text-gray-900 font-bold hover:text-[#163A2C] transition-colors"
            >
              +91 99685 84137
            </a>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              title="Copy phone number"
            >
              {copied ? (
                <Check size={14} className="text-green-600" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          <div className="text-gray-600 font-normal">
            Timing: 9:30 AM - 6:30 PM
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2 mb-6">
          <a
            href="tel:+919968584137"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
          >
            <Phone size={13} className="text-[#163A2C]" />
            <span>Call Now</span>
          </a>
          <a
            href="https://wa.me/919968584137?text=Hi%20Arjun,%20I%20need%20support%20with%20Loan%20Operations."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
          >
            <MessageSquare size={13} className="text-emerald-600" />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Footer with Red 'Got it!' button matching screenshot */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => setSupportModalOpen(false)}
            className="px-6 py-2 bg-[#E01E2E] hover:bg-[#C91423] text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
