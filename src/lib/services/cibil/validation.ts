import {
  NormalizedBureauReport,
  BureauLoanAccount,
  ValidationWarning,
  NormalizedBureauReportSchema,
} from "./types";

export function validateNormalizedBureauReport(
  report: NormalizedBureauReport
): {
  isValid: boolean;
  validatedReport: NormalizedBureauReport;
  warnings: ValidationWarning[];
  criticalErrors: string[];
} {
  const warnings: ValidationWarning[] = [...report.warnings];
  const criticalErrors: string[] = [];

  // 1. Zod structural validation
  const zodResult = NormalizedBureauReportSchema.safeParse(report);
  if (!zodResult.success) {
    zodResult.error.issues.forEach((err) => {
      warnings.push({
        code: "SCHEMA_VALIDATION_ISSUE",
        severity: "warning",
        message: `${err.path.join(".")}: ${err.message}`,
      });
    });
  }

  // 2. Score validation
  const score = report.customer.score;
  if (score !== null) {
    if (score < 300 || score > 900) {
      criticalErrors.push(`Credit score (${score}) is outside the standard bureau range [300-900].`);
      warnings.push({
        code: "INVALID_SCORE_RANGE",
        severity: "error",
        message: `Credit score ${score} is out of allowable bureau range (300 to 900).`,
      });
    }
  } else {
    warnings.push({
      code: "MISSING_CREDIT_SCORE",
      severity: "warning",
      message: "No credit score detected in bureau report. Account may have No Hit (NH) or Insufficient History status.",
    });
  }

  // 3. Duplicate Account Detection
  const seenAccIdentifiers = new Map<string, string>();
  report.accounts.forEach((acc) => {
    // Build unique signature if account number or lender+type+sanc
    if (acc.accountNumberMasked && acc.accountNumberMasked !== "XXXX") {
      const key = `${acc.lender.toLowerCase()}-${acc.accountNumberMasked}`;
      if (seenAccIdentifiers.has(key)) {
        warnings.push({
          code: "DUPLICATE_ACCOUNT_DETECTED",
          severity: "warning",
          accountId: acc.id,
          message: `Possible duplicate credit facility detected for account ${acc.accountNumberMasked} with ${acc.lender}.`,
        });
      } else {
        seenAccIdentifiers.set(key, acc.id);
      }
    }
  });

  // 4. Account-level business rules & sanity checks
  report.accounts.forEach((acc) => {
    // Missing lender
    if (!acc.lender || acc.lender.trim() === "" || acc.lender.toLowerCase().includes("unspecified")) {
      warnings.push({
        code: "MISSING_LENDER",
        severity: "warning",
        accountId: acc.id,
        message: `Account ID ${acc.id} is missing an identifiable lender name.`,
      });
    }

    // Negative amounts
    if (acc.currentBalance !== null && acc.currentBalance < 0) {
      warnings.push({
        code: "NEGATIVE_BALANCE",
        severity: "warning",
        accountId: acc.id,
        message: `Negative balance (${acc.currentBalance}) detected on ${acc.lender} account.`,
      });
    }
    if (acc.sanctionAmount !== null && acc.sanctionAmount < 0) {
      warnings.push({
        code: "NEGATIVE_SANCTION",
        severity: "error",
        accountId: acc.id,
        message: `Negative sanction amount (${acc.sanctionAmount}) is invalid.`,
      });
    }

    // Conflicting open/closed status
    if (acc.status === "Closed" && acc.currentBalance !== null && acc.currentBalance > 0) {
      warnings.push({
        code: "CLOSED_ACCOUNT_WITH_BALANCE",
        severity: "warning",
        accountId: acc.id,
        message: `Account with ${acc.lender} has closure date (${acc.closedDate || "Closed"}), but shows non-zero balance (₹${acc.currentBalance.toLocaleString("en-IN")}). Manual review recommended.`,
      });
    }

    if (acc.status === "Open" && acc.closedDate) {
      warnings.push({
        code: "OPEN_ACCOUNT_WITH_CLOSURE_DATE",
        severity: "warning",
        accountId: acc.id,
        message: `Account with ${acc.lender} is marked Open but contains closure date (${acc.closedDate}).`,
      });
    }

    // Missing EMI on active term loan requiring EMI
    const isTermLoan = /loan/i.test(acc.accountType) && !/gold loan|bullet/i.test(acc.accountType);
    if (acc.status === "Open" && isTermLoan && (acc.monthlyEmi === null || acc.monthlyEmi === 0)) {
      warnings.push({
        code: "ACTIVE_LOAN_MISSING_EMI",
        severity: "warning",
        accountId: acc.id,
        message: `Active ${acc.accountType} with ${acc.lender} has ₹${(acc.currentBalance || 0).toLocaleString("en-IN")} outstanding but no monthly EMI reported. Please verify or input EMI manually.`,
      });
    }

    // Balance significantly exceeding sanction amount (> 120%)
    if (
      acc.sanctionAmount !== null &&
      acc.currentBalance !== null &&
      acc.sanctionAmount > 0 &&
      acc.currentBalance > acc.sanctionAmount * 1.2
    ) {
      warnings.push({
        code: "BALANCE_EXCEEDS_SANCTION",
        severity: "warning",
        accountId: acc.id,
        message: `Current balance (₹${acc.currentBalance.toLocaleString("en-IN")}) exceeds sanctioned limit (₹${acc.sanctionAmount.toLocaleString("en-IN")}) on ${acc.lender} account.`,
      });
    }
  });

  // 5. Summary reconciliation check
  if (
    report.summary.totalCurrentBalanceReported !== null &&
    Math.abs(report.summary.aggregatedLiveBalance - report.summary.totalCurrentBalanceReported) > 100
  ) {
    const diff = Math.abs(
      report.summary.aggregatedLiveBalance - report.summary.totalCurrentBalanceReported
    );
    warnings.push({
      code: "SUMMARY_BALANCE_MISMATCH",
      severity: "warning",
      message: `Bureau summary live balance (₹${report.summary.totalCurrentBalanceReported.toLocaleString("en-IN")}) differs from sum of extracted accounts (₹${report.summary.aggregatedLiveBalance.toLocaleString("en-IN")}) by ₹${diff.toLocaleString("en-IN")}.`,
    });
  }

  // Deduplicate warnings by code + message
  const uniqueWarnings: ValidationWarning[] = [];
  const seenWarningKeys = new Set<string>();
  warnings.forEach((w) => {
    const key = `${w.code}-${w.accountId || ""}-${w.message}`;
    if (!seenWarningKeys.has(key)) {
      seenWarningKeys.add(key);
      uniqueWarnings.push(w);
    }
  });

  return {
    isValid: criticalErrors.length === 0,
    validatedReport: {
      ...report,
      warnings: uniqueWarnings,
    },
    warnings: uniqueWarnings,
    criticalErrors,
  };
}
