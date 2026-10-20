import { parseBureauPdf } from "./cibil";
import { NormalizedBureauReport, BureauLoanAccount } from "./cibil/types";

export interface ExtractedLoanAccount {
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
  openDate?: string;
  closedDate?: string;
  sourcePage?: number | null;
  confidence?: "high" | "medium" | "low";
  maxDpd?: number;
  paymentHistory?: any[];
}

export interface ExtractedCibilData {
  success: boolean;
  score: number | null;
  scoreBand: { label: string; color: string; bg: string };
  applicantName: string;
  pan?: string;
  reportDate?: string;
  mobile?: string;
  bureauType: string;
  accounts: ExtractedLoanAccount[];
  totalExtracted: number;
  needsVerificationCount: number;
  summary: {
    totalSanctioned: number;
    totalOutstanding: number;
    currentLiveEmi: number;
    activeAccountsCount: number;
    closedAccountsCount: number;
  };
  warnings: string[];
  extractionDetails: {
    pagesCount: number;
    charactersExtracted: number;
    isScannedWarning: boolean;
    formatDetected: string;
  };
  normalizedReport: NormalizedBureauReport;
}

/**
 * Backward-compatible wrapper delegating to the production-ready modular CIBIL pipeline.
 */
export async function parseCibilPdfBuffer(
  buffer: Buffer,
  fileName?: string
): Promise<ExtractedCibilData> {
  const normalized = await parseBureauPdf(buffer, fileName);

  const mappedAccounts: ExtractedLoanAccount[] = normalized.accounts.map((acc: BureauLoanAccount) => {
    return {
      id: acc.id,
      lender: acc.lender,
      type: acc.accountType,
      sanctionAmount: acc.sanctionAmount || 0,
      currentBalance: acc.currentBalance || 0,
      monthlyEmi: acc.monthlyEmi || 0,
      dpdStatus: acc.dpdSummaryString,
      status: acc.status === "Open" ? "Active" : "Closed",
      toClose: acc.toClose || false,
      needsVerification: acc.needsReview,
      verificationReason: acc.reviewReasons.join("; ") || undefined,
      accountNumber: acc.accountNumberMasked,
      openDate: acc.openDate || undefined,
      closedDate: acc.closedDate || undefined,
      sourcePage: acc.sourcePage,
      confidence: acc.confidence,
      maxDpd: acc.maxDpd,
      paymentHistory: acc.paymentHistory,
    };
  });

  const activeAccs = mappedAccounts.filter((a) => a.status === "Active");
  const closedAccs = mappedAccounts.filter((a) => a.status === "Closed");

  const totalSanctioned = mappedAccounts.reduce((sum, a) => sum + a.sanctionAmount, 0);
  const totalOutstanding = activeAccs.reduce((sum, a) => sum + a.currentBalance, 0);
  const currentLiveEmi = activeAccs.reduce((sum, a) => sum + a.monthlyEmi, 0);
  const needsVerificationCount = mappedAccounts.filter((a) => a.needsVerification).length;

  return {
    success: true,
    score: normalized.customer.score,
    scoreBand: normalized.customer.scoreBand,
    applicantName: normalized.customer.fullName,
    pan: normalized.customer.panMasked || undefined,
    reportDate: normalized.customer.reportDate || undefined,
    mobile: normalized.customer.mobileMasked || undefined,
    bureauType: normalized.customer.bureauName,
    accounts: mappedAccounts,
    totalExtracted: mappedAccounts.length,
    needsVerificationCount,
    summary: {
      totalSanctioned,
      totalOutstanding,
      currentLiveEmi,
      activeAccountsCount: activeAccs.length,
      closedAccountsCount: closedAccs.length,
    },
    warnings: normalized.warnings.map((w) => w.message),
    extractionDetails: {
      pagesCount: normalized.meta.totalPages,
      charactersExtracted: normalized.meta.textLength,
      isScannedWarning: normalized.meta.isScanned,
      formatDetected: normalized.formatDetected,
    },
    normalizedReport: normalized,
  };
}
