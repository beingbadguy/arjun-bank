"use client";

import React from "react";
import { ChevronRight, Menu, Headphones, PhoneCall, Volume2, VolumeX } from "lucide-react";
import { useWorkspaceStore, WorkspaceTab } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { stopSpeaking, playChime } from "@/lib/audioAssist";

const tabTitleMap: Record<WorkspaceTab, string> = {
  overview: "Overview",
  "company-search": "Company search",
  "pin-search": "PIN code search",
  "cibil-relook": "CIBIL & case relook",
  "emi-calc": "EMI calculator",
  eligibility: "Eligibility check",
  "pdf-tools": "PDF tools",
  "data-update": "Data update",
  "admin-access": "Admin access",
  "cases-vault": "Cases Vault (Locked)",
  training: "Training modules",
};

export const Header: React.FC = () => {
  const {
    activeTab,
    setMobileMenuOpen,
    mobileMenuOpen,
    setSupportModalOpen,
    setScriptModalOpen,
    audioAssistEnabled,
    setAudioAssistEnabled,
    isSpeaking,
  } = useWorkspaceStore();
  const { user } = useAuthStore();

  const handleToggleAudio = () => {
    if (audioAssistEnabled) {
      stopSpeaking();
      setAudioAssistEnabled(false);
    } else {
      playChime(600);
      setAudioAssistEnabled(true);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "AG";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-11 md:h-12 px-2.5 sm:px-4 md:px-6 flex items-center justify-between border-b border-[#ECEFE9] bg-[#F8F9F5]/90 backdrop-blur-md sticky top-0 z-20 select-none shrink-0 gap-1.5 sm:gap-2">
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <button
          type="button"
          className="md:hidden p-1.5 -ml-1 rounded-md text-[#576558] hover:bg-[#EEF4EB] cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center shrink-0"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <nav className="flex items-center gap-1 text-[11.5px] text-[#829283] min-w-0" aria-label="Breadcrumb">
          <span className="hidden sm:inline hover:text-[#17241B] cursor-pointer transition-colors">Workspace</span>
          <ChevronRight size={12} className="hidden sm:inline text-[#BDC7BC] shrink-0" />
          <span className="text-[#17241B] font-semibold truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
            {tabTitleMap[activeTab]}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Audio Assist Mute / Unmute Button in Header */}
        <button
          type="button"
          onClick={handleToggleAudio}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] ${
            audioAssistEnabled
              ? "text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300"
              : "text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300"
          }`}
          title={
            audioAssistEnabled
              ? "Audio Assist is ON (Click to Mute)"
              : "Audio Assist is Muted (Click to Unmute)"
          }
          id="header-audio-assist-btn"
        >
          {audioAssistEnabled ? (
            <>
              <Volume2
                size={13}
                className={`text-emerald-600 shrink-0 stroke-[2.3] ${
                  isSpeaking ? "animate-pulse" : ""
                }`}
              />
              <span className="hidden sm:inline">Audio ON</span>
              <span className="sm:hidden">Audio</span>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-slate-500 shrink-0 stroke-[2.3]" />
              <span className="hidden sm:inline">Audio Muted</span>
              <span className="sm:hidden">Muted</span>
            </>
          )}
        </button>

        {/* Calling Script Tab / Button on top of header */}
        <button
          type="button"
          onClick={() => setScriptModalOpen(true)}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-[#163A2C] bg-white hover:bg-[#EEF4EB] border border-[#DCE4D9] hover:border-[#CBD8C7] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
          title="Open Standard Calling Script for Telecallers"
          id="header-script-tab"
        >
          <Headphones size={13} className="text-[#D92D20] shrink-0 stroke-[2.2]" />
          <span>Script</span>
          <span className="hidden sm:inline text-[9.5px] font-medium text-[#576558] bg-[#F3F6F0] px-1.5 py-0.2 rounded-full border border-[#E1E8DD]">
            Telecaller
          </span>
        </button>

        {/* Contact Us button in header */}
        <button
          type="button"
          onClick={() => setSupportModalOpen(true)}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-white bg-[#163A2C] hover:bg-[#102B21] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
          title="Contact Process Manager "
          id="header-contact-us-btn"
        >
          <PhoneCall size={13} className="text-[#DCE8D7] shrink-0" />
          <span className="hidden sm:inline">Contact Us</span>
          <span className="sm:hidden">Contact</span>
        </button>

        <div className="hidden lg:flex items-center gap-1.5 text-[10.5px] font-medium text-[#576558] bg-[#F2F5EF] px-2 py-0.5 rounded-full border border-[#ECEFE9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F855A] shadow-[0_0_0_2px_rgba(47,133,90,0.2)] animate-pulse shrink-0" />
          <span>Workspace ready</span>
        </div>

        <div
          className="w-7 h-7 rounded-full bg-[#E6EFE4] text-[#163A2C] text-[10.5px] font-bold flex items-center justify-center border border-[#E4ECE1] shadow-2xs shrink-0 cursor-default"
          title={user?.name || "User Profile"}
        >
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
};
