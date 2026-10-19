"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Lock,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  RefreshCw,
  Phone,
  CreditCard,
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FolderLock,
  X,
  FileSpreadsheet,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export interface CaseRecord {
  _id: string;
  customerId: string;
  name: string;
  bankName: string;
  location: string;
  status: "DISBURSED" | "LOGIN" | "HOLD" | "REJECTED" | "CANCELLED" | "APPROVED";
  applicationNo?: string;
  remarks?: string;
  contactNo?: string;
  product?: string;
  panCard?: string;
  appliedAmount?: number;
  approvedAmount?: number;
  lastUpdateDate?: string;
  createdAt?: string;
}

const STATUS_CONFIG: Record<
  CaseRecord["status"],
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    rowHighlight?: string;
  }
> = {
  DISBURSED: {
    label: "DISBURSED",
    badgeBg: "bg-[#BFDBFE]",
    badgeText: "text-[#1E3A8A]",
    border: "border-[#93C5FD]",
    rowHighlight: "bg-blue-50/40 hover:bg-blue-50/80",
  },
  LOGIN: {
    label: "LOGIN",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#92400E]",
    border: "border-[#FDE68A]",
    rowHighlight: "bg-amber-50/20 hover:bg-amber-50/60",
  },
  HOLD: {
    label: "HOLD",
    badgeBg: "bg-[#FED7AA]",
    badgeText: "text-[#9A3412]",
    border: "border-[#FDBA74]",
    rowHighlight: "bg-orange-50/30 hover:bg-orange-50/70",
  },
  REJECTED: {
    label: "REJECTED",
    badgeBg: "bg-[#FECACA]",
    badgeText: "text-[#991B1B]",
    border: "border-[#FCA5A5]",
    rowHighlight: "bg-red-50/30 hover:bg-red-50/70",
  },
  CANCELLED: {
    label: "CANCELLED",
    badgeBg: "bg-[#E5E7EB]",
    badgeText: "text-[#374151]",
    border: "border-[#D1D5DB]",
    rowHighlight: "bg-gray-50/40 hover:bg-gray-50/80",
  },
  APPROVED: {
    label: "APPROVED",
    badgeBg: "bg-[#BBF7D0]",
    badgeText: "text-[#166534]",
    border: "border-[#86EFAC]",
    rowHighlight: "bg-emerald-50/30 hover:bg-emerald-50/70",
  },
};

const BANK_SUGGESTIONS = [
  "KOTAK MAHINDRA",
  "SMFG",
  "AXIS BANK",
  "POONAWALA",
  "TATA CAPITAL",
  "ICICI BANK",
  "BAJAJ FINANCE",
  "HDFC BANK",
  "IDFC FIRST BANK",
  "INDUSIND BANK",
  "YES BANK",
  "PIRAMAL FINANCE",
  "ADITYA BIRLA",
  "CHOLAMANDALAM",
];

const PRODUCT_SUGGESTIONS = [
  "Personal Loan",
  "Business Loan",
  "Home Loan",
  "Loan Against Property",
  "Professional Loan",
  "Doctor Loan",
];

