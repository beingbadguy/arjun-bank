"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  LayoutGrid,
  Building2,
  MapPin,
  FileText,
  Calculator,
  CheckCircle2,
  Files,
  Upload,
  Lock,
  ShieldCheck,
  LogOut,
  X,
  AlertTriangle,
  Headphones,
  PhoneCall,
  FolderLock,
  Award,
  GraduationCap,
} from "lucide-react";
import { useWorkspaceStore, WorkspaceTab } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    mobileMenuOpen,
    setMobileMenuOpen,
    setSupportModalOpen,
    setScriptModalOpen,
    benefitsModalOpen,
    setBenefitsModalOpen,
  } = useWorkspaceStore();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset any body overflow lock on unmount or drawer close
  React.useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  const isSuperadmin = user?.role === "superadmin";

  const workspaceNavItems: {
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "overview", label: "Overview", icon: <LayoutGrid size={15} /> },
    { id: "company-search", label: "Company search", icon: <Building2 size={15} /> },
    { id: "pin-search", label: "PIN code search", icon: <MapPin size={15} /> },
    { id: "cibil-relook", label: "CIBIL & case relook", icon: <FileText size={15} /> },
    { id: "emi-calc", label: "EMI calculator", icon: <Calculator size={15} /> },
    { id: "eligibility", label: "Eligibility check", icon: <CheckCircle2 size={15} /> },
    { id: "pdf-tools", label: "PDF tools", icon: <Files size={15} /> },
    { id: "training", label: "Training modules", icon: <GraduationCap size={15} /> },
  ];

  const managementNavItems: {
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
    requiresSuperadmin?: boolean;
  }[] = [
    { id: "data-update", label: "Data update", icon: <Upload size={15} /> },
    {
      id: "admin-access",
      label: "Admin access",
      icon: <Lock size={15} />,
      requiresSuperadmin: true,
    },
    {
      id: "cases-vault",
      label: "My Cases (Locked)",
      icon: <FolderLock size={15} />,
      requiresSuperadmin: true,
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "AG";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleSelectTab = (tabId: WorkspaceTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`w-64 max-w-[85vw] md:w-56 shrink-0 bg-[#F8F9F5] border-r border-[#E4ECE1] flex flex-col p-3.5 h-full overflow-hidden select-none transition-transform duration-200 ${
          mobileMenuOpen
            ? "fixed inset-y-0 left-0 z-50 shadow-2xl translate-x-0"
            : "hidden md:flex relative z-30"
        }`}
      >
        {/* Brand Header - Pinned at top */}
        <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#ECEFE9] mb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#163A2C] text-white w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs tracking-tight shadow-2xs">
              ag.
            </div>
            <div className="flex flex-col">
              <div className="text-xs font-bold text-[#17241B] leading-tight tracking-tight">
                Arjun Grewal
              </div>
              <div className="text-[9px] font-bold tracking-widest text-[#829283] uppercase">
                LOAN OPERATIONS
              </div>
            </div>
          </div>
          {mobileMenuOpen && (
            <button
              type="button"
              className="md:hidden p-1.5 rounded-md text-[#829283] hover:text-[#17241B] hover:bg-[#EEF4EB] cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-3.5 min-h-0">
          {/* Workspace Navigation */}
          <div>
            <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase px-2 mb-1.5">
              YOUR WORKSPACE
            </div>
            <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
              {workspaceNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#E3EDE0] text-[#143729] font-semibold"
                          : "text-[#576558] hover:bg-[#EEF4EB] hover:text-[#17241B]"
                      }`}
                      onClick={() => handleSelectTab(item.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isActive ? "text-[#163A2C]" : "text-[#7B8B7C]"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#257853]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Management Navigation */}
          <div>
            <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase px-2 mb-1.5">
              MANAGEMENT
            </div>
            <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
              {managementNavItems
                .filter((item) => !item.requiresSuperadmin || isSuperadmin)
                .map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#E3EDE0] text-[#143729] font-semibold"
                            : "text-[#576558] hover:bg-[#EEF4EB] hover:text-[#17241B]"
                        }`}
                        onClick={() => handleSelectTab(item.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={isActive ? "text-[#163A2C]" : "text-[#7B8B7C]"}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#257853]" />
                        )}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Benefits & Bonuses - For all users */}
          <div>
            <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase px-2 mb-1.5">
              BENEFITS &amp; REWARDS
            </div>
            <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
              <li>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                    benefitsModalOpen
                      ? "bg-[#E3EDE0] text-[#143729] font-semibold"
                      : "text-[#576558] hover:bg-[#EEF4EB] hover:text-[#17241B]"
                  }`}
                  onClick={() => {
                    setBenefitsModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  id="sidebar-benefits-btn"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">
                      <Award size={15} />
                    </span>
                    <span>Benefits &amp; Bonuses</span>
                  </div>
                  {benefitsModalOpen && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#257853]" />
                  )}
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Support & Resources */}
          <div>
            <div className="text-[9.5px] font-bold tracking-widest text-[#829283] uppercase px-2 mb-1.5">
              SUPPORT &amp; SCRIPT
            </div>
            <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
              <li>
                <button
                  type="button"
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-md text-[12px] font-medium text-[#576558] hover:bg-[#EEF4EB] hover:text-[#17241B] transition-all cursor-pointer"
                  onClick={() => {
                    setScriptModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  id="sidebar-script-btn"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#D92D20]">
                      <Headphones size={15} />
                    </span>
                    <span>Calling Script</span>
                  </div>
                  <span className="text-[9px] font-semibold text-[#829283] bg-[#EAF2E8] px-1.5 py-0.5 rounded">
                    Telecaller
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-md text-[12px] font-medium text-[#576558] hover:bg-[#EEF4EB] hover:text-[#17241B] transition-all cursor-pointer"
                  onClick={() => {
                    setSupportModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  id="sidebar-contact-us-btn"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#163A2C]">
                      <PhoneCall size={15} />
                    </span>
                    <span>Contact Us</span>
                  </div>
                  <span className="text-[9px] font-semibold text-[#163A2C] bg-[#EAF2E8] px-1.5 py-0.5 rounded">
                    Support
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar Footer - Pinned at bottom */}
        <div className="shrink-0 mt-auto flex flex-col gap-2 pt-2 pb-6 md:pb-0 border-t border-[#ECEFE9]">
          <div className="flex gap-2 p-2 bg-[#F2F5EF] border border-[#ECEFE9] rounded-lg text-[10px] leading-snug text-[#576558]">
            <ShieldCheck size={14} className="text-[#2A7B51] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#17241B]">
                A little more peace of mind.
              </div>
              <div className="text-[9.5px] text-[#6A7B6C] mt-0.5">
                Client reports &amp; PDF tools processed locally.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1 px-1">
            <div className="w-7 h-7 rounded-full bg-[#E2ECE0] text-[#163A2C] flex items-center justify-center text-[10.5px] font-bold shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#17241B] truncate leading-tight">
                {user?.name || "Arjun Grewal"}
              </div>
              <div className="text-[9.5px] text-[#829283] truncate">
                {user?.role === "superadmin"
                  ? "Superadmin"
                  : user?.role === "analyst"
                  ? "Credit Analyst"
                  : "Loan Operator"}
              </div>
            </div>
            <button
              type="button"
              className="p-1 rounded-md text-[#829283] hover:bg-[#FBEBEB] hover:text-[#C53030] transition-colors cursor-pointer"
              onClick={() => setShowLogoutModal(true)}
              title="Sign out of workspace"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal - Teleported directly to document.body to cover the entire page */}
      {showLogoutModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-start sm:items-center justify-center p-4 py-8 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setShowLogoutModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl border border-[#DCE4D9] p-5 max-w-sm w-full shadow-2xl my-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-[#F3F7F2] text-[#163A2C] flex items-center justify-center">
                <LogOut size={16} />
              </div>
              <button
                type="button"
                className="p-1 rounded-md text-[#829283] hover:text-[#17241B] hover:bg-[#F1F5EE] transition-colors cursor-pointer"
                onClick={() => setShowLogoutModal(false)}
              >
                <X size={15} />
              </button>
            </div>

            <h3 className="text-sm md:text-[15px] font-bold text-[#17241B] mb-1">
              Sign out of workspace?
            </h3>
            <p className="text-xs text-[#576558] mb-4 leading-relaxed">
              Are you sure you want to end your active session? You will need to re-enter your credentials to access operations.
            </p>

            {/* Active User Card preview */}
            <div className="flex items-center gap-2.5 p-2.5 bg-[#FAFBF9] border border-[#E7EFE4] rounded-lg mb-4">
              <div className="w-7 h-7 rounded-full bg-[#163A2C] text-[#DCE8D7] flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#17241B] truncate">
                  {user?.name || "Arjun Grewal"}
                </div>
                <div className="text-[10.5px] text-[#829283] truncate font-mono">
                  {user?.email}
                </div>
              </div>
              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-[#EBF3E8] text-[#163A2C] uppercase shrink-0">
                {user?.role}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="h-8 px-3.5 border border-[#DCE4D9] hover:bg-[#F5F8F4] text-[#576558] hover:text-[#17241B] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-8 px-4 bg-[#163A2C] hover:bg-[#1D4A38] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                <span>{isLoggingOut ? "Signing out..." : "Yes, sign out"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
