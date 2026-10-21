"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Landmark,
  Search,
  ArrowUpRight,
  Phone,
  Mail,
  MapPin,
  Building2,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Briefcase,
  FileText,
  Tag,
  CheckCircle2,
  Upload,
  Download,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ClipboardPaste,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  parseBankersCsv,
  downloadSampleCsvTemplate,
  SAMPLE_AXIS_BANK_CSV,
  detectBankFromEmail,
  ParsedBankerRow,
  ParseResult,
} from "@/lib/services/bankerCsvParser";

export interface BankerContact {
  _id?: string;
  id?: string;
  name: string;
  bankName: string;
  designation: string;
  branch: string;
  city: string;
  phone: string;
  email: string;
  productsHandled: string[];
  isVerified: boolean;
  isDemo?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const COMMON_BANKS = [
  "Axis Bank",
  "HDFC Bank",
  "ICICI Bank",
  "Kotak Mahindra Bank",
  "State Bank of India (SBI)",
  "Tata Capital",
  "Bajaj Finserv",
  "IndusInd Bank",
  "IDFC FIRST Bank",
  "Poonawalla Fincorp",
  "Piramal Finance",
  "L&T Finance",
  "Axis Finance",
  "Fullerton (SMFG)",
  "Yes Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Canara Bank",
  "Federal Bank",
  "AU Small Finance Bank",
  "Other / NBFC",
];

const COMMON_PRODUCTS = [
  "Personal Loan",
  "Home Loan",
  "Business Loan",
  "LAP (Loan Against Property)",
  "Doctor Loans",
  "Working Capital",
  "Auto Loan",
  "Balance Transfer",
  "CGTMSE SME",
];

const INITIAL_FALLBACK_DEMO_BANKERS: BankerContact[] = [
  {
    _id: "demo-1",
    name: "Rohan Malhotra",
    bankName: "HDFC Bank",
    designation: "Senior Branch Credit Manager",
    branch: "Connaught Place, New Delhi",
    city: "New Delhi",
    phone: "+91 98110 24890",
    email: "rohan.malhotra@hdfcbank.com",
    productsHandled: ["Personal Loan", "Business Loan", "LAP (Loan Against Property)"],
    isVerified: true,
    isDemo: true,
    notes: "Specialized in high-ticket salaried cases and priority doctor loans.",
  },
  {
    _id: "demo-2",
    name: "Pooja Varma",
    bankName: "ICICI Bank",
    designation: "Relationship Manager - Retail Lending",
    branch: "Bandra Kurla Complex (BKC)",
    city: "Mumbai",
    phone: "+91 98201 45892",
    email: "pooja.varma@icicibank.com",
    productsHandled: ["Home Loan", "Balance Transfer", "Personal Loan"],
    isVerified: true,
    isDemo: true,
    notes: "Handles corporate salary account tie-ups and priority housing sanctions.",
  },
  {
    _id: "demo-3",
    name: "Sandeep Rao",
    bankName: "Axis Bank",
    designation: "Assistant Vice President - DSA Liaison",
    branch: "MG Road, Bengaluru",
    city: "Bengaluru",
    phone: "+91 97415 67210",
    email: "sandeep.rao@axisbank.com",
    productsHandled: ["Working Capital", "Business Loan", "Doctor Loans"],
    isVerified: true,
    isDemo: true,
    notes: "Direct contact for fast-track DSA file approvals and high-multiplier profiles.",
  },
  {
    _id: "demo-4",
    name: "Anil Kulkarni",
    bankName: "State Bank of India (SBI)",
    designation: "Chief Manager (SME & Retail)",
    branch: "FC Road, Pune",
    city: "Pune",
    phone: "+91 94220 89134",
    email: "anil.kulkarni@sbi.co.in",
    productsHandled: ["Home Loan", "CGTMSE SME", "Auto Loan"],
    isVerified: true,
    isDemo: true,
    notes: "Government PSU loan schemes, MSME guarantees, and subsidized retail credit.",
  },
];

export const BankersSearchView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();
  const { user, token } = useAuthStore();
  const isSuperadmin = user?.role === "superadmin";
  const [bankers, setBankers] = useState<BankerContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "custom" | "demo">("all");

