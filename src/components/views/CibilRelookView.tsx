"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle,
  FileText,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
  Check,
  Copy,
  Layers,
  HelpCircle,
  Eye,
  Calendar,
  CreditCard,
  Building2,
  DollarSign,
  Clock,
  ArrowRight,
  Download,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type {
  BureauLoanAccount,
  BureauCustomerProfile,
} from "@/lib/services/cibil/types";
import { calculateRelookMetrics } from "@/lib/services/cibil/calculator";
import { generateRelookJustification } from "@/lib/services/cibil/justification";
import {
  getCreditScoreBand,
  maskAccountNumber,
  maskPan,
} from "@/lib/services/cibil/utils";
import { CibilDownloadView } from "./CibilDownloadView";

const COMMON_LENDERS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "SBI Cards",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Federal Bank",
  "Bajaj Finance",
  "Bajaj Finserv",
  "Tata Capital",
  "IDFC FIRST Bank",
  "IndusInd Bank",
  "Punjab National Bank",
  "Yes Bank",
  "RBL Bank",
  "Fullerton (SMFG)",
  "Aditya Birla Capital",
  "L&T Finance",
  "InCred Financial",
  "Finnable",
  "Piramal Finance",
  "Standard Chartered",
  "Hero FinCorp",
  "Muthoot Finance",
  "Cholamandalam Finance",
  "Shriram Finance",
];

const LOAN_TYPES = [
  "Personal Loan",
  "Auto Loan",
  "Credit Card",
  "Home Loan",
  "Consumer Durable Loan",
  "Two-Wheeler Loan",
  "Loan Against Property",
  "Business Loan",
  "Education Loan",
  "Overdraft",
  "Gold Loan",
  "Loan Against Bank Deposits",
];

