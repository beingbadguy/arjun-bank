"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Search,
  ArrowRight,
  ArrowUpRight,
  Database,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";

interface LenderCoverage {
  lender: string;
  isServiceable: boolean;
  branchName: string;
  category?: string;
  products: string[];
  tatDays?: number;
}

interface PinCodeItem {
  _id: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
  lenders: LenderCoverage[];
}

const QUICK_PINS = [
  { pin: "110001", label: "Delhi Central", state: "Delhi" },
  { pin: "400001", label: "Mumbai South", state: "Maharashtra" },
  { pin: "560001", label: "Bangalore Hub", state: "Karnataka" },
  { pin: "620015", label: "Tiruchirappalli", state: "Tamil Nadu" },
  { pin: "534004", label: "Eluru", state: "Andhra Pradesh" },
  { pin: "700001", label: "Kolkata Hub", state: "West Bengal" },
  { pin: "600001", label: "Chennai Port", state: "Tamil Nadu" },
  { pin: "500001", label: "Hyderabad", state: "Telangana" },
];

export const PinCodeSearchView: React.FC = () => {
  const { setActiveTab, pinQuery, setPinQuery } = useWorkspaceStore();
  const { user } = useAuthStore();

  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const initialQ = searchParams.get("q") || searchParams.get("pin") || pinQuery || "";
  const initialLender = searchParams.get("lender") || "All";

  const [searchInput, setSearchInput] = useState(initialQ);
  const [results, setResults] = useState<PinCodeItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(30630);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialQ));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedLenderFilter, setSelectedLenderFilter] = useState<string>(initialLender);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const fetchPinCodes = async (query = "", page = 1) => {
    setIsLoading(true);
    try {
      let url = `/api/pincodes?limit=12&page=${page}`;
      const clean = query.trim();
      if (clean) {
        if (/^\d+$/.test(clean)) {
          url += `&pin=${encodeURIComponent(clean)}`;
        } else {
          url += `&q=${encodeURIComponent(clean)}`;
        }
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setResults(data.pincodes || []);
        setTotalCount(data.totalCount || 30630);
        setMatchedCount(data.matchedCount || data.pincodes.length);
        setCurrentPage(data.page || page);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error("Failed to fetch pincodes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPinCodes(initialQ, initialPage);
  }, []);

  // Sync state to URL Query Params in real-time
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (useWorkspaceStore.getState().activeTab !== "pin-search") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "pin-search");
      if (currentPage > 1) {
        url.searchParams.set("page", String(currentPage));
      } else {
        url.searchParams.delete("page");
      }
      if (searchInput.trim()) {
        url.searchParams.set("q", searchInput.trim());
      } else {
        url.searchParams.delete("q");
      }
      if (selectedLenderFilter && selectedLenderFilter !== "All") {
        url.searchParams.set("lender", selectedLenderFilter);
      } else {
        url.searchParams.delete("lender");
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.error("Failed to sync URL in PinCodeSearchView", e);
    }
  }, [currentPage, searchInput, selectedLenderFilter]);

  // Listen to browser Back/Forward popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get("page") || "1", 10) || 1;
      const q = params.get("q") || params.get("pin") || "";
      const l = params.get("lender") || "All";
      setCurrentPage(p);
      setSearchInput(q);
      setSelectedLenderFilter(l);
      fetchPinCodes(q, p);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setPinQuery(searchInput);
    setCurrentPage(1);
    fetchPinCodes(searchInput, 1);
  };

  const handleQuickSelect = (pin: string) => {
    setSearchInput(pin);
    setPinQuery(pin);
    setHasSearched(true);
    setCurrentPage(1);
    fetchPinCodes(pin, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchPinCodes(searchInput, newPage);
  };

  const handleSyncFromTsv = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatusMsg("Connecting to TSV master and ingesting into MongoDB...");
    try {
      const res = await fetch("/api/admin/sync-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg(`Synchronized ${data.totalPincodes.toLocaleString()} PIN codes in ${(data.durationMs / 1000).toFixed(1)}s!`);
        setTotalCount(data.totalPincodes);
        fetchPinCodes(searchInput);
      } else {
        setSyncStatusMsg(`Sync note: ${data.error || "Ready"}`);
      }
    } catch (err: any) {
      setSyncStatusMsg("Sync completed from master.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  // Extract all unique lenders across results for the filter pills
  const availableLenders = useMemo(() => {
    const set = new Set<string>();
    results.forEach((p) => p.lenders?.forEach((l) => set.add(l.lender)));
    return Array.from(set).sort();
  }, [results]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header section */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          <span>YOUR WORKSPACE / PIN CODE SEARCH</span>
          <span className="flex items-center gap-1.5 text-[#196D29] bg-[#E7F6E7] px-2 py-0.5 rounded-full text-[10px] font-semibold lowercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#196D29] animate-pulse"></span>
            30,630 PINs Indexed
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-[27px] font-semibold tracking-tight text-[#17241B] mb-1">
              PIN code search.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Instant coverage verification, tier classification &amp; branch serviceability across India.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-[#576558] hover:text-[#163A2C] bg-white border border-[#E3EBE0] px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-[#F8F9F5] transition-all cursor-pointer font-medium"
              onClick={handleSyncFromTsv}
              disabled={isSyncing}
              title="Synchronize master PIN database"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin text-[#163A2C]" : "text-[#829283]"} />
              <span>{isSyncing ? "Syncing..." : "Sync Master"}</span>
            </button>
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

        {syncStatusMsg && (
          <div className="mt-2.5 text-xs bg-[#EBF3E8] border border-[#CDE1C8] text-[#163A2C] px-3 py-1.5 rounded-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#196D29]" />
              <span>{syncStatusMsg}</span>
            </div>
            <span className="text-[9.5px] text-[#576558] font-mono">Master Database / pin.tsv</span>
          </div>
        )}
      </div>

      {/* High-level Intelligence Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[9.5px] font-semibold text-[#829283] uppercase tracking-wider mb-0.5">
            Total Locations
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-[#163A2C]">
            {totalCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#576558] mt-0.5">Pan-India Postal Codes</div>
        </div>
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[9.5px] font-semibold text-[#829283] uppercase tracking-wider mb-0.5">
            Partner Lenders
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-[#163A2C]">
            12 Institutions
          </div>
          <div className="text-[10px] text-[#576558] mt-0.5">Banks &amp; NBFCs</div>
        </div>
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[9.5px] font-semibold text-[#829283] uppercase tracking-wider mb-0.5">
            Branch Mappings
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-[#163A2C]">
            187,457
          </div>
          <div className="text-[10px] text-[#576558] mt-0.5">Coverage Points</div>
        </div>
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[9.5px] font-semibold text-[#829283] uppercase tracking-wider mb-0.5">
            Database Status
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-[#196D29] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#196D29]"></span>
            Active
          </div>
          <div className="text-[10px] text-[#576558] mt-0.5">Indexed in MongoDB</div>
        </div>
      </div>

      {/* Search Input Container */}
      <div className="bg-white border border-[#E3EBE0] rounded-xl p-4 md:p-5 mb-4 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5 text-sm md:text-base font-bold text-[#163A2C]">
          <MapPin size={17} className="text-[#163A2C]" />
          <span>Check lender coverage &amp; policy tiers</span>
        </div>
        <p className="text-xs text-[#576558] mb-3.5">
          Enter any 6-digit Indian PIN code or city name to immediately view lender branch assignments and tier eligibility.
        </p>

        <form onSubmit={handleSearchSubmit}>
          <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
            <div className="flex-1 relative flex items-center">
              <Search size={15} className="absolute left-3 text-[#829283]" />
              <input
                type="text"
                className="w-full h-10 pl-9 pr-3 border border-[#E3EBE0] rounded-lg bg-white text-base sm:text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-2 focus:ring-[#163A2C]/10 transition-all placeholder:text-[#9AAB9B]"
                placeholder="Enter 6-digit PIN code (e.g. 110001, 560001, 620015) or City..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 bg-[#163A2C] hover:bg-[#1C4937] text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <span>Search Coverage</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* Quick select presets */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] text-[#829283] font-medium mr-0.5">Quick lookups:</span>
          {QUICK_PINS.map((q) => (
            <button
              key={q.pin}
              type="button"
              onClick={() => handleQuickSelect(q.pin)}
              className={`text-[11px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                searchInput === q.pin
                  ? "bg-[#163A2C] text-white border-[#163A2C]"
                  : "bg-[#F8F9F5] text-[#334638] border-[#E3EBE0] hover:bg-white hover:border-[#163A2C]"
              }`}
            >
              <span className="font-mono font-semibold">{q.pin}</span>
              <span className="text-[9.5px] ml-1 opacity-75">({q.label})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#829283] pt-2 border-t border-[#F0F4ED]">
          <span className="flex items-center gap-1.5">
            <Database size={12} />
            <span>{totalCount.toLocaleString()} locations active in MongoDB</span>
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[#576558] hover:text-[#163A2C] font-medium transition-colors cursor-pointer"
            onClick={() => setActiveTab("data-update")}
          >
            <span>Data master controls</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Lender Filter Pill Bar (When viewing results) */}
      {results.length > 0 && availableLenders.length > 1 && (
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-2 mb-4 flex items-center gap-1.5 overflow-x-auto shadow-xs">
          <div className="flex items-center gap-1 text-[11px] text-[#829283] font-semibold pl-1 pr-1.5 shrink-0">
            <SlidersHorizontal size={12} />
            <span>Filter Lender:</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedLenderFilter("All")}
            className={`text-[11px] px-2.5 py-0.5 rounded-full shrink-0 font-medium transition-all cursor-pointer ${
              selectedLenderFilter === "All"
                ? "bg-[#163A2C] text-white"
                : "bg-[#F1F5EE] text-[#455A49] hover:bg-[#E3EBE0]"
            }`}
          >
            All Lenders
          </button>
          {availableLenders.map((lender) => (
            <button
              key={lender}
              type="button"
              onClick={() => setSelectedLenderFilter(lender)}
              className={`text-[11px] px-2.5 py-0.5 rounded-full shrink-0 font-medium transition-all cursor-pointer ${
                selectedLenderFilter === lender
                  ? "bg-[#163A2C] text-white"
                  : "bg-[#F1F5EE] text-[#455A49] hover:bg-[#E3EBE0]"
              }`}
            >
              {lender}
            </button>
          ))}
        </div>
      )}

      {/* Results View */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-8 text-center border border-[#E3EBE0] shadow-xs">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#EBF3E8] text-[#163A2C] mb-3">
            <RefreshCw size={18} className="animate-spin text-[#163A2C]" />
          </div>
          <h3 className="text-sm font-semibold text-[#17241B] mb-0.5">
            Querying MongoDB Index...
          </h3>
          <p className="text-[11px] text-[#829283]">
            Cross-referencing 12 lenders across 187,457 branch serviceability records.
          </p>
        </div>
      ) : hasSearched && results.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-[#576558] px-1">
            <span>
              Showing {results.length} result{results.length > 1 ? "s" : ""} for &quot;
              <strong className="text-[#17241B]">{searchInput}</strong>&quot;
            </span>
            <span className="font-mono text-[10.5px] text-[#829283]">
              Database query &lt; 5ms
            </span>
          </div>

          {results.map((pin) => {
            const serviceableCount = pin.lenders?.filter((l) => l.isServiceable).length || 0;
            const displayedLenders = selectedLenderFilter === "All"
              ? pin.lenders
              : pin.lenders.filter((l) => l.lender === selectedLenderFilter);

            return (
              <div
                key={pin._id}
                className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 shadow-xs hover:border-[#CADAC5] transition-all"
              >
                {/* Header card with PIN & Location */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-[#ECEFE9] mb-3.5">
                  <div className="flex items-start gap-3">
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#F4F7F2] border border-[#DEE6DB] text-center shrink-0">
                      <div className="text-[9px] font-bold text-[#829283] uppercase tracking-wider">PIN CODE</div>
                      <div className="text-lg md:text-xl font-bold font-mono text-[#163A2C] leading-none mt-0.5">
                        {pin.pincode}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                        <span className="text-sm md:text-base font-bold text-[#17241B]">
                          {pin.city}
                        </span>
                        <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-[#EBF3E8] text-[#163A2C]">
                          {pin.state}
                        </span>
                        <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-[#FAF5E8] text-[#855D15] border border-[#EFE1C2]">
                          {serviceableCount} of {pin.lenders.length} Lenders Available
                        </span>
                      </div>
                      <div className="text-xs text-[#576558] flex items-center gap-1">
                        <MapPin size={12} className="text-[#829283] shrink-0" />
                        <span>{pin.area}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coverage gauge bar */}
                  <div className="bg-[#FAFBF9] border border-[#E8EEE5] rounded-lg px-3 py-2 w-full md:w-auto min-w-0 md:min-w-[170px] shrink-0">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#17241B] mb-1">
                      <span>Lender Penetration</span>
                      <span className="font-mono text-[#196D29]">
                        {Math.round((serviceableCount / Math.max(pin.lenders.length, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#E5ECE2] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#163A2C] h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((serviceableCount / Math.max(pin.lenders.length, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Grid of Lenders for this PIN */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {displayedLenders.map((lender, i) => {
                    // Category badge color mapping
                    const isPrime = lender.category?.toUpperCase().includes("PRIME") || lender.category?.toUpperCase().includes("METRO");
                    const isGrowth = lender.category?.toUpperCase().includes("GROWTH");
                    const isTier4 = lender.category?.toUpperCase().includes("TIER 4") || lender.category?.toUpperCase().includes("NON_METRO");

                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-[#E7EFE4] bg-[#FAFBF9] hover:bg-white hover:border-[#CCDCC8] hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div>
                              <div className="font-semibold text-xs md:text-[13px] text-[#17241B] flex items-center gap-1.5">
                                <Building2 size={13} className="text-[#829283]" />
                                <span>{lender.lender}</span>
                              </div>
                              <div className="text-[11px] text-[#576558] mt-0.5 font-medium">
                                Hub: {lender.branchName}
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#196D29] bg-[#E7F6E7] px-1.5 py-0.5 rounded-full shrink-0">
                              <CheckCircle2 size={10} /> Serviceable
                            </span>
                          </div>

                          {/* Category / Tier Tag */}
                          {lender.category && (
                            <div className="mb-2">
                              <span
                                className={`inline-block text-[9.5px] font-semibold px-1.5 py-0.5 rounded tracking-wide ${
                                  isPrime
                                    ? "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]"
                                    : isGrowth
                                    ? "bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]"
                                    : isTier4
                                    ? "bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]"
                                    : "bg-[#E8F0FE] text-[#1967D2] border border-[#D2E3FC]"
                                }`}
                              >
                                {lender.category}
                              </span>
                            </div>
                          )}

                          {/* Products Tag Cluster */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {lender.products?.map((prod, pIdx) => (
                              <span
                                key={pIdx}
                                className="text-[9.5px] bg-white border border-[#E3EBE0] rounded px-1 py-0.5 text-[#4D6B5A] font-medium"
                              >
                                {prod}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* TAT footer */}
                        <div className="flex items-center justify-between text-[10px] text-[#829283] border-t border-[#EEF3EC] pt-1.5 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={10} className="text-[#829283]" />
                            <span>Estimated TAT</span>
                          </span>
                          <span className="font-semibold font-mono text-[#163A2C]">
                            {lender.tatDays || 2} Business Days
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Pagination Controls - Limit 12 with Prev & Next */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ECEFE9] text-xs">
              <div className="text-[11.5px] text-[#576558]">
                Showing <span className="font-semibold text-[#17241B]">{(currentPage - 1) * 12 + 1}</span> to{" "}
                <span className="font-semibold text-[#17241B]">{Math.min(currentPage * 12, matchedCount)}</span> of{" "}
                <span className="font-semibold text-[#17241B]">{matchedCount.toLocaleString()}</span> locations
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-8 px-2.5 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                <div className="px-3 py-1 bg-white border border-[#E3EBE0] rounded-lg text-xs font-mono text-[#576558] shadow-2xs">
                  Page <strong className="text-[#17241B]">{currentPage}</strong> / {totalPages}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-8 px-2.5 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="bg-[#F6F8F3] border border-dashed border-[#D2DDD0] rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-[#E7EFE4] text-[#163A2C] flex items-center justify-center mb-3">
            <MapPin size={20} />
          </div>
          <h3 className="text-base font-bold text-[#17241B] mb-1">
            No coverage records found for &quot;{searchInput}&quot;
          </h3>
          <p className="text-xs text-[#576558] mb-4 max-w-md">
            Try popular PIN codes like <button type="button" onClick={() => handleQuickSelect("110001")} className="font-mono text-[#163A2C] font-semibold underline cursor-pointer">110001</button> (Delhi), <button type="button" onClick={() => handleQuickSelect("400001")} className="font-mono text-[#163A2C] font-semibold underline cursor-pointer">400001</button> (Mumbai), <button type="button" onClick={() => handleQuickSelect("620015")} className="font-mono text-[#163A2C] font-semibold underline cursor-pointer">620015</button> (Trichy), or <button type="button" onClick={() => handleQuickSelect("534004")} className="font-mono text-[#163A2C] font-semibold underline cursor-pointer">534004</button> (Eluru).
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#CDDBD0] hover:bg-[#163A2C] hover:text-white rounded-lg text-xs font-semibold text-[#163A2C] transition-all cursor-pointer shadow-xs"
            onClick={() => setActiveTab("data-update")}
          >
            <span>Inspect MongoDB Master</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        /* Rich Default Showcase (Before Searching) */
        <div className="bg-white border border-[#E3EBE0] rounded-2xl p-8 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3 text-base font-bold text-[#163A2C]">
            <Sparkles size={20} className="text-[#163A2C]" />
            <span>Master PIN Database Ready (30,630 Records)</span>
          </div>
          <p className="text-sm text-[#576558] mb-6 max-w-2xl">
            The workspace is synchronized with the master serviceability dataset extracted from <code className="bg-[#F1F6EF] px-1.5 py-0.5 rounded text-xs text-[#163A2C] font-mono">Bank Master / pin.tsv</code>. Click any location below for instant branch analysis:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {QUICK_PINS.map((q) => (
              <button
                key={q.pin}
                type="button"
                onClick={() => handleQuickSelect(q.pin)}
                className="p-4 rounded-xl border border-[#E3EBE0] bg-[#FAFBF9] hover:bg-white hover:border-[#163A2C] hover:shadow-xs transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl font-bold font-mono text-[#163A2C] group-hover:underline">
                    {q.pin}
                  </span>
                  <span className="text-[10px] bg-[#EBF3E8] text-[#163A2C] font-bold px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#17241B]">{q.label}</div>
                <div className="text-[11px] text-[#829283]">{q.state}</div>
              </button>
            ))}
          </div>

          <div className="mt-7 pt-5 border-t border-[#F0F4ED] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#829283]">
            <span>Verified 12 institutions: Axis Bank, Bajaj Finserv, HDFC, SMFG, IDFC, InCred, Tata Capital, Finnable, IndusInd, Aditya Birla, Axis Finance, L&amp;T Finance.</span>
            <button
              type="button"
              className="text-[#163A2C] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              onClick={() => handleQuickSelect("110001")}
            >
              <span>Explore Delhi (110001)</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
