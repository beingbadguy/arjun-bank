"use client";

import React from "react";
import { ChevronRight, Menu } from "lucide-react";
import { useWorkspaceStore, WorkspaceTab } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";

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
};

export const Header: React.FC = () => {
  const { activeTab, setMobileMenuOpen, mobileMenuOpen } = useWorkspaceStore();
  const { user } = useAuthStore();

  const getInitials = (name?: string) => {
    if (!name) return "AG";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-11 md:h-12 px-3 sm:px-4 md:px-6 flex items-center justify-between border-b border-[#ECEFE9] bg-[#F8F9F5]/90 backdrop-blur-md sticky top-0 z-20 select-none shrink-0">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          className="md:hidden p-1.5 -ml-1 rounded-md text-[#576558] hover:bg-[#EEF4EB] cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <nav className="flex items-center gap-1.5 text-[11.5px] text-[#829283] min-w-0" aria-label="Breadcrumb">
          <span className="hidden sm:inline hover:text-[#17241B] cursor-pointer transition-colors">Workspace</span>
          <ChevronRight size={12} className="hidden sm:inline text-[#BDC7BC] shrink-0" />
          <span className="text-[#17241B] font-semibold truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
            {tabTitleMap[activeTab]}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-[#576558] bg-[#F2F5EF] px-2 py-0.5 rounded-full border border-[#ECEFE9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F855A] shadow-[0_0_0_2px_rgba(47,133,90,0.2)] animate-pulse shrink-0" />
          <span className="hidden sm:inline">Workspace ready</span>
          <span className="sm:hidden">Ready</span>
        </div>

        <div
          className="w-7 h-7 rounded-full bg-[#E6EFE4] text-[#163A2C] text-[10.5px] font-bold flex items-center justify-center border border-[#E4ECE1] shadow-2xs shrink-0"
          title={user?.name || "User Profile"}
        >
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
};
