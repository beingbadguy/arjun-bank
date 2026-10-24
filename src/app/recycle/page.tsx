"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  RotateCcw,
  Search,
  Building2,
  MapPin,
  Users,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
  Link2,
} from "lucide-react";

import { clientCache } from "@/lib/clientCache";

type SectionType = "bankers" | "pincodes" | "companies" | "cases" | "utmlinks";

interface BankerItem {
  _id: string;
  name: string;
  bankName: string;
  designation: string;
  branch: string;
  city: string;
  phone: string;
  email: string;
  productsHandled?: string[];
  isVerified?: boolean;
  notes?: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface PinCodeItem {
  _id: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
  lenders?: {
    lender: string;
    isServiceable: boolean;
    branchName?: string;
    category?: string;
    products?: string[];
    tatDays?: number;
  }[];
  deletedAt?: string;
  deletedBy?: string;
}

interface CompanyItem {
  _id: string;
  name: string;
  industry?: string;
  category: string;
  minSalary?: number;
  remarks?: string;
  lenderCategories?: {
    lender: string;
    category: string;
    multiplier?: number;
    maxLoan?: number;
  }[];
  deletedAt?: string;
  deletedBy?: string;
}

interface CaseItem {
  _id: string;
  customerId: string;
  name: string;
  bankName: string;
  location: string;
  status: string;
  applicationNo?: string;
  remarks?: string;
  product?: string;
  appliedAmount?: number;
  approvedAmount?: number;
  contactNo?: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface UtmLinkItem {
  _id: string;
  tagName: string;
  url: string;
  category?: string;
  description?: string;
  clicks?: number;
  deletedAt?: string;
  deletedBy?: string;
}

export default function RecycleBinPage() {
  const [activeSection, setActiveSection] = useState<SectionType>("bankers");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal for confirming restore
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "single" | "all";
    section: SectionType;
    id?: string;
    title: string;
  } | null>(null);

  const [data, setData] = useState<{
    bankers: BankerItem[];
    pincodes: PinCodeItem[];
    companies: CompanyItem[];
    cases: CaseItem[];
    utmlinks: UtmLinkItem[];
  }>({
    bankers: [],
    pincodes: [],
    companies: [],
    cases: [],
    utmlinks: [],
  });

  const [counts, setCounts] = useState({
    bankers: 0,
    pincodes: 0,
    companies: 0,
    cases: 0,
    utmlinks: 0,
    total: 0,
  });

  // Fetch Recycle Bin Data with instant client cache
  const fetchData = async () => {
    const cached = clientCache.get<any>("/api/recycle?section=all");
    if (cached && cached.success) {
      setData(cached.data || { bankers: [], pincodes: [], companies: [], cases: [], utmlinks: [] });
      setCounts(cached.counts || { bankers: 0, pincodes: 0, companies: 0, cases: 0, utmlinks: 0, total: 0 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const json = await clientCache.fetchWithCache<any>("/api/recycle?section=all", {}, 60);
      if (json && json.success) {
        setData(json.data || { bankers: [], pincodes: [], companies: [], cases: [], utmlinks: [] });
        setCounts(json.counts || { bankers: 0, pincodes: 0, companies: 0, cases: 0, utmlinks: 0, total: 0 });
      } else {
        setErrorMessage(json?.error || "Failed to load recycle bin data.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to recycle bin service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Previously deleted";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered lists based on search
  const filteredBankers = useMemo(() => {
    if (!searchQuery.trim()) return data.bankers;
    const q = searchQuery.toLowerCase().trim();
    return data.bankers.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.bankName?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.branch?.toLowerCase().includes(q) ||
        b.phone?.toLowerCase().includes(q) ||
        b.designation?.toLowerCase().includes(q)
    );
  }, [data.bankers, searchQuery]);

  const filteredPincodes = useMemo(() => {
    if (!searchQuery.trim()) return data.pincodes;
    const q = searchQuery.toLowerCase().trim();
    return data.pincodes.filter(
      (p) =>
        p.pincode?.toLowerCase().includes(q) ||
        p.area?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.state?.toLowerCase().includes(q)
    );
  }, [data.pincodes, searchQuery]);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return data.companies;
    const q = searchQuery.toLowerCase().trim();
    return data.companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
    );
  }, [data.companies, searchQuery]);

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return data.cases;
    const q = searchQuery.toLowerCase().trim();
    return data.cases.filter(
      (cs) =>
        cs.name?.toLowerCase().includes(q) ||
        cs.customerId?.toLowerCase().includes(q) ||
        cs.bankName?.toLowerCase().includes(q) ||
        cs.location?.toLowerCase().includes(q) ||
        cs.product?.toLowerCase().includes(q)
    );
  }, [data.cases, searchQuery]);

