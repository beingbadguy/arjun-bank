import { z } from "zod";

export interface PaymentHistoryItem {
  month: string; // e.g. "Sep 2026" or "09-26"
  status: string; // e.g. "STD", "000", "030", "XXX", "SUB", "DBT", "LSS"
  dpdNumeric?: number | null;
}

export interface BureauLoanAccount {
  id: string;
  lender: string;
  accountType: string;
  accountNumberMasked: string;
  ownership: string;
  status: "Open" | "Closed";
  sanctionAmount: number | null;
  currentBalance: number | null;
  amountOverdue: number | null;
  monthlyEmi: number | null;
  interestRate: number | null;
  repaymentTenure: number | null;
  paymentFrequency: string | null;
  openDate: string | null;
  closedDate: string | null;
  lastPaymentDate: string | null;
  reportedDate: string | null;
  writtenOffTotal: number | null;
  writtenOffPrincipal: number | null;
  settlementAmount: number | null;
  suitFiledWilfulDefault: string | null;
  paymentHistory: PaymentHistoryItem[];
  maxDpd: number;
  dpdSummaryString: string;
  sourcePage: number | null;
  confidence: "high" | "medium" | "low";
  needsReview: boolean;
  reviewReasons: string[];
  isManuallyEdited?: boolean;
  toClose?: boolean;
}

export interface BureauCustomerProfile {
  fullName: string;
  dob: string | null;
  gender: string | null;
  panMasked: string | null;
  mobileMasked: string | null;
  emailMasked: string | null;
  address: string | null;
  bureauName: string;
  score: number | null;
  scoreType: string;
  scoreBand: { label: string; color: string; bg: string };
  reportDate: string | null;
  reportControlNumber: string | null;
}

export interface BureauReportSummary {
  totalAccountsReported: number | null;
  totalSanctionedReported: number | null;
  totalCurrentBalanceReported: number | null;
  totalOverdueReported: number | null;
  zeroBalanceAccountsReported: number | null;
  aggregatedOpenAccounts: number;
  aggregatedClosedAccounts: number;
  aggregatedLiveBalance: number;
  aggregatedLiveEmi: number;
  aggregatedTotalSanction: number;
  reconciliationDiscrepancies: string[];
}

export interface ValidationWarning {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  accountId?: string;
}

export type BureauReportFormat =
  | "cibil_consumer"
  | "cibil_institutional"
  | "crif_highmark"
  | "experian"
  | "generic";

export interface NormalizedBureauReport {
  success: boolean;
  formatDetected: BureauReportFormat;
  customer: BureauCustomerProfile;
  accounts: BureauLoanAccount[];
  summary: BureauReportSummary;
  warnings: ValidationWarning[];
  meta: {
    totalPages: number;
    textLength: number;
    isScanned: boolean;
    ocrUsed: boolean;
    fileName?: string;
  };
}

// ==================== ZOD VALIDATION SCHEMAS ====================

export const PaymentHistoryItemSchema = z.object({
  month: z.string(),
  status: z.string(),
  dpdNumeric: z.number().nullable().optional(),
});

export const BureauLoanAccountSchema = z.object({
  id: z.string().min(1),
  lender: z.string().min(1, "Lender name cannot be empty"),
  accountType: z.string().min(1, "Account type is required"),
  accountNumberMasked: z.string(),
  ownership: z.string(),
  status: z.enum(["Open", "Closed"]),
  sanctionAmount: z.number().nonnegative().nullable(),
  currentBalance: z.number().nonnegative().nullable(),
  amountOverdue: z.number().nonnegative().nullable(),
  monthlyEmi: z.number().nonnegative().nullable(),
  interestRate: z.number().nonnegative().nullable(),
  repaymentTenure: z.number().int().nonnegative().nullable(),
  paymentFrequency: z.string().nullable(),
  openDate: z.string().nullable(),
  closedDate: z.string().nullable(),
  lastPaymentDate: z.string().nullable(),
  reportedDate: z.string().nullable(),
  writtenOffTotal: z.number().nonnegative().nullable(),
  writtenOffPrincipal: z.number().nonnegative().nullable(),
  settlementAmount: z.number().nonnegative().nullable(),
  suitFiledWilfulDefault: z.string().nullable(),
  paymentHistory: z.array(PaymentHistoryItemSchema),
  maxDpd: z.number().int().nonnegative(),
  dpdSummaryString: z.string(),
  sourcePage: z.number().int().positive().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  isManuallyEdited: z.boolean().optional(),
  toClose: z.boolean().optional(),
});

export const BureauCustomerProfileSchema = z.object({
  fullName: z.string().min(1, "Applicant name cannot be empty"),
  dob: z.string().nullable(),
  gender: z.string().nullable(),
  panMasked: z.string().nullable(),
  mobileMasked: z.string().nullable(),
  emailMasked: z.string().nullable(),
  address: z.string().nullable(),
  bureauName: z.string(),
  score: z.number().int().min(300).max(900).nullable(),
  scoreType: z.string(),
  scoreBand: z.object({
    label: z.string(),
    color: z.string(),
    bg: z.string(),
  }),
  reportDate: z.string().nullable(),
  reportControlNumber: z.string().nullable(),
});

export const NormalizedBureauReportSchema = z.object({
  success: z.boolean(),
  formatDetected: z.enum([
    "cibil_consumer",
    "cibil_institutional",
    "crif_highmark",
    "experian",
    "generic",
  ]),
  customer: BureauCustomerProfileSchema,
  accounts: z.array(BureauLoanAccountSchema),
  summary: z.object({
    totalAccountsReported: z.number().nullable(),
    totalSanctionedReported: z.number().nullable(),
    totalCurrentBalanceReported: z.number().nullable(),
    totalOverdueReported: z.number().nullable(),
    zeroBalanceAccountsReported: z.number().nullable(),
    aggregatedOpenAccounts: z.number(),
    aggregatedClosedAccounts: z.number(),
    aggregatedLiveBalance: z.number(),
    aggregatedLiveEmi: z.number(),
    aggregatedTotalSanction: z.number(),
    reconciliationDiscrepancies: z.array(z.string()),
  }),
  warnings: z.array(
    z.object({
      code: z.string(),
      severity: z.enum(["info", "warning", "error"]),
      message: z.string(),
      accountId: z.string().optional(),
    })
  ),
  meta: z.object({
    totalPages: z.number(),
    textLength: z.number(),
    isScanned: z.boolean(),
    ocrUsed: z.boolean(),
    fileName: z.string().optional(),
  }),
});