// Initial Manual Accounts for Simulation
const INITIAL_MANUAL_ACCOUNTS: BureauLoanAccount[] = [
  {
    id: "manual-1",
    lender: "HDFC Bank",
    accountType: "Auto Loan",
    accountNumberMasked: "XXXX-4821",
    ownership: "Individual",
    status: "Open",
    sanctionAmount: 850000,
    currentBalance: 412000,
    amountOverdue: 0,
    monthlyEmi: 18450,
    interestRate: 8.75,
    repaymentTenure: 60,
    paymentFrequency: "Monthly",
    openDate: "15/03/2023",
    closedDate: null,
    lastPaymentDate: "15/09/2026",
    reportedDate: "30/09/2026",
    writtenOffTotal: null,
    writtenOffPrincipal: null,
    settlementAmount: null,
    suitFiledWilfulDefault: null,
    paymentHistory: [
      { month: "09/26", dpdNumeric: 0, status: "000" },
      { month: "08/26", dpdNumeric: 0, status: "000" },
      { month: "07/26", dpdNumeric: 0, status: "000" },
      { month: "06/26", dpdNumeric: 0, status: "000" },
      { month: "05/26", dpdNumeric: 0, status: "000" },
      { month: "04/26", dpdNumeric: 0, status: "000" },
      { month: "03/26", dpdNumeric: 0, status: "000" },
      { month: "02/26", dpdNumeric: 0, status: "000" },
      { month: "01/26", dpdNumeric: 0, status: "000" },
      { month: "12/25", dpdNumeric: 0, status: "000" },
      { month: "11/25", dpdNumeric: 0, status: "000" },
      { month: "10/25", dpdNumeric: 0, status: "000" },
    ],
    maxDpd: 0,
    dpdSummaryString: "000/000 (Clear)",
    sourcePage: null,
    confidence: "high",
    needsReview: false,
    reviewReasons: [],
    toClose: false,
  },
  {
    id: "manual-2",
    lender: "SBI Cards",
    accountType: "Credit Card",
    accountNumberMasked: "XXXX-9102",
    ownership: "Individual",
    status: "Open",
    sanctionAmount: 180000,
    currentBalance: 94500,
    amountOverdue: 0,
    monthlyEmi: 4725,
    interestRate: 42.0,
    repaymentTenure: null,
    paymentFrequency: "Monthly",
    openDate: "10/08/2022",
    closedDate: null,
    lastPaymentDate: "20/09/2026",
    reportedDate: "30/09/2026",
    writtenOffTotal: null,
    writtenOffPrincipal: null,
    settlementAmount: null,
    suitFiledWilfulDefault: null,
    paymentHistory: [
      { month: "09/26", dpdNumeric: 0, status: "000" },
      { month: "08/26", dpdNumeric: 0, status: "000" },
      { month: "07/26", dpdNumeric: 0, status: "000" },
      { month: "06/26", dpdNumeric: 0, status: "000" },
      { month: "05/26", dpdNumeric: 0, status: "000" },
      { month: "04/26", dpdNumeric: 0, status: "000" },
      { month: "03/26", dpdNumeric: 0, status: "000" },
      { month: "02/26", dpdNumeric: 30, status: "030" },
      { month: "01/26", dpdNumeric: 0, status: "000" },
      { month: "12/25", dpdNumeric: 0, status: "000" },
      { month: "11/25", dpdNumeric: 0, status: "000" },
      { month: "10/25", dpdNumeric: 0, status: "000" },
    ],
    maxDpd: 30,
    dpdSummaryString: "030 (1 delayed payment 8 mos ago)",
    sourcePage: null,
    confidence: "high",
    needsReview: false,
    reviewReasons: [],
    toClose: true,
  },
  {
    id: "manual-3",
    lender: "Bajaj Finance",
    accountType: "Consumer Durable Loan",
    accountNumberMasked: "XXXX-7741",
    ownership: "Individual",
    status: "Closed",
    sanctionAmount: 75000,
    currentBalance: 0,
    amountOverdue: 0,
    monthlyEmi: 0,
    interestRate: 14,
    repaymentTenure: 12,
    paymentFrequency: "Monthly",
    openDate: "05/01/2024",
    closedDate: "05/01/2025",
    lastPaymentDate: "05/01/2025",
    reportedDate: "31/01/2025",
    writtenOffTotal: null,
    writtenOffPrincipal: null,
    settlementAmount: null,
    suitFiledWilfulDefault: null,
    paymentHistory: [],
    maxDpd: 0,
    dpdSummaryString: "000/000 (Clear)",
    sourcePage: null,
    confidence: "high",
    needsReview: false,
    reviewReasons: [],
    toClose: false,
  },
  {
    id: "manual-4",
    lender: "ICICI Bank",
    accountType: "Personal Loan",
    accountNumberMasked: "XXXX-3389",
    ownership: "Individual",
    status: "Open",
    sanctionAmount: 500000,
    currentBalance: 120000,
    amountOverdue: 0,
    monthlyEmi: 14500,
    interestRate: 11.5,
    repaymentTenure: 48,
    paymentFrequency: "Monthly",
    openDate: "12/06/2023",
    closedDate: null,
    lastPaymentDate: "12/09/2026",
    reportedDate: "30/09/2026",
    writtenOffTotal: null,
    writtenOffPrincipal: null,
    settlementAmount: null,
    suitFiledWilfulDefault: null,
    paymentHistory: [],
    maxDpd: 0,
    dpdSummaryString: "000/000 (Clear)",
    sourcePage: null,
    confidence: "high",
    needsReview: false,
    reviewReasons: [],
    toClose: false,
  },
];

