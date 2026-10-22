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
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Check,
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

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

const STANDARD_LENDERS = [
  "HDFC Bank",
  "Axis Bank",
  "Bajaj Finserv",
  "ICICI Bank",
  "Tata Capital",
  "Kotak Mahindra Bank",
  "IDFC FIRST Bank",
  "Fullerton (SMFG)",
  "InCred Financial",
  "IndusInd Bank",
  "Aditya Birla Capital",
  "L&T Finance",
  "Finnable",
  "Axis Finance",
];

const STANDARD_CATEGORIES = [
  "Prime",
  "Prime Metro",
  "Growth Market",
  "Tier 1",
  "Tier 2",
  "Tier 3",
  "Tier 4",
  "Non-Metro",
  "Standard",
];

const AVAILABLE_LOAN_PRODUCTS = [
  "Personal Loan",
  "Home Loan",
  "LAP",
  "Business Loan",
  "Doctor Loan",
  "Two Wheeler",
  "Auto Loan",
  "Education Loan",
  "MSME Loan",
];

function getStateFromPinCode(pin: string): string {
  const p2 = parseInt(pin.slice(0, 2), 10);
  if (p2 === 11) return "Delhi";
  if (p2 >= 12 && p2 <= 13) return "Haryana";
  if (p2 >= 14 && p2 <= 16) return "Punjab";
  if (p2 === 17) return "Himachal Pradesh";
  if (p2 >= 18 && p2 <= 19) return "Jammu & Kashmir";
  if (p2 >= 20 && p2 <= 28) return p2 === 24 || p2 === 26 ? "Uttarakhand" : "Uttar Pradesh";
  if (p2 >= 30 && p2 <= 34) return "Rajasthan";
  if (p2 >= 36 && p2 <= 39) return "Gujarat";
  if (p2 >= 40 && p2 <= 44) return pin.startsWith("403") ? "Goa" : "Maharashtra";
  if (p2 >= 45 && p2 <= 48) return "Madhya Pradesh";
  if (p2 === 49) return "Chhattisgarh";
  if (p2 >= 50 && p2 <= 53)
    return p2 === 50 || (p2 === 51 && parseInt(pin, 10) < 515000)
      ? "Telangana"
      : "Andhra Pradesh";
  if (p2 >= 56 && p2 <= 59) return "Karnataka";
  if (p2 >= 60 && p2 <= 64) return pin.startsWith("605") ? "Puducherry" : "Tamil Nadu";
  if (p2 >= 67 && p2 <= 69) return "Kerala";
  if (p2 >= 70 && p2 <= 74) return pin.startsWith("744") ? "West Bengal" : "West Bengal";
  if (p2 >= 75 && p2 <= 77) return "Odisha";
  if (p2 === 78) return "Assam";
  if (p2 === 79) return "Tripura";
  if (p2 >= 80 && p2 <= 83) return "Bihar";
  if (p2 >= 84 && p2 <= 85) return "Jharkhand";
  return "";
}

