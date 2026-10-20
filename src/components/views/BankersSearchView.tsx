"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

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
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "State Bank of India (SBI)",
  "Kotak Mahindra Bank",
  "Tata Capital",
  "Bajaj Finserv",
  "IndusInd Bank",
  "IDFC FIRST Bank",
  "Poonawalla Fincorp",
  "Piramal Finance",
  "L&T Finance",
  "Axis Finance",
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
  const [bankers, setBankers] = useState<BankerContact[]>(INITIAL_FALLBACK_DEMO_BANKERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "custom" | "demo">("all");

  // Status Alerts
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>("");
  const [formBankName, setFormBankName] = useState<string>("HDFC Bank");
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

  // Load Bankers from API
  const fetchBankers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bankers");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.bankers) && data.bankers.length > 0) {
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

  // Filter Options for Institutions
  const bankFilterOptions = [
    { id: "all", label: "All Institutions" },
    { id: "hdfc", label: "HDFC" },
    { id: "icici", label: "ICICI" },
    { id: "axis", label: "Axis" },
    { id: "sbi", label: "SBI" },
    { id: "kotak", label: "Kotak" },
    { id: "tata", label: "Tata Capital" },
  ];

  // Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFormName("");
    setFormBankName("HDFC Bank");
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
      setErrorMessage("Please select or specify the bank/institution.");
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

    try {
      if (modalMode === "create") {
        const res = await fetch("/api/bankers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
      setErrorMessage(err.message || "Network error while saving banker record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Record
  const handleConfirmDelete = async () => {
    if (!deletingBanker) return;
    const id = deletingBanker._id || deletingBanker.id;
    if (!id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bankers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBankers((prev) => prev.filter((b) => (b._id || b.id) !== id));
        setStatusMessage(`Deleted banker record for "${deletingBanker.name}".`);
      } else {
        setErrorMessage(data.error || "Failed to delete record.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error deleting banker record.");
    } finally {
      setIsSubmitting(false);
      setDeletingBanker(null);
    }
  };

  // Filtered Bankers List
  const filteredBankers = useMemo(() => {
    return bankers.filter((banker) => {
      // Demo vs Custom filter
      if (filterType === "demo" && !banker.isDemo) return false;
      if (filterType === "custom" && banker.isDemo) return false;

      // Bank Institution filter
      if (selectedBank !== "all") {
        const matchesBank = banker.bankName
          .toLowerCase()
          .includes(selectedBank.toLowerCase());
        if (!matchesBank) return false;
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
          banker.productsHandled?.some((p) => p.toLowerCase().includes(q));
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
          YOUR WORKSPACE / INSTITUTIONAL CONTACTS
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-[26px] font-semibold tracking-tight text-[#17241B] mb-1">
              Bankers search &amp; directory.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Manage and search direct branch credit managers, loan officers, and DSA liaisons across partner banks.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="h-9 px-4 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Plus size={15} />
              <span>Add New Banker</span>
            </button>
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

      {/* Facility Notice & Demo Data Clarification Banner */}
      <div className="bg-[#FAFBF9] rounded-2xl border border-[#D8E6D5] p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EBF4E9] text-[#163A2C] flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-[#257853]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#17241B]">
                Institutional Directory &amp; Demo Reference Records
              </h2>
              <span className="text-[10px] font-bold bg-[#EBF3E8] text-[#163A2C] px-2 py-0.5 rounded-full border border-[#D5E4D2]">
                CRUD Enabled
              </span>
            </div>
            <p className="text-xs text-[#576558] mt-0.5 leading-relaxed">
              Sample profiles are tagged with a <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">Demo Record</span> title for demonstration. You can add your own custom banker contacts, update them via modal, or delete records anytime.
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

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E3EBE0] shadow-2xs space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829283]"
          />
          <input
            type="text"
            placeholder="Search banker by name, bank (HDFC, ICICI, SBI), city, branch, phone, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FAFBF9] border border-[#DCE4D9] rounded-xl outline-none focus:border-[#163A2C] focus:bg-white transition-all text-[#17241B] placeholder:text-[#9AA89A]"
          />
        </div>

        {/* Bank Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EEF2EB]">
          <span className="text-[11px] font-bold text-[#829283] flex items-center gap-1 mr-1">
            <Filter size={12} />
            <span>Institution:</span>
          </span>
          {bankFilterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedBank(opt.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedBank === opt.id
                  ? "bg-[#163A2C] text-white shadow-2xs font-bold"
                  : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4] hover:text-[#17241B]"
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* Refresh List Button */}
          <button
            type="button"
            onClick={fetchBankers}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#829283] hover:text-[#163A2C] transition-colors cursor-pointer"
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
                        {/* Demo Title Badge */}
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

                    {/* Action Buttons: Edit & Delete */}
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
            Try adjusting your search query, selecting another institution, or add a new banker record directly.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-9 px-4 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Add New Banker Contact</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BANKER DETAILS                                         */}
      {/* ========================================================================= */}
      {isModalOpen && (
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
                    Enter institutional details, branch desk, and lending product specialties.
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
                    Lending Institution <span className="text-red-500">*</span>
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
                    placeholder="e.g. Senior Branch Credit Manager"
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
                    placeholder="e.g. Mumbai, New Delhi, Bengaluru"
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
                  placeholder="e.g. Bandra Kurla Complex (BKC) Branch, Retail Assets Hub"
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
                    placeholder="e.g. +91 98765 43210"
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
                    placeholder="e.g. ramesh.chandra@bank.com"
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
                  Internal Escalation Notes &amp; Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fast turnaround on salaried cases above ₹10L, reachable on WhatsApp."
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
      {deletingBanker && (
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
                  {deletingBanker.bankName}) from your institutional contact directory?
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
                Cancel
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
                    <span>Confirm Delete</span>
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
