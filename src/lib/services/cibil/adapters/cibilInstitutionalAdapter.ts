import {
  NormalizedBureauReport,
  BureauLoanAccount,
  BureauCustomerProfile,
  BureauReportSummary,
  ValidationWarning,
  PaymentHistoryItem,
} from "../types";
import {
  parseIndianCurrency,
  parseNumeric,
  normalizeDate,
  maskAccountNumber,
  maskPan,
  maskPhone,
  maskEmail,
  analyzePaymentHistory,
  getCreditScoreBand,
} from "../utils";

interface PageInfo {
  num: number;
  text: string;
}

export function parseCibilInstitutionalReport(
  fullText: string,
  pages: PageInfo[]
): NormalizedBureauReport {
  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const warnings: ValidationWarning[] = [];

  // ================= 1. CUSTOMER PROFILE EXTRACTION =================
  let fullName = "";
  let dob: string | null = null;
  let gender: string | null = null;
  let pan: string | null = null;
  let mobile: string | null = null;
  let email: string | null = null;
  let address: string | null = null;
  let score: number | null = null;
  let reportDate: string | null = null;
  let controlNumber: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Customer Name
    const nameM1 = line.match(/Customer Name:\s*([A-Za-z\s]+?)(?=\s*Report Date:|$)/i);
    if (nameM1 && !fullName) fullName = nameM1[1].trim();

    const nameM2 = line.match(/^NAME:\s*([A-Za-z\s]+)$/i);
    if (nameM2 && !fullName) fullName = nameM2[1].trim();

    const consumerM = line.match(/^CONSUMER:\s*([A-Za-z\s]+?)(?=\s*DATE:|$)/i);
    if (consumerM && !fullName) fullName = consumerM[1].trim();

    // DOB & Gender
    const dobM = line.match(/DATE OF BIRTH:\s*(\d{2}-\d{2}-\d{4})/i);
    if (dobM && !dob) dob = normalizeDate(dobM[1]);

    const genderM = line.match(/GENDER:\s*([A-Za-z]+)/i);
    if (genderM && !gender) gender = genderM[1].trim();

    // PAN
    const panM = line.match(/INCOME TAX ID NUMBER \(PAN\)\s+([A-Z0-9]{10})/i);
    if (panM && !pan) pan = panM[1].trim();

    // Mobile Phone
    const mobM = line.match(/MOBILE PHONE\s+(\d{10,12})/i);
    if (mobM && !mobile) mobile = mobM[1].trim();

    // Email
    if (/^EMAIL ADDRESS:$/i.test(line) && i + 1 < lines.length) {
      const emailLine = lines[i + 1].trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLine)) {
        email = emailLine;
      }
    }

    // Address
    if (/^ADDRESS\s*:/i.test(line) && !address) {
      address = line.replace(/^ADDRESS\s*:\s*/i, "").trim();
    }

    // Report Date
    const repDateM = line.match(/Report Date:\s*(\d{2}-\d{2}-\d{4})/i) || line.match(/DATE:\s*(\d{2}-\d{2}-\d{4})/i);
    if (repDateM && !reportDate) reportDate = normalizeDate(repDateM[1]);

    // Control Number
    const ctrlM = line.match(/CONTROL NUMBER:\s*(\d+)/i);
    if (ctrlM && !controlNumber) controlNumber = ctrlM[1].trim();

    // Score
    if (/CIBIL TRANSUNION SCORE VERSION/i.test(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const scoreM = nextLine.match(/(?:3\.0\s+)?(\d{3})/);
      if (scoreM && score === null) {
        const parsed = parseInt(scoreM[1], 10);
        if (parsed >= 300 && parsed <= 900) score = parsed;
      }
    }
  }

  if (!fullName) {
    fullName = "Bureau Report Subject";
    warnings.push({
      code: "MISSING_NAME",
      severity: "warning",
      message: "Applicant name could not be automatically extracted from BureauOne header.",
    });
  }

  const customerProfile: BureauCustomerProfile = {
    fullName,
    dob,
    gender,
    panMasked: maskPan(pan),
    mobileMasked: maskPhone(mobile),
    emailMasked: maskEmail(email),
    address,
    bureauName: "TransUnion CIBIL (BureauOne / Institutional)",
    score,
    scoreType: "CIBIL TransUnion Score 3.0",
    scoreBand: getCreditScoreBand(score),
    reportDate,
    reportControlNumber: controlNumber,
  };

  // ================= 2. REPORT SUMMARY TOTALS EXTRACTION =================
  let totalAccountsReported: number | null = null;
  let totalSanctionedReported: number | null = null;
  let totalCurrentBalanceReported: number | null = null;
  let totalOverdueReported: number | null = null;
  let zeroBalanceAccountsReported: number | null = null;

  // Search fullText for summary block
  const summaryMatches = fullText.match(
    /TOTAL:\s*(\d+)\s+HIGH CR\/SANC\.\s*AMT:\s*([\d,]+)\s+CURRENT:\s*([\d,]+)[\s\S]*?OVERDUE:\s*([\d,]+)[\s\S]*?ZERO BALANCE:\s*(\d+)/i
  );

  if (summaryMatches) {
    totalAccountsReported = parseInt(summaryMatches[1], 10);
    totalSanctionedReported = parseIndianCurrency(summaryMatches[2]);
    totalCurrentBalanceReported = parseIndianCurrency(summaryMatches[3]);
    totalOverdueReported = parseIndianCurrency(summaryMatches[4]);
    zeroBalanceAccountsReported = parseInt(summaryMatches[5], 10);
  }

  // ================= 3. ACCOUNTS EXTRACTION =================
  const accIndices: number[] = [];
  lines.forEach((l, idx) => {
    if (/^ACCOUNT DATES AMOUNTS STATUS/i.test(l)) {
      accIndices.push(idx);
    }
  });

  const accounts: BureauLoanAccount[] = [];

  for (let k = 0; k < accIndices.length; k++) {
    const startIdx = accIndices[k];
    const endIdx = k + 1 < accIndices.length ? accIndices[k + 1] - 1 : lines.length - 1;
    const accLines = lines.slice(startIdx, endIdx + 1);
    const blockText = accLines.join("\n");

    // Extract fields using label patterns
    const lenderM = blockText.match(/MEMBER NAME:\s*(.+?)(?=\s+OPENED:|\n|$)/i);
    const openedM = blockText.match(/OPENED:\s*(\d{2}-\d{2}-\d{4})/i);
    const closedM = blockText.match(/CLOSED:\s*(\d{2}-\d{2}-\d{4})/i);
    const typeM = blockText.match(/TYPE:\s*(.+?)(?=\s+CLOSED:|\n|$)/i);
    const accNoM = blockText.match(/ACCOUNT NUMBER:\s*([A-Za-z0-9]+?)(?=\s+LAST PAYMENT:|\n|$)/i);
    const lastPmtM = blockText.match(/LAST PAYMENT:\s*(\d{2}-\d{2}-\d{4})/i);
    const sanctionedM = blockText.match(/HIGH CR \/SANCTIONED:\s*([\d,]+)/i);
    const creditLimitM = blockText.match(/CREDIT LIMIT:\s*([\d,]+)/i);
    const balanceM = blockText.match(/CURRENT BALANCE:\s*([\d,]+)/i);
    const emiM = blockText.match(/EMI:\s*([\d,]+)/i);
    const overdueM = blockText.match(/OVERDUE:\s*([\d,]+)/i);
    const tenureM = blockText.match(/REPAYMENT TENURE:\s*(\d+)/i);
    const rateM = blockText.match(/INTEREST RATE:\s*([\d.]+)/i);
    const pmtFreqM = blockText.match(/PMT FREQ:\s*(.+?)(?=\s+REPAYMENT|\n|$)/i);
    const ownershipM = blockText.match(/OWNERSHIP:\s*(.+?)(?=\s+REPORTED|\n|$)/i);
    const reportedM = blockText.match(/CERTIFIED:\s*(\d{2}-\d{2}-\d{4})/i);
    const writtenOffTotalM = blockText.match(/WRITTEN\s*OFF\(TOTAL\):\s*([\d,]+)/i);
    const writtenOffPrincipalM = blockText.match(/WRITTEN\s*OFF\(PRINCIPAL\):\s*([\d,]+)/i);
    const settlementM = blockText.match(/SETTLEMENT:\s*([\d,]+)/i);
    const suitFiledM = blockText.match(/SUIT FILED\/WILFUL\s*DEFAULT\/WRITTEN\s*OFF STATUS\s*:\s*(.+?)(?=\n|$)/i);

    const lenderRaw = lenderM ? lenderM[1].trim() : "MEMBER (NOT DISCLOSED)";
    const accountType = typeM ? typeM[1].trim() : "Loan";
    const openDate = openedM ? normalizeDate(openedM[1]) : null;
    const closedDate = closedM ? normalizeDate(closedM[1]) : null;
    const status: "Open" | "Closed" = closedDate ? "Closed" : "Open";

    const sanctionAmount = sanctionedM
      ? parseIndianCurrency(sanctionedM[1])
      : creditLimitM
      ? parseIndianCurrency(creditLimitM[1])
      : null;

    let currentBalance = balanceM ? parseIndianCurrency(balanceM[1]) : null;
    if (status === "Closed" && (currentBalance === null || isNaN(currentBalance))) {
      currentBalance = 0;
    } else if (status === "Open" && currentBalance === null) {
      // In Format B, credit cards or zero balance accounts with empty current balance have 0
      if (/credit card/i.test(accountType)) {
        currentBalance = 0;
      }
    }

    const monthlyEmi = emiM ? parseIndianCurrency(emiM[1]) : null;

    // ================= PAYMENT HISTORY EXTRACTION =================
    const paymentHistory: PaymentHistoryItem[] = [];
    // Find "DAYS PAST DUE/ASSET CLASSIFICATION"
    const dpdHeaderIdx = accLines.findIndex((l) =>
      /DAYS PAST DUE\/ASSET CLASSIFICATION/i.test(l)
    );

    if (dpdHeaderIdx !== -1) {
      // Gather lines following the header
      // Lines alternate between status codes ("STD STD STD..." or "000 000...") and date strings ("01-26 12-25...")
      const historyLines = accLines
        .slice(dpdHeaderIdx + 1)
        .filter((l) => !/Reference Number:|CREDIT INFORMATION BUREAU|CONSUMER:|MEMBER ID:|MEMBER REFERENCE/i.test(l) && !/^--/i.test(l));

      let pendingStatuses: string[] = [];
      for (const hLine of historyLines) {
        const tokens = hLine.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) continue;

        // Check if line contains dates (MM-YY format)
        const isDateLine = tokens.every((t) => /^\d{2}-\d{2}$/.test(t));
        const isStatusLine = tokens.every(
          (t) => /^(STD|SMA|SUB|DBT|LSS|XXX|\d{3}|\d{1,2})$/i.test(t)
        );

        if (isStatusLine) {
          pendingStatuses = tokens;
        } else if (isDateLine && pendingStatuses.length > 0) {
          const count = Math.min(pendingStatuses.length, tokens.length);
          for (let m = 0; m < count; m++) {
            const rawStatus = pendingStatuses[m].toUpperCase();
            paymentHistory.push({
              month: tokens[m],
              status: rawStatus,
              dpdNumeric: /^\d+$/.test(rawStatus) ? parseInt(rawStatus, 10) : null,
            });
          }
          pendingStatuses = [];
        }
      }
    }

    const pmtAnalysis = analyzePaymentHistory(paymentHistory);

    // Confidence & review reasons
    const reviewReasons: string[] = [];
    if (lenderRaw.toUpperCase().includes("NOT DISCLOSED")) {
      reviewReasons.push("Lender name masked/not disclosed in institutional bureau report");
    }
    if (status === "Open" && currentBalance === null) {
      reviewReasons.push("Current balance not available");
    }
    if (
      status === "Open" &&
      accountType &&
      /auto loan|personal loan|home loan|housing loan/i.test(accountType) &&
      monthlyEmi === null
    ) {
      reviewReasons.push("EMI missing on active term loan");
    }

    const confidence: "high" | "medium" | "low" =
      reviewReasons.length === 0 ? "high" : reviewReasons.length === 1 ? "medium" : "low";

    const id = `cibil-inst-${k + 1}-${Math.random().toString(36).substring(2, 6)}`;

    // Approximate source page based on position
    const pageIndex = Math.min(
      pages.length,
      Math.max(1, Math.ceil(((k + 1) / accIndices.length) * (pages.length - 1)) + 1)
    );

    accounts.push({
      id,
      lender: lenderRaw,
      accountType,
      accountNumberMasked: maskAccountNumber(accNoM ? accNoM[1] : null),
      ownership: ownershipM ? ownershipM[1].trim() : "Individual",
      status,
      sanctionAmount,
      currentBalance,
      amountOverdue: overdueM ? parseIndianCurrency(overdueM[1]) : 0,
      monthlyEmi,
      interestRate: rateM ? parseNumeric(rateM[1]) : null,
      repaymentTenure: tenureM ? parseNumeric(tenureM[1]) : null,
      paymentFrequency: pmtFreqM ? pmtFreqM[1].trim() : null,
      openDate,
      closedDate,
      lastPaymentDate: lastPmtM ? normalizeDate(lastPmtM[1]) : null,
      reportedDate: reportedM ? normalizeDate(reportedM[1]) : null,
      writtenOffTotal: writtenOffTotalM ? parseIndianCurrency(writtenOffTotalM[1]) : null,
      writtenOffPrincipal: writtenOffPrincipalM ? parseIndianCurrency(writtenOffPrincipalM[1]) : null,
      settlementAmount: settlementM ? parseIndianCurrency(settlementM[1]) : null,
      suitFiledWilfulDefault: suitFiledM ? suitFiledM[1].trim() : null,
      paymentHistory,
      maxDpd: pmtAnalysis.maxDpd,
      dpdSummaryString: pmtAnalysis.dpdSummaryString,
      sourcePage: pageIndex,
      confidence,
      needsReview: reviewReasons.length > 0,
      reviewReasons,
      toClose: false,
    });
  }

  // ================= 4. SUMMARY AGGREGATION & RECONCILIATION =================
  const openAccs = accounts.filter((a) => a.status === "Open");
  const closedAccs = accounts.filter((a) => a.status === "Closed");

  const aggregatedLiveBalance = openAccs.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const aggregatedLiveEmi = openAccs.reduce((sum, a) => sum + (a.monthlyEmi || 0), 0);
  const aggregatedTotalSanction = accounts.reduce((sum, a) => sum + (a.sanctionAmount || 0), 0);

  const reconciliationDiscrepancies: string[] = [];

  if (totalCurrentBalanceReported !== null && aggregatedLiveBalance !== totalCurrentBalanceReported) {
    const diff = aggregatedLiveBalance - totalCurrentBalanceReported;
    const msg = `Reconciliation Warning: Aggregated active outstanding (₹${aggregatedLiveBalance.toLocaleString("en-IN")}) differs from Bureau summary (₹${totalCurrentBalanceReported.toLocaleString("en-IN")}) by ₹${Math.abs(diff).toLocaleString("en-IN")}.`;
    reconciliationDiscrepancies.push(msg);
    warnings.push({
      code: "BALANCE_RECONCILIATION_DIFF",
      severity: "warning",
      message: msg,
    });
  }

  if (totalSanctionedReported !== null && aggregatedTotalSanction !== totalSanctionedReported) {
    const diff = aggregatedTotalSanction - totalSanctionedReported;
    const msg = `Reconciliation Warning: Aggregated sanction amount (₹${aggregatedTotalSanction.toLocaleString("en-IN")}) differs from Bureau summary (₹${totalSanctionedReported.toLocaleString("en-IN")}) by ₹${Math.abs(diff).toLocaleString("en-IN")}.`;
    reconciliationDiscrepancies.push(msg);
    warnings.push({
      code: "SANCTION_RECONCILIATION_DIFF",
      severity: "info",
      message: msg,
    });
  }

  if (totalAccountsReported !== null && accounts.length !== totalAccountsReported) {
    const msg = `Account Count Notice: Extracted ${accounts.length} accounts while bureau summary reported ${totalAccountsReported}.`;
    reconciliationDiscrepancies.push(msg);
    warnings.push({
      code: "ACCOUNT_COUNT_MISMATCH",
      severity: "warning",
      message: msg,
    });
  }

  const reportSummary: BureauReportSummary = {
    totalAccountsReported,
    totalSanctionedReported,
    totalCurrentBalanceReported,
    totalOverdueReported,
    zeroBalanceAccountsReported,
    aggregatedOpenAccounts: openAccs.length,
    aggregatedClosedAccounts: closedAccs.length,
    aggregatedLiveBalance,
    aggregatedLiveEmi,
    aggregatedTotalSanction,
    reconciliationDiscrepancies,
  };

  return {
    success: true,
    formatDetected: "cibil_institutional",
    customer: customerProfile,
    accounts,
    summary: reportSummary,
    warnings,
    meta: {
      totalPages: pages.length,
      textLength: fullText.length,
      isScanned: false,
      ocrUsed: false,
    },
  };
}
