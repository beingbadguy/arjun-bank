"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Filter,
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
  category: string;
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
  const initialLimit = parseInt(searchParams.get("limit") || "12", 10) || 12;

  const [mounted, setMounted] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [pageSize, setPageSize] = useState<number>(initialLimit);
  const [jumpPageInput, setJumpPageInput] = useState<string>("");
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

  // Listen for Escape key when modal is open
  useEffect(() => {
    if (selectedCompany) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedCompany(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedCompany]);

  // Server-side paginated fetch with category filter support
  const fetchCompanies = async (query = "", page = 1, cat = "All", limit = 12) => {
    setIsLoading(true);
    try {
      const categoryParam = cat && cat !== "All" ? `&category=${encodeURIComponent(cat)}` : "";
      const res = await fetch(
        `/api/companies?limit=${limit}&page=${page}&q=${encodeURIComponent(query)}${categoryParam}`
      );
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies || []);
        setTotalCount(data.totalCount || 0);
        setMatchedCount(data.matchedCount || (data.companies ? data.companies.length : 0));
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
    fetchCompanies(initialQ, initialPage, initialCat, initialLimit);
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
      if (pageSize !== 12) {
        url.searchParams.set("limit", String(pageSize));
      } else {
        url.searchParams.delete("limit");
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.error("Failed to sync URL in CompanySearchView", e);
    }
  }, [currentPage, searchInput, selectedCategory, pageSize]);

  // Listen to browser Back/Forward popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get("page") || "1", 10) || 1;
      const q = params.get("q") || params.get("search") || "";
      const cat = params.get("cat") || params.get("category") || "All";
      const lim = parseInt(params.get("limit") || "12", 10) || 12;
      setCurrentPage(p);
      setSearchInput(q);
      setSelectedCategory(cat);
      setPageSize(lim);
      fetchCompanies(q, p, cat, lim);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyQuery(searchInput);
    setCurrentPage(1);
    fetchCompanies(searchInput, 1, selectedCategory, pageSize);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setCompanyQuery("");
    setCurrentPage(1);
    fetchCompanies("", 1, selectedCategory, pageSize);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    fetchCompanies(searchInput, 1, cat, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchCompanies(searchInput, 1, selectedCategory, newSize);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchCompanies(searchInput, newPage, selectedCategory, pageSize);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handlePageChange(p);
      setJumpPageInput("");
    }
  };

  // Helper for generating page numbers with smart ellipsis
  const getPaginationPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const getCategoryBadgeClass = (category: string) => {
    const c = (category || "").toUpperCase();
    if (c.includes("SUPER") || c.includes("DIAMOND") || c.includes("ELITE")) {
      return "inline-flex items-center text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#E3F2E6] text-[#14532D] border border-[#BCE4C3] shadow-2xs whitespace-nowrap";
    }
    if (c.includes("CAT A") || c.includes("CATEGORY A") || c.includes("PLATINUM") || c.includes("GOVERNMENT")) {
      return "inline-flex items-center text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3E8] text-[#163A2C] border border-[#CCE0C6] shadow-2xs whitespace-nowrap";
    }
    if (c.includes("CAT B") || c.includes("CATEGORY B") || c.includes("GOLD")) {
      return "inline-flex items-center text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF6E7] text-[#92400E] border border-[#FDE68A] shadow-2xs whitespace-nowrap";
    }
    if (c.includes("CAT C") || c.includes("CATEGORY C") || c.includes("SILVER")) {
      return "inline-flex items-center text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#F3F6F1] text-[#4F6352] border border-[#D5E1D3] shadow-2xs whitespace-nowrap";
    }
    if (c.includes("DELIST") || c.includes("NEGATIVE")) {
      return "inline-flex items-center text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] shadow-2xs whitespace-nowrap";
    }
    return "inline-flex items-center text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] shadow-2xs whitespace-nowrap";
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
              {totalCount > 0 ? `${totalCount.toLocaleString("en-IN")} Companies Active` : "Connecting Master Database..."}
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
          {/* <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-[#576558] hover:text-[#163A2C] bg-white border border-[#E3EBE0] px-3 py-1.5 rounded-lg shadow-2xs hover:bg-[#F8F9F5] transition-all cursor-pointer font-medium"
            onClick={() => setActiveTab("data-update")}
          >
            <Upload size={13} className="text-[#163A2C]" />
            <span>Update Sheets</span>
          </button> */}
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
            {totalCount > 0 ? totalCount.toLocaleString("en-IN") : "343,169"}
          </div>
          <div className="text-[11px] text-[#576558] mt-0.5">MongoDB Master Indexed</div>
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
            9 Major Institutions
          </div>
          <div className="text-[11px] text-[#576558] mt-0.5">762k+ Category Mappings</div>
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
                placeholder="Search company by name (e.g. Tata, Infosys, Reliance, Wipro, Apollo, HCL, L&T)..."
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
          {["All", "Super Cat A", "Cat A", "Cat B", "Cat C", "Delist"].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`text-xs px-3 py-1 rounded-full shrink-0 font-medium transition-all cursor-pointer ${isSelected
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
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E3EBE0] shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#EBF3E8] text-[#163A2C] flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Building2 size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#17241B] mb-1">
            Querying MongoDB Company Master...
          </h3>
          <p className="text-xs text-[#829283]">
            Cross-referencing category tiers and multiplier caps across 343k+ employers.
          </p>
        </div>
      ) : companies.length > 0 ? (
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
                {companies.map((comp) => {
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

          {/* Enhanced Server-Side Pagination Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-t border-[#ECEFE9] text-xs bg-[#FAFBF9]">
            {/* Results count & Page size selector */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#576558]">
              <div>
                Showing{" "}
                <span className="font-bold text-[#17241B]">
                  {matchedCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-[#17241B]">
                  {Math.min(currentPage * pageSize, matchedCount)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#163A2C]">
                  {matchedCount.toLocaleString("en-IN")}
                </span>{" "}
                companies
              </div>

              <div className="flex items-center gap-1.5 pl-3 border-l border-[#DCE4D9]">
                <span className="text-[#829283] font-medium">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-7 px-2 text-xs font-semibold bg-white border border-[#DCE4D9] rounded-lg text-[#17241B] outline-none cursor-pointer"
                >
                  <option value={12}>12 / page</option>
                  <option value={24}>24 / page</option>
                  <option value={48}>48 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            {/* Numeric page navigation buttons & Jump to page */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* First Page */}
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => handlePageChange(1)}
                className="h-8 w-8 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => handlePageChange(currentPage - 1)}
                className="h-8 px-2.5 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft size={13} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {getPaginationPages().map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-[#829283] font-mono">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handlePageChange(p as number)}
                      className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs ${currentPage === p
                          ? "bg-[#163A2C] text-white"
                          : "bg-white border border-[#E3EBE0] text-[#17241B] hover:bg-[#F4F7F2]"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              {/* Next Page */}
              <button
                type="button"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => handlePageChange(currentPage + 1)}
                className="h-8 px-2.5 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={13} />
              </button>

              {/* Last Page */}
              <button
                type="button"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => handlePageChange(totalPages)}
                className="h-8 w-8 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#17241B] hover:bg-[#F8FAF6] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>

              {/* Direct Jump Input */}
              <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 ml-1 sm:ml-2">
                <div className="flex items-center border border-[#DCE4D9] rounded-lg bg-white overflow-hidden shadow-2xs focus-within:border-[#163A2C] focus-within:ring-1 focus-within:ring-[#163A2C]/20 transition-all">
                  <span className="px-2.5 text-[11px] font-semibold text-[#576558] bg-[#F4F7F2] border-r border-[#E3EBE0] h-8 flex items-center select-none shrink-0">
                    Page
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    placeholder={`1 - ${totalPages}`}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    className="w-20 sm:w-24 h-8 px-2 text-center text-xs font-semibold bg-white text-[#17241B] placeholder:text-[#9AA89B] placeholder:font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label={`Enter page number between 1 and ${totalPages}`}
                    title={`Enter page number (1 to ${totalPages})`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!jumpPageInput}
                  className="h-8 px-3 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs active:scale-95 shrink-0"
                >
                  Go
                </button>
              </form>
            </div>
          </div>
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
            Try searching with partial legal names (e.g. &quot;Tata&quot;, &quot;Infosys&quot;, &quot;Wipro&quot;, &quot;Microns&quot;), or adjust your tier filter.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#CDDBD0] hover:bg-[#163A2C] hover:text-white rounded-xl text-xs font-semibold text-[#163A2C] transition-all cursor-pointer shadow-xs"
            onClick={handleClearSearch}
          >
            <span>Reset Search Filter</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Selected Company Policy Modal */}
      {selectedCompany && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh bg-black/60 backdrop-blur-xs p-3 sm:p-6 py-6 sm:py-8 flex items-start sm:items-center justify-center overflow-y-auto animate-fade-in"
          onClick={() => setSelectedCompany(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative bg-white rounded-2xl border border-[#DCE4D9] shadow-2xl p-5 sm:p-7 max-w-xl w-full my-auto animate-scale-up flex flex-col"
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
                  <div className="text-xs text-[#576558] mt-1">
                    Industry: <span className="font-semibold text-[#17241B]">{selectedCompany.industry || "Corporate Enterprise"}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="p-1 rounded-lg text-[#829283] hover:text-[#17241B] hover:bg-[#EEF3EC] transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lender Classifications Table */}
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
              <div>
                <h4 className="text-[11px] font-bold tracking-wider text-[#829283] uppercase mb-2">
                  Institutional Lender Classifications ({selectedCompany.lenderCategories?.length || 0} Lenders)
                </h4>
                <div className="border border-[#E3EBE0] rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAFBF9] border-b border-[#ECEFE9] text-[#718373] text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Lender Institution</th>
                        <th className="py-2.5 px-3">Category Tier</th>
                        <th className="py-2.5 px-3 text-right">Multiplier</th>
                        <th className="py-2.5 px-3 text-right">Max Sanction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECEFE9]">
                      {selectedCompany.lenderCategories && selectedCompany.lenderCategories.length > 0 ? (
                        selectedCompany.lenderCategories.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFBF9]">
                            <td className="py-2.5 px-3 font-semibold text-[#17241B]">
                              {item.lender}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-[#163A2C] font-semibold bg-[#EBF3E8] px-2 py-0.5 rounded text-[11px]">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#196D29]">
                              {item.multiplier || 18}x
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#17241B]">
                              ₹{((item.maxLoan || 4000000) / 100000).toFixed(1)}L
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-[#829283]">
                            No specific lender exclusions listed. Standard open market policy applies.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy & Operational Remarks */}
              <div className="bg-[#FAFBF9] p-3.5 rounded-xl border border-[#ECEFE9] space-y-1.5 text-xs text-[#576558]">
                <div className="flex items-center gap-1.5 font-bold text-[#163A2C] text-[11px]">
                  <ShieldCheck size={14} className="text-[#257853]" />
                  <span>Corporate Eligibility Underwriting Guidance</span>
                </div>
                <p className="text-[11.5px] leading-relaxed">
                  Employees at <strong>{selectedCompany.name}</strong> qualify under{" "}
                  <strong>{selectedCompany.category}</strong> guidelines. Multipliers apply against clean net in-hand monthly salary before existing EMI obligations.
                </p>
                {selectedCompany.remarks && (
                  <div className="text-[11px] text-[#163A2C] font-mono bg-[#EBF4E9] p-2 rounded-lg border border-[#D5E3D2]">
                    Note: {selectedCompany.remarks}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#ECEFE9] mt-4 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#829283]">
                Policy verified from master corporate sheets
              </span>
              <button
                type="button"
                className="px-4 py-2 bg-[#163A2C] text-white rounded-xl text-xs font-semibold hover:bg-[#102B21] transition-colors cursor-pointer"
                onClick={() => setSelectedCompany(null)}
              >
                Close Policy View
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
