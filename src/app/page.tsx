"use client";

import React, { useEffect, Suspense } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { LoginView } from "@/components/auth/LoginView";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OverviewView } from "@/components/views/OverviewView";
import { CompanySearchView } from "@/components/views/CompanySearchView";
import { PinCodeSearchView } from "@/components/views/PinCodeSearchView";
import { CibilRelookView } from "@/components/views/CibilRelookView";
import { EmiCalculatorView } from "@/components/views/EmiCalculatorView";
import { EligibilityCheckView } from "@/components/views/EligibilityCheckView";
import { PdfToolsView } from "@/components/views/PdfToolsView";
import { DataUpdateView } from "@/components/views/DataUpdateView";
import { AdminAccessView } from "@/components/views/AdminAccessView";
import { CasesVaultView } from "@/components/views/CasesVaultView";
import { TrainingView } from "@/components/views/TrainingView";
import { SupportDeskModal } from "@/components/modals/SupportDeskModal";
import { CallingScriptModal } from "@/components/modals/CallingScriptModal";
import { BenefitsModal } from "@/components/modals/BenefitsModal";

export default function Home() {
  const { isAuthenticated, isLoading, fetchMe } = useAuthStore();
  const { activeTab, syncFromUrl } = useWorkspaceStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "cases-vault") {
        window.location.replace("/private");
        return;
      }
      if (params.get("tab") === "admin-access") {
        window.location.replace("/admin");
        return;
      }
    }
    fetchMe();
    syncFromUrl();
  }, [fetchMe, syncFromUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9F5] gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#163A2C] text-[#DCE8D7] flex items-center justify-center font-bold text-lg font-mono shadow-xs animate-pulse">
          ag.
        </div>
        <div className="text-xs font-semibold text-[#829283] tracking-wide">
          Verifying security credentials &amp; workspace session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewView />;
      case "company-search":
        return <CompanySearchView />;
      case "pin-search":
        return <PinCodeSearchView />;
      case "cibil-relook":
        return <CibilRelookView />;
      case "emi-calc":
        return <EmiCalculatorView />;
      case "eligibility":
        return <EligibilityCheckView />;
      case "pdf-tools":
        return <PdfToolsView />;
      case "data-update":
        return <DataUpdateView />;
      case "admin-access":
        if (typeof window !== "undefined") {
          window.location.replace("/admin");
        }
        return <OverviewView />;
      case "cases-vault":
        if (typeof window !== "undefined") {
          window.location.replace("/private");
        }
        return <OverviewView />;
      case "training":
        return <TrainingView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <Suspense fallback={null}>
      <div className="app-container">
        <Sidebar />
        <div className="app-main">
          <Header />
          <main className="flex-1 w-full min-w-0 pb-20 sm:pb-10">{renderCurrentView()}</main>
        </div>
      </div>
      <SupportDeskModal />
      <CallingScriptModal />
      <BenefitsModal />
    </Suspense>
  );
}