  // Status Alerts
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Modal State: Create / Edit Banker
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>("");
  const [formBankName, setFormBankName] = useState<string>("Axis Bank");
  const [formCustomBank, setFormCustomBank] = useState<string>("");
  const [formDesignation, setFormDesignation] = useState<string>("");
  const [formBranch, setFormBranch] = useState<string>("");
  const [formCity, setFormCity] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formProducts, setFormProducts] = useState<string[]>(["Personal Loan"]);
  const [formIsVerified, setFormIsVerified] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState<string>("");
  const [customProductInput, setCustomProductInput] = useState<string>("");

  // Delete Confirmation State
  const [deletingBanker, setDeletingBanker] = useState<BankerContact | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importTab, setImportTab] = useState<"upload" | "paste">("upload");
  const [importRawText, setImportRawText] = useState<string>("");
  const [importSelectedBank, setImportSelectedBank] = useState<string>("auto");
  const [importCustomBank, setImportCustomBank] = useState<string>("");
  const [importDesignation, setImportDesignation] = useState<string>("Sales Manager");
  const [importProduct, setImportProduct] = useState<string>("Personal Loan");
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Bankers from API
  const fetchBankers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bankers");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.bankers)) {
          setBankers(data.bankers);
        }
      }
    } catch (err) {
      console.warn("Could not fetch bankers from API, using cached state", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankers();
  }, []);

  // Compute available unique banks and their counts dynamically from data
  const availableBanks = useMemo(() => {
    const bankCounts: Record<string, number> = {};
    bankers.forEach((banker) => {
      const bName = banker.bankName?.trim();
      if (bName) {
        bankCounts[bName] = (bankCounts[bName] || 0) + 1;
      }
    });

    // Sort by count descending, then alphabetically
    const sortedNames = Object.keys(bankCounts).sort((a, b) => {
      if (bankCounts[b] !== bankCounts[a]) {
        return bankCounts[b] - bankCounts[a];
      }
      return a.localeCompare(b);
    });

    return {
      counts: bankCounts,
      names: sortedNames,
    };
  }, [bankers]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    if (!isSuperadmin) {
      setErrorMessage("Permission denied. Only Superadmin can add banker records.");
      return;
    }
    setModalMode("create");
    setEditingId(null);
    setFormName("");
    setFormBankName("Axis Bank");
    setFormCustomBank("");
    setFormDesignation("");
    setFormBranch("");
    setFormCity("");
    setFormPhone("");
    setFormEmail("");
    setFormProducts(["Personal Loan"]);
    setFormIsVerified(true);
    setFormNotes("");
    setCustomProductInput("");
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (banker: BankerContact) => {
    if (!isSuperadmin) {
      setErrorMessage("Permission denied. Only Superadmin can edit banker records.");
      return;
    }
    const id = banker._id || banker.id || "";
    setModalMode("edit");
    setEditingId(id);
    setFormName(banker.name);

    if (COMMON_BANKS.includes(banker.bankName)) {
      setFormBankName(banker.bankName);
      setFormCustomBank("");
    } else {
      setFormBankName("Other / NBFC");
      setFormCustomBank(banker.bankName);
    }

    setFormDesignation(banker.designation);
    setFormBranch(banker.branch);
    setFormCity(banker.city);
    setFormPhone(banker.phone);
    setFormEmail(banker.email || "");
    setFormProducts(banker.productsHandled || ["Personal Loan"]);
    setFormIsVerified(banker.isVerified ?? true);
    setFormNotes(banker.notes || "");
    setCustomProductInput("");
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Open CSV Import Modal
  const handleOpenImportModal = () => {
    if (!isSuperadmin) {
      setErrorMessage("Permission denied. Only Superadmin can import banker directories.");
      return;
    }
    setImportRawText("");
    setParsedData(null);
    setFileName("");
    setImportSelectedBank("auto");
    setImportCustomBank("");
    setImportDesignation("Sales Manager");
    setImportProduct("Personal Loan");
    setIsImportModalOpen(true);
  };

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportRawText(text);
        runParsing(text, importSelectedBank, importCustomBank, importDesignation, importProduct);
      }
    };
    reader.readAsText(file);
  };

  // Run parser
  const runParsing = (
    text: string,
    bankOption: string,
    customBank: string,
    designation: string,
    product: string
  ) => {
    if (!text.trim()) {
      setParsedData(null);
      return;
    }
    const effectiveBank =
      bankOption === "custom" && customBank.trim()
        ? customBank.trim()
        : bankOption === "auto"
        ? undefined
        : bankOption;

    const result = parseBankersCsv(text, {
      defaultBank: effectiveBank,
      defaultDesignation: designation || "Sales Manager",
      defaultProduct: product || "Personal Loan",
    });
    setParsedData(result);
  };

  // Re-run parsing when bank option or custom input changes
  useEffect(() => {
    if (importRawText) {
      runParsing(importRawText, importSelectedBank, importCustomBank, importDesignation, importProduct);
    }
  }, [importSelectedBank, importCustomBank, importDesignation, importProduct, importRawText]);

  // Load sample ICICI Bank data from reference sheet
  const handleLoadSampleData = () => {
    setFileName("sample_icici_bank_ncr.csv");
    setImportRawText(SAMPLE_AXIS_BANK_CSV);
    setImportSelectedBank("auto");
    setImportDesignation("Relationship Manager");
    setImportProduct("Personal Loan");
    runParsing(SAMPLE_AXIS_BANK_CSV, "auto", "", "Relationship Manager", "Personal Loan");
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!isSuperadmin) {
      setErrorMessage("Permission denied. Only Superadmin can import bankers.");
      return;
    }
    if (!parsedData || parsedData.valid.length === 0) return;

    setIsImporting(true);
    setErrorMessage("");

    try {
      const payload = {
        bankers: parsedData.valid,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/bankers/import", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Successfully saved in DB
        const newBankersList = Array.isArray(data.bankers) ? data.bankers : parsedData.valid;
        setBankers((prev) => [...newBankersList, ...prev]);

        // Determine dominant bank to automatically select filter
        const bankKeys = Object.keys(parsedData.banksDetected);
        const dominantBank = bankKeys.length > 0 ? bankKeys[0] : "all";
        if (dominantBank) {
          setSelectedBank(dominantBank);
        }

        setStatusMessage(
          `Successfully imported ${data.count || parsedData.valid.length} banker contact(s)!`
        );
        setIsImportModalOpen(false);
      } else {
        setErrorMessage(data.error || "Failed to import bankers. Superadmin permission required.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  // Toggle product selection in form
  const toggleProduct = (prod: string) => {
    if (formProducts.includes(prod)) {
      setFormProducts(formProducts.filter((p) => p !== prod));
    } else {
      setFormProducts([...formProducts, prod]);
    }
  };

  // Add custom product tag
  const handleAddCustomProduct = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = customProductInput.trim();
    if (trimmed && !formProducts.includes(trimmed)) {
      setFormProducts([...formProducts, trimmed]);
      setCustomProductInput("");
    }
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage("Please enter the banker's name.");
      return;
    }
    const finalBankName =
      formBankName === "Other / NBFC" && formCustomBank.trim()
        ? formCustomBank.trim()
        : formBankName;

    if (!finalBankName) {
      setErrorMessage("Please select or specify the bank institution.");
      return;
    }
    if (!formDesignation.trim()) {
      setErrorMessage("Please enter the banker's designation.");
      return;
    }
    if (!formBranch.trim()) {
      setErrorMessage("Please enter the branch or desk location.");
      return;
    }
    if (!formCity.trim()) {
      setErrorMessage("Please enter the city.");
      return;
    }
    if (!formPhone.trim()) {
      setErrorMessage("Please enter a contact phone number.");
      return;
    }

    if (!isSuperadmin) {
      setErrorMessage("Permission denied. Only Superadmin can create or update banker records.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");

    const payload = {
      name: formName.trim(),
      bankName: finalBankName,
      designation: formDesignation.trim(),
      branch: formBranch.trim(),
      city: formCity.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      productsHandled: formProducts.length > 0 ? formProducts : ["Personal Loan"],
      isVerified: formIsVerified,
      notes: formNotes.trim(),
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      if (modalMode === "create") {
        const res = await fetch("/api/bankers", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setBankers((prev) => [data.banker, ...prev]);
          setStatusMessage(`Banker record "${formName}" created successfully!`);
          setIsModalOpen(false);
        } else {
          setErrorMessage(data.error || "Failed to create banker record.");
        }
      } else {
        // Edit Mode
        const res = await fetch("/api/bankers", {
          method: "PUT",
          headers,
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setBankers((prev) =>
            prev.map((b) => ((b._id || b.id) === editingId ? data.banker : b))
          );
          setStatusMessage(`Banker record "${formName}" updated successfully!`);
          setIsModalOpen(false);
        } else {
          setErrorMessage(data.error || "Failed to update banker record.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save banker record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Record
  const handleConfirmDelete = async () => {
    if (!isSuperadmin) {
      setErrorMessage("Permission denied. Only Superadmin can delete banker records.");
      setDeletingBanker(null);
      return;
    }
    if (!deletingBanker) return;
    const id = deletingBanker._id || deletingBanker.id;
    if (!id) return;

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/bankers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBankers((prev) => prev.filter((b) => (b._id || b.id) !== id));
        setStatusMessage(`Deleted banker record for "${deletingBanker.name}".`);
      } else {
        setErrorMessage(data.error || "Failed to delete banker record.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete banker record.");
    } finally {
      setIsSubmitting(false);
      setDeletingBanker(null);
    }
  };

  // Handle Delete All Records (Admin Only)
  const handleDeleteAllBankers = async () => {
    if (!isSuperadmin) {
      setErrorMessage("Permission denied. Only Superadmin can delete bankers.");
      setIsDeleteAllModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/bankers?all=true", {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBankers([]);
        setStatusMessage(data.message || "All banker records have been deleted.");
      } else {
        setErrorMessage(data.error || "Failed to delete all bankers.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete all bankers.");
    } finally {
      setIsSubmitting(false);
      setIsDeleteAllModalOpen(false);
    }
  };

  // Filtered Bankers List
  const filteredBankers = useMemo(() => {
    return bankers.filter((banker) => {
      // Demo vs Custom filter
      if (filterType === "demo" && !banker.isDemo) return false;
      if (filterType === "custom" && banker.isDemo) return false;

      // Bank Filter
      if (selectedBank !== "all") {
        const bName = (banker.bankName || "").toLowerCase().trim();
        const sel = selectedBank.toLowerCase().trim();
        if (bName !== sel && !bName.includes(sel) && !sel.includes(bName)) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          banker.name.toLowerCase().includes(q) ||
          banker.bankName.toLowerCase().includes(q) ||
          banker.branch.toLowerCase().includes(q) ||
          banker.city.toLowerCase().includes(q) ||
          banker.designation.toLowerCase().includes(q) ||
          banker.phone.toLowerCase().includes(q) ||
          (banker.email && banker.email.toLowerCase().includes(q)) ||
          banker.productsHandled?.some((p) => p.toLowerCase().includes(q)) ||
          (banker.notes && banker.notes.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [bankers, searchQuery, selectedBank, filterType]);

  const demoCount = bankers.filter((b) => b.isDemo).length;
  const customCount = bankers.filter((b) => !b.isDemo).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-4">
      {/* View Header */}
      <div>
        <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          YOUR WORKSPACE / BANK DIRECTORY
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-[26px] font-semibold tracking-tight text-[#17241B] mb-1">
              Bankers search &amp; directory.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Manage and search direct branch credit managers, sales managers, and DSA liaisons across all partner banks.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {isSuperadmin ? (
              <>
                {/* Import from CSV Button */}
                <button
                  type="button"
                  onClick={handleOpenImportModal}
                  className="h-9 px-3.5 bg-white hover:bg-[#F0F5EE] text-[#163A2C] border border-[#C5DEC0] text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                  title="Bulk import banker contacts from CSV or Excel"
                >
                  <Upload size={14} className="text-[#257853]" />
                  <span>Import from CSV</span>
                </button>

                {/* Add New Banker Button */}
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="h-9 px-4 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Plus size={15} />
                  <span>Add New Banker</span>
                </button>

                {/* Delete All Button (Admin Only, when bankers exist) */}
                {bankers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteAllModalOpen(true)}
                    className="h-9 px-3 bg-white hover:bg-[#FDF2F2] text-[#991B1B] border border-[#F8D7DA] text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                    title="Delete all banker records in the directory"
                  >
                    <Trash2 size={13} />
                    <span>Delete All</span>
                  </button>
                )}
              </>
            ) : (
              <div className="h-9 px-3 bg-[#F4F6F2] text-[#637265] border border-[#E0E7DC] rounded-xl text-xs font-medium inline-flex items-center gap-1.5 select-none shadow-2xs">
                <Lock size={13} className="text-[#829283]" />
                <span>Directory (Read-Only)</span>
              </div>
            )}

            {/* Overview Link */}
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-[#829283] hover:text-[#17241B] transition-colors cursor-pointer px-2 py-1"
              onClick={() => setActiveTab("overview")}
            >
              <span>Overview</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {statusMessage && (
        <div className="p-3 bg-[#EBF4E9] border border-[#C5DEC0] text-[#163A2C] rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-[#196D29] shrink-0" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage("")}
            className="text-[#163A2C] hover:opacity-75 cursor-pointer p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-[#FDF2F2] border border-[#F8D7DA] text-[#991B1B] rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-[#991B1B] hover:opacity-75 cursor-pointer p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Facility Notice & Roster Stats Banner */}
      <div className="bg-[#FAFBF9] rounded-2xl border border-[#D8E6D5] p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EBF4E9] text-[#163A2C] flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-[#257853]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-[#17241B]">
                Bank Directory &amp; Partner Roster
              </h2>
              <span className="text-[10px] font-bold bg-[#EBF3E8] text-[#163A2C] px-2 py-0.5 rounded-full border border-[#D5E4D2]">
                {availableBanks.names.length} Banks Active
              </span>
              <span className="text-[10px] font-bold bg-[#E6F0FA] text-[#1E429F] px-2 py-0.5 rounded-full border border-[#C3DDFD]">
                CSV Import Enabled
              </span>
            </div>
            <p className="text-xs text-[#576558] mt-0.5 leading-relaxed">
              Import entire branch manager matrices via CSV, or add custom contacts directly. Click any bank pill below to instantly filter bankers across your operational areas.
            </p>
          </div>
        </div>

        {/* Quick Filter: All vs Custom vs Demo */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#DCE4D9] shrink-0 self-start md:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-[#163A2C] text-white shadow-2xs"
                : "text-[#576558] hover:text-[#17241B]"
            }`}
          >
            All ({bankers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("custom")}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === "custom"
                ? "bg-[#163A2C] text-white shadow-2xs"
                : "text-[#576558] hover:text-[#17241B]"
            }`}
          >
            Active ({customCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("demo")}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === "demo"
                ? "bg-amber-700 text-white shadow-2xs"
                : "text-amber-800 hover:text-amber-950"
            }`}
          >
            Demo Records ({demoCount})
          </button>
        </div>
      </div>

      {/* Search & Dynamic Bank Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E3EBE0] shadow-2xs space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829283]"
          />
          <input
            type="text"
            placeholder="Search banker by name, bank (Axis, HDFC, Kotak), city, branch, phone, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FAFBF9] border border-[#DCE4D9] rounded-xl outline-none focus:border-[#163A2C] focus:bg-white transition-all text-[#17241B] placeholder:text-[#9AA89A]"
          />
        </div>

        {/* Dynamic Bank Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#EEF2EB]">
          <span className="text-[11px] font-bold text-[#829283] flex items-center gap-1 mr-1 shrink-0">
            <Filter size={12} />
            <span>Bank:</span>
          </span>

          {/* All Banks Pill */}
          <button
            type="button"
            onClick={() => setSelectedBank("all")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              selectedBank === "all"
                ? "bg-[#163A2C] text-white shadow-2xs font-bold"
                : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4] hover:text-[#17241B]"
            }`}
          >
            <span>All Banks</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedBank === "all"
                  ? "bg-white/20 text-white"
                  : "bg-[#E3EBE0] text-[#576558]"
              }`}
            >
              {bankers.length}
            </span>
          </button>

          {/* Dynamic Pills for all banks we have in the database/directory */}
          {availableBanks.names.map((bName) => {
            const isSelected = selectedBank.toLowerCase() === bName.toLowerCase();
            const count = availableBanks.counts[bName];
            return (
              <button
                key={bName}
                type="button"
                onClick={() => setSelectedBank(isSelected ? "all" : bName)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#163A2C] text-white shadow-2xs font-bold ring-2 ring-[#163A2C]/20"
                    : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4] hover:text-[#17241B]"
                }`}
                title={`Filter by ${bName} (${count} contacts)`}
              >
                <span>{bName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-[#E3EBE0] text-[#576558]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Refresh List Button */}
          <button
            type="button"
            onClick={fetchBankers}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#829283] hover:text-[#163A2C] transition-colors cursor-pointer pl-2"
            title="Refresh Banker Directory"
          >
            <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Bankers Directory Grid */}
      {filteredBankers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBankers.map((banker) => {
            const id = banker._id || banker.id || "";
            return (
              <div
                key={id}
                className="bg-white rounded-2xl border border-[#E3EBE0] p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#163A2C]/30 transition-all flex flex-col justify-between space-y-3.5 relative overflow-hidden group"
              >
                {/* Top Strip / Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F0F5EE] text-[#163A2C] flex items-center justify-center font-bold text-sm shrink-0 border border-[#DCE4D9]">
                      <Landmark size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-[#17241B]">
                          {banker.name}
                        </h3>
                        {banker.isVerified && (
                          <span title="Verified Official Profile">
                            <ShieldCheck size={14} className="text-[#257853]" />
                          </span>
                        )}
                        {/* Demo vs Active Badge */}
                        {banker.isDemo ? (
                          <span className="text-[9.5px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            Demo Record
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold uppercase tracking-wider bg-[#EBF4E9] text-[#163A2C] border border-[#C5DEC0] px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#163A2C] font-semibold mt-0.5">
                        {banker.designation}
                      </div>
                      <div className="text-[11px] text-[#829283] font-medium">
                        {banker.bankName}
                      </div>
                    </div>
                  </div>

                  {/* City Badge & Actions */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold bg-[#EBF3E8] text-[#163A2C] px-2.5 py-0.5 rounded-full border border-[#D5E4D2]">
                      {banker.city}
                    </span>

                    {/* Action Buttons: Edit & Delete (Admin Only) */}
                    {isSuperadmin && (
                      <div className="flex items-center gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(banker)}
                          className="w-7 h-7 rounded-lg border border-[#E3EBE0] bg-white hover:bg-[#F2F6F0] text-[#576558] hover:text-[#163A2C] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Edit Banker Details"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingBanker(banker)}
                          className="w-7 h-7 rounded-lg border border-[#F8D7DA] bg-white hover:bg-[#FDF2F2] text-[#991B1B] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Delete Banker Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Branch Details & Contact Bar */}
                <div className="bg-[#FAFBF9] p-3 rounded-xl border border-[#EEF2EB] text-xs text-[#576558] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <MapPin size={12} className="text-[#829283] shrink-0" />
                    <span className="truncate font-medium">{banker.branch}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#EEF2EB] text-[11.5px]">
                    <a
                      href={`tel:${banker.phone}`}
                      className="flex items-center gap-1 text-[#17241B] font-mono hover:text-[#163A2C] hover:underline"
                    >
                      <Phone size={12} className="text-[#257853]" />
                      <span>{banker.phone}</span>
                    </a>
                    {banker.email && (
                      <a
                        href={`mailto:${banker.email}`}
                        className="flex items-center gap-1 text-[#576558] hover:text-[#163A2C] hover:underline truncate max-w-[200px]"
                        title={banker.email}
                      >
                        <Mail size={12} className="text-[#829283]" />
                        <span className="truncate">{banker.email}</span>
                      </a>
                    )}
                  </div>

                  {banker.notes && (
                    <div className="text-[10.5px] text-[#718373] italic pt-1 border-t border-[#EEF2EB]">
                      &quot;{banker.notes}&quot;
                    </div>
                  )}
                </div>

                {/* Products Handled Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-[#829283] mr-0.5">
                    Products:
                  </span>
                  {banker.productsHandled?.map((prod, pIdx) => (
                    <span
                      key={pIdx}
                      className="text-[10px] font-medium bg-[#F3F6F1] text-[#2C4837] px-2 py-0.5 rounded-md border border-[#E3EBE0]"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F8FAF6] border border-dashed border-[#D2DDD0] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#E7EFE4] text-[#163A2C] flex items-center justify-center mb-3">
            <Landmark size={22} />
          </div>
          <h3 className="text-base font-bold text-[#17241B] mb-1">
            No bankers found matching your filter
          </h3>
          <p className="text-xs text-[#576558] mb-4 max-w-sm">
            Try adjusting your search query, selecting another bank, or import your team roster directly from CSV.
          </p>
          {isSuperadmin ? (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleOpenImportModal}
                className="h-9 px-4 bg-white hover:bg-[#F0F5EE] text-[#163A2C] border border-[#C5DEC0] text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Upload size={14} className="text-[#257853]" />
                <span>Import from CSV</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="h-9 px-4 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Add New Banker Contact</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-[#829283] italic">
              Try clearing your search query or selecting another bank from the filter dropdown.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPORT FROM CSV / EXCEL                                           */}
      {/* ========================================================================= */}
      {isImportModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#D8E4D5] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#ECEFE9] bg-[#FAFBF9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EAF2E7] text-[#163A2C] flex items-center justify-center font-bold">
                  <FileSpreadsheet size={20} className="text-[#257853]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#17241B]">
                    Import Bankers from CSV / Excel
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#576558]">
                    Supports exact columns: <code className="bg-[#EBF3E8] text-[#163A2C] px-1.5 py-0.2 rounded font-mono text-[10px]">SM name</code>, <code className="bg-[#EBF3E8] text-[#163A2C] px-1.5 py-0.2 rounded font-mono text-[10px]">Location</code>, <code className="bg-[#EBF3E8] text-[#163A2C] px-1.5 py-0.2 rounded font-mono text-[10px]">State Name</code>, <code className="bg-[#EBF3E8] text-[#163A2C] px-1.5 py-0.2 rounded font-mono text-[10px]">Bank Name</code>, <code className="bg-[#EBF3E8] text-[#163A2C] px-1.5 py-0.2 rounded font-mono text-[10px]">RM email id</code>, <code className="bg-[#EBF3E8] text-[#163A2C] px-1.5 py-0.2 rounded font-mono text-[10px]">CON</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#F0F4ED] text-[#829283] hover:text-[#17241B] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F4F8F2] border border-[#D5E5D1] rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#163A2C]">Quick Test &amp; Template:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="h-7 px-2.5 bg-[#163A2C] hover:bg-[#102B21] text-white font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Sparkles size={12} />
                    <span>Load 17 Sample Records (ICICI Bank)</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleCsvTemplate}
                    className="h-7 px-2.5 bg-white hover:bg-[#EBF3E8] text-[#163A2C] border border-[#C5DEC0] font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Download preformatted CSV template"
                  >
                    <Download size={12} />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              {/* Input Mode Selector */}
              <div className="flex items-center gap-2 border-b border-[#EEF2EB] pb-2">
                <button
                  type="button"
                  onClick={() => setImportTab("upload")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    importTab === "upload"
                      ? "bg-[#163A2C] text-white"
                      : "text-[#576558] hover:text-[#17241B] hover:bg-[#F3F6F1]"
                  }`}
                >
                  <Upload size={13} />
                  <span>Upload CSV / Excel File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab("paste")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    importTab === "paste"
                      ? "bg-[#163A2C] text-white"
                      : "text-[#576558] hover:text-[#17241B] hover:bg-[#F3F6F1]"
                  }`}
                >
                  <ClipboardPaste size={13} />
                  <span>Paste Tabular / CSV Text</span>
                </button>
              </div>

              {/* Upload Dropzone Tab */}
              {importTab === "upload" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .tsv, .txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#C5DEC0] hover:border-[#163A2C] bg-[#FAFBF9] hover:bg-[#F5F8F4] rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#EBF4E9] text-[#163A2C] flex items-center justify-center">
                      <Upload size={22} className="text-[#257853]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#17241B]">
                        {fileName ? fileName : "Click to browse or drop CSV/Excel file here"}
                      </span>
                      <p className="text-[11px] text-[#829283] mt-0.5">
                        Accepts comma-separated (.csv) or tab-delimited (.tsv) files
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Paste Tab */}
              {importTab === "paste" && (
                <div>
                  <textarea
                    rows={5}
                    value={importRawText}
                    onChange={(e) => {
                      setImportRawText(e.target.value);
                      runParsing(
                        e.target.value,
                        importSelectedBank,
                        importCustomBank,
                        importDesignation,
                        importProduct
                      );
                    }}
                    placeholder={`Paste CSV or copy directly from Excel and paste here:\nSM Name\tLocation\tState Name\tSM Email id\tCON\nSujata Mohanty\tBhubaneshwar\tOdisha\tSujata2.Mohanty@axisbank.com\tCON_9556614650`}
                    className="w-full p-3 font-mono text-xs border border-[#DCE4D9] rounded-xl bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all"
                  />
                </div>
              )}

              {/* Configuration Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAFBF9] rounded-xl border border-[#EEF2EB]">
                <div>
                  <label className="block text-[10.5px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Bank Institution
                  </label>
                  <select
                    value={importSelectedBank}
                    onChange={(e) => setImportSelectedBank(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-[#DCE4D9] rounded-lg bg-white text-[#17241B] outline-none focus:border-[#163A2C]"
                  >
                    <option value="auto">Auto-detect from Email domain</option>
                    {COMMON_BANKS.filter((b) => b !== "Other / NBFC").map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="custom">Other / Custom Bank</option>
                  </select>
                </div>

                {importSelectedBank === "custom" && (
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                      Custom Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Federal Bank"
                      value={importCustomBank}
                      onChange={(e) => setImportCustomBank(e.target.value)}
                      className="w-full h-8 px-2 text-xs border border-[#DCE4D9] rounded-lg bg-white text-[#17241B] outline-none focus:border-[#163A2C]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10.5px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Default Designation
                  </label>
                  <input
                    type="text"
                    value={importDesignation}
                    onChange={(e) => setImportDesignation(e.target.value)}
                    placeholder="Sales Manager"
                    className="w-full h-8 px-2 text-xs border border-[#DCE4D9] rounded-lg bg-white text-[#17241B] outline-none focus:border-[#163A2C]"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Lending Product Specialty
                  </label>
                  <select
                    value={importProduct}
                    onChange={(e) => setImportProduct(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-[#DCE4D9] rounded-lg bg-white text-[#17241B] outline-none focus:border-[#163A2C]"
                  >
                    {COMMON_PRODUCTS.map((prod) => (
                      <option key={prod} value={prod}>
                        {prod}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parsing Summary & Preview */}
              {parsedData && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#17241B]">
                        Parsed Records Preview ({parsedData.valid.length} valid / {parsedData.totalRows} detected)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.entries(parsedData.banksDetected).map(([b, count]) => (
                        <span
                          key={b}
                          className="text-[10px] font-bold bg-[#EBF3E8] text-[#163A2C] px-2 py-0.5 rounded-full border border-[#D5E4D2]"
                        >
                          {b}: {count}
                        </span>
                      ))}
                    </div>
                  </div>

                  {parsedData.warnings.length > 0 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px]">
                      {parsedData.warnings.slice(0, 3).map((w, idx) => (
                        <div key={idx}>⚠️ {w}</div>
                      ))}
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-[#DCE4D9] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-[#F0F5EE] text-[#163A2C] font-semibold sticky top-0 border-b border-[#DCE4D9]">
                        <tr>
                          <th className="py-2 px-2.5">#</th>
                          <th className="py-2 px-2.5">SM Name</th>
                          <th className="py-2 px-2.5">Bank</th>
                          <th className="py-2 px-2.5">Designation</th>
                          <th className="py-2 px-2.5">Location</th>
                          <th className="py-2 px-2.5">State</th>
                          <th className="py-2 px-2.5">Contact (CON)</th>
                          <th className="py-2 px-2.5">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2EB]">
                        {parsedData.valid.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFBF9]">
                            <td className="py-1.5 px-2.5 text-[#829283]">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-bold text-[#17241B]">
                              {row.name}
                            </td>
                            <td className="py-1.5 px-2.5 text-[#163A2C] font-semibold">
                              {row.bankName}
                            </td>
                            <td className="py-1.5 px-2.5 text-[#576558]">{row.designation}</td>
                            <td className="py-1.5 px-2.5 text-[#17241B]">{row.city}</td>
                            <td className="py-1.5 px-2.5 text-[#829283]">
                              {row.rawState || "-"}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-[#163A2C] font-semibold">
                              {row.phone}
                            </td>
                            <td className="py-1.5 px-2.5 text-[#576558] truncate max-w-[140px]">
                              {row.email || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedData.valid.length > 15 && (
                    <div className="text-center text-[11px] text-[#829283]">
                      + {parsedData.valid.length - 15} more records will be imported
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-[#ECEFE9] bg-[#FAFBF9] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportRawText("");
                  setParsedData(null);
                  setFileName("");
                }}
                disabled={!parsedData}
                className="text-xs text-[#829283] hover:text-[#17241B] font-semibold disabled:opacity-30 cursor-pointer"
              >
                Clear
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="h-9 px-4 text-xs font-semibold border border-[#DCE4D9] hover:bg-[#F5F8F4] text-[#576558] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting || !parsedData || parsedData.valid.length === 0}
                  className="h-9 px-5 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Importing Bankers...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>
                        Import {parsedData ? `${parsedData.valid.length} Bankers` : "Bankers"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BANKER DETAILS                                         */}
      {/* ========================================================================= */}
      {isModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#D8E4D5] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#ECEFE9] bg-[#FAFBF9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EAF2E7] text-[#163A2C] flex items-center justify-center font-bold">
                  <Landmark size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#17241B]">
                    {modalMode === "create" ? "Add New Banker Contact" : "Edit Banker Profile"}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#576558]">
                    Enter bank branch details, desk contact, and lending product specialties.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#F0F4ED] text-[#829283] hover:text-[#17241B] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-4 sm:p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-[#FDF2F2] border border-[#F8D7DA] text-[#991B1B] rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Row 1: Full Name & Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Banker Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-[#DCE4D9] rounded-lg bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-[#DCE4D9] rounded-lg bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all cursor-pointer font-medium"
                  >
                    {COMMON_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* If "Other / NBFC" is selected, show custom bank text input */}
              {formBankName === "Other / NBFC" && (
                <div>
                  <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Custom Bank / NBFC Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Federal Bank, Aditya Birla Finance"
                    value={formCustomBank}
                    onChange={(e) => setFormCustomBank(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-[#DCE4D9] rounded-lg bg-white text-[#17241B] outline-none focus:border-[#163A2C]"
                  />
                </div>
              )}

              {/* Row 2: Designation & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Designation / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Manager, Branch Credit Manager"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-[#DCE4D9] rounded-lg bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhubaneshwar, Mumbai, New Delhi"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-[#DCE4D9] rounded-lg bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Branch / Desk Location */}
              <div>
                <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                  Branch / Desk Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhubaneshwar, Retail Assets Branch"
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  className="w-full h-9 px-3 text-xs border border-[#DCE4D9] rounded-lg bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all"
                />
              </div>

              {/* Row 4: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Contact Phone / Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9556614650 or +91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-mono border border-[#DCE4D9] rounded-lg bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. Sujata2.Mohanty@axisbank.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-[#DCE4D9] rounded-lg bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all"
                  />
                </div>
              </div>

              {/* Row 5: Products Handled (Multi-select Chips) */}
              <div>
                <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1.5">
                  Products &amp; Loan Specialties
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_PRODUCTS.map((prod) => {
                    const isSelected = formProducts.includes(prod);
                    return (
                      <button
                        key={prod}
                        type="button"
                        onClick={() => toggleProduct(prod)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#163A2C] text-white border-[#163A2C] shadow-2xs font-semibold"
                            : "bg-[#F7F9F6] text-[#576558] border-[#DCE4D9] hover:bg-[#EEF3EC]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {prod}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Product Add Input */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Add custom product (e.g. Gold Loan)..."
                    value={customProductInput}
                    onChange={(e) => setCustomProductInput(e.target.value)}
                    onKeyDown={handleAddCustomProduct}
                    className="flex-1 h-8 px-3 text-xs border border-[#DCE4D9] rounded-lg bg-white text-[#17241B] outline-none focus:border-[#163A2C]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomProduct}
                    className="h-8 px-3 text-xs bg-[#F0F5EE] hover:bg-[#E3EBE0] text-[#163A2C] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Row 6: Internal Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-1">
                  Internal Escalation Notes &amp; State Info
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. State: Odisha. Fast turnaround on salaried PL cases."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#DCE4D9] rounded-lg bg-[#FAFBF9] text-[#17241B] outline-none focus:bg-white focus:border-[#163A2C] transition-all"
                />
              </div>

              {/* Verified Status Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formVerified"
                  checked={formIsVerified}
                  onChange={(e) => setFormIsVerified(e.target.checked)}
                  className="w-4 h-4 accent-[#163A2C] rounded cursor-pointer"
                />
                <label
                  htmlFor="formVerified"
                  className="text-xs font-semibold text-[#17241B] cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck size={14} className="text-[#257853]" />
                  <span>Mark as Verified Official Banker Profile</span>
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-[#ECEFE9] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="h-9 px-4 text-xs font-semibold border border-[#DCE4D9] hover:bg-[#F5F8F4] text-[#576558] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-5 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>{modalMode === "create" ? "Saving..." : "Updating..."}</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{modalMode === "create" ? "Save Banker Contact" : "Save Changes"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                               */}
      {/* ========================================================================= */}
      {deletingBanker && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#F8D7DA] shadow-2xl w-full max-w-md p-5 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#991B1B] flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17241B]">
                  Delete Banker Record?
                </h3>
                <p className="text-xs text-[#576558] mt-1 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <strong className="text-[#17241B]">{deletingBanker.name}</strong> (
                  {deletingBanker.bankName}) from your bank contact directory?
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingBanker(null)}
                disabled={isSubmitting}
                className="h-8 px-3.5 text-xs font-semibold border border-[#DCE4D9] hover:bg-[#F5F8F4] text-[#576558] rounded-lg transition-colors cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="h-8 px-4 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE ALL CONFIRMATION                                            */}
      {/* ========================================================================= */}
      {isDeleteAllModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#F8D7DA] shadow-2xl w-full max-w-md p-5 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#991B1B] flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17241B]">
                  Delete All Banker Records?
                </h3>
                <p className="text-xs text-[#576558] mt-1 leading-relaxed">
                  Are you sure you want to permanently delete all{" "}
                  <strong className="text-[#991B1B]">{bankers.length}</strong> banker contacts from your workspace directory? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                disabled={isSubmitting}
                className="h-8 px-3.5 text-xs font-semibold border border-[#DCE4D9] hover:bg-[#F5F8F4] text-[#576558] rounded-lg transition-colors cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllBankers}
                disabled={isSubmitting}
                className="h-8 px-4 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Deleting All...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Yes, Delete All</span>
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