export const CasesVaultView: React.FC = () => {
  const { user } = useAuthStore();
  const { setActiveTab } = useWorkspaceStore();
  const isSuperadmin = user?.role === "superadmin";

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "ALL";
  const initialBank = searchParams.get("bank") || "ALL";

  // Filters & Pagination synced with route query params
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedBank, setSelectedBank] = useState<string>(initialBank);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const isFirstMount = useRef(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCase, setEditingCase] = useState<CaseRecord | null>(null);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    customerId: "",
    name: "",
    bankName: "",
    location: "",
    status: "LOGIN" as CaseRecord["status"],
    applicationNo: "",
    remarks: "",
    contactNo: "",
    product: "Personal Loan",
    panCard: "",
    appliedAmount: "",
    approvedAmount: "",
  });

  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cases");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load cases");
      }
      setCases(data.cases || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch private cases");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
      fetchCases();
    }
  }, [isSuperadmin]);

  const resetForm = () => {
    setFormData({
      customerId: "",
      name: "",
      bankName: "",
      location: "",
      status: "LOGIN",
      applicationNo: "",
      remarks: "",
      contactNo: "",
      product: "Personal Loan",
      panCard: "",
      appliedAmount: "",
      approvedAmount: "",
    });
    setEditingCase(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: CaseRecord) => {
    setEditingCase(item);
    setFormData({
      customerId: item.customerId,
      name: item.name,
      bankName: item.bankName,
      location: item.location,
      status: item.status,
      applicationNo: item.applicationNo || "",
      remarks: item.remarks || "",
      contactNo: item.contactNo || "",
      product: item.product || "Personal Loan",
      panCard: item.panCard || "",
      appliedAmount: item.appliedAmount ? String(item.appliedAmount) : "",
      approvedAmount: item.approvedAmount ? String(item.approvedAmount) : "",
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        customerId: formData.customerId,
        name: formData.name,
        bankName: formData.bankName,
        location: formData.location,
        status: formData.status,
        applicationNo: formData.applicationNo,
        remarks: formData.remarks,
        contactNo: formData.contactNo,
        product: formData.product,
        panCard: formData.panCard,
        appliedAmount: Number(formData.appliedAmount) || 0,
        approvedAmount: Number(formData.approvedAmount) || 0,
      };

      const url = editingCase
        ? `/api/admin/cases/${editingCase._id}`
        : "/api/admin/cases";
      const method = editingCase ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save case entry");
      }

      setSuccessMessage(
        editingCase
          ? "Case entry updated successfully!"
          : "Case entry added to locked vault!"
      );
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowAddModal(false);
      resetForm();
      fetchCases();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/cases/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete case");
      }
      setSuccessMessage("Case deleted successfully from vault.");
      setTimeout(() => setSuccessMessage(null), 3000);
      setDeletingCaseId(null);
      fetchCases();
    } catch (err: any) {
      setError(err.message || "Failed to delete case");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (
    id: string,
    newStatus: CaseRecord["status"]
  ) => {
    try {
      const res = await fetch(`/api/admin/cases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCases((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Filter & Search logic
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesStatus =
        selectedStatus === "ALL" || c.status === selectedStatus;
      const matchesBank = selectedBank === "ALL" || c.bankName === selectedBank;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.customerId?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.bankName?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.applicationNo?.toLowerCase().includes(q) ||
        c.contactNo?.toLowerCase().includes(q) ||
        c.panCard?.toLowerCase().includes(q) ||
        c.remarks?.toLowerCase().includes(q);

      return matchesStatus && matchesBank && matchesSearch;
    });
  }, [cases, selectedStatus, selectedBank, searchQuery]);

  const pageSize = 12;

  // Reset page when search or filters change (skip initial mount to preserve URL page)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedBank]);

  // Sync to URL Query Params in real-time
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (useWorkspaceStore.getState().activeTab !== "cases-vault") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "cases-vault");
      if (currentPage > 1) {
        url.searchParams.set("page", String(currentPage));
      } else {
        url.searchParams.delete("page");
      }
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      } else {
        url.searchParams.delete("search");
      }
      if (selectedStatus && selectedStatus !== "ALL") {
        url.searchParams.set("status", selectedStatus);
      } else {
        url.searchParams.delete("status");
      }
      if (selectedBank && selectedBank !== "ALL") {
        url.searchParams.set("bank", selectedBank);
      } else {
        url.searchParams.delete("bank");
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {
      console.error("Failed to sync URL params", e);
    }
  }, [currentPage, searchQuery, selectedStatus, selectedBank]);

  // Listen to browser Back/Forward popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get("page") || "1", 10) || 1;
      const s = params.get("search") || "";
      const st = params.get("status") || "ALL";
      const b = params.get("bank") || "ALL";
      setCurrentPage(p);
      setSearchQuery(s);
      setSelectedStatus(st);
      setSelectedBank(b);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredCases.length);

  const paginatedCases = useMemo(() => {
    return filteredCases.slice(startIndex, startIndex + pageSize);
  }, [filteredCases, startIndex, pageSize]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = cases.length;
    const disbursed = cases.filter((c) => c.status === "DISBURSED");
    const login = cases.filter((c) => c.status === "LOGIN");
    const hold = cases.filter((c) => c.status === "HOLD");
    const rejected = cases.filter((c) => c.status === "REJECTED");
    const approved = cases.filter((c) => c.status === "APPROVED");

    const totalDisbursedAmt = disbursed.reduce(
      (sum, c) => sum + (c.approvedAmount || 0),
      0
    );

    return {
      total,
      disbursedCount: disbursed.length,
      disbursedAmt: totalDisbursedAmt,
      loginCount: login.length,
      holdCount: hold.length,
      rejectedCount: rejected.length,
      approvedCount: approved.length,
    };
  }, [cases]);

  // Unique bank names for dropdown filter
  const uniqueBanks = useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => {
      if (c.bankName) set.add(c.bankName);
    });
    return Array.from(set).sort();
  }, [cases]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredCases.length === 0) return;

    const headers = [
      "Customer ID",
      "Customer Name",
      "Contact No",
      "PAN Card",
      "Product",
      "Bank Name",
      "Location",
      "Status",
      "Application No",
      "Applied Amount",
      "Approved Amount",
      "Remarks",
      "Last Update Date",
    ];

    const rows = filteredCases.map((c) => [
      `"${c.customerId || ""}"`,
      `"${c.name || ""}"`,
      `"${c.contactNo || ""}"`,
      `"${c.panCard || ""}"`,
      `"${c.product || ""}"`,
      `"${c.bankName || ""}"`,
      `"${c.location || ""}"`,
      `"${c.status || ""}"`,
      `"${c.applicationNo || ""}"`,
      c.appliedAmount || 0,
      c.approvedAmount || 0,
      `"${(c.remarks || "").replace(/"/g, '""')}"`,
      `"${c.lastUpdateDate ? new Date(c.lastUpdateDate).toLocaleDateString("en-IN") : ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cases_vault_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val?: number) => {
    if (!val || val === 0) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // RESTRICTED ACCESS SCREEN IF NOT SUPERADMIN
  if (!isSuperadmin) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto mt-12 animate-fade-in">
        <div className="bg-white rounded-2xl border border-red-200 shadow-xl p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <FolderLock size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider mb-3">
            🔒 Locked Folder
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Superadmin Access Required
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
            This folder is an encrypted private repository containing confidential case
            entries, applicant contact numbers, and PAN cards. Only the{" "}
            <strong>Superadmin (Arjun Grewal)</strong> has authorization to open or
            modify records in this vault.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className="px-5 py-2.5 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
          >
            Return to Workspace Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full animate-fade-in select-none">
      {/* Title & Locked Vault Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#EBF4E9] text-[#163A2C] text-[10.5px] font-bold uppercase tracking-wider mb-1.5 border border-[#DCE4D9]">
            <Lock size={12} className="text-[#163A2C]" />
            <span>Superadmin Private Vault • Only You Have Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17241B]">
            My Cases (Locked Folder)
          </h1>
          <p className="text-xs sm:text-[13px] text-[#576558] mt-0.5">
            Confidential case repository with customer records, banks, application
            numbers, loan amounts &amp; real-time status tracking.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchCases}
            disabled={isLoading}
            className="p-2 sm:px-3 sm:py-2 bg-white hover:bg-[#EEF4EB] border border-[#DCE4D9] rounded-lg text-xs font-semibold text-[#17241B] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Refresh vault records"
          >
            <RefreshCw
              size={14}
              className={`text-[#576558] ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredCases.length === 0}
            className="px-3 py-2 bg-white hover:bg-[#EEF4EB] border border-[#DCE4D9] rounded-lg text-xs font-semibold text-[#17241B] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export filtered records as CSV"
          >
            <Download size={14} className="text-[#2563EB]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
            id="add-case-entry-btn"
          >
            <Plus size={16} />
            <span>Add Case Entry</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 5-Card Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mb-5">
        {/* Total Cases */}
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-3 sm:p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-[#829283] uppercase tracking-wider mb-1">
            Total Vault Cases
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#17241B]">
            {stats.total}
          </div>
          <div className="text-[10.5px] text-[#576558] mt-0.5">Active files</div>
        </div>

        {/* Disbursed */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 sm:p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-wider mb-1">
            Disbursed Files
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1E3A8A]">
            {stats.disbursedCount}
          </div>
          <div className="text-[10.5px] font-semibold text-[#2563EB] mt-0.5 truncate">
            {formatCurrency(stats.disbursedAmt)}
          </div>
        </div>

        {/* Login */}
        <div className="bg-[#FEF9C3]/50 border border-[#FDE047] rounded-xl p-3 sm:p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-[#A16207] uppercase tracking-wider mb-1">
            In Login Process
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#854D0E]">
            {stats.loginCount}
          </div>
          <div className="text-[10.5px] text-[#A16207] mt-0.5">Under underwriting</div>
        </div>

        {/* Hold */}
        <div className="bg-[#FFEDD5]/60 border border-[#FDBA74] rounded-xl p-3 sm:p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider mb-1">
            On Hold
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#9A3412]">
            {stats.holdCount}
          </div>
          <div className="text-[10.5px] text-[#C2410C] mt-0.5">Pending client feedback</div>
        </div>

        {/* Rejected */}
        <div className="bg-[#FEE2E2]/60 border border-[#FCA5A5] rounded-xl p-3 sm:p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-[#B91C1C] uppercase tracking-wider mb-1">
            Rejected
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#991B1B]">
            {stats.rejectedCount}
          </div>
          <div className="text-[10.5px] text-[#B91C1C] mt-0.5">Policy / RCU decline</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E3EBE0] rounded-xl p-3 sm:p-4 mb-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829283]"
          />
          <input
            type="text"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#DCE4D9] bg-[#F8F9F5] text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:bg-white transition-all placeholder:text-[#9AAB9B]"
            placeholder="Search by Name, App No, Mobile, Bank, Location, PAN Card, Remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
            {[
              "ALL",
              "DISBURSED",
              "LOGIN",
              "HOLD",
              "REJECTED",
              "CANCELLED",
            ].map((st) => {
              const active = selectedStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-[#163A2C] text-white shadow-2xs"
                      : "bg-[#F3F6F0] text-[#576558] hover:bg-[#E3EDE0] hover:text-[#17241B]"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>

          {/* Bank Select */}
          {uniqueBanks.length > 0 && (
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-[#DCE4D9] bg-[#F8F9F5] text-xs font-semibold text-[#17241B] outline-none focus:border-[#163A2C] cursor-pointer"
            >
              <option value="ALL">All Banks ({uniqueBanks.length})</option>
              {uniqueBanks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Cases Table - Faithfully matching spreadsheet screenshot */}
      <div className="bg-white border border-[#E3EBE0] rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            {/* Yellow Header Row like spreadsheet */}
            <thead>
              <tr className="bg-[#FFFF00] border-b-2 border-black text-black text-[11px] font-black uppercase tracking-tight">
                <th className="py-2.5 px-3 border-r border-black/30 w-24">
                  Customer ID
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 min-w-[170px]">
                  NAME
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 min-w-[125px]">
                  Bank Name
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 min-w-[110px]">
                  Location
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 w-28 text-center">
                  STATUS
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 min-w-[150px]">
                  Application No
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 min-w-[190px]">
                  Remarks
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 min-w-[120px] text-right">
                  APPROVED AMT
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 min-w-[120px] text-right">
                  Applied Amount
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 min-w-[120px]">
                  Contact No
                </th>
                <th className="py-2.5 px-3 border-r border-black/30 w-28">
                  PAN Card
                </th>
                <th className="py-2.5 px-3 w-20 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/20 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-[#163A2C]" />
                      <span className="text-xs font-semibold">
                        Decrypting and loading locked case records...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderLock size={28} className="text-gray-400" />
                      <span className="font-semibold text-gray-700">
                        No case entries found matching your criteria.
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="mt-2 text-xs text-[#163A2C] font-bold underline"
                      >
                        Add your first case entry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCases.map((item) => {
                  const cfg =
                    STATUS_CONFIG[item.status] || STATUS_CONFIG.LOGIN;
                  return (
                    <tr
                      key={item._id}
                      className={`transition-colors border-b border-black/15 font-medium ${cfg.rowHighlight || "hover:bg-gray-50"}`}
                    >
                      {/* Customer ID */}
                      <td className="py-2.5 px-3 border-r border-black/15 font-mono font-bold text-[#1E3A8A]">
                        {item.customerId}
                      </td>

                      {/* NAME */}
                      <td className="py-2.5 px-3 border-r border-black/15 font-bold text-[#111827] uppercase">
                        {item.name}
                        {item.product && (
                          <div className="text-[10px] font-normal text-gray-500 lowercase first-letter:uppercase">
                            {item.product}
                          </div>
                        )}
                      </td>

                      {/* Bank Name */}
                      <td className="py-2.5 px-3 border-r border-black/15 font-bold text-gray-900 uppercase">
                        {item.bankName}
                      </td>

                      {/* Location */}
                      <td className="py-2.5 px-3 border-r border-black/15 font-semibold text-gray-800 uppercase">
                        {item.location}
                      </td>

                      {/* STATUS with dropdown for fast editing */}
                      <td className="py-2 px-2 border-r border-black/15 text-center">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              item._id,
                              e.target.value as CaseRecord["status"]
                            )
                          }
                          className={`w-full py-1 px-1.5 rounded-md text-[10.5px] font-black uppercase tracking-tight border cursor-pointer outline-none transition-all ${cfg.badgeBg} ${cfg.badgeText} ${cfg.border}`}
                          title="Click to quick-change status"
                        >
                          <option value="DISBURSED">DISBURSED</option>
                          <option value="LOGIN">LOGIN</option>
                          <option value="HOLD">HOLD</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="APPROVED">APPROVED</option>
                        </select>
                      </td>

                      {/* Application No */}
                      <td className="py-2.5 px-3 border-r border-black/15 font-mono text-[11.5px] text-gray-800">
                        {item.applicationNo || "-"}
                      </td>

                      {/* Remarks */}
                      <td
                        className="py-2.5 px-3 border-r border-black/15 text-gray-700 text-[11px] leading-snug max-w-[220px] truncate"
                        title={item.remarks}
                      >
                        {item.remarks || "-"}
                      </td>

                      {/* APPROVED AMT */}
                      <td className="py-2.5 px-3 border-r border-black/15 text-right font-mono font-bold text-[#166534]">
                        {formatCurrency(item.approvedAmount)}
                      </td>

                      {/* Applied Loan Amount */}
                      <td className="py-2.5 px-3 border-r border-black/15 text-right font-mono font-semibold text-gray-800">
                        {formatCurrency(item.appliedAmount)}
                      </td>

                      {/* Contact No */}
                      <td className="py-2.5 px-3 border-r border-black/15 font-mono text-gray-800 text-[11px]">
                        {item.contactNo ? (
                          <a
                            href={`tel:${item.contactNo}`}
                            className="hover:underline hover:text-[#163A2C]"
                          >
                            {item.contactNo}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* PAN Card */}
                      <td className="py-2.5 px-3 border-r border-black/15 font-mono font-bold text-gray-700 uppercase">
                        {item.panCard ? (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            {item.panCard}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded text-gray-500 hover:text-[#163A2C] hover:bg-gray-200/70 transition-colors cursor-pointer"
                            title="Edit Case"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCaseId(item._id)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Case"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-3 sm:p-3.5 bg-[#F8F9F5] border-t border-[#ECEFE9] flex flex-col md:flex-row items-center justify-between text-xs text-[#576558] gap-3">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong>{filteredCases.length === 0 ? 0 : startIndex + 1}</strong>{" "}
              to <strong>{endIndex}</strong> of{" "}
              <strong>{filteredCases.length}</strong> cases
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF4E9] text-[#163A2C] text-[10.5px] font-bold border border-[#DCE4D9]">
              Limit: 12 at once
            </span>
          </div>

          {/* Page controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-[#DCE4D9] bg-white text-xs font-semibold text-[#17241B] hover:bg-[#EEF4EB] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Previous page"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Only show current, first, last, and immediate neighbors if > 7 pages
                  if (
                    totalPages > 7 &&
                    page !== 1 &&
                    page !== totalPages &&
                    Math.abs(page - currentPage) > 1
                  ) {
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <span key={page} className="px-1 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  const isActive = currentPage === page;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#163A2C] text-white shadow-2xs"
                          : "border border-[#DCE4D9] bg-white text-[#576558] hover:bg-[#EEF4EB] hover:text-[#17241B]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-[#DCE4D9] bg-white text-xs font-semibold text-[#17241B] hover:bg-[#EEF4EB] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Next page"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-[#6A7B6C]">
              Vault Encrypted • Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* ADD / EDIT CASE MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl border border-gray-100 my-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF4E9] text-[#163A2C] flex items-center justify-center">
                  <FolderLock size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {editingCase ? "Edit Case Entry" : "Add New Case to Vault"}
                  </h3>
                  <div className="text-[11px] text-gray-500">
                    Locked Folder • Superadmin Private Entry
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer ID */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Customer ID (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 uppercase font-mono text-gray-900 focus:bg-white focus:border-[#163A2C] outline-none"
                    placeholder="e.g. CUST-012"
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData({ ...formData, customerId: e.target.value })
                    }
                  />
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 uppercase text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. RAVINDER GAJENGI"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    list="bank-datalist"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 uppercase text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. KOTAK MAHINDRA"
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                  />
                  <datalist id="bank-datalist">
                    {BANK_SUGGESTIONS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                {/* Location */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 uppercase text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. HYDERABAD, DELHI, MUMBAI"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    STATUS *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as CaseRecord["status"],
                      })
                    }
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-gray-900 font-bold outline-none cursor-pointer focus:border-[#163A2C]"
                  >
                    <option value="LOGIN">LOGIN</option>
                    <option value="DISBURSED">DISBURSED</option>
                    <option value="HOLD">HOLD</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="APPROVED">APPROVED</option>
                  </select>
                </div>

                {/* Application No */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Application No
                  </label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 font-mono text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. PLRG2609191415405866"
                    value={formData.applicationNo}
                    onChange={(e) =>
                      setFormData({ ...formData, applicationNo: e.target.value })
                    }
                  />
                </div>

                {/* Contact No */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Contact No
                  </label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 font-mono text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. +91 99685 84137"
                    value={formData.contactNo}
                    onChange={(e) =>
                      setFormData({ ...formData, contactNo: e.target.value })
                    }
                  />
                </div>

                {/* Product */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Product
                  </label>
                  <input
                    type="text"
                    list="product-datalist"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. Personal Loan"
                    value={formData.product}
                    onChange={(e) =>
                      setFormData({ ...formData, product: e.target.value })
                    }
                  />
                  <datalist id="product-datalist">
                    {PRODUCT_SUGGESTIONS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                {/* PAN Card */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    PAN Card
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 uppercase font-mono font-bold text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. ABCDE1234F"
                    value={formData.panCard}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        panCard: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>

                {/* Applied Loan Amount */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Applied Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 font-mono text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. 2000000"
                    value={formData.appliedAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, appliedAmount: e.target.value })
                    }
                  />
                </div>

                {/* Approved Amount */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">
                    APPROVED AMT (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 font-mono font-bold text-emerald-800 bg-emerald-50/40 focus:border-emerald-600 outline-none"
                    placeholder="e.g. 1390000"
                    value={formData.approvedAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, approvedAmount: e.target.value })
                    }
                  />
                </div>

                {/* Remarks */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    className="w-full p-2.5 rounded-lg border border-gray-200 text-gray-900 focus:border-[#163A2C] outline-none"
                    placeholder="e.g. Physical file will send to today, DUAL PAN, Case Decline in RCU..."
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving to Vault..."
                    : editingCase
                    ? "Update Case"
                    : "Add to Locked Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCaseId && (
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setDeletingCaseId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Delete Case Entry?
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Are you sure you want to permanently delete this case record from your
              locked vault? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingCaseId(null)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingCaseId)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                {isSubmitting ? "Deleting..." : "Yes, Delete Case"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
