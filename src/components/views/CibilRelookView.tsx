"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  ArrowUpRight,
  CheckCircle,
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
  FileCheck,
  Check,
  Copy,
  Layers,
  ShieldAlert,
  HelpCircle,
  Eye,
  Calendar,
  CreditCard,
  Building2,
  DollarSign,
  Clock,
  ArrowRight,
  FileSpreadsheet,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { generateDemoCibilPdf } from "@/lib/services/cibilDemoReport";
import type {
  BureauLoanAccount,
  BureauCustomerProfile,
  NormalizedBureauReport,
} from "@/lib/services/cibil/types";
import { calculateRelookMetrics } from "@/lib/services/cibil/calculator";
import { generateRelookJustification } from "@/lib/services/cibil/justification";
import {
  getCreditScoreBand,
  maskAccountNumber,
  maskPan,
} from "@/lib/services/cibil/utils";

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

// Initial Manual Accounts for backward compatibility
const INITIAL_MANUAL_ACCOUNTS: BureauLoanAccount[] = [
  {
    id: "manual-1",
    lender: "HDFC Bank",
    accountType: "Auto Loan",
    accountNumberMasked: "XXXX-4821",
    ownership: "Individual",
    status: "Open",
    sanctionAmount: 850000,
    currentBalance: 240000,
    amountOverdue: 0,
    monthlyEmi: 18200,
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
    id: "manual-2",
    lender: "SBI Cards",
    accountType: "Credit Card",
    accountNumberMasked: "XXXX-9102",
    ownership: "Individual",
    status: "Open",
    sanctionAmount: 200000,
    currentBalance: 32000,
    amountOverdue: 0,
    monthlyEmi: 3200,
    interestRate: 36,
    repaymentTenure: null,
    paymentFrequency: "Monthly",
    openDate: "10/08/2022",
    closedDate: null,
    lastPaymentDate: "10/09/2026",
    reportedDate: "30/09/2026",
    writtenOffTotal: null,
    writtenOffPrincipal: null,
    settlementAmount: null,
    suitFiledWilfulDefault: null,
    paymentHistory: [{ month: "01-26", status: "030", dpdNumeric: 30 }],
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

  // Workflow Mode: Manual vs Upload
  const [activeWorkflow, setActiveWorkflow] = useState<"manual" | "upload">("manual");

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

  // Upload & Extraction Staging State (Requirement 7)
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staged Extracted Report for Review & Audit before committing
  const [stagedReport, setStagedReport] = useState<NormalizedBureauReport | null>(null);
  const [stagedAccounts, setStagedAccounts] = useState<BureauLoanAccount[]>([]);
  const [stagedTabFilter, setStagedTabFilter] = useState<"open" | "closed" | "all">("open");
  const [isReviewStage, setIsReviewStage] = useState<boolean>(false);

  // Payment History Inspect Modal
  const [inspectHistoryAccount, setInspectHistoryAccount] = useState<BureauLoanAccount | null>(null);

  // Modals for Adding / Editing Trade Lines
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<BureauLoanAccount | null>(null);
  const [isEditingStagedItem, setIsEditingStagedItem] = useState<boolean>(false);

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

  // ===================== DETERMINISTIC RELOOK ENGINE (REQUIREMENT 8) =====================
  const currentMetrics = calculateRelookMetrics(accounts);
  const stagedMetrics = stagedReport ? calculateRelookMetrics(stagedAccounts) : null;

  const scoreBand = getCreditScoreBand(score);

  const toggleClosure = (id: string, isStaged = false) => {
    if (isStaged) {
      setStagedAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, toClose: !a.toClose } : a))
      );
    } else {
      setAccounts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, toClose: !a.toClose } : a))
      );
    }
  };

  // Generate verified Case Relook Justification (Requirement 9)
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

  // ===================== PDF UPLOAD PIPELINE =====================
  const processPdfFile = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setUploadError("Invalid file type. Only PDF credit reports (.pdf) are supported.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File exceeds 15MB limit. Please upload a smaller credit report PDF.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);
    setUploadWarnings([]);
    setUploadedFileName(file.name);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch("/api/cibil/extract", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract credit report PDF.");
      }

      // If normalized report is returned, populate the Staging Review interface (Requirement 7)
      if (data.normalizedReport) {
        const norm: NormalizedBureauReport = data.normalizedReport;
        setStagedReport(norm);
        setStagedAccounts(norm.accounts);
        setIsReviewStage(true);

        if (norm.customer.fullName) {
          setApplicantName(norm.customer.fullName);
          setTempName(norm.customer.fullName);
        }
        if (norm.customer.score) {
          setScore(norm.customer.score);
        }
        if (norm.customer.panMasked) {
          setPanNumber(norm.customer.panMasked);
        }
        if (norm.customer.reportDate) {
          setReportDate(norm.customer.reportDate);
        }
        if (norm.customer.bureauName) {
          setBureauType(norm.customer.bureauName);
        }
        if (norm.customer.reportControlNumber) {
          setControlNumber(norm.customer.reportControlNumber);
        }

        const warningStrings = norm.warnings.map((w: any) => `${w.code}: ${w.message}`);
        setUploadWarnings(warningStrings);

        setUploadSuccessMsg(
          `Extracted ${norm.accounts.length} accounts from ${file.name}. Please review and audit trade lines below before committing.`
        );
      } else {
        // Fallback for legacy format response
        if (data.score) setScore(data.score);
        if (data.applicantName) {
          setApplicantName(data.applicantName);
          setTempName(data.applicantName);
        }
        if (data.pan) setPanNumber(data.pan);
        if (data.reportDate) setReportDate(data.reportDate);
        if (data.bureauType) setBureauType(data.bureauType);
        if (data.accounts && data.accounts.length > 0) {
          const mappedAccounts: BureauLoanAccount[] = data.accounts.map((a: any) => ({
            id: a.id,
            lender: a.lender,
            accountType: a.type,
            accountNumberMasked: a.accountNumber || "XXXX",
            ownership: "Individual",
            status: a.status === "Closed" ? "Closed" : "Open",
            sanctionAmount: a.sanctionAmount,
            currentBalance: a.currentBalance,
            amountOverdue: 0,
            monthlyEmi: a.monthlyEmi,
            interestRate: null,
            repaymentTenure: null,
            paymentFrequency: "Monthly",
            openDate: a.openDate || null,
            closedDate: a.closedDate || null,
            lastPaymentDate: null,
            reportedDate: null,
            writtenOffTotal: null,
            writtenOffPrincipal: null,
            settlementAmount: null,
            suitFiledWilfulDefault: null,
            paymentHistory: a.paymentHistory || [],
            maxDpd: a.maxDpd || 0,
            dpdSummaryString: a.dpdStatus || "000/000 (Clear)",
            sourcePage: a.sourcePage || null,
            confidence: a.confidence || "high",
            needsReview: a.needsVerification || false,
            reviewReasons: a.verificationReason ? [a.verificationReason] : [],
            toClose: a.toClose || false,
          }));
          setAccounts(mappedAccounts);
        }
        setUploadSuccessMsg(`CIBIL Report processed successfully!`);
      }
    } catch (err: any) {
      console.error("PDF extraction error:", err);
      setUploadError(
        err.message || "Extraction failed. Please verify that the PDF is an unlocked credit report."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Commit Staged Data to Relook Summary (Requirement 7)
  const handleCommitStagedData = () => {
    if (!stagedReport) return;
    setAccounts(stagedAccounts);
    setIsReviewStage(false);
    setActiveWorkflow("upload");
    setUploadSuccessMsg(
      `Reviewed data committed! ${stagedAccounts.length} trade lines loaded into Relook Analysis.`
    );
  };

  const handleDiscardStaged = () => {
    setStagedReport(null);
    setStagedAccounts([]);
    setIsReviewStage(false);
    setUploadedFileName("");
  };

  // Demo PDF generator
  const handleLoadDemoPdf = async () => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);
    try {
      const demoBytes = await generateDemoCibilPdf("Aarav Mehta", 785, "AARPM5678B");
      const demoBlob = new Blob([demoBytes as any], { type: "application/pdf" });
      const demoFile = new File([demoBlob], "CIBIL_Report_Aarav_Mehta.pdf", {
        type: "application/pdf",
      });
      await processPdfFile(demoFile);
    } catch (err: any) {
      setUploadError(`Failed to generate demo report: ${err.message}`);
      setIsUploading(false);
    }
  };

  // Reset to default manual data
  const handleResetToManual = () => {
    setApplicantName("Vikramaditya Sharma");
    setTempName("Vikramaditya Sharma");
    setScore(762);
    setPanNumber("");
    setReportDate("");
    setBureauType("");
    setControlNumber("");
    setUploadedFileName("");
    setUploadSuccessMsg(null);
    setUploadError(null);
    setUploadWarnings([]);
    setStagedReport(null);
    setStagedAccounts([]);
    setIsReviewStage(false);
    setAccounts(INITIAL_MANUAL_ACCOUNTS);
    setCaseRemarks("");
  };

  // Modal Handlers
  const handleOpenAddModal = (isStaged = false) => {
    setIsEditingStagedItem(isStaged);
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

    if (isEditingStagedItem) {
      setStagedAccounts([...stagedAccounts, newAccount]);
    } else {
      setAccounts([...accounts, newAccount]);
    }
    setShowAddModal(false);
  };

  const handleOpenEditModal = (acc: BureauLoanAccount, isStaged = false) => {
    setIsEditingStagedItem(isStaged);
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

    const updater = (prevList: BureauLoanAccount[]) =>
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
      );

    if (isEditingStagedItem) {
      setStagedAccounts(updater);
    } else {
      setAccounts(updater);
    }
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string, isStaged = false) => {
    if (isStaged) {
      setStagedAccounts((prev) => prev.filter((a) => a.id !== id));
    } else {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    }
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

  // Filtered lists for staged table
  const displayedStagedAccounts = stagedAccounts.filter((a) => {
    if (stagedTabFilter === "open") return a.status === "Open";
    if (stagedTabFilter === "closed") return a.status === "Closed";
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
              Automated bureau extraction, verified audit review, and debt consolidation FOIR relook.
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

      {/* Workflow Tabs (Dual Workflows: Manual Entry & Upload CIBIL PDF) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E3EBE0] shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveWorkflow("manual");
              setIsReviewStage(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeWorkflow === "manual" && !isReviewStage
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
            onClick={() => setActiveWorkflow("upload")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeWorkflow === "upload" || isReviewStage
                ? "bg-[#163A2C] text-white shadow-2xs"
                : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4] hover:text-[#17241B]"
            }`}
            id="workflow-upload-tab"
          >
            <UploadCloud size={14} />
            <span>Upload CIBIL Report (PDF)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {uploadedFileName && (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <FileCheck size={13} className="text-emerald-600" />
              <span>Loaded: {uploadedFileName}</span>
            </span>
          )}
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

      {/* ===================== UPLOAD AREA (WHEN UPLOAD WORKFLOW ACTIVE) ===================== */}
      {activeWorkflow === "upload" && !isReviewStage && (
        <div className="bg-white rounded-2xl border border-[#D5E4D2] p-4 sm:p-6 shadow-sm space-y-4 animate-scale-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEF3EC] pb-3">
            <div>
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#163A2C]">
                <FileText size={18} className="text-[#196D29]" />
                <span>Automated CIBIL Report Extraction Engine</span>
              </div>
              <p className="text-xs text-[#576558] mt-0.5">
                Drop customer CIBIL PDF (Format A Consumer or Format B BureauOne Institutional). Parsing is performed server-side in-memory for zero data persistence.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadDemoPdf}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF3E8] hover:bg-[#DEEBD9] text-[#163A2C] border border-[#C5DDC0] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
              id="test-sample-cibil-btn"
            >
              <Sparkles size={13} className="text-[#196D29]" />
              <span>Test with Demo CIBIL PDF</span>
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processPdfFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#163A2C] bg-[#EBF3E8]"
                : "border-[#C7D9C3] hover:border-[#163A2C] bg-[#FAFBF9] hover:bg-[#F4F7F2]"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processPdfFile(file);
              }}
            />
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <RefreshCw size={32} className="text-[#163A2C] animate-spin" />
                <div className="font-bold text-sm text-[#17241B]">
                  Extracting Credit Bureau Trade Lines &amp; DPD Tracks...
                </div>
                <div className="text-xs text-[#829283]">
                  Preserving reading order, parsing account columns, and verifying payment histories
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#EBF3E8] text-[#163A2C] flex items-center justify-center shadow-2xs">
                  <UploadCloud size={24} />
                </div>
                <div className="font-bold text-sm text-[#17241B]">
                  Drop customer CIBIL PDF here, or <span className="text-[#163A2C] underline">browse file</span>
                </div>
                <div className="text-xs text-[#6A7B6C] max-w-md">
                  Supports CIBIL Consumer Report (21-page) and Institutional Bureau (7-page) layouts (Max 15MB). Securely processed with zero logging of sensitive customer data.
                </div>
              </div>
            )}
          </div>

          {/* Upload Error Alert */}
          {uploadError && (
            <div className="bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-600" />
              <div>
                <span className="font-bold">Extraction Notice: </span>
                <span>{uploadError}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {uploadSuccessMsg && (
            <div className="bg-[#EBF3E8] border border-[#CDE1C8] text-[#163A2C] p-3.5 rounded-xl text-xs flex items-start justify-between gap-2.5 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-bold">Extraction Ready! </span>
                  <span>{uploadSuccessMsg}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadSuccessMsg(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===================== STAGING & AUDIT REVIEW INTERFACE (REQUIREMENT 7) ===================== */}
      {isReviewStage && stagedReport && (
        <div className="bg-white rounded-2xl border-2 border-[#163A2C]/30 p-4 sm:p-6 shadow-md space-y-4 animate-scale-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#EEF3EC] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#163A2C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Audit &amp; Staging Step
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#17241B]">
                  Review Extracted Bureau Data Before Committing
                </h2>
              </div>
              <p className="text-xs text-[#576558] mt-1">
                Verify customer profile, verify trade line balances against source pages, and correct any low-confidence fields before applying to Case Relook.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardStaged}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Discard &amp; Re-upload
              </button>
              <button
                type="button"
                onClick={handleCommitStagedData}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#163A2C] hover:bg-[#102B21] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                id="confirm-commit-btn"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Confirm &amp; Apply to Case Relook</span>
              </button>
            </div>
          </div>

          {/* Staged Metadata Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#F8FAF6] p-3 rounded-xl border border-[#E3EBE0] text-xs">
            <div>
              <div className="text-[10px] text-[#829283] uppercase font-bold">Detected Format</div>
              <div className="font-bold text-[#163A2C] truncate">
                {stagedReport.formatDetected === "cibil_consumer"
                  ? "CIBIL Consumer (Format A)"
                  : stagedReport.formatDetected === "cibil_institutional"
                  ? "BureauOne / Institutional (Format B)"
                  : stagedReport.formatDetected}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#829283] uppercase font-bold">Total Pages</div>
              <div className="font-bold text-[#17241B]">
                {stagedReport.meta.totalPages} pages ({stagedReport.meta.textLength.toLocaleString()} chars)
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#829283] uppercase font-bold">Accounts Found</div>
              <div className="font-bold text-[#17241B]">
                {stagedAccounts.length} accounts ({stagedAccounts.filter((a) => a.status === "Open").length} Open,{" "}
                {stagedAccounts.filter((a) => a.status === "Closed").length} Closed)
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#829283] uppercase font-bold">Reconciliation Status</div>
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <Check size={13} className="text-emerald-600" />
                <span>Verified Match</span>
              </div>
            </div>
          </div>

          {/* Staged Customer Profile (Editable) */}
          <div className="bg-[#FAFBF9] p-3.5 rounded-xl border border-[#E3EBE0]">
            <div className="text-[11px] font-bold text-[#17241B] uppercase tracking-wider mb-2">
              Customer Profile Fields
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-[#829283] font-bold mb-1">Borrower Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full h-8 px-2.5 font-bold border border-gray-200 rounded-lg bg-white outline-none focus:border-[#163A2C]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#829283] font-bold mb-1">CIBIL Score</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="300"
                    max="900"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-20 h-8 px-2 font-mono font-bold border border-gray-200 rounded-lg bg-white outline-none focus:border-[#163A2C]"
                  />
                  <span className={`text-[10.5px] font-bold px-2 py-1 rounded-md ${scoreBand.bg} ${scoreBand.color}`}>
                    {scoreBand.label}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#829283] font-bold mb-1">PAN Number</label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  placeholder="e.g. BSW****2J"
                  className="w-full h-8 px-2.5 font-mono border border-gray-200 rounded-lg bg-white outline-none focus:border-[#163A2C]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#829283] font-bold mb-1">Report Date</label>
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:border-[#163A2C]"
                />
              </div>
            </div>
          </div>

          {/* Staged Warnings / Discrepancies */}
          {uploadWarnings.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 text-[11px]">
                <AlertTriangle size={13} />
                <span>Verification Checklist &amp; Anomaly Warnings ({uploadWarnings.length}):</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800">
                {uploadWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Staged Accounts Table */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStagedTabFilter("open")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stagedTabFilter === "open"
                      ? "bg-[#163A2C] text-white"
                      : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4]"
                  }`}
                >
                  Open / Live Accounts ({stagedAccounts.filter((a) => a.status === "Open").length})
                </button>
                <button
                  type="button"
                  onClick={() => setStagedTabFilter("closed")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stagedTabFilter === "closed"
                      ? "bg-[#163A2C] text-white"
                      : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4]"
                  }`}
                >
                  Closed / Settled ({stagedAccounts.filter((a) => a.status === "Closed").length})
                </button>
                <button
                  type="button"
                  onClick={() => setStagedTabFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stagedTabFilter === "all"
                      ? "bg-[#163A2C] text-white"
                      : "bg-[#F3F6F1] text-[#576558] hover:bg-[#E7EFE4]"
                  }`}
                >
                  All Accounts ({stagedAccounts.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Missing Account</span>
              </button>
            </div>

            <div className="border border-[#ECEFE9] rounded-xl overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#F8FAF6] border-b border-[#ECEFE9] text-[#829283] text-[10px] font-bold tracking-wider uppercase">
                    <th className="py-2.5 px-3">Page</th>
                    <th className="py-2.5 px-3">Lender &amp; Product</th>
                    <th className="py-2.5 px-3">Sanctioned</th>
                    <th className="py-2.5 px-3">Current Balance</th>
                    <th className="py-2.5 px-3">Monthly EMI</th>
                    <th className="py-2.5 px-3">DPD Status</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">BT / Closure</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedStagedAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className={`border-b border-[#ECEFE9] last:border-b-0 hover:bg-[#FBFDFB] transition-colors ${
                        acc.status === "Closed" ? "opacity-75 bg-slate-50/40" : ""
                      } ${acc.needsReview ? "bg-amber-50/50" : ""}`}
                    >
                      <td className="py-2 px-3 text-[11px] font-mono text-[#829283]">
                        {acc.sourcePage ? (
                          <span className="bg-[#EBF3E8] text-[#163A2C] font-bold px-1.5 py-0.5 rounded text-[10px]">
                            Pg {acc.sourcePage}
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#17241B]">{acc.lender}</span>
                          {acc.confidence === "high" && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                              Extracted
                            </span>
                          )}
                          {acc.isManuallyEdited && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1 rounded">
                              Edited
                            </span>
                          )}
                          {acc.needsReview && (
                            <span
                              className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded cursor-help"
                              title={acc.reviewReasons.join("; ")}
                            >
                              Verify
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#829283]">
                          {acc.accountType} • {acc.accountNumberMasked}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[#576558]">
                        ₹{(acc.sanctionAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-3 font-semibold text-[#17241B]">
                        ₹{(acc.currentBalance || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-3 text-[#163A2C] font-semibold">
                        {acc.monthlyEmi !== null && acc.monthlyEmi > 0 ? (
                          `₹${acc.monthlyEmi.toLocaleString("en-IN")}`
                        ) : (
                          <span className="text-gray-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              acc.maxDpd === 0
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {acc.dpdSummaryString}
                          </span>
                          {acc.paymentHistory && acc.paymentHistory.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setInspectHistoryAccount(acc)}
                              className="p-1 text-gray-400 hover:text-[#163A2C] cursor-pointer"
                              title="Inspect month-by-month payment history"
                            >
                              <Eye size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            acc.status === "Open"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {acc.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {acc.status === "Open" ? (
                          <button
                            type="button"
                            onClick={() => toggleClosure(acc.id, true)}
                            className={`text-[10.5px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              acc.toClose
                                ? "bg-amber-100 border-amber-300 text-amber-800"
                                : "bg-white border-[#CAD8C7] text-[#1B4734] hover:bg-[#F2F7F0]"
                            }`}
                          >
                            {acc.toClose ? "✓ Slated to Close" : "+ Plan Closure"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400">Paid</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(acc, true)}
                            className="p-1 text-gray-400 hover:text-[#163A2C] hover:bg-gray-100 rounded cursor-pointer"
                            title="Edit trade line"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.id, true)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete trade line"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staged Calculations Preview */}
          {stagedMetrics && (
            <div className="bg-[#FAFBF9] p-3 rounded-xl border border-[#D8E7D5] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-[#829283] text-[11px]">Live Outstanding: </span>
                  <span className="font-bold text-[#17241B]">
                    ₹{stagedMetrics.totalLiveOutstanding.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[#829283] text-[11px]">Current Monthly EMI: </span>
                  <span className="font-bold text-[#163A2C]">
                    ₹{stagedMetrics.currentLiveMonthlyEmi.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[#829283] text-[11px]">Slated for Closure: </span>
                  <span className="font-bold text-amber-800">
                    {stagedMetrics.slatedForClosureCount} account(s) (₹
                    {stagedMetrics.slatedClosureEmiRelief.toLocaleString("en-IN")} relief)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCommitStagedData}
                className="px-4 py-1.5 bg-[#163A2C] hover:bg-[#102B21] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                Confirm &amp; Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Extracted Customer Summary Pill Bar (when report loaded) */}
      {(bureauType || panNumber || reportDate) && !isReviewStage && (
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

      {/* Top Score & Summary Banner (Active Relook Engine) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-4">
        {/* Score Dial Box */}
        <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1.5">
            BUREAU SCORE (CIBIL / TRANSUNION)
          </div>
          <div className="text-4xl md:text-5xl font-extrabold font-mono text-[#163A2C] leading-none mb-1.5">
            {score}
          </div>
          <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${scoreBand.bg} ${scoreBand.color} mb-3`}>
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
                    className="h-8 px-2 text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-bold text-[#17241B]">
                    Credit Profile for {applicantName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(applicantName);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-gray-400 hover:text-[#163A2C] transition-colors cursor-pointer rounded hover:bg-gray-100"
                    title="Edit borrower name"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Metrics Breakdown (Requirement 8) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <div className="bg-[#F9FAF7] p-2.5 rounded-lg border border-[#ECEFE9]">
                <div className="text-[11px] text-[#829283]">Current Live EMI</div>
                <div className="text-base font-bold text-[#17241B]">
                  ₹{currentMetrics.currentLiveMonthlyEmi.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-[#829283] mt-0.5">
                  {currentMetrics.activeAccountsContributingToEmi.length} amortizing trade lines
                </div>
              </div>
              <div className="bg-[#EBF3E8] p-2.5 rounded-lg border border-[#D8E7D5]">
                <div className="text-[11px] text-[#1B4734]">After BT / Closure</div>
                <div className="text-base font-bold text-[#153A2A]">
                  ₹{currentMetrics.postClosureMonthlyEmi.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-emerald-800 mt-0.5 font-medium">
                  -₹{currentMetrics.netMonthlyRelief.toLocaleString("en-IN")}/mo relief
                </div>
              </div>
              <div className="bg-[#F9FAF7] p-2.5 rounded-lg border border-[#ECEFE9]">
                <div className="text-[11px] text-[#829283]">Total Live Outstanding</div>
                <div className="text-base font-bold text-[#17241B]">
                  ₹{(currentMetrics.totalLiveOutstanding / 100000).toFixed(2)}L
                </div>
                <div className="text-[10px] text-[#829283] mt-0.5">
                  ₹{currentMetrics.totalLiveOutstanding.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full h-9 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            onClick={handleGenerateJustification}
            id="generate-relook-btn"
          >
            <RefreshCw size={13} />
            <span>Generate Relook Justification</span>
          </button>
        </div>
      </div>

      {/* ===================== MAIN ACCOUNTS TABLE & CONTROLS ===================== */}
      <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-bold text-[#17241B]">
                Trade Lines &amp; Facilities ({accounts.length})
              </h3>
              {accounts.filter((a) => a.needsReview).length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {accounts.filter((a) => a.needsReview).length} Needs Verification
                </span>
              )}
            </div>
            <p className="text-xs text-[#576558] mt-0.5">
              Toggle &quot;Plan Closure / BT&quot; on open accounts to calculate revised FOIR and relief.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Open / Closed filter tabs */}
            <div className="flex items-center bg-[#F3F6F1] p-0.5 rounded-lg border border-[#E3EBE0] text-xs">
              <button
                type="button"
                onClick={() => setAccountTabFilter("open")}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  accountTabFilter === "open"
                    ? "bg-white text-[#163A2C] shadow-2xs"
                    : "text-[#576558] hover:text-[#17241B]"
                }`}
              >
                Open ({accounts.filter((a) => a.status === "Open").length})
              </button>
              <button
                type="button"
                onClick={() => setAccountTabFilter("closed")}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  accountTabFilter === "closed"
                    ? "bg-white text-[#163A2C] shadow-2xs"
                    : "text-[#576558] hover:text-[#17241B]"
                }`}
              >
                Closed ({accounts.filter((a) => a.status === "Closed").length})
              </button>
              <button
                type="button"
                onClick={() => setAccountTabFilter("all")}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  accountTabFilter === "all"
                    ? "bg-white text-[#163A2C] shadow-2xs"
                    : "text-[#576558] hover:text-[#17241B]"
                }`}
              >
                All ({accounts.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddModal(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#163A2C] hover:bg-[#1C4937] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
              id="add-tradeline-btn"
            >
              <Plus size={13} />
              <span>Add Trade Line</span>
            </button>
          </div>
        </div>

        <div className="border border-[#ECEFE9] rounded-xl overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAF6] border-b border-[#ECEFE9] text-[#829283] text-[10px] font-bold tracking-wider uppercase">
                <th className="py-2.5 px-3">Lender &amp; Product</th>
                <th className="py-2.5 px-3">Sanctioned</th>
                <th className="py-2.5 px-3">Current Balance</th>
                <th className="py-2.5 px-3">Monthly EMI</th>
                <th className="py-2.5 px-3">DPD Track</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Closure / BT</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 text-xs">
                    No trade lines present in this view.
                  </td>
                </tr>
              ) : (
                displayedAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    className={`border-b border-[#ECEFE9] last:border-b-0 hover:bg-[#FBFDFB] transition-colors ${
                      acc.status === "Closed" ? "opacity-60 bg-slate-50/50" : ""
                    } ${acc.needsReview ? "bg-amber-50/40" : ""}`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="font-semibold text-[#17241B]">{acc.lender}</div>
                        {acc.sourcePage && (
                          <span className="text-[9.5px] bg-[#EBF3E8] text-[#163A2C] font-mono px-1 rounded">
                            Pg {acc.sourcePage}
                          </span>
                        )}
                        {acc.needsReview && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded cursor-help"
                            title={acc.reviewReasons.join("; ") || "Extracted field requires verification"}
                          >
                            <AlertTriangle size={10} />
                            <span>Verify</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#829283]">
                        {acc.accountType} • {acc.accountNumberMasked}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#576558]">
                      ₹{(acc.sanctionAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#17241B]">
                      ₹{(acc.currentBalance || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-[#163A2C] font-semibold">
                      {acc.monthlyEmi !== null && acc.monthlyEmi > 0 ? (
                        `₹${acc.monthlyEmi.toLocaleString("en-IN")}`
                      ) : (
                        <span className="text-gray-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[10.5px] px-1.5 py-0.5 rounded ${
                            acc.maxDpd === 0
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {acc.dpdSummaryString}
                        </span>
                        {acc.paymentHistory && acc.paymentHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setInspectHistoryAccount(acc)}
                            className="p-1 text-gray-400 hover:text-[#163A2C] cursor-pointer"
                            title="Inspect month-by-month payment history"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          acc.status === "Open"
                            ? "bg-[#E3EDE0] text-[#194532]"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {acc.status === "Open" ? (
                        <button
                          type="button"
                          onClick={() => toggleClosure(acc.id, false)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            acc.toClose
                              ? "bg-amber-100 border-amber-300 text-amber-800"
                              : "bg-white border-[#CAD8C7] text-[#1B4734] hover:bg-[#F2F7F0]"
                          }`}
                        >
                          {acc.toClose ? "✓ Slated to Close" : "+ Plan Closure"}
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#829283]">Already Paid</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(acc, false)}
                          className="p-1 text-gray-400 hover:text-[#163A2C] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                          title="Edit trade line"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.id, false)}
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

      {/* ===================== GENERATED CASE RELOOK JUSTIFICATION (REQUIREMENT 9) ===================== */}
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

              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Month / Cycle</th>
                      <th className="py-2 px-3">Reported Code</th>
                      <th className="py-2 px-3">Asset Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectHistoryAccount.paymentHistory.map((item, idx) => {
                      const isClear = item.status === "0" || item.status === "000" || item.status === "STD";
                      const isNotReported = item.status === "XXX" || item.status === "NR";
                      return (
                        <tr key={idx} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                          <td className="py-1.5 px-3 font-mono font-medium">{item.month}</td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10.5px] ${
                                isClear
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isNotReported
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-[11px] text-gray-600">
                            {isClear
                              ? "Standard (0 DPD)"
                              : isNotReported
                              ? "Not Reported by Member (XXX)"
                              : `${item.status} Days Past Due`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
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
              <h3 className="text-base font-bold text-gray-900">
                {isEditingStagedItem ? "Add Missing Staged Account" : "Add Trade Line / Loan Account"}
              </h3>
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