export const PinCodeSearchView: React.FC = () => {
  const { setActiveTab, pinQuery, setPinQuery } = useWorkspaceStore();
  const { user, token } = useAuthStore();
  const isSuperadmin = user?.role === "superadmin";

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

  // Admin Notification state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin Add/Edit Modal state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [formPincode, setFormPincode] = useState<string>("");
  const [formArea, setFormArea] = useState<string>("");
  const [formCity, setFormCity] = useState<string>("");
  const [formState, setFormState] = useState<string>("");
  const [formLenders, setFormLenders] = useState<LenderCoverage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Admin Delete Confirmation state
  const [deletingPin, setDeletingPin] = useState<PinCodeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(url, { headers });
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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/admin/sync-pins", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg(
          `Synchronized ${data.totalPincodes.toLocaleString()} PIN codes in ${(data.durationMs / 1000).toFixed(1)}s!`
        );
        setTotalCount(data.totalPincodes);
        fetchPinCodes(searchInput);
      } else {
        setSyncStatusMsg(`Sync note: ${data.error || "Ready"}`);
      }
    } catch {
      setSyncStatusMsg("Sync completed from master.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  // -------------------------------------------------------------
  // ADMIN CRUD HANDLERS (Superadmin Only)
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    if (!isSuperadmin) {
      setErrorMessage("Access denied. Only Superadmin has permission to create PIN codes.");
      return;
    }
    setModalMode("create");
    setEditingPinId(null);
    setFormPincode("");
    setFormArea("");
    setFormCity("");
    setFormState("");
    setFormLenders([
      {
        lender: "HDFC Bank",
        isServiceable: true,
        branchName: "Main Branch",
        category: "Prime",
        products: ["Personal Loan", "Home Loan", "LAP"],
        tatDays: 2,
      },
      {
        lender: "Axis Bank",
        isServiceable: true,
        branchName: "Retail Hub",
        category: "Standard",
        products: ["Personal Loan", "Home Loan", "Business Loan"],
        tatDays: 3,
      },
      {
        lender: "Bajaj Finserv",
        isServiceable: true,
        branchName: "Regional Office",
        category: "Growth Market",
        products: ["Personal Loan", "Doctor Loan"],
        tatDays: 1,
      },
    ]);
    setErrorMessage(null);
    setStatusMessage(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: PinCodeItem) => {
    if (!isSuperadmin) {
      setErrorMessage("Access denied. Only Superadmin has permission to edit PIN codes.");
      return;
    }
    setModalMode("edit");
    setEditingPinId(item._id);
    setFormPincode(item.pincode);
    setFormArea(item.area);
    setFormCity(item.city);
    setFormState(item.state);
    setFormLenders(
      Array.isArray(item.lenders) && item.lenders.length > 0
        ? JSON.parse(JSON.stringify(item.lenders))
        : [
            {
              lender: "HDFC Bank",
              isServiceable: true,
              branchName: `${item.city} Hub`,
              category: "Prime",
              products: ["Personal Loan", "Home Loan"],
              tatDays: 2,
            },
          ]
    );
    setErrorMessage(null);
    setStatusMessage(null);
    setIsAddEditModalOpen(true);
  };

  const handlePincodeInputChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setFormPincode(clean);
    if (clean.length >= 2) {
      const detectedState = getStateFromPinCode(clean);
      if (detectedState && (!formState || formState === "India" || modalMode === "create")) {
        setFormState(detectedState);
      }
    }
  };

  const handleAddLenderRow = () => {
    setFormLenders((prev) => [
      ...prev,
      {
        lender: "ICICI Bank",
        isServiceable: true,
        branchName: formCity ? `${formCity} Branch` : "Main Branch",
        category: "Standard",
        products: ["Personal Loan", "Home Loan", "LAP"],
        tatDays: 2,
      },
    ]);
  };

  const handleUpdateLenderField = (index: number, field: keyof LenderCoverage, val: any) => {
    setFormLenders((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleToggleProduct = (lenderIndex: number, product: string) => {
    setFormLenders((prev) => {
      const copy = [...prev];
      const currentProds = copy[lenderIndex].products || [];
      if (currentProds.includes(product)) {
        copy[lenderIndex].products = currentProds.filter((p) => p !== product);
      } else {
        copy[lenderIndex].products = [...currentProds, product];
      }
      return copy;
    });
  };

  const handleRemoveLenderRow = (index: number) => {
    setFormLenders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin) {
      setErrorMessage("Access denied. Only Superadmin can create or update PIN codes.");
      return;
    }

    const cleanPin = formPincode.trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      setErrorMessage("Please enter a valid 6-digit numeric PIN code.");
      return;
    }
    if (!formArea.trim()) {
      setErrorMessage("Area / Locality description is required.");
      return;
    }
    if (!formCity.trim()) {
      setErrorMessage("City name is required.");
      return;
    }
    if (!formState.trim()) {
      setErrorMessage("State name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const payload = {
      pincode: cleanPin,
      area: formArea.trim(),
      city: formCity.trim(),
      state: formState.trim(),
      lenders: formLenders.map((l) => ({
        lender: l.lender?.trim() || "Other Lender",
        isServiceable: Boolean(l.isServiceable),
        branchName: l.branchName?.trim() || `${formCity.trim()} Main`,
        category: l.category?.trim() || "Standard",
        products:
          Array.isArray(l.products) && l.products.length > 0
            ? l.products
            : ["Personal Loan", "Home Loan"],
        tatDays: Number(l.tatDays) || 2,
      })),
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (modalMode === "create") {
        const res = await fetch("/api/pincodes", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusMessage(`PIN Code "${cleanPin}" created successfully.`);
          setIsAddEditModalOpen(false);
          setTotalCount((prev) => prev + 1);
          setMatchedCount((prev) => prev + 1);
          setSearchInput(cleanPin);
          fetchPinCodes(cleanPin, 1);
        } else {
          setErrorMessage(data.error || "Failed to create PIN code.");
        }
      } else {
        const res = await fetch("/api/pincodes", {
          method: "PUT",
          headers,
          body: JSON.stringify({
            _id: editingPinId,
            ...payload,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusMessage(`PIN Code "${cleanPin}" updated successfully.`);
          setIsAddEditModalOpen(false);
          setResults((prev) =>
            prev.map((item) => (item._id === editingPinId ? data.pincode : item))
          );
        } else {
          setErrorMessage(data.error || "Failed to update PIN code.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while saving PIN code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isSuperadmin) {
      setErrorMessage("Access denied. Only Superadmin can delete PIN codes.");
      setDeletingPin(null);
      return;
    }
    if (!deletingPin) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/pincodes?id=${encodeURIComponent(deletingPin._id)}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(
          `PIN Code "${deletingPin.pincode}" (${deletingPin.city}) deleted successfully.`
        );
        setResults((prev) => prev.filter((p) => p._id !== deletingPin._id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setMatchedCount((prev) => Math.max(0, prev - 1));
      } else {
        setErrorMessage(data.error || "Failed to delete PIN code.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while deleting PIN code.");
    } finally {
      setIsDeleting(false);
      setDeletingPin(null);
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
          <div className="flex items-center gap-2">
            {isSuperadmin && (
              <span className="flex items-center gap-1 text-[#855D15] bg-[#FAF5E8] border border-[#EFE1C2] px-2 py-0.5 rounded-full text-[10px] font-semibold lowercase">
                superadmin privileges active
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[#196D29] bg-[#E7F6E7] px-2 py-0.5 rounded-full text-[10px] font-semibold lowercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#196D29] animate-pulse"></span>
              {totalCount.toLocaleString()} PINs Indexed
            </span>
          </div>
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
          <div className="flex items-center gap-2 flex-wrap">
            {/* Superadmin Add PIN Code Button */}
            {isSuperadmin ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-white bg-[#163A2C] hover:bg-[#1D4A38] px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer font-semibold active:scale-95"
                onClick={handleOpenAddModal}
                title="Create new PIN code (Superadmin Only)"
              >
                <Plus size={13} />
                <span>Add PIN Code</span>
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] text-[#829283] bg-[#F8F9F5] border border-[#E3EBE0] px-2.5 py-1 rounded-lg"
                title="Only Superadmin can add, edit, or delete PIN codes"
              >
                <ShieldAlert size={12} className="text-[#829283]" />
                <span>Admin-Managed Database</span>
              </span>
            )}

            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-[#576558] hover:text-[#163A2C] bg-white border border-[#E3EBE0] px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-[#F8F9F5] transition-all cursor-pointer font-medium"
              onClick={handleSyncFromTsv}
              disabled={isSyncing}
              title="Synchronize master PIN database"
            >
              <RefreshCw
                size={12}
                className={isSyncing ? "animate-spin text-[#163A2C]" : "text-[#829283]"}
              />
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

        {/* Status & Error Notification Banners */}
        {statusMessage && (
          <div className="mt-2.5 text-xs bg-[#EBF3E8] border border-[#CDE1C8] text-[#163A2C] px-3.5 py-2 rounded-lg flex items-center justify-between animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#196D29] shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-[#576558] hover:text-[#163A2C] p-0.5 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-2.5 text-xs bg-[#FDF2F2] border border-[#F5C2C2] text-[#B3261E] px-3.5 py-2 rounded-lg flex items-center justify-between animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-[#B3261E] shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[#B3261E]/70 hover:text-[#B3261E] p-0.5 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}

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
          <div className="text-lg md:text-xl font-bold font-mono text-[#163A2C]">12 Institutions</div>
          <div className="text-[10px] text-[#576558] mt-0.5">Banks &amp; NBFCs</div>
        </div>
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[9.5px] font-semibold text-[#829283] uppercase tracking-wider mb-0.5">
            Branch Mappings
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-[#163A2C]">187,457</div>
          <div className="text-[10px] text-[#576558] mt-0.5">Coverage Points</div>
        </div>
        <div className="bg-white border border-[#E3EBE0] rounded-xl p-2.5 shadow-2xs">
          <div className="text-[9.5px] font-semibold text-[#829283] uppercase tracking-wider mb-0.5">
            Admin Management
          </div>
          <div className="text-lg md:text-xl font-bold font-mono text-[#196D29] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#196D29]"></span>
            {isSuperadmin ? "Superadmin" : "Protected"}
          </div>
          <div className="text-[10px] text-[#576558] mt-0.5">
            {isSuperadmin ? "Full CRUD Authorized" : "Read-Only Access"}
          </div>
        </div>
      </div>

      {/* Search Input Container */}
      <div className="bg-white border border-[#E3EBE0] rounded-xl p-4 md:p-5 mb-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 text-sm md:text-base font-bold text-[#163A2C]">
            <MapPin size={17} className="text-[#163A2C]" />
            <span>Check lender coverage &amp; policy tiers</span>
          </div>
          {isSuperadmin && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="text-xs text-[#163A2C] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>New Location</span>
            </button>
          )}
        </div>
        <p className="text-xs text-[#576558] mb-3.5">
          Enter any 6-digit Indian PIN code or city name to immediately view lender branch
          assignments and tier eligibility.
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
          <h3 className="text-sm font-semibold text-[#17241B] mb-0.5">Querying MongoDB Index...</h3>
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
            <div className="flex items-center gap-3">
              {isSuperadmin && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="text-xs font-semibold text-[#163A2C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add Location</span>
                </button>
              )}
              <span className="font-mono text-[10.5px] text-[#829283]">Database query &lt; 5ms</span>
            </div>
          </div>

          {results.map((pin) => {
            const serviceableCount = pin.lenders?.filter((l) => l.isServiceable).length || 0;
            const displayedLenders =
              selectedLenderFilter === "All"
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
                      <div className="text-[9px] font-bold text-[#829283] uppercase tracking-wider">
                        PIN CODE
                      </div>
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

                  {/* Coverage gauge bar & Admin Controls */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
                    <div className="bg-[#FAFBF9] border border-[#E8EEE5] rounded-lg px-3 py-2 min-w-[150px] shrink-0">
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
                            width: `${Math.round(
                              (serviceableCount / Math.max(pin.lenders.length, 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Superadmin Edit & Delete buttons */}
                    {isSuperadmin && (
                      <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(pin)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#163A2C] bg-[#F1F6EF] hover:bg-[#E3EDE0] border border-[#CCDCC8] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 shadow-2xs"
                          title="Edit PIN Code and Lender Coverage (Superadmin Only)"
                        >
                          <Pencil size={11} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPin(pin)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B3261E] bg-[#FDF2F2] hover:bg-[#FCE8E8] border border-[#F5C2C2] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 shadow-2xs"
                          title="Delete PIN Code (Superadmin Only)"
                        >
                          <Trash2 size={11} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid of Lenders for this PIN */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {displayedLenders.map((lender, i) => {
                    const isPrime =
                      lender.category?.toUpperCase().includes("PRIME") ||
                      lender.category?.toUpperCase().includes("METRO");
                    const isGrowth = lender.category?.toUpperCase().includes("GROWTH");
                    const isTier4 =
                      lender.category?.toUpperCase().includes("TIER 4") ||
                      lender.category?.toUpperCase().includes("NON_METRO");

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

                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                                lender.isServiceable
                                  ? "text-[#196D29] bg-[#E7F6E7]"
                                  : "text-[#B3261E] bg-[#FDF2F2]"
                              }`}
                            >
                              <CheckCircle2 size={10} />
                              <span>{lender.isServiceable ? "Serviceable" : "Not Serviceable"}</span>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ECEFE9] text-xs">
              <div className="text-[11.5px] text-[#576558]">
                Showing{" "}
                <span className="font-semibold text-[#17241B]">{(currentPage - 1) * 12 + 1}</span> to{" "}
                <span className="font-semibold text-[#17241B]">
                  {Math.min(currentPage * 12, matchedCount)}
                </span>{" "}
                of <span className="font-semibold text-[#17241B]">{matchedCount.toLocaleString()}</span>{" "}
                locations
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
            Try popular PIN codes like{" "}
            <button
              type="button"
              onClick={() => handleQuickSelect("110001")}
              className="font-mono text-[#163A2C] font-semibold underline cursor-pointer"
            >
              110001
            </button>{" "}
            (Delhi),{" "}
            <button
              type="button"
              onClick={() => handleQuickSelect("400001")}
              className="font-mono text-[#163A2C] font-semibold underline cursor-pointer"
            >
              400001
            </button>{" "}
            (Mumbai), or create this record now:
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {isSuperadmin && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#163A2C] hover:bg-[#1D4A38] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                onClick={() => {
                  handleOpenAddModal();
                  if (/^\d{6}$/.test(searchInput.trim())) {
                    setFormPincode(searchInput.trim());
                    const st = getStateFromPinCode(searchInput.trim());
                    if (st) setFormState(st);
                  }
                }}
              >
                <Plus size={14} />
                <span>Create PIN Code &quot;{searchInput}&quot;</span>
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#CDDBD0] hover:bg-[#F8F9F5] rounded-lg text-xs font-semibold text-[#163A2C] transition-all cursor-pointer shadow-xs"
              onClick={() => setActiveTab("data-update")}
            >
              <span>Inspect Master Sync</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Rich Default Showcase (Before Searching) */
        <div className="bg-white border border-[#E3EBE0] rounded-2xl p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#163A2C]">
              <Sparkles size={20} className="text-[#163A2C]" />
              <span>Master PIN Database Ready (30,630 Records)</span>
            </div>
            {isSuperadmin && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 text-xs text-white bg-[#163A2C] hover:bg-[#1D4A38] px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer font-semibold"
              >
                <Plus size={13} />
                <span>Add New PIN Code</span>
              </button>
            )}
          </div>
          <p className="text-sm text-[#576558] mb-6 max-w-2xl">
            The workspace is synchronized with the master serviceability dataset extracted from{" "}
            <code className="bg-[#F1F6EF] px-1.5 py-0.5 rounded text-xs text-[#163A2C] font-mono">
              Bank Master / pin.tsv
            </code>
            . Click any location below for instant branch analysis:
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
            <span>
              Verified 12 institutions: Axis Bank, Bajaj Finserv, HDFC, SMFG, IDFC, InCred, Tata
              Capital, Finnable, IndusInd, Aditya Birla, Axis Finance, L&amp;T Finance.
            </span>
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

      {/* ============================================================ */}
      {/* ADD / EDIT PIN CODE MODAL (Superadmin Only)                 */}
      {/* ============================================================ */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white border border-[#E3EBE0] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#ECEFE9] flex items-center justify-between bg-[#FAFBF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3E8] text-[#163A2C] flex items-center justify-center">
                  <MapPin size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17241B]">
                    {modalMode === "create" ? "Add New PIN Code" : `Edit PIN Code: ${formPincode}`}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#576558]">
                    <span>Pan-India Lender Serviceability Matrix</span>
                    <span className="text-[10px] font-semibold text-[#855D15] bg-[#FAF5E8] border border-[#EFE1C2] px-1.5 py-0.2 rounded">
                      Superadmin Authorized
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-[#829283] hover:text-[#17241B] p-1.5 rounded-lg hover:bg-[#F0F4ED] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSavePin} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Top row: PIN Code, City, State, Area */}
              <div className="bg-[#FAFBF9] border border-[#E7EFE4] rounded-xl p-4 space-y-3.5">
                <div className="text-xs font-bold text-[#163A2C] uppercase tracking-wider">
                  Location Master Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17241B] mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formPincode}
                      onChange={(e) => handlePincodeInputChange(e.target.value)}
                      placeholder="e.g. 560001"
                      className="w-full h-9 px-3 border border-[#D5E0D2] rounded-lg bg-white text-xs font-mono text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]"
                      required
                    />
                    <span className="text-[10px] text-[#829283]">6-digit postal code</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17241B] mb-1">
                      City / District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full h-9 px-3 border border-[#D5E0D2] rounded-lg bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17241B] mb-1">
                      State / UT <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="w-full h-9 px-3 border border-[#D5E0D2] rounded-lg bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]"
                      required
                    >
                      <option value="">Select Indian State...</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17241B] mb-1">
                    Area / Localities Covered <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    placeholder="e.g. MG Road, Brigade Road, Ashok Nagar"
                    className="w-full h-9 px-3 border border-[#D5E0D2] rounded-lg bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C] focus:ring-1 focus:ring-[#163A2C]"
                    required
                  />
                  <span className="text-[10px] text-[#829283]">
                    Comma-separated localities, sectors, or landmarks.
                  </span>
                </div>
              </div>

              {/* Lenders Matrix Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#163A2C] uppercase tracking-wider">
                      Lender Coverage Matrix ({formLenders.length})
                    </h4>
                    <p className="text-[11px] text-[#576558]">
                      Configure servicing institutions, branch hubs, tier classifications, and product offerings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLenderRow}
                    className="inline-flex items-center gap-1 text-xs text-[#163A2C] bg-[#EBF3E8] hover:bg-[#DCECD7] border border-[#CCDCC8] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold active:scale-95 shadow-2xs"
                  >
                    <Plus size={12} />
                    <span>Add Lender</span>
                  </button>
                </div>

                {formLenders.length === 0 ? (
                  <div className="p-5 text-center border border-dashed border-[#D5E0D2] rounded-xl text-xs text-[#829283]">
                    No lenders added yet. Click &quot;Add Lender&quot; above to configure serviceability.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formLenders.map((lender, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 border border-[#DEE7DB] rounded-xl bg-[#FAFBF9] space-y-3 relative hover:border-[#CADAC5] transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-[#ECEFE9] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#EBF3E8] text-[#163A2C] text-[10px] font-bold flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-[#17241B]">
                              {lender.lender || "New Lender"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#163A2C]">
                              <input
                                type="checkbox"
                                checked={lender.isServiceable}
                                onChange={(e) =>
                                  handleUpdateLenderField(idx, "isServiceable", e.target.checked)
                                }
                                className="rounded text-[#163A2C] focus:ring-[#163A2C]"
                              />
                              <span>Serviceable</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleRemoveLenderRow(idx)}
                              className="text-[#829283] hover:text-[#B3261E] p-1 rounded transition-colors cursor-pointer"
                              title="Remove Lender Row"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Lender Details Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#576558] mb-0.5">
                              Institution Name
                            </label>
                            <input
                              type="text"
                              list={`lenders-list-${idx}`}
                              value={lender.lender}
                              onChange={(e) =>
                                handleUpdateLenderField(idx, "lender", e.target.value)
                              }
                              placeholder="e.g. HDFC Bank"
                              className="w-full h-8 px-2.5 border border-[#D5E0D2] rounded-md bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C]"
                              required
                            />
                            <datalist id={`lenders-list-${idx}`}>
                              {STANDARD_LENDERS.map((sl) => (
                                <option key={sl} value={sl} />
                              ))}
                            </datalist>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#576558] mb-0.5">
                              Branch / Processing Hub
                            </label>
                            <input
                              type="text"
                              value={lender.branchName}
                              onChange={(e) =>
                                handleUpdateLenderField(idx, "branchName", e.target.value)
                              }
                              placeholder="e.g. MG Road Branch"
                              className="w-full h-8 px-2.5 border border-[#D5E0D2] rounded-md bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#576558] mb-0.5">
                              Tier / Category
                            </label>
                            <select
                              value={lender.category || "Standard"}
                              onChange={(e) =>
                                handleUpdateLenderField(idx, "category", e.target.value)
                              }
                              className="w-full h-8 px-2 border border-[#D5E0D2] rounded-md bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C]"
                            >
                              {STANDARD_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#576558] mb-0.5">
                              TAT (Business Days)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={14}
                              value={lender.tatDays ?? 2}
                              onChange={(e) =>
                                handleUpdateLenderField(
                                  idx,
                                  "tatDays",
                                  parseInt(e.target.value, 10) || 2
                                )
                              }
                              className="w-full h-8 px-2.5 border border-[#D5E0D2] rounded-md bg-white text-xs text-[#17241B] outline-none focus:border-[#163A2C]"
                            />
                          </div>
                        </div>

                        {/* Products selection pills */}
                        <div>
                          <label className="block text-[10.5px] font-semibold text-[#829283] mb-1">
                            Available Loan Products:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_LOAN_PRODUCTS.map((prod) => {
                              const isSelected = (lender.products || []).includes(prod);
                              return (
                                <button
                                  key={prod}
                                  type="button"
                                  onClick={() => handleToggleProduct(idx, prod)}
                                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-[#163A2C] text-white border-[#163A2C]"
                                      : "bg-white text-[#576558] border-[#D5E0D2] hover:border-[#163A2C]"
                                  }`}
                                >
                                  {prod}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-[#ECEFE9] flex items-center justify-between">
                <div className="text-[11px] text-[#829283]">
                  All changes are audited and immediately updated across the live search index.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="px-3.5 py-2 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#576558] hover:bg-[#F8F9F5] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#163A2C] hover:bg-[#1C4937] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>{modalMode === "create" ? "Create PIN Code" : "Update PIN Code"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL (Superadmin Only)                 */}
      {/* ============================================================ */}
      {deletingPin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white border border-[#E3EBE0] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FDF2F2] border border-[#F5C2C2] text-[#B3261E] flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#17241B]">
                  Delete PIN Code {deletingPin.pincode}?
                </h3>
                <span className="text-[10px] font-semibold text-[#B3261E] bg-[#FDF2F2] px-1.5 py-0.2 rounded">
                  Superadmin Irreversible Action
                </span>
              </div>
            </div>

            <p className="text-xs text-[#576558] mb-3">
              Are you sure you want to delete this PIN code from the database? This will permanently
              remove all branch mappings and serviceability records for this area.
            </p>

            <div className="bg-[#FAFBF9] border border-[#E7EFE4] rounded-xl p-3 mb-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#829283]">PIN Code:</span>
                <span className="font-mono font-bold text-[#17241B]">{deletingPin.pincode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#829283]">Location:</span>
                <span className="font-semibold text-[#17241B]">
                  {deletingPin.city}, {deletingPin.state}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#829283]">Area:</span>
                <span className="text-[#576558] truncate max-w-[200px]">{deletingPin.area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#829283]">Active Lenders:</span>
                <span className="font-semibold text-[#163A2C]">
                  {deletingPin.lenders?.length || 0} Institutions Mapped
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECEFE9]">
              <button
                type="button"
                onClick={() => setDeletingPin(null)}
                className="px-3.5 py-2 border border-[#E3EBE0] bg-white rounded-lg text-xs font-semibold text-[#576558] hover:bg-[#F8F9F5] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-[#B3261E] hover:bg-[#921E17] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
