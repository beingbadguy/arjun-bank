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
} from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { generateDemoCibilPdf } from "@/lib/services/cibilDemoReport";

export interface LoanAccount {
  id: string;
  lender: string;
  type: string;
  sanctionAmount: number;
  currentBalance: number;
  monthlyEmi: number;
  dpdStatus: string;
  status: "Active" | "Closed";
  toClose: boolean;
  needsVerification?: boolean;
  verificationReason?: string;
  accountNumber?: string;
}

const COMMON_LENDERS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "SBI Cards",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bajaj Finance",
  "Bajaj Finserv",
  "Tata Capital",
  "IDFC FIRST Bank",
  "IndusInd Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Federal Bank",
  "Yes Bank",
  "RBL Bank",
  "Fullerton (SMFG)",
  "Aditya Birla Capital",
  "L&T Finance",
  "InCred Financial",
  "Finnable",
  "Piramal Finance",
  "Standard Chartered",
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
];

export const CibilRelookView: React.FC = () => {
  const { setActiveTab } = useWorkspaceStore();
  const searchParams = useSearchParams();
  const initialScore = Number(searchParams.get("score")) || 762;

  // Workflow Mode
  const [activeWorkflow, setActiveWorkflow] = useState<"manual" | "upload">("manual");

  // Core Customer & Bureau State
  const [score, setScore] = useState<number>(initialScore);
  const [applicantName, setApplicantName] = useState<string>("Vikramaditya Sharma");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("Vikramaditya Sharma");
  const [panNumber, setPanNumber] = useState<string>("");
  const [reportDate, setReportDate] = useState<string>("");
  const [bureauType, setBureauType] = useState<string>("");
  const [caseRemarks, setCaseRemarks] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals for Adding / Editing Trade Lines
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<LoanAccount | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Omit<LoanAccount, "id">>({
    lender: "HDFC Bank",
    type: "Personal Loan",
    sanctionAmount: 500000,
    currentBalance: 250000,
    monthlyEmi: 14500,
    dpdStatus: "000/000/000 (Clear)",
    status: "Active",
    toClose: false,
    needsVerification: false,
    verificationReason: "",
  });

  // Preserve initial accounts for backward compatibility
  const [accounts, setAccounts] = useState<LoanAccount[]>([
    {
      id: "1",
      lender: "HDFC Bank",
      type: "Auto Loan",
      sanctionAmount: 850000,
      currentBalance: 240000,
      monthlyEmi: 18200,
      dpdStatus: "000/000/000 (Clear)",
      status: "Active",
      toClose: false,
    },
    {
      id: "2",
      lender: "SBI Cards",
      type: "Credit Card",
      sanctionAmount: 200000,
      currentBalance: 32000,
      monthlyEmi: 3200,
      dpdStatus: "030 (1 delayed payment 8 mos ago)",
      status: "Active",
      toClose: true,
    },
    {
      id: "3",
      lender: "Bajaj Finance",
      type: "Consumer Durable Loan",
      sanctionAmount: 75000,
      currentBalance: 0,
      monthlyEmi: 0,
      dpdStatus: "000/000 (Clear)",
      status: "Closed",
      toClose: false,
    },
    {
      id: "4",
      lender: "ICICI Bank",
      type: "Personal Loan",
      sanctionAmount: 500000,
      currentBalance: 120000,
      monthlyEmi: 14500,
      dpdStatus: "000/000/000 (Clear)",
      status: "Active",
      toClose: false,
    },
  ]);

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

  // ===================== SHARED RELOOK ENGINE (REQUIREMENT 4) =====================
  const activeAccounts = accounts.filter((a) => a.status === "Active");
  const currentTotalEmi = activeAccounts.reduce((sum, a) => sum + a.monthlyEmi, 0);
  const emiAfterClosure = activeAccounts
    .filter((a) => !a.toClose)
    .reduce((sum, a) => sum + a.monthlyEmi, 0);
  const totalOutstanding = activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalSanctioned = accounts.reduce((sum, a) => sum + a.sanctionAmount, 0);
  const reliefEmi = currentTotalEmi - emiAfterClosure;
  const closedCount = accounts.filter((a) => a.toClose).length;
  const needsVerificationCount = accounts.filter((a) => a.needsVerification).length;

  const getScoreBand = (val: number) => {
    if (val >= 750) return { label: "Excellent (Prime)", color: "text-[#17653C]", bg: "bg-[#DCF2E4]" };
    if (val >= 700) return { label: "Good (Standard)", color: "text-[#1E4E9E]", bg: "bg-[#E2ECFE]" };
    if (val >= 650) return { label: "Moderate Risk", color: "text-amber-800", bg: "bg-amber-100" };
    return { label: "High Risk / Policy Deviation", color: "text-red-800", bg: "bg-red-100" };
  };

  const band = getScoreBand(score);

  const toggleClosure = (id: string) => {
    setAccounts(
      accounts.map((a) => (a.id === id ? { ...a, toClose: !a.toClose } : a))
    );
  };

  const generateRelookCase = () => {
    const closedTradeLines = accounts.filter((a) => a.toClose);
    const closedLenders = closedTradeLines.map((a) => `${a.lender} (${a.type})`).join(", ");

    setCaseRemarks(
      `CASE RELOOK JUSTIFICATION FOR UNDERWRITING:\n` +
        `• Applicant: ${applicantName} | CIBIL Score: ${score} (${band.label})${panNumber ? ` | PAN: ${panNumber}` : ""}\n` +
        `• Total Live Credit Lines: ${activeAccounts.length} (Total Bureau Sanction: ₹${totalSanctioned.toLocaleString("en-IN")})\n` +
        `• Current Monthly Obligation: ₹${currentTotalEmi.toLocaleString("en-IN")}\n` +
        `• Proposed BT / Closure: ${closedCount} trade line(s) slated for closure, reducing monthly burden by ₹${reliefEmi.toLocaleString("en-IN")}.\n` +
        (closedCount > 0 ? `  - Slated Accounts: ${closedLenders}\n` : "") +
        `• Revised Post-Sanction Obligation: ₹${emiAfterClosure.toLocaleString("en-IN")}/month.\n` +
        `• DPD Analysis: Isolated 30 DPD over 6 months old due to technical banking clearing. Zero 60+ or 90+ write-offs recorded.\n` +
        `• Recommendation: Eligible for Deviation Sanction with BT condition on slated accounts.`
    );
  };

  // ===================== CIBIL UPLOAD WORKFLOW (REQUIREMENTS 2, 5, 6) =====================
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
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cibil/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse CIBIL report PDF.");
      }

      // Populate extracted data into shared relook engine
      if (data.score) {
        setScore(data.score);
      }
      if (data.applicantName) {
        setApplicantName(data.applicantName);
        setTempName(data.applicantName);
      }
      if (data.pan) {
        setPanNumber(data.pan);
      }
      if (data.reportDate) {
        setReportDate(data.reportDate);
      }
      if (data.bureauType) {
        setBureauType(data.bureauType);
      }
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
      }
      if (data.warnings && data.warnings.length > 0) {
        setUploadWarnings(data.warnings);
      }

      setUploadSuccessMsg(
        `CIBIL Report parsed successfully! Extracted ${data.accounts?.length || 0} trade lines for ${data.applicantName} (Score: ${data.score || "N/A"}).`
      );
    } catch (err: any) {
      console.error("PDF upload failure:", err);
      setUploadError(err.message || "Extraction failed. Please ensure the PDF is an unlocked credit report.");
    } finally {
      setIsUploading(false);
    }
  };

  // Demo PDF Generator for one-click testing
  const handleLoadDemoPdf = async () => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);
    try {
      const demoBytes = await generateDemoCibilPdf("Aarav Mehta", 785, "AARPM5678B");
      const demoBlob = new Blob([demoBytes as any], { type: "application/pdf" });
      const demoFile = new File([demoBlob], "CIBIL_Report_Aarav_Mehta.pdf", { type: "application/pdf" });
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
    setUploadedFileName("");
    setUploadSuccessMsg(null);
    setUploadError(null);
    setUploadWarnings([]);
    setAccounts([
      {
        id: "1",
        lender: "HDFC Bank",
        type: "Auto Loan",
        sanctionAmount: 850000,
        currentBalance: 240000,
        monthlyEmi: 18200,
        dpdStatus: "000/000/000 (Clear)",
        status: "Active",
        toClose: false,
      },
      {
        id: "2",
        lender: "SBI Cards",
        type: "Credit Card",
        sanctionAmount: 200000,
        currentBalance: 32000,
        monthlyEmi: 3200,
        dpdStatus: "030 (1 delayed payment 8 mos ago)",
        status: "Active",
        toClose: true,
      },
      {
        id: "3",
        lender: "Bajaj Finance",
        type: "Consumer Durable Loan",
        sanctionAmount: 75000,
        currentBalance: 0,
        monthlyEmi: 0,
        dpdStatus: "000/000 (Clear)",
        status: "Closed",
        toClose: false,
      },
      {
        id: "4",
        lender: "ICICI Bank",
        type: "Personal Loan",
        sanctionAmount: 500000,
        currentBalance: 120000,
        monthlyEmi: 14500,
        dpdStatus: "000/000/000 (Clear)",
        status: "Active",
        toClose: false,
      },
    ]);
  };

  // ===================== REVIEW & EDIT TRADE LINES (REQUIREMENT 3) =====================
  const handleOpenAddModal = () => {
    setFormData({
      lender: "HDFC Bank",
      type: "Personal Loan",
      sanctionAmount: 300000,
      currentBalance: 150000,
      monthlyEmi: 9200,
      dpdStatus: "000/000/000 (Clear)",
      status: "Active",
      toClose: false,
      needsVerification: false,
      verificationReason: "",
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: LoanAccount = {
      ...formData,
      id: String(Date.now()),
    };
    setAccounts([...accounts, newAccount]);
    setShowAddModal(false);
  };

  const handleOpenEditModal = (acc: LoanAccount) => {
    setEditingAccount(acc);
    setFormData({
      lender: acc.lender,
      type: acc.type,
      sanctionAmount: acc.sanctionAmount,
      currentBalance: acc.currentBalance,
      monthlyEmi: acc.monthlyEmi,
      dpdStatus: acc.dpdStatus,
      status: acc.status,
      toClose: acc.toClose,
      needsVerification: acc.needsVerification,
      verificationReason: acc.verificationReason,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    setAccounts(
      accounts.map((a) =>
        a.id === editingAccount.id
          ? {
              ...a,
              ...formData,
              // When user edits and saves, clear verification warning
              needsVerification: false,
              verificationReason: "",
            }
          : a
      )
    );
    setEditingAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  const handleVerifyAccount = (id: string) => {
    setAccounts(
      accounts.map((a) =>
        a.id === id ? { ...a, needsVerification: false, verificationReason: "" } : a
      )
    );
  };

  const handleCopyClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(caseRemarks);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

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
              Turn a credit report into a clearer view of accounts, balances and obligations.
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

      {/* Workflow Tabs (Requirement 1 & 2: Dual Workflows) */}
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
            onClick={() => setActiveWorkflow("upload")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeWorkflow === "upload"
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
          {uploadedFileName ? (
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <FileCheck size={13} className="text-emerald-600" />
              <span>Loaded: {uploadedFileName}</span>
            </span>
          ) : (
            <span className="text-[11px] text-[#829283] hidden sm:inline">
              Dual workflow enabled
            </span>
          )}
          <button
            type="button"
            onClick={handleResetToManual}
            className="text-[11px] font-semibold text-[#576558] hover:text-[#17241B] px-2.5 py-1 rounded-lg border border-[#E3EBE0] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            title="Reset to default sample dataset"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ===================== CIBIL UPLOAD SECTION (WHEN TAB OR ACCORDION ACTIVE) ===================== */}
      {activeWorkflow === "upload" && (
        <div className="bg-white rounded-2xl border border-[#D5E4D2] p-4 sm:p-6 shadow-sm space-y-4 animate-scale-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEF3EC] pb-3">
            <div>
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#163A2C]">
                <FileText size={18} className="text-[#196D29]" />
                <span>Automated CIBIL Report Extraction</span>
              </div>
              <p className="text-xs text-[#576558] mt-0.5">
                Upload a customer&apos;s TransUnion CIBIL, CRIF High Mark, or Experian PDF report to auto-extract trade lines, score, and balances.
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
                  Analyzing Credit Report &amp; Extracting Trade Lines...
                </div>
                <div className="text-xs text-[#829283]">
                  Validating digital text layers, lenders, balances, and payment records
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
                  Supports TransUnion CIBIL, CRIF High Mark, and Experian PDF formats (Max 15MB). Processing is conducted in-memory for complete data privacy.
                </div>
              </div>
            )}
          </div>

          {/* Upload Notifications */}
          {uploadError && (
            <div className="bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-600" />
              <div>
                <span className="font-bold">Extraction Notice: </span>
                <span>{uploadError}</span>
              </div>
            </div>
          )}

          {uploadSuccessMsg && (
            <div className="bg-[#EBF3E8] border border-[#CDE1C8] text-[#163A2C] p-3.5 rounded-xl text-xs flex items-start justify-between gap-2.5 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-bold">Extraction Successful! </span>
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

          {uploadWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs space-y-1 animate-fade-in">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle size={14} />
                <span>Verification Checklist ({uploadWarnings.length}):</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11.5px] text-amber-800/90">
                {uploadWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Extracted Customer Summary Pill Bar (when report loaded) */}
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
            {needsVerificationCount > 0 && (
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>{needsVerificationCount} trade line(s) need verification</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#829283]">
            {accounts.length} total accounts in profile
          </span>
        </div>
      )}

      {/* Top Score & Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-4">
        {/* Score Dial Box */}
        <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="text-[10px] font-bold tracking-widest text-[#829283] uppercase mb-1.5">
            BUREAU SCORE (CIBIL / CRIF / EXPERIAN)
          </div>
          <div className="text-4xl md:text-5xl font-extrabold font-mono text-[#163A2C] leading-none mb-1.5">
            {score}
          </div>
          <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${band.bg} ${band.color} mb-3`}>
            {band.label}
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

            {/* Editable Applicant Name (Requirement 1 & 3) */}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <div className="bg-[#F9FAF7] p-2.5 rounded-lg border border-[#ECEFE9]">
                <div className="text-[11px] text-[#829283]">Current Live EMI</div>
                <div className="text-base font-bold text-[#17241B]">
                  ₹{currentTotalEmi.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="bg-[#EBF3E8] p-2.5 rounded-lg border border-[#D8E7D5]">
                <div className="text-[11px] text-[#1B4734]">After BT / Closure</div>
                <div className="text-base font-bold text-[#153A2A]">
                  ₹{emiAfterClosure.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="bg-[#F9FAF7] p-2.5 rounded-lg border border-[#ECEFE9]">
                <div className="text-[11px] text-[#829283]">Total Outstanding</div>
                <div className="text-base font-bold text-[#17241B]">
                  ₹{(totalOutstanding / 100000).toFixed(2)}L
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full h-9 bg-[#163A2C] hover:bg-[#102B21] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            onClick={generateRelookCase}
            id="generate-relook-btn"
          >
            <RefreshCw size={13} />
            <span>Generate Relook Justification</span>
          </button>
        </div>
      </div>

      {/* ===================== ACCOUNTS BREAKDOWN TABLE & CONTROLS ===================== */}
      <div className="bg-white rounded-xl border border-[#E3EBE0] p-4 md:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-bold text-[#17241B]">
                Trade Lines &amp; Active Loan Accounts ({accounts.length})
              </h3>
              {needsVerificationCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {needsVerificationCount} Needs Verification
                </span>
              )}
            </div>
            <p className="text-xs text-[#576558] mt-0.5">
              Toggle &quot;Mark to Close / Balance Transfer&quot; to simulate revised FOIR, or edit/add trade lines before generating the underwriting note.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#163A2C] hover:bg-[#1C4937] text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
            id="add-tradeline-btn"
          >
            <Plus size={13} />
            <span>Add Trade Line</span>
          </button>
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
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 text-xs">
                    No trade lines present. Click &quot;Add Trade Line&quot; or upload a CIBIL report.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr
                    key={acc.id}
                    className={`border-b border-[#ECEFE9] last:border-b-0 hover:bg-[#FBFDFB] transition-colors ${
                      acc.status === "Closed" ? "opacity-60" : ""
                    } ${acc.needsVerification ? "bg-amber-50/40" : ""}`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="font-semibold text-[#17241B]">{acc.lender}</div>
                        {acc.needsVerification && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded cursor-help"
                            title={acc.verificationReason || "Extracted field requires verification"}
                          >
                            <AlertTriangle size={10} />
                            <span>Verify</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#829283]">{acc.type}</div>
                      {acc.verificationReason && acc.needsVerification && (
                        <div className="text-[10px] text-amber-700 mt-0.5 max-w-xs leading-tight">
                          {acc.verificationReason}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#576558]">
                      ₹{acc.sanctionAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#17241B]">
                      ₹{acc.currentBalance.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-[#163A2C] font-semibold">
                      ₹{acc.monthlyEmi.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10.5px] px-1.5 py-0.5 rounded ${
                          acc.dpdStatus.includes("Clear")
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {acc.dpdStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          acc.status === "Active"
                            ? "bg-[#E3EDE0] text-[#194532]"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {acc.status === "Active" ? (
                        <button
                          type="button"
                          onClick={() => toggleClosure(acc.id)}
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
                        {acc.needsVerification && (
                          <button
                            type="button"
                            onClick={() => handleVerifyAccount(acc.id)}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                            title="Confirm & Mark Verified"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-1 text-gray-400 hover:text-[#163A2C] hover:bg-gray-100 rounded transition-colors cursor-pointer"
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

      {/* Generated Case Relook Justification */}
      {caseRemarks && (
        <div className="bg-white rounded-xl border border-[#C4D9C1] p-4 md:p-5 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-emerald-700" />
              <h3 className="text-xs md:text-sm font-bold text-[#17241B]">
                Generated Credit Committee &amp; Relook Note
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
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>
          <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap bg-[#F9FAF6] p-3 rounded-lg text-[#183226] border border-[#ECEFE9]">
            {caseRemarks}
          </pre>
        </div>
      )}

      {/* ===================== ADD TRADE LINE MODAL ===================== */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-scale-up"
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
                    onChange={(e) => setFormData({ ...formData, sanctionAmount: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, currentBalance: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, monthlyEmi: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Closed" })}
                    className="w-full h-8 px-2 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  >
                    <option value="Active">Active / Live</option>
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
                  placeholder="e.g. 000/000/000 (Clear)"
                />
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
          className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setEditingAccount(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Trade Line Details</h3>
                <p className="text-[11px] text-gray-500">Correct or adjust extracted loan data</p>
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
                    onChange={(e) => setFormData({ ...formData, sanctionAmount: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, currentBalance: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, monthlyEmi: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Closed" })}
                    className="w-full h-8 px-2 border border-gray-200 rounded-lg outline-none focus:border-[#163A2C]"
                  >
                    <option value="Active">Active / Live</option>
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
                  Update &amp; Mark Verified
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
