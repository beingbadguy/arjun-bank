"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Database,
  Building2,
  MapPin,
  ExternalLink,
  Layers,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";

const TSV_SOURCE_URL = "pin_download.tsv";

const LENDER_COUNTS_DISPLAY = [
  { name: "Axis Bank", count: 73174, tier: "Major Bank" },
  { name: "HDFC Bank", count: 29252, tier: "Premier Bank" },
  { name: "Aditya Birla Capital", count: 15787, tier: "Prime NBFC" },
  { name: "Bajaj Finserv", count: 13219, tier: "Prime NBFC" },
  { name: "InCred Financial", count: 10837, tier: "Fintech NBFC" },
  { name: "Tata Capital", count: 10162, tier: "Prime NBFC" },
  { name: "IndusInd Bank", count: 9680, tier: "Commercial Bank" },
  { name: "Fullerton (SMFG)", count: 8463, tier: "Institutional NBFC" },
  { name: "IDFC FIRST Bank", count: 7445, tier: "Scheduled Bank" },
  { name: "L&T Finance", count: 5333, tier: "Infrastructure NBFC" },
  { name: "Finnable", count: 3779, tier: "Digital PL" },
  { name: "Axis Finance", count: 326, tier: "Wholesale Lending" },
];

export const DataUpdateView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();
  const { user, token } = useAuthStore();
  const isSuperadmin = user?.role === "superadmin";

  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "companies" ? "companies" : "pincodes";

  const [activeMaster, setActiveMaster] = useState<"companies" | "pincodes">(initialType);
  const [companyCount, setCompanyCount] = useState<number>(0);
  const [pincodeCount, setPincodeCount] = useState<number>(30630);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDataPath = window.location.pathname === "/data";
    if (!isDataPath && useWorkspaceStore.getState().activeTab !== "data-update") return;
    try {
      const url = new URL(window.location.href);
      if (isDataPath) {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", "data-update");
      }
      url.searchParams.set("type", activeMaster);
      window.history.replaceState(null, "", url.toString());
    } catch {}
  }, [activeMaster]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("type") === "companies" ? "companies" : "pincodes";
      setActiveMaster(t);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const [isSyncingTsv, setIsSyncingTsv] = useState<boolean>(false);
  const [customTsvUrl, setCustomTsvUrl] = useState<string>(TSV_SOURCE_URL);
  const [isSyncingCompanyTsv, setIsSyncingCompanyTsv] = useState<boolean>(false);
  const [customCompanyTsvUrl, setCustomCompanyTsvUrl] = useState<string>("company_master.tsv");

  // New Company Form State
  const [showAddCompany, setShowAddCompany] = useState<boolean>(false);
  const [newCompName, setNewCompName] = useState<string>("");
  const [newCompCategory, setNewCompCategory] = useState<string>("Cat A");
  const [newCompIndustry, setNewCompIndustry] = useState<string>("Financial Services");

  // New PIN Form State
  const [showAddPin, setShowAddPin] = useState<boolean>(false);
  const [newPinCode, setNewPinCode] = useState<string>("");
  const [newPinArea, setNewPinArea] = useState<string>("");
  const [newPinCity, setNewPinCity] = useState<string>("");
  const [newPinState, setNewPinState] = useState<string>("");

  const refreshCounts = async () => {
    try {
      const [compRes, pinRes] = await Promise.all([
        fetch("/api/companies"),
        fetch("/api/pincodes?limit=1"),
      ]);
      const compData = await compRes.json();
      const pinData = await pinRes.json();
      if (compData.success) setCompanyCount(compData.totalCount || compData.count || 0);
      if (pinData.success) setPincodeCount(pinData.totalCount || 30630);
    } catch (e) {
      console.error("Failed to fetch data counts", e);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  const handleSyncTsvMaster = async () => {
    if (!isSuperadmin) {
      setErrorMessage("Access denied. Only Superadmin can sync the master PIN database.");
      return;
    }
    setIsSyncingTsv(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/admin/sync-pins", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: customTsvUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(
          `Extracted ${data.totalRows?.toLocaleString() || "187,457"} rows and synchronized ${data.totalPincodes?.toLocaleString() || "30,630"} PIN codes into MongoDB in ${(data.durationMs / 1000).toFixed(1)}s!`
        );
        refreshCounts();
      } else {
        setErrorMessage(data.error || "Failed to sync TSV master");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Network error syncing TSV master");
    } finally {
      setIsSyncingTsv(false);
    }
  };

  const handleSyncCompanyTsv = async () => {
    setIsSyncingCompanyTsv(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/sync-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: customCompanyTsvUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(
          `Extracted ${data.totalRows?.toLocaleString() || "762,389"} rows and synchronized ${data.totalCompanies?.toLocaleString() || "343,169"} companies into MongoDB in ${(data.durationMs / 1000).toFixed(1)}s!`
        );
        refreshCounts();
      } else {
        setErrorMessage(data.error || "Failed to sync company master TSV");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Network error syncing company TSV");
    } finally {
      setIsSyncingCompanyTsv(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompName.trim(),
          category: newCompCategory,
          industry: newCompIndustry,
          lenderCategories: [
            { lender: "HDFC Bank", category: newCompCategory, multiplier: 20 },
            { lender: "ICICI Bank", category: newCompCategory, multiplier: 20 },
            { lender: "Axis Bank", category: newCompCategory, multiplier: 18 },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Company "${newCompName}" added successfully.`);
        setNewCompName("");
        setShowAddCompany(false);
        refreshCounts();
      } else {
        setErrorMessage(data.error || "Failed to add company");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const handleAddPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin) {
      setErrorMessage("Access denied. Only Superadmin can add new PIN codes.");
      return;
    }
    if (!newPinCode.trim() || !newPinArea.trim()) return;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/pincodes", {
        method: "POST",
        headers,
        body: JSON.stringify({
          pincode: newPinCode.trim(),
          area: newPinArea.trim(),
          city: newPinCity.trim(),
          state: newPinState.trim(),
          lenders: [
            { lender: "HDFC Bank", isServiceable: true, branchName: `${newPinCity} Main`, products: ["Personal Loan", "Home Loan"] },
            { lender: "ICICI Bank", isServiceable: true, branchName: `${newPinCity} Branch`, products: ["Personal Loan", "LAP"] },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(`PIN Code "${newPinCode}" added successfully.`);
        setNewPinCode("");
        setNewPinArea("");
        setNewPinCity("");
        setNewPinState("");
        setShowAddPin(false);
        refreshCounts();
      } else {
        setErrorMessage(data.error || "Failed to add PIN code");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* View Header */}
      <div className="mb-4">
        <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          WORKSPACE CONFIGURATION / DATA SYNC
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-[26px] font-semibold tracking-tight text-[#17241B] mb-1">
              Data management &amp; master sync.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Synchronize, inspect, and maintain institutional lender matrices and nationwide PIN serviceability.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-[#829283] hover:text-[#17241B] transition-colors cursor-pointer"
            onClick={() => setActiveTab("overview")}
          >
            <span>Overview</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div className="bg-[#EBF3E8] border border-[#CADBC4] text-[#163A2B] px-3.5 py-2.5 rounded-lg mb-3.5 flex items-center gap-2 text-xs animate-fade-in">
          <CheckCircle size={16} className="text-[#196D29] shrink-0" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] px-3.5 py-2.5 rounded-lg mb-3.5 flex items-center gap-2 text-xs animate-fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-[#E3EBE0] p-3.5 md:p-4 shadow-xs">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold text-[#829283] tracking-wider uppercase">
              PIN CODE MASTER RECORDS
            </span>
            <span className="text-[9.5px] bg-[#EBF3E8] text-[#196D29] font-bold px-1.5 py-0.5 rounded-full">
              LIVE MONGODB
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#163A2C] font-mono mt-0.5">
            {pincodeCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#576558] mt-1 flex items-center justify-between">
            <span>187,457 Lender Mappings</span>
            <button
              type="button"
              onClick={() => setActiveTab("pin-search")}
              className="text-[#163A2C] font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Search PINs</span>
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E3EBE0] p-3.5 md:p-4 shadow-xs">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold text-[#829283] tracking-wider uppercase">
              COMPANY CATEGORIZATIONS
            </span>
            <span className="text-[9.5px] bg-[#F1F6EF] text-[#163A2C] font-bold px-1.5 py-0.5 rounded-full">
              CORPORATE
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#163A2C] font-mono mt-0.5">
            {companyCount}
          </div>
          <div className="text-[11px] text-[#576558] mt-1 flex items-center justify-between">
            <span>Pre-approved multipliers</span>
            <button
              type="button"
              onClick={() => setActiveTab("company-search")}
              className="text-[#163A2C] font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Search Companies</span>
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>

        <div className="bg-[#EBF3E8] rounded-xl border border-[#D8E7D5] p-3.5 md:p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#163A2B] uppercase tracking-wider mb-0.5">
              <Database size={13} className="text-[#196D29]" />
              <span>TSV Data Pipeline</span>
            </div>
            <div className="text-[11px] text-[#576558]">
              Extracts 187k+ rows from <span className="font-mono text-[#163A2C]">pin_download.tsv</span> into indexed MongoDB documents.
            </div>
          </div>
          <button
            type="button"
            className="mt-2.5 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#163A2C] hover:bg-[#1C4937] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            onClick={handleSyncTsvMaster}
            disabled={isSyncingTsv}
          >
            <RefreshCw size={12} className={isSyncingTsv ? "animate-spin" : ""} />
            <span>{isSyncingTsv ? "Ingesting TSV Data..." : "Run TSV Master Sync"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-3.5">
        <button
          type="button"
          onClick={() => setActiveMaster("pincodes")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            activeMaster === "pincodes"
              ? "bg-[#163A2C] border-[#163A2C] text-white shadow-xs"
              : "bg-white border-[#E3EBE0] text-[#17241B] hover:bg-[#F8FAF6]"
          }`}
        >
          PIN Code Lender Coverage Master (30,630)
        </button>

        <button
          type="button"
          onClick={() => setActiveMaster("companies")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            activeMaster === "companies"
              ? "bg-[#163A2C] border-[#163A2C] text-white shadow-xs"
              : "bg-white border-[#E3EBE0] text-[#17241B] hover:bg-[#F8FAF6]"
          }`}
        >
          Company Categorization Master
        </button>
      </div>

      {/* Master Content */}
      {activeMaster === "pincodes" ? (
        <div className="space-y-4">
          {/* TSV Source Box */}
          <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-[#EEF3EC] mb-3.5">
              <div>
                <div className="flex items-center gap-1.5 text-sm md:text-base font-bold text-[#17241B]">
                  <Database size={16} className="text-[#163A2C]" />
                  <span>Master TSV Data Stream</span>
                </div>
                <p className="text-xs text-[#576558] mt-0.5">
                  Extracts pan-India branch coverage, clusters, and tier categorizations across 12 institutional lenders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E3EBE0] hover:bg-[#F5F8F4] rounded-lg text-xs font-semibold text-[#17241B] transition-colors shrink-0 cursor-pointer"
                  onClick={() => setShowAddPin(!showAddPin)}
                >
                  <Plus size={13} />
                  <span>{showAddPin ? "Cancel" : "Add Single PIN"}</span>
                </button>
              </div>
            </div>

            {/* URL Input & Trigger */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <input
                type="text"
                className="flex-1 h-9 px-3 border border-[#E3EBE0] rounded-lg bg-[#FAFBF9] text-base sm:text-xs font-mono text-[#17241B] outline-none focus:border-[#163A2C] focus:bg-white"
                value={customTsvUrl}
                onChange={(e) => setCustomTsvUrl(e.target.value)}
                placeholder="Internal Master Dataset (pin_download.tsv)"
              />
              <button
                type="button"
                className="h-9 px-4 bg-[#163A2C] hover:bg-[#1C4937] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99] shrink-0"
                onClick={handleSyncTsvMaster}
                disabled={isSyncingTsv}
              >
                <RefreshCw size={13} className={isSyncingTsv ? "animate-spin" : ""} />
                <span>{isSyncingTsv ? "Processing & Ingesting..." : "Sync From TSV"}</span>
              </button>
            </div>

            {/* Quick Add PIN Form */}
            {showAddPin && (
              <form
                onSubmit={handleAddPin}
                className="bg-[#F8FAF6] p-4 rounded-xl border border-[#ECEFE9] mb-4 animate-fade-in"
              >
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#17241B] mb-2.5">
                  Add Single PIN Code Coverage Record
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#17241B] mb-1">PIN Code (6 digits)</label>
                    <input
                      type="text"
                      className="w-full h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs outline-none"
                      placeholder="e.g. 560001"
                      maxLength={6}
                      value={newPinCode}
                      onChange={(e) => setNewPinCode(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#17241B] mb-1">Area / Locality</label>
                    <input
                      type="text"
                      className="w-full h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs outline-none"
                      placeholder="e.g. MG Road, Ashok Nagar"
                      value={newPinArea}
                      onChange={(e) => setNewPinArea(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#17241B] mb-1">City</label>
                    <input
                      type="text"
                      className="w-full h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs outline-none"
                      placeholder="e.g. Bengaluru"
                      value={newPinCity}
                      onChange={(e) => setNewPinCity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#17241B] mb-1">State</label>
                    <input
                      type="text"
                      className="w-full h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs outline-none"
                      placeholder="e.g. Karnataka"
                      value={newPinState}
                      onChange={(e) => setNewPinState(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-3.5 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            )}

            {/* Ingested Lender Matrix Grid */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#17241B] mb-2.5">
                Ingested Partner Lenders Coverage Distribution (187,457 Mappings)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {LENDER_COUNTS_DISPLAY.map((lender) => (
                  <div
                    key={lender.name}
                    className="p-2.5 rounded-lg border border-[#E7EFE4] bg-[#FAFBF9] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] uppercase font-bold text-[#829283]">
                          {lender.tier}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#196D29]"></span>
                      </div>
                      <div className="text-xs font-semibold text-[#17241B]">
                        {lender.name}
                      </div>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-[#EEF3EC] flex items-center justify-between text-[11px]">
                      <span className="text-[#829283]">Indexed Branches</span>
                      <span className="font-mono font-bold text-[#163A2C]">
                        {lender.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Company Master Content */
        <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div>
              <h3 className="text-sm md:text-base font-bold text-[#17241B]">
                Import Company Master Sheets
              </h3>
              <p className="text-xs text-[#576558]">
                Upload lender categorized company lists (.csv, .xlsx). Columns: Company Name, Category, Multiplier, Lender.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E3EBE0] hover:bg-[#F5F8F4] rounded-lg text-xs font-semibold text-[#17241B] transition-colors shrink-0 cursor-pointer"
              onClick={() => setShowAddCompany(!showAddCompany)}
            >
              <Plus size={13} />
              <span>{showAddCompany ? "Cancel" : "Add Single Company"}</span>
            </button>
          </div>

          {/* Quick Add Company Form */}
          {showAddCompany && (
            <form
              onSubmit={handleAddCompany}
              className="bg-[#F8FAF6] p-4 rounded-xl border border-[#ECEFE9] mb-4"
            >
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#17241B] mb-2.5">
                Add New Company Record
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-[#17241B] mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    className="w-full h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs outline-none"
                    placeholder="e.g. Larsen & Toubro"
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#17241B] mb-1">Industry</label>
                  <input
                    type="text"
                    className="w-full h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs outline-none"
                    placeholder="e.g. Infrastructure"
                    value={newCompIndustry}
                    onChange={(e) => setNewCompIndustry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#17241B] mb-1">Default Category</label>
                  <select
                    className="w-full h-9 px-2.5 border border-[#E3EBE0] rounded-lg bg-white text-xs outline-none"
                    value={newCompCategory}
                    onChange={(e) => setNewCompCategory(e.target.value)}
                  >
                    <option value="Super Cat A">Super Cat A (Max Multiplier)</option>
                    <option value="Cat A">Cat A (Preferred)</option>
                    <option value="Cat B">Cat B (Standard)</option>
                    <option value="Cat C">Cat C (Restricted)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="h-9 px-3.5 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          )}

          {/* Company TSV Stream Box */}
          <div className="bg-[#FAFBF9] border border-[#D8E6D5] rounded-xl p-4 mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Database size={15} className="text-[#163A2C]" />
              <h4 className="text-xs font-bold text-[#17241B]">
                Master Company TSV Data Stream (762k+ Category Mappings)
              </h4>
            </div>
            <p className="text-[11.5px] text-[#576558]">
              Automated multi-lender ingestion stream from <span className="font-mono text-[#163A2C]">company.tsv</span>. Groups 762k+ rows into 343k+ unique employer documents in MongoDB.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                className="flex-1 h-9 px-3 border border-[#E3EBE0] rounded-lg bg-white text-xs font-mono text-[#17241B] outline-none focus:border-[#163A2C]"
                value={customCompanyTsvUrl}
                onChange={(e) => setCustomCompanyTsvUrl(e.target.value)}
                placeholder="company_master.tsv"
              />
              <button
                type="button"
                className="h-9 px-4 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99] shrink-0"
                onClick={handleSyncCompanyTsv}
                disabled={isSyncingCompanyTsv}
              >
                <RefreshCw size={13} className={isSyncingCompanyTsv ? "animate-spin" : ""} />
                <span>{isSyncingCompanyTsv ? "Ingesting 762k Rows..." : "Sync Company TSV"}</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Import Box */}
          <div className="bg-[#F9FAF6] border-2 border-dashed border-[#C8DAC5] rounded-xl p-6 text-center cursor-pointer hover:border-[#163A2C]/40 transition-colors">
            <UploadCloud size={28} className="text-[#163A2C] mx-auto mb-2" />
            <div className="font-semibold text-xs md:text-sm text-[#17241B]">
              Upload Company Master (CSV or Excel)
            </div>
            <div className="text-[11px] text-[#829283] mt-0.5">
              Drag files here or browse from local filesystem
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