export const CibilRelookView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();
  const searchParams = useSearchParams();
  const initialScore = Number(searchParams.get("score")) || 762;

  // Workflow Mode: Manual Simulation vs Download Bureau Reports
  const [activeWorkflow, setActiveWorkflow] = useState<"manual" | "download">("manual");

  // Core Customer Profile State
  const [applicantName, setApplicantName] = useState<string>("Vikramaditya Sharma");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("Vikramaditya Sharma");
  const [score, setScore] = useState<number>(initialScore);
  const [panNumber, setPanNumber] = useState<string>("");
  const [reportDate, setReportDate] = useState<string>("");
  const [bureauType, setBureauType] = useState<string>("");
  const [controlNumber, setControlNumber] = useState<string>("");

  // Active Committed Accounts
  const [accounts, setAccounts] = useState<BureauLoanAccount[]>(INITIAL_MANUAL_ACCOUNTS);
  const [accountTabFilter, setAccountTabFilter] = useState<"all" | "open" | "closed">("open");

  // Case Relook Output State
  const [caseRemarks, setCaseRemarks] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Payment History Inspect Modal
  const [inspectHistoryAccount, setInspectHistoryAccount] = useState<BureauLoanAccount | null>(null);

  // Modals for Adding / Editing Trade Lines
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<BureauLoanAccount | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    lender: string;
    type: string;
    sanctionAmount: number;
    currentBalance: number;
    monthlyEmi: number;
    dpdStatus: string;
    status: "Open" | "Closed";
    accountNumberMasked: string;
    toClose: boolean;
  }>({
    lender: "HDFC Bank",
    type: "Personal Loan",
    sanctionAmount: 500000,
    currentBalance: 250000,
    monthlyEmi: 14500,
    dpdStatus: "000/000 (Clear)",
    status: "Open",
    accountNumberMasked: "XXXX-1234",
    toClose: false,
  });

  // Sync URL query state
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (useWorkspaceStore.getState().activeTab !== "cibil-relook") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "cibil-relook");
      url.searchParams.set("score", String(score));
      window.history.replaceState(null, "", url.toString());
    } catch {}
  }, [score]);

  // Deterministic Relook Engine
  const currentMetrics = calculateRelookMetrics(accounts);
  const scoreBand = getCreditScoreBand(score);
  const unsecuredMonthlyEmi = accounts
    .filter(
      (a) =>
        a.status === "Open" &&
        (a.accountType.toLowerCase().includes("credit card") ||
          a.accountType.toLowerCase().includes("personal"))
    )
    .reduce((sum, a) => sum + (a.monthlyEmi || 0), 0);
  const maxDpdAcrossAll = Math.max(0, ...accounts.map((a) => a.maxDpd || 0));
  const hasOverdueRisk = maxDpdAcrossAll > 0;

  const toggleClosure = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, toClose: !a.toClose } : a))
    );
  };

  // Generate verified Case Relook Justification
  const handleGenerateJustification = () => {
    const customerProfile: BureauCustomerProfile = {
      fullName: applicantName,
      dob: null,
      gender: null,
      panMasked: panNumber ? maskPan(panNumber) : null,
      mobileMasked: null,
      emailMasked: null,
      address: null,
      bureauName: bureauType || "TransUnion CIBIL",
      score,
      scoreType: "Credit Bureau Score",
      scoreBand,
      reportDate: reportDate || new Date().toLocaleDateString("en-GB"),
      reportControlNumber: controlNumber || null,
    };

    const memo = generateRelookJustification({
      customer: customerProfile,
      accounts,
      metrics: currentMetrics,
    });

    setCaseRemarks(memo);
  };

  // Reset to default sample data
  const handleResetToManual = () => {
    setApplicantName("Vikramaditya Sharma");
    setTempName("Vikramaditya Sharma");
    setScore(762);
    setPanNumber("");
    setReportDate("");
    setBureauType("");
    setControlNumber("");
    setAccounts(INITIAL_MANUAL_ACCOUNTS);
    setCaseRemarks("");
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setFormData({
      lender: "HDFC Bank",
      type: "Personal Loan",
      sanctionAmount: 300000,
      currentBalance: 150000,
      monthlyEmi: 9200,
      dpdStatus: "000/000 (Clear)",
      status: "Open",
      accountNumberMasked: "XXXX-5512",
      toClose: false,
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: BureauLoanAccount = {
      id: `acc-${Date.now()}`,
      lender: formData.lender,
      accountType: formData.type,
      accountNumberMasked: formData.accountNumberMasked || "XXXX",
      ownership: "Individual",
      status: formData.status,
      sanctionAmount: formData.sanctionAmount,
      currentBalance: formData.currentBalance,
      amountOverdue: 0,
      monthlyEmi: formData.monthlyEmi,
      interestRate: null,
      repaymentTenure: null,
      paymentFrequency: "Monthly",
      openDate: new Date().toLocaleDateString("en-GB"),
      closedDate: formData.status === "Closed" ? new Date().toLocaleDateString("en-GB") : null,
      lastPaymentDate: null,
      reportedDate: new Date().toLocaleDateString("en-GB"),
      writtenOffTotal: null,
      writtenOffPrincipal: null,
      settlementAmount: null,
      suitFiledWilfulDefault: null,
      paymentHistory: [],
      maxDpd: 0,
      dpdSummaryString: formData.dpdStatus,
      sourcePage: null,
      confidence: "high",
      needsReview: false,
      reviewReasons: [],
      isManuallyEdited: true,
      toClose: formData.toClose,
    };

    setAccounts([...accounts, newAccount]);
    setShowAddModal(false);
  };

  const handleOpenEditModal = (acc: BureauLoanAccount) => {
    setEditingAccount(acc);
    setFormData({
      lender: acc.lender,
      type: acc.accountType,
      sanctionAmount: acc.sanctionAmount || 0,
      currentBalance: acc.currentBalance || 0,
      monthlyEmi: acc.monthlyEmi || 0,
      dpdStatus: acc.dpdSummaryString,
      status: acc.status,
      accountNumberMasked: acc.accountNumberMasked,
      toClose: acc.toClose || false,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    setAccounts((prevList) =>
      prevList.map((a) =>
        a.id === editingAccount.id
          ? {
              ...a,
              lender: formData.lender,
              accountType: formData.type,
              sanctionAmount: formData.sanctionAmount,
              currentBalance: formData.currentBalance,
              monthlyEmi: formData.monthlyEmi,
              dpdStatus: formData.dpdStatus,
              status: formData.status,
              accountNumberMasked: formData.accountNumberMasked,
              toClose: formData.toClose,
              isManuallyEdited: true,
              needsReview: false,
              reviewReasons: [],
            }
          : a
      )
    );
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCopyClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(caseRemarks);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // Filtered lists for main table
  const displayedAccounts = accounts.filter((a) => {
    if (accountTabFilter === "open") return a.status === "Open";
    if (accountTabFilter === "closed") return a.status === "Closed";
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-4">
      {/* View Header */}
      <div>
        <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
          YOUR WORKSPACE / CIBIL &amp; CASE RELOOK
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-[26px] font-semibold tracking-tight text-[#17241B] mb-1">
              CIBIL &amp; case relook.
            </h1>
            <p className="text-xs md:text-[13px] text-[#576558]">
              Download official credit bureau reports or manually simulate FOIR obligation relooks.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-[#829283] hover:text-[#17241B] transition-colors cursor-pointer self-start sm:self-auto"
            onClick={() => setActiveTab("overview")}
          >
            <span>Overview</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Workflow Tabs: Manual Entry & Simulation vs Download Bureau Reports */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E3EBE0] shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveWorkflow("manual")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeWorkflow === "manual"
                ? "bg-[#163A2C] text-white shadow-2xs"
                : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4] hover:text-[#17241B]"
            }`}
            id="workflow-manual-tab"
          >
            <Edit3 size={14} />
            <span>Manual Entry &amp; Simulation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkflow("download")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeWorkflow === "download"
                ? "bg-[#163A2C] text-white shadow-2xs"
                : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4] hover:text-[#17241B]"
            }`}
            id="workflow-download-tab"
          >
            <Download size={14} />
            <span>Download Bureau Reports</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full ml-1">
              7 Links
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToManual}
            className="text-[11px] font-semibold text-[#576558] hover:text-[#17241B] px-2.5 py-1 rounded-lg border border-[#E3EBE0] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            title="Reset to default sample dataset"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* ===================== DOWNLOAD HUB VIEW ===================== */}
      {activeWorkflow === "download" && <CibilDownloadView />}

      {/* ===================== MANUAL ENTRY & SIMULATION WORKFLOW ===================== */}
      {activeWorkflow === "manual" && (
        <div className="space-y-4">
          {/* Extracted / Entered Customer Summary Pill Bar */}
          {(bureauType || panNumber || reportDate) && (
            <div className="bg-[#F8FAF6] p-3 rounded-xl border border-[#E3EBE0] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {bureauType && (
                  <span className="bg-[#EBF3E8] text-[#163A2C] font-bold px-2.5 py-0.5 rounded-full border border-[#D5E4D2]">
                    {bureauType}
                  </span>
                )}
                {panNumber && (
                  <span className="text-[#576558]">
                    PAN: <span className="font-mono font-bold text-[#17241B]">{panNumber}</span>
                  </span>
                )}
                {reportDate && (
                  <span className="text-[#576558]">
                    Report Date: <span className="font-medium text-[#17241B]">{reportDate}</span>
                  </span>
                )}
                {controlNumber && (
                  <span className="text-[#829283] hidden sm:inline">
                    Control No: <span className="font-mono">{controlNumber}</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#829283]">
                {accounts.length} total trade lines in active engine
              </span>
            </div>
          )}

          {/* Top Score & Summary Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-4">
            {/* Score Dial Box */}
            <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1.5">
                BUREAU SCORE (CIBIL / TRANSUNION)
              </div>
              <div className="text-4xl md:text-5xl font-extrabold font-mono text-[#163A2C] leading-none mb-1.5">
                {score}
              </div>
              <div
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${scoreBand.bg} ${scoreBand.color} mb-3`}
              >
                {scoreBand.label}
              </div>

              <div className="w-full px-2">
                <input
                  type="range"
                  min="300"
                  max="900"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full accent-[#163A2C] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#829283] mt-1">
                  <span>300 (Poor)</span>
                  <span>750 (Prime)</span>
                  <span>900 (Excellent)</span>
                </div>
              </div>
            </div>

            {/* Obligation Summary Box */}
            <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1">
                  OBLIGATION &amp; BURDEN ANALYSIS
                </div>

                {/* Editable Applicant Name */}
                <div className="flex items-center gap-2 mb-3">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5 w-full max-w-sm">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="h-8 px-2.5 text-xs sm:text-sm font-bold border border-[#CADBC4] rounded-lg bg-white outline-none focus:border-[#163A2C] flex-1"
                        placeholder="Enter borrower name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tempName.trim()) setApplicantName(tempName.trim());
                          setIsEditingName(false);
                        }}
                        className="h-8 px-2.5 bg-[#163A2C] text-white rounded-lg text-xs font-semibold hover:bg-[#102B21] transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempName(applicantName);
                          setIsEditingName(false);
                        }}
                        className="h-8 px-2 text-xs text-[#576558] hover:text-[#17241B]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-bold text-[#17241B]">
                        {applicantName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempName(applicantName);
                          setIsEditingName(true);
                        }}
                        className="p-1 text-[#829283] hover:text-[#163A2C] transition-colors cursor-pointer"
                        title="Edit applicant name"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Burden Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <div className="bg-[#FAFBF9] p-2.5 rounded-lg border border-[#EEF2EB]">
                    <div className="text-[10px] text-[#829283] font-semibold">Current Monthly EMI</div>
                    <div className="text-sm sm:text-base font-bold font-mono text-[#17241B]">
                      ₹{currentMetrics.currentLiveMonthlyEmi.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="bg-[#FAFBF9] p-2.5 rounded-lg border border-[#EEF2EB]">
                    <div className="text-[10px] text-[#829283] font-semibold">Post-Relook EMI</div>
                    <div className="text-sm sm:text-base font-bold font-mono text-emerald-800">
                      ₹{currentMetrics.postClosureMonthlyEmi.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="bg-[#FAFBF9] p-2.5 rounded-lg border border-[#EEF2EB] col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-[#829283] font-semibold">Monthly EMI Relief</div>
                    <div className="text-sm sm:text-base font-bold font-mono text-amber-800">
                      ₹{currentMetrics.slatedClosureEmiRelief.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Debt Consolidation / Closure Callout */}
              <div className="bg-[#EBF4E9] p-2.5 rounded-lg border border-[#D3E4D0] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#257853]" />
                  <span className="text-[#163A2C] font-semibold text-[11px] sm:text-xs">
                    {currentMetrics.slatedForClosureCount > 0 ? (
                      <>
                        <strong>{currentMetrics.slatedForClosureCount} account(s)</strong> slated
                        for closure saves{" "}
                        <strong>₹{currentMetrics.slatedClosureEmiRelief.toLocaleString("en-IN")}/mo</strong>,
                        reducing FOIR burden.
                      </>
                    ) : (
                      <>Select accounts to close below to simulate FOIR relook relief.</>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateJustification}
                  className="px-3 py-1 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  Generate Relook Memo
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Row: 4 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E3EBE0] shadow-xs">
              <div className="text-[10.5px] font-bold text-[#829283] uppercase mb-1">
                Open Accounts
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#17241B]">
                {currentMetrics.activeAccountsCount}
                <span className="text-xs font-normal text-[#829283] ml-1.5">
                  / {accounts.length} total
                </span>
              </div>
              <div className="text-[11px] text-[#576558] mt-0.5">
                {currentMetrics.closedAccountsCount} closed / settled
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E3EBE0] shadow-xs">
              <div className="text-[10.5px] font-bold text-[#829283] uppercase mb-1">
                Live Outstanding
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#17241B]">
                ₹{currentMetrics.totalLiveOutstanding.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-[#576558] mt-0.5">
                Sanctioned: ₹{currentMetrics.totalSanctionedAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E3EBE0] shadow-xs">
              <div className="text-[10.5px] font-bold text-[#829283] uppercase mb-1">
                Unsecured / CC EMI
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#17241B]">
                ₹{unsecuredMonthlyEmi.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
                High-interest burden
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E3EBE0] shadow-xs">
              <div className="text-[10.5px] font-bold text-[#829283] uppercase mb-1">
                Max DPD In Track
              </div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  hasOverdueRisk ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {maxDpdAcrossAll} DPD
              </div>
              <div className="text-[11px] text-[#576558] mt-0.5">
                {hasOverdueRisk ? "Adverse DPD flag recorded" : "Clean payment history"}
              </div>
            </div>
          </div>

          {/* Trade Lines Management Table */}
          <div className="bg-white rounded-xl border border-[#E3EBE0] shadow-xs overflow-hidden">
            {/* Table Header & Controls */}
            <div className="p-3.5 sm:p-4 border-b border-[#EEF2EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-[#17241B]">Active Trade Lines &amp; Debt</h2>

                {/* Filter Tabs */}
                <div className="flex items-center bg-[#F4F7F2] p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAccountTabFilter("open")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      accountTabFilter === "open"
                        ? "bg-white text-[#163A2C] shadow-2xs font-bold"
                        : "text-[#576558] hover:text-[#17241B]"
                    }`}
                  >
                    Open Only ({accounts.filter((a) => a.status === "Open").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountTabFilter("all")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      accountTabFilter === "all"
                        ? "bg-white text-[#163A2C] shadow-2xs font-bold"
                        : "text-[#576558] hover:text-[#17241B]"
                    }`}
                  >
                    All ({accounts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountTabFilter("closed")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      accountTabFilter === "closed"
                        ? "bg-white text-[#163A2C] shadow-2xs font-bold"
                        : "text-[#576558] hover:text-[#17241B]"
                    }`}
                  >
                    Closed ({accounts.filter((a) => a.status === "Closed").length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={13} />
                  <span>Add Trade Line</span>
                </button>
              </div>
            </div>

            {/* Explanatory banner for Relook Action */}
            <div className="bg-[#FAFBF9] px-4 py-2 border-b border-[#ECEFE9] text-[11px] text-[#576558] flex items-center gap-2">
              <span className="font-bold text-[#163A2C]">Relook Action:</span>
              <span>
                Toggle <strong>&ldquo;Close with New Loan&rdquo;</strong> on any open trade line to
                simulate debt consolidation and see real-time FOIR relief.
              </span>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAFBF9] text-[#829283] font-bold text-[10.5px] tracking-wider uppercase border-b border-[#EEF2EB]">
                    <th className="py-2.5 px-3.5">Lender / Product</th>
                    <th className="py-2.5 px-3">Account No</th>
                    <th className="py-2.5 px-3 text-right">Sanction / Limit</th>
                    <th className="py-2.5 px-3 text-right">Current Balance</th>
                    <th className="py-2.5 px-3 text-right">Monthly EMI</th>
                    <th className="py-2.5 px-3">DPD / Track</th>
                    <th className="py-2.5 px-3 text-center">Relook Action</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2EB]">
                  {displayedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#829283]">
                        No accounts match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    displayedAccounts.map((acc) => (
                      <tr
                        key={acc.id}
                        className={`hover:bg-[#F9FAF8] transition-colors ${
                          acc.toClose ? "bg-[#FFFBF0]/60" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-[#17241B]">{acc.lender}</div>
                          <div className="text-[11px] text-[#576558]">{acc.accountType}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#576558]">
                          {acc.accountNumberMasked}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#17241B]">
                          ₹{(acc.sanctionAmount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#17241B]">
                          ₹{(acc.currentBalance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#163A2C]">
                          ₹{(acc.monthlyEmi || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                acc.maxDpd > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {acc.dpdSummaryString}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {acc.status === "Open" ? (
                            <button
                              type="button"
                              onClick={() => toggleClosure(acc.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                                acc.toClose
                                  ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                              }`}
                              title={
                                acc.toClose
                                  ? "Slated to close with fresh loan proceeds (Click to unmark)"
                                  : "Click to mark for closure in debt consolidation relook"
                              }
                            >
                              {acc.toClose ? "✓ Close via Loan" : "Keep Open"}
                            </button>
                          ) : (
                            <span className="text-[10.5px] text-gray-400 font-medium">Closed</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {acc.paymentHistory && acc.paymentHistory.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setInspectHistoryAccount(acc)}
                                className="p-1 text-gray-500 hover:text-[#163A2C] hover:bg-[#EBF3E8] rounded transition-colors cursor-pointer"
                                title="Inspect 36-month DPD history"
                              >
                                <Eye size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(acc)}
                              className="p-1 text-gray-500 hover:text-[#163A2C] hover:bg-[#EBF3E8] rounded transition-colors cursor-pointer"
                              title="Edit trade line"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Delete trade line"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================== GENERATED CASE RELOOK JUSTIFICATION ===================== */}
          {caseRemarks && (
            <div className="bg-white rounded-xl border border-[#C4D9C1] p-4 md:p-5 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={16} className="text-emerald-700" />
                  <h3 className="text-xs md:text-sm font-bold text-[#17241B]">
                    Credit Committee Case Relook Memo (Verified Figures)
                  </h3>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 bg-white border border-[#E3EBE0] hover:bg-[#F5F8F4] text-[11px] font-semibold text-[#17241B] rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  onClick={handleCopyClipboard}
                >
                  {copyFeedback ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Memo</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap bg-[#F9FAF6] p-3.5 rounded-lg text-[#183226] border border-[#ECEFE9] overflow-x-auto">
                {caseRemarks}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ===================== INSPECT PAYMENT HISTORY MODAL ===================== */}
      {inspectHistoryAccount && (
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setInspectHistoryAccount(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-gray-100 my-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Payment History Track (Up to 36 Months)
                </h3>
                <p className="text-[11px] text-gray-500">
                  {inspectHistoryAccount.lender} • {inspectHistoryAccount.accountType} (
                  {inspectHistoryAccount.accountNumberMasked})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectHistoryAccount(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Summary Track:</span>
                <span className="font-bold text-[#163A2C]">
                  {inspectHistoryAccount.dpdSummaryString}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
                {inspectHistoryAccount.paymentHistory.map((h, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg text-center border text-[11px] ${
                      (h.dpdNumeric ?? 0) === 0
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                    }`}
                  >
                    <div className="text-[10px] text-gray-500 font-semibold">{h.month}</div>
                    <div className="font-mono mt-0.5">
                      {h.status || String(h.dpdNumeric ?? 0).padStart(3, "0")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setInspectHistoryAccount(null)}
                  className="px-4 py-1.5 bg-[#163A2C] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD TRADE LINE MODAL ===================== */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-start sm:items-center justify-center p-3 sm:p-4 py-6 sm:py-8 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-gray-100 my-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Add Trade Line / Loan Account</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lender / Institution</label>
                <input
                  type="text"
                  list="lenders-list"
                  required
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  placeholder="e.g. HDFC Bank"
                />
                <datalist id="lenders-list">
                  {COMMON_LENDERS.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Loan / Product Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-8 px-2 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                >
                  {LOAN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sanction Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sanctionAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, sanctionAmount: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Current Balance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, currentBalance: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.monthlyEmi}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyEmi: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "Open" | "Closed" })
                    }
                    className="w-full h-8 px-2 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  >
                    <option value="Open">Open / Active</option>
                    <option value="Closed">Closed / Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Account Masked No.</label>
                  <input
                    type="text"
                    value={formData.accountNumberMasked}
                    onChange={(e) =>
                      setFormData({ ...formData, accountNumberMasked: e.target.value })
                    }
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                    placeholder="XXXX-1234"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">DPD Track</label>
                  <input
                    type="text"
                    value={formData.dpdStatus}
                    onChange={(e) => setFormData({ ...formData, dpdStatus: e.target.value })}
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#163A2C] text-white rounded-lg font-bold hover:bg-[#102B21] transition-colors cursor-pointer shadow-xs"
                >
                  Save Trade Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT TRADE LINE MODAL ===================== */}
      {editingAccount && (
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen min-h-dvh flex items-start sm:items-center justify-center p-3 sm:p-4 py-6 sm:py-8 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setEditingAccount(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-gray-100 my-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Trade Line Details</h3>
                <p className="text-[11px] text-gray-500">Correct or adjust loan parameters</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lender / Institution</label>
                <input
                  type="text"
                  list="lenders-list"
                  required
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Loan / Product Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-8 px-2 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                >
                  {LOAN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sanction Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sanctionAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, sanctionAmount: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Current Balance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, currentBalance: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.monthlyEmi}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyEmi: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "Open" | "Closed" })
                    }
                    className="w-full h-8 px-2 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  >
                    <option value="Open">Open / Active</option>
                    <option value="Closed">Closed / Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">DPD / Asset Track</label>
                <input
                  type="text"
                  value={formData.dpdStatus}
                  onChange={(e) => setFormData({ ...formData, dpdStatus: e.target.value })}
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#163A2C] text-white rounded-lg font-bold hover:bg-[#102B21] transition-colors cursor-pointer shadow-xs"
                >
                  Update &amp; Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
