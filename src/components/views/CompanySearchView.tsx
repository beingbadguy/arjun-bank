"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Building2,
  Search,
  ArrowRight,
  ArrowUpRight,
  Upload,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface LenderCategory {
  lender: string;
  category: string;
  multiplier?: number;
  maxLoan?: number;
}

interface CompanyItem {
  _id: string;
  name: string;
  industry?: string;
  category: "Super Cat A" | "Cat A" | "Cat B" | "Cat C" | "Listed" | "Unlisted";
  lenderCategories: LenderCategory[];
  minSalary?: number;
  remarks?: string;
}

export const CompanySearchView: React.FC = () => {
  const { setActiveTab, companyQuery, setCompanyQuery } = useWorkspaceStore();
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const initialQ = searchParams.get("q") || searchParams.get("search") || companyQuery || "";
  const initialCat = searchParams.get("cat") || searchParams.get("category") || "All";

  const [mounted, setMounted] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (selectedCompany) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedCompany(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedCompany]);

  const fetchCompanies = async (query = "", page = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/companies?limit=12&page=${page}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies || []);
        setTotalCount(data.totalCount || 0);
        setMatchedCount(data.matchedCount || data.companies.length);
        setCurrentPage(data.page || page);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error("Failed to fetch companies:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(initialQ, initialPage);
  }, []);

  // Sync state to URL Query Params in real-time
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (useWorkspaceStore.getState().activeTab !== "company-search") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "company-search");
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
      if (selectedCategory && selectedCategory !== "All") {
        url.searchParams.set("cat", selectedCategory);
      } else {
        url.searchParams.delete("cat");
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.error("Failed to sync URL in CompanySearchView", e);
    }
  }, [currentPage, searchInput, selectedCategory]);

  // Listen to browser Back/Forward popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get("page") || "1", 10) || 1;
      const q = params.get("q") || params.get("search") || "";
      const cat = params.get("cat") || params.get("category") || "All";
      setCurrentPage(p);
      setSearchInput(q);
      setSelectedCategory(cat);
      fetchCompanies(q, p);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyQuery(searchInput);
    setCurrentPage(1);
    fetchCompanies(searchInput, 1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setCompanyQuery("");
    setCurrentPage(1);
    fetchCompanies("", 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchCompanies(searchInput, newPage);
  };

  // Filter companies client-side if a specific category filter pill is clicked
  const displayedCompanies = useMemo(() => {
    if (selectedCategory === "All") return companies;
    return companies.filter((c) => c.category === selectedCategory);
  }, [companies, selectedCategory]);

  const getCategoryBadgeClass = (category: string) => {
    if (category.includes("Super")) {
      return "inline-flex items-center text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#E3F2E6] text-[#14532D] border border-[#BCE4C3] shadow-2xs whitespace-nowrap";
    }
    if (category.includes("A")) {
      return "inline-flex items-center text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3E8] text-[#163A2C] border border-[#CCE0C6] shadow-2xs whitespace-nowrap";
    }
    if (category.includes("B")) {
      return "inline-flex items-center text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#FEF6E7] text-[#92400E] border border-[#FDE68A] shadow-2xs whitespace-nowrap";
    }
    return "inline-flex items-center text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] shadow-2xs whitespace-nowrap";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-4 sm:space-y-5">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
            <span>YOUR WORKSPACE / COMPANY SEARCH</span>
            <span className="flex items-center gap-1 text-[#196D29] bg-[#E7F6E7] px-2 py-0.5 rounded-full text-[9.5px] font-semibold lowercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#196D29] animate-pulse"></span>
              {totalCount} Companies Active
            </span>
          </div>
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-[#17241B]">
            Company search.
          </h1>
          <p className="text-xs md:text-sm text-[#576558] mt-0.5">
            Identify institutional lender classifications, salary multipliers, and policy caps across corporate employers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-[#576558] hover:text-[#163A2C] bg-white border border-[#E3EBE0] px-3 py-1.5 rounded-lg shadow-2xs hover:bg-[#F8F9F5] transition-all cursor-pointer font-medium"
            onClick={() => setActiveTab("data-update")}
          >
            <Upload size={13} className="text-[#163A2C]" />
            <span>Update Sheets</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-[#829283] hover:text-[#17241B] transition-colors cursor-pointer px-2 py-1.5"
            onClick={() => setActiveTab("overview")}
          >
            <span>Overview</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider mb-1">
            Verified Companies
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#163A2C]">
            {totalCount}
          </div>
          <div className="text-[11px] text-[#576558] mt-0.5">Lender Master Records</div>
        </div>

        <div className="bg-white border border-[#E3EBE0] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider mb-1">
            Top Multiplier
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#196D29]">
            26x
          </div>
          <div className="text-[11px] text-[#576558] mt-0.5">Super Cat A Tier</div>
        </div>

        <div className="bg-white border border-[#E3EBE0] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider mb-1">
            Max Sanction
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#163A2C]">
            ₹50.0L
          </div>
          <div className="text-[11px] text-[#576558] mt-0.5">Pre-Approved Cap</div>
        </div>

        <div className="bg-white border border-[#E3EBE0] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider mb-1">
            Partner Lenders
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#163A2C]">
            12 Banks &amp; NBFCs
          </div>
          <div className="text-[11px] text-[#576558] mt-0.5">Cross-Referenced</div>
        </div>
      </div>

      {/* Search Input & Filter Toolbar */}
      <div className="bg-white border border-[#E3EBE0] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative flex items-center">
              <Search size={17} className="absolute left-3.5 text-[#829283]" />
              <input
                type="text"
                className="w-full h-11 pl-10 pr-9 border border-[#E3EBE0] rounded-xl bg-[#FAFBF9] text-base sm:text-sm text-[#17241B] outline-none focus:border-[#163A2C] focus:bg-white focus:ring-2 focus:ring-[#163A2C]/10 transition-all placeholder:text-[#9AAB9B]"
                placeholder="Search company by name (e.g. Tata, Infosys, Reliance, Wipro, Apollo, HCL)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 p-1 rounded-full text-[#829283] hover:text-[#17241B] hover:bg-[#EEF3EC] cursor-pointer"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-11 px-5 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] shrink-0"
            >
              <span>Search Database</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>

        {/* Category Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
          <div className="flex items-center gap-1 text-[11px] text-[#829283] font-semibold pr-1 shrink-0">
            <SlidersHorizontal size={12} />
            <span>Tier Filter:</span>
          </div>
          {["All", "Super Cat A", "Cat A", "Cat B", "Cat C"].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full shrink-0 font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#163A2C] text-white shadow-2xs font-semibold"
                    : "bg-[#F1F5EE] text-[#425946] hover:bg-[#E3EDE0]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Table Section */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E3EBE0] shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#EBF3E8] text-[#163A2C] flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Building2 size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#17241B] mb-1">
            Searching corporate lender sheets...
          </h3>
          <p className="text-xs text-[#829283]">
            Cross-referencing category tiers and multiplier caps across institutional matrices.
          </p>
        </div>
      ) : displayedCompanies.length > 0 ? (
        <div className="bg-white border border-[#E3EBE0] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAF6] border-b border-[#ECEFE9] text-[#718373] text-[10.5px] font-bold tracking-wider uppercase">
                  <th className="py-3 px-4">Company Legal Name</th>
                  <th className="py-3 px-3.5">Category Tier</th>
                  <th className="py-3 px-3.5">Lender Classifications</th>
                  <th className="py-3 px-3.5">Multiplier</th>
                  <th className="py-3 px-3.5">Max Sanction</th>
                  <th className="py-3 px-4 text-right">Policy Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE9]">
                {displayedCompanies.map((comp) => {
                  const primaryLenders = comp.lenderCategories?.slice(0, 3) || [];
                  const highestMultiplier = comp.lenderCategories?.length
                    ? Math.max(...comp.lenderCategories.map((l) => l.multiplier || 18))
                    : 20;
                  const maxSanction = comp.lenderCategories?.length
                    ? Math.max(...comp.lenderCategories.map((l) => l.maxLoan || 4000000))
                    : 4000000;

                  return (
                    <tr
                      key={comp._id}
                      className="hover:bg-[#FAFBF9] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#F2F6F0] text-[#163A2C] flex items-center justify-center font-bold text-xs shrink-0 border border-[#E3EBE0]">
                            {comp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#17241B] text-[13px] leading-tight">
                              {comp.name}
                            </div>
                            <div className="text-[11px] text-[#829283] mt-0.5">
                              {comp.industry || "Corporate Enterprise"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <span className={getCategoryBadgeClass(comp.category)}>
                          {comp.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {primaryLenders.map((l, idx) => (
                            <span
                              key={idx}
                              className="text-[10.5px] bg-[#F1F5EF] border border-[#E1ECE0] px-2 py-0.5 rounded text-[#2C4A38] font-medium"
                            >
                              <strong>{l.lender}:</strong> {l.category}
                            </span>
                          ))}
                          {(comp.lenderCategories?.length || 0) > 3 && (
                            <span className="text-[10px] text-[#829283] px-1 py-0.5 self-center font-medium">
                              +{(comp.lenderCategories?.length || 0) - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <span className="font-mono font-bold text-sm text-[#196D29]">
                          {highestMultiplier}x
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <span className="font-mono font-bold text-sm text-[#17241B]">
                          ₹{(maxSanction / 100000).toFixed(1)}L
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#163A2C] bg-[#F1F6EF] hover:bg-[#163A2C] hover:text-white border border-[#DCE8D8] px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                          onClick={() => setSelectedCompany(comp)}
                        >
                          <span>Details</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Limit 12 with Prev & Next */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#ECEFE9] text-xs bg-[#FAFBF9]">
              <div className="text-[12px] text-[#576558]">
                Showing <span className="font-semibold text-[#17241B]">{(currentPage - 1) * 12 + 1}</span> to{" "}
                <span className="font-semibold text-[#17241B]">{Math.min(currentPage * 12, matchedCount)}</span> of{" "}
                <span className="font-semibold text-[#17241B]">{matchedCount.toLocaleString()}</span> companies
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-8 px-3 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                <div className="px-3.5 py-1 bg-white border border-[#E3EBE0] rounded-lg text-xs font-mono text-[#576558] shadow-2xs font-semibold">
                  Page <strong className="text-[#17241B]">{currentPage}</strong> / {totalPages}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-8 px-3 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#F8FAF6] border border-dashed border-[#D2DDD0] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#E7EFE4] text-[#163A2C] flex items-center justify-center mb-3">
            <Building2 size={22} />
          </div>
          <h3 className="text-base font-bold text-[#17241B] mb-1">
            No companies found for &quot;{searchInput}&quot;
          </h3>
          <p className="text-xs text-[#576558] mb-4 max-w-sm">
            Try searching for &quot;Tata&quot;, &quot;Infosys&quot;, &quot;Wipro&quot;, or import fresh lender classification spreadsheets.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#CDDBD0] hover:bg-[#163A2C] hover:text-white rounded-xl text-xs font-semibold text-[#163A2C] transition-all cursor-pointer shadow-xs"
            onClick={() => setActiveTab("data-update")}
          >
            <span>Manage Company Master</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Selected Company Policy Modal - Teleported directly to document.body to cover the whole page */}
      {selectedCompany && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh bg-black/60 backdrop-blur-xs p-4 sm:p-6 flex items-center justify-center overflow-y-auto animate-fade-in"
          onClick={() => setSelectedCompany(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative bg-white rounded-2xl border border-[#DCE4D9] shadow-2xl p-5 sm:p-7 max-w-xl w-full my-auto animate-scale-up flex flex-col max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#ECEFE9] mb-4 shrink-0">
              <div className="flex items-start gap-3 min-w-0 pr-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF2E7] text-[#163A2C] font-bold text-sm flex items-center justify-center border border-[#D3E2CF] shrink-0 font-mono shadow-2xs">
                  {selectedCompany.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-[#17241B] leading-tight">
                      {selectedCompany.name}
                    </h3>
                    <span className={getCategoryBadgeClass(selectedCompany.category)}>
                      {selectedCompany.category}
                    </span>
                  </div>
                  <div className="text-xs text-[#829283] mt-0.5">
                    {selectedCompany.industry || "Corporate Enterprise"} • Lender Master Matrix
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-full bg-[#F1F5EE] hover:bg-[#E3EDE0] text-[#576558] hover:text-[#17241B] transition-colors cursor-pointer flex items-center justify-center shrink-0"
                onClick={() => setSelectedCompany(null)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto max-h-[50vh] pr-1 space-y-3.5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#728374] mb-2">
                  Lender Specific Classifications &amp; Multipliers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCompany.lenderCategories?.map((lc, i) => (
                    <div
                      key={i}
                      className="p-3 bg-[#FAFBF9] rounded-xl border border-[#E7EFE4] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#17241B]">
                          {lc.lender}
                        </div>
                        <div className="text-[10.5px] text-[#697B6B] mt-0.5">
                          Category: <strong>{lc.category}</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-[#196D29]">
                          {lc.multiplier || 20}x Multiplier
                        </div>
                        <div className="text-[10px] text-[#829283]">
                          Max ₹{((lc.maxLoan || 4000000) / 100000).toFixed(0)}L
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCompany.remarks && (
                <div className="p-3 bg-[#F3F7F2] rounded-xl border border-[#DFEAE0] text-xs text-[#455A49] flex gap-2.5 items-start">
                  <Info size={15} className="text-[#1D4A39] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#17241B]">Policy Underwriting Notes: </strong>
                    {selectedCompany.remarks}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#ECEFE9] mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-[#829283] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#196D29]" />
                <span>Pre-approved policy guidelines for institutional lending.</span>
              </div>
              <button
                type="button"
                className="w-full sm:w-auto h-9 px-5 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                onClick={() => setSelectedCompany(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