  const filteredUtmLinks = useMemo(() => {
    if (!searchQuery.trim()) return data.utmlinks || [];
    const q = searchQuery.toLowerCase().trim();
    return (data.utmlinks || []).filter(
      (u) =>
        u.tagName?.toLowerCase().includes(q) ||
        u.url?.toLowerCase().includes(q) ||
        u.category?.toLowerCase().includes(q) ||
        u.description?.toLowerCase().includes(q)
    );
  }, [data.utmlinks, searchQuery]);

  // Handle Restore
  const handleRestore = async (section: SectionType, id?: string, all?: boolean) => {
    setIsRestoring(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/recycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          section,
          id,
          all: Boolean(all),
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        clientCache.clear();
        setStatusMessage(resJson.message || "Record successfully restored to database.");
        // Refresh local data
        await fetchData();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setErrorMessage(resJson.error || "Failed to restore record.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while restoring record.");
    } finally {
      setIsRestoring(false);
      setConfirmModal(null);
    }
  };

  const getSectionTitle = (sec: SectionType) => {
    switch (sec) {
      case "bankers":
        return "Bankers Search";
      case "pincodes":
        return "Pincode Search";
      case "companies":
        return "Company Search";
      case "cases":
        return "Cases Vault";
      case "utmlinks":
        return "UTM Links";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] text-[#17241B] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E3EBE0] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#163A2C] text-[#DCE8D7] flex items-center justify-center font-bold text-sm font-mono shadow-xs">
              ag.
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-[#163A2C]">
                  Database Recycle Bin
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E3EDE0] text-[#163A2C] border border-[#D0DFC9]">
                  <ShieldCheck className="w-3 h-3 text-[#257853]" /> Unlocked View
                </span>
              </div>
              <div className="text-[11px] text-[#829283]">
                Preservation Layer &bull; Route: <code className="text-[#163A2C] font-mono font-medium">/recycle</code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#163A2C] border border-[#E3EBE0] hover:bg-[#F4F6F0] hover:border-[#D0DFC9] transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Refresh recycle bin"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Banner Alert Notes */}
        <div className="rounded-2xl bg-gradient-to-br from-[#163A2C] via-[#1A4534] to-[#123125] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(220,232,215,0.12),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-[#DCE8D7] border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-[#DCE8D7]" />
              <span>Protected Soft-Delete System</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Permanent Archive &amp; Recycle Repository
            </h1>
            
            <p className="text-sm text-[#B8CDB7] leading-relaxed">
              Records deleted from the active platform are never lost or wiped from the database. 
              They are hidden from regular users and searches, and preserved here organized by section. 
              You can review the full record details and restore them back to the active database at any moment.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-[#DCE8D7]" />
                Total Archived
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {counts.total}
              </div>
            </div>

            <div 
              onClick={() => setActiveSection("bankers")}
              className={`rounded-xl p-3 border transition-all cursor-pointer ${
                activeSection === "bankers"
                  ? "bg-white/15 border-white/30 ring-1 ring-white/30"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#DCE8D7]" />
                Bankers Search
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {counts.bankers}
              </div>
            </div>

            <div 
              onClick={() => setActiveSection("pincodes")}
              className={`rounded-xl p-3 border transition-all cursor-pointer ${
                activeSection === "pincodes"
                  ? "bg-white/15 border-white/30 ring-1 ring-white/30"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#DCE8D7]" />
                Pincode Search
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {counts.pincodes}
              </div>
            </div>

            <div 
              onClick={() => setActiveSection("companies")}
              className={`rounded-xl p-3 border transition-all cursor-pointer ${
                activeSection === "companies"
                  ? "bg-white/15 border-white/30 ring-1 ring-white/30"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#DCE8D7]" />
                Company Search
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {counts.companies}
              </div>
            </div>

            <div 
              onClick={() => setActiveSection("cases")}
              className={`rounded-xl p-3 border transition-all cursor-pointer ${
                activeSection === "cases"
                  ? "bg-white/15 border-white/30 ring-1 ring-white/30"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#DCE8D7]" />
                Cases Vault
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {counts.cases}
              </div>
            </div>

            <div 
              onClick={() => setActiveSection("utmlinks")}
              className={`rounded-xl p-3 border transition-all cursor-pointer ${
                activeSection === "utmlinks"
                  ? "bg-white/15 border-white/30 ring-1 ring-white/30"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-[11px] text-[#B8CDB7] font-medium flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#DCE8D7]" />
                UTM Links
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {counts.utmlinks || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {statusMessage && (
          <div className="rounded-xl bg-[#E3EDE0] border border-[#C5DAC0] p-4 flex items-center gap-3 text-[#163A2C] text-sm font-medium animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-[#257853] shrink-0" />
            <div className="flex-1">{statusMessage}</div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-[#576558] hover:text-[#17241B] text-xs font-semibold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl bg-[#FDF2F2] border border-[#F8D7DA] p-4 flex items-center gap-3 text-[#B42318] text-sm font-medium animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-[#D92D20] shrink-0" />
            <div className="flex-1">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#B42318] hover:underline text-xs font-semibold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section Navigation Tabs & Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#E3EBE0] shadow-2xs">
          {/* Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                setActiveSection("bankers");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === "bankers"
                  ? "bg-[#163A2C] text-[#DCE8D7] shadow-xs"
                  : "bg-transparent text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bankers Search</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeSection === "bankers"
                    ? "bg-[#DCE8D7] text-[#163A2C]"
                    : "bg-[#E3EDE0] text-[#163A2C]"
                }`}
              >
                {counts.bankers}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("pincodes");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === "pincodes"
                  ? "bg-[#163A2C] text-[#DCE8D7] shadow-xs"
                  : "bg-transparent text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B]"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Pincode Search</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeSection === "pincodes"
                    ? "bg-[#DCE8D7] text-[#163A2C]"
                    : "bg-[#E3EDE0] text-[#163A2C]"
                }`}
              >
                {counts.pincodes}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("companies");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === "companies"
                  ? "bg-[#163A2C] text-[#DCE8D7] shadow-xs"
                  : "bg-transparent text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company Search</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeSection === "companies"
                    ? "bg-[#DCE8D7] text-[#163A2C]"
                    : "bg-[#E3EDE0] text-[#163A2C]"
                }`}
              >
                {counts.companies}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("cases");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === "cases"
                  ? "bg-[#163A2C] text-[#DCE8D7] shadow-xs"
                  : "bg-transparent text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B]"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Cases Vault</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeSection === "cases"
                    ? "bg-[#DCE8D7] text-[#163A2C]"
                    : "bg-[#E3EDE0] text-[#163A2C]"
                }`}
              >
                {counts.cases}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("utmlinks");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === "utmlinks"
                  ? "bg-[#163A2C] text-[#DCE8D7] shadow-xs"
                  : "bg-transparent text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B]"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>UTM Links</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeSection === "utmlinks"
                    ? "bg-[#DCE8D7] text-[#163A2C]"
                    : "bg-[#E3EDE0] text-[#163A2C]"
                }`}
              >
                {counts.utmlinks || 0}
              </span>
            </button>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#829283] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search deleted ${activeSection}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[#F4F6F0] border border-[#E3EBE0] text-[#17241B] placeholder-[#829283] focus:outline-none focus:border-[#163A2C] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#829283] hover:text-[#17241B]"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Restore All in section button */}
            {counts[activeSection] > 0 && (
              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: "all",
                    section: activeSection,
                    title: `Restore All in ${getSectionTitle(activeSection)}`,
                  })
                }
                disabled={isRestoring}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E3EDE0] text-[#163A2C] hover:bg-[#DCE8D7] border border-[#D0DFC9] transition-all whitespace-nowrap cursor-pointer shadow-2xs"
                title="Restore all items in this section back to active database"
              >
                <RotateCcw className="w-3 h-3 text-[#257853]" />
                <span className="hidden sm:inline">Restore All</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Section Content */}
        {isLoading ? (
          <div className="min-h-72 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-[#E3EBE0] p-12">
            <div className="w-10 h-10 rounded-xl bg-[#163A2C] text-[#DCE8D7] flex items-center justify-center font-bold text-sm font-mono shadow-xs animate-pulse">
              ag.
            </div>
            <div className="text-xs font-medium text-[#829283]">
              Loading archived database records...
            </div>
          </div>
        ) : (
          <div>
            {/* SECTION 1: BANKERS SEARCH */}
            {activeSection === "bankers" && (
              <div>
                {filteredBankers.length === 0 ? (
                  <EmptyRecycleState
                    sectionTitle="Bankers Search"
                    hasSearch={Boolean(searchQuery)}
                    onClearSearch={() => setSearchQuery("")}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBankers.map((b) => (
                      <div
                        key={b._id}
                        className="bg-white rounded-2xl border border-[#E3EBE0] p-5 shadow-2xs hover:shadow-xs hover:border-[#D0DFC9] transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-base font-bold text-[#17241B] flex items-center gap-1.5">
                                <span>{b.name}</span>
                                {b.isVerified && (
                                  <span title="Verified Banker">
                                    <ShieldCheck className="w-4 h-4 text-[#257853]" />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-[#163A2C] mt-0.5">
                                {b.bankName}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDF2F2] text-[#B42318] border border-[#F8D7DA]">
                              Archived
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-[#576558]">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-[#829283]" />
                              <span className="font-medium text-[#17241B]">{b.designation}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#829283]" />
                              <span>{b.branch}, {b.city}</span>
                            </div>
                            {b.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#829283]" />
                                <span className="font-mono">{b.phone}</span>
                              </div>
                            )}
                            {b.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-[#829283]" />
                                <span className="truncate">{b.email}</span>
                              </div>
                            )}
                          </div>

                          {/* Products Handled */}
                          {b.productsHandled && b.productsHandled.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {b.productsHandled.map((prod, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F4F6F0] text-[#576558] border border-[#E3EBE0]"
                                >
                                  {prod}
                                </span>
                              ))}
                            </div>
                          )}

                          {b.notes && (
                            <p className="text-[11px] text-[#829283] italic border-l-2 border-[#DCE8D7] pl-2 line-clamp-2">
                              &ldquo;{b.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Footer Deletion Info & Restore button */}
                        <div className="pt-4 mt-4 border-t border-[#ECEFE9] flex items-center justify-between gap-2">
                          <div className="text-[10px] text-[#829283] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(b.deletedAt)}</span>
                          </div>

                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                type: "single",
                                section: "bankers",
                                id: b._id,
                                title: `Restore Banker "${b.name}"`,
                              })
                            }
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore to App</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: PINCODE SEARCH */}
            {activeSection === "pincodes" && (
              <div>
                {filteredPincodes.length === 0 ? (
                  <EmptyRecycleState
                    sectionTitle="Pincode Search"
                    hasSearch={Boolean(searchQuery)}
                    onClearSearch={() => setSearchQuery("")}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPincodes.map((pin) => (
                      <div
                        key={pin._id}
                        className="bg-white rounded-2xl border border-[#E3EBE0] p-5 shadow-2xs hover:shadow-xs hover:border-[#D0DFC9] transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xl font-black font-mono tracking-tight text-[#163A2C]">
                                {pin.pincode}
                              </div>
                              <div className="text-xs font-bold text-[#17241B] mt-0.5">
                                {pin.area}
                              </div>
                              <div className="text-[11px] text-[#829283]">
                                {pin.city}, {pin.state}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDF2F2] text-[#B42318] border border-[#F8D7DA]">
                              Archived
                            </span>
                          </div>

                          {/* Serviceable Lenders List */}
                          {pin.lenders && pin.lenders.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider">
                                Serviceable Lenders ({pin.lenders.length}):
                              </div>
                              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                                {pin.lenders.map((len, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F4F6F0] text-[#17241B] border border-[#E3EBE0] flex items-center gap-1"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#257853]" />
                                    <span>{len.lender}</span>
                                    {len.tatDays ? (
                                      <span className="text-[#829283] font-mono">({len.tatDays}d)</span>
                                    ) : null}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer Deletion Info & Restore button */}
                        <div className="pt-4 mt-4 border-t border-[#ECEFE9] flex items-center justify-between gap-2">
                          <div className="text-[10px] text-[#829283] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(pin.deletedAt)}</span>
                          </div>

                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                type: "single",
                                section: "pincodes",
                                id: pin._id,
                                title: `Restore PIN Code ${pin.pincode}`,
                              })
                            }
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore to App</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: COMPANY SEARCH */}
            {activeSection === "companies" && (
              <div>
                {filteredCompanies.length === 0 ? (
                  <EmptyRecycleState
                    sectionTitle="Company Search"
                    hasSearch={Boolean(searchQuery)}
                    onClearSearch={() => setSearchQuery("")}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCompanies.map((c) => (
                      <div
                        key={c._id}
                        className="bg-white rounded-2xl border border-[#E3EBE0] p-5 shadow-2xs hover:shadow-xs hover:border-[#D0DFC9] transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-base font-bold text-[#17241B] truncate">
                                {c.name}
                              </div>
                              <div className="text-xs text-[#829283] mt-0.5">
                                {c.industry || "Corporate Enterprise"}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3EDE0] text-[#163A2C] border border-[#D0DFC9] shrink-0">
                              {c.category || "Cat A"}
                            </span>
                          </div>

                          {c.minSalary ? (
                            <div className="text-xs text-[#576558] flex items-center gap-1">
                              <span>Min Salary:</span>
                              <span className="font-mono font-bold text-[#17241B]">
                                ₹{c.minSalary.toLocaleString("en-IN")}/mo
                              </span>
                            </div>
                          ) : null}

                          {/* Lender Categories Matrix */}
                          {c.lenderCategories && c.lenderCategories.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider">
                                Lender Matrices ({c.lenderCategories.length}):
                              </div>
                              <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto pr-1">
                                {c.lenderCategories.map((lc, idx) => (
                                  <div
                                    key={idx}
                                    className="p-1.5 rounded-lg bg-[#F4F6F0] border border-[#E3EBE0] text-[10px]"
                                  >
                                    <div className="font-bold text-[#17241B] truncate">{lc.lender}</div>
                                    <div className="text-[#576558] flex items-center justify-between mt-0.5">
                                      <span className="font-semibold text-[#163A2C]">{lc.category}</span>
                                      {lc.multiplier ? (
                                        <span className="font-mono text-[#829283]">{lc.multiplier}x</span>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {c.remarks && (
                            <p className="text-[11px] text-[#829283] italic border-l-2 border-[#DCE8D7] pl-2 line-clamp-2">
                              &ldquo;{c.remarks}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Footer Deletion Info & Restore button */}
                        <div className="pt-4 mt-4 border-t border-[#ECEFE9] flex items-center justify-between gap-2">
                          <div className="text-[10px] text-[#829283] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(c.deletedAt)}</span>
                          </div>

                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                type: "single",
                                section: "companies",
                                id: c._id,
                                title: `Restore Company "${c.name}"`,
                              })
                            }
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore to App</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: CASES VAULT */}
            {activeSection === "cases" && (
              <div>
                {filteredCases.length === 0 ? (
                  <EmptyRecycleState
                    sectionTitle="Cases Vault"
                    hasSearch={Boolean(searchQuery)}
                    onClearSearch={() => setSearchQuery("")}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCases.map((cs) => (
                      <div
                        key={cs._id}
                        className="bg-white rounded-2xl border border-[#E3EBE0] p-5 shadow-2xs hover:shadow-xs hover:border-[#D0DFC9] transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-base font-bold text-[#17241B]">{cs.name}</div>
                              <div className="text-xs font-mono font-semibold text-[#829283]">
                                {cs.customerId}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                cs.status === "DISBURSED"
                                  ? "bg-[#DCE8D7] text-[#163A2C]"
                                  : cs.status === "REJECTED"
                                  ? "bg-[#FDF2F2] text-[#B42318]"
                                  : "bg-[#F4F6F0] text-[#576558]"
                              }`}
                            >
                              {cs.status}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-[#576558]">
                            <div>
                              Bank: <span className="font-semibold text-[#17241B]">{cs.bankName}</span>
                            </div>
                            <div>
                              Location: <span className="font-semibold text-[#17241B]">{cs.location}</span>
                            </div>
                            {cs.product && (
                              <div>
                                Product: <span className="font-medium text-[#17241B]">{cs.product}</span>
                              </div>
                            )}
                            {cs.applicationNo && (
                              <div className="font-mono text-[11px] text-[#829283]">
                                App No: {cs.applicationNo}
                              </div>
                            )}
                          </div>

                          {/* Amounts */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ECEFE9] text-xs">
                            <div>
                              <div className="text-[10px] text-[#829283]">Applied Amt</div>
                              <div className="font-mono font-bold text-[#17241B]">
                                ₹{(cs.appliedAmount || 0).toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[#829283]">Approved Amt</div>
                              <div className="font-mono font-bold text-[#163A2C]">
                                ₹{(cs.approvedAmount || 0).toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>

                          {cs.remarks && (
                            <p className="text-[11px] text-[#829283] italic border-l-2 border-[#DCE8D7] pl-2 line-clamp-2">
                              &ldquo;{cs.remarks}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Footer Deletion Info & Restore button */}
                        <div className="pt-4 mt-4 border-t border-[#ECEFE9] flex items-center justify-between gap-2">
                          <div className="text-[10px] text-[#829283] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(cs.deletedAt)}</span>
                          </div>

                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                type: "single",
                                section: "cases",
                                id: cs._id,
                                title: `Restore Case "${cs.name}"`,
                              })
                            }
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore to Vault</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 5: UTM LINKS */}
            {activeSection === "utmlinks" && (
              <div>
                {filteredUtmLinks.length === 0 ? (
                  <EmptyRecycleState
                    sectionTitle="UTM Links"
                    hasSearch={Boolean(searchQuery)}
                    onClearSearch={() => setSearchQuery("")}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUtmLinks.map((u) => (
                      <div
                        key={u._id}
                        className="bg-white rounded-2xl border border-[#E3EBE0] p-5 shadow-2xs hover:shadow-xs hover:border-[#D0DFC9] transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-[#E3EDE0] text-[#163A2C] border border-[#D0DFC9] truncate max-w-full">
                                {u.tagName}
                              </span>
                              <div className="text-xs font-semibold text-[#576558] mt-1.5 truncate">
                                {u.category || "Poonawalla Fincorp"}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDF2F2] text-[#B42318] border border-[#F8D7DA] shrink-0">
                              Archived
                            </span>
                          </div>

                          {/* URL Preview */}
                          <div className="p-2.5 rounded-xl bg-[#F4F6F0] border border-[#E3EBE0] space-y-1">
                            <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-[#163A2C]" />
                              <span>Destination Link</span>
                            </div>
                            <a
                              href={u.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-[#163A2C] hover:underline break-all block line-clamp-2"
                              title={u.url}
                            >
                              {u.url}
                            </a>
                          </div>

                          {u.description && (
                            <p className="text-[11px] text-[#829283] italic border-l-2 border-[#DCE8D7] pl-2 line-clamp-2">
                              &ldquo;{u.description}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Footer Deletion Info & Restore button */}
                        <div className="pt-4 mt-4 border-t border-[#ECEFE9] flex items-center justify-between gap-2">
                          <div className="text-[10px] text-[#829283] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(u.deletedAt)}</span>
                          </div>

                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                type: "single",
                                section: "utmlinks",
                                id: u._id,
                                title: `Restore UTM Link "${u.tagName}"`,
                              })
                            }
                            disabled={isRestoring}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore to App</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E3EBE0] space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E3EDE0] text-[#163A2C] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-[#257853]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#17241B]">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-[#576558] leading-relaxed">
                  {confirmModal.type === "all"
                    ? `Are you sure you want to restore all items in ${getSectionTitle(
                        confirmModal.section
                      )} back to the active database? They will immediately become visible to all users again.`
                    : `This record will be recovered from the archive and will reappear in the active ${getSectionTitle(
                        confirmModal.section
                      )} directory.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#576558] hover:bg-[#F4F6F0] hover:text-[#17241B] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleRestore(
                    confirmModal.section,
                    confirmModal.id,
                    confirmModal.type === "all"
                  )
                }
                disabled={isRestoring}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#163A2C] text-[#DCE8D7] hover:bg-[#102B21] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? "animate-spin" : ""}`} />
                <span>{isRestoring ? "Restoring..." : "Confirm & Restore"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for Empty State
function EmptyRecycleState({
  sectionTitle,
  hasSearch,
  onClearSearch,
}: {
  sectionTitle: string;
  hasSearch: boolean;
  onClearSearch: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E3EBE0] p-12 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-[#F4F6F0] text-[#829283] flex items-center justify-center mx-auto">
        <Trash2 className="w-6 h-6 text-[#829283]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-[#17241B]">
          {hasSearch ? `No matching records found in ${sectionTitle}` : `Recycle Bin is Empty for ${sectionTitle}`}
        </h3>
        <p className="text-xs text-[#576558] max-w-md mx-auto leading-relaxed">
          {hasSearch
            ? "No deleted records match your search filter. Try clearing your search query."
            : `Whenever any record is deleted from ${sectionTitle}, it will be preserved safely here instead of being permanently removed from the database.`}
        </p>
      </div>
      {hasSearch && (
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F4F6F0] text-[#163A2C] hover:bg-[#E3EDE0] transition-all cursor-pointer"
        >
          Clear Search Filter
        </button>
      )}
    </div>
  );
}
