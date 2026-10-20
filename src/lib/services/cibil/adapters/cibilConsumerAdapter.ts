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
  analyzePaymentHistory,
  getCreditScoreBand,
} from "../utils";

interface PageInfo {
  num: number;
  text: string;
}

export function parseCibilConsumerReport(
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
  let score: number | null = null;
  let reportDate: string | null = null;
  let controlNumber: string | null = null;

  for (let i = 0; i < Math.min(lines.length, 120); i++) {
    const line = lines[i];

    // Control Number
    const ctrlMatch = line.match(/Control Number\s*:\s*([\d,]+)/i);
    if (ctrlMatch && !controlNumber) {
      controlNumber = ctrlMatch[1].replace(/,/g, "");
    }

    // Report Date: Date : 13/10/2026
    const dateMatch = line.match(/^Date\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dateMatch && !reportDate) {
      reportDate = normalizeDate(dateMatch[1]);
    }

    // Score: "Your CIBIL Score is 715" or number on its own line between 300 and 900
    const scoreTextMatch = line.match(/Your CIBIL Score is\s*(\d{3})/i);
    if (scoreTextMatch && score === null) {
      const parsed = parseInt(scoreTextMatch[1], 10);
      if (parsed >= 300 && parsed <= 900) score = parsed;
    }

    // "Hello, DHINAKARAN S/O PICHAIAMMAL"
    const helloMatch = line.match(/^Hello,\s*(.+)$/i);
    if (helloMatch && !fullName) {
      fullName = helloMatch[1].trim();
    }

    // Name under PERSONAL DETAILS
    if (/^PERSONAL DETAILS$/i.test(line)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
        if (/^Name$/i.test(lines[j]) && j + 1 < lines.length && !fullName) {
          fullName = lines[j + 1].trim();
        }
        const dobM = lines[j].match(/Date Of Birth\s*\t*\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
        if (dobM && !dob) {
          dob = normalizeDate(dobM[1]);
        }
        const genM = lines[j].match(/Gender\s*\t*\s*(Male|Female|Other)/i);
        if (genM && !gender) {
          gender = genM[1];
        }
      }
    }

    // PAN in IDENTIFICATION DETAILS
    if (/Income Tax ID Number \(PAN\)/i.test(line) || /Identification Type\s*\t*\s*Income Tax/i.test(line)) {
      for (let j = i; j < Math.min(lines.length, i + 8); j++) {
        const panMatch = lines[j].match(/ID Number\s*\t*\s*([A-Z0-9]{10})/i);
        if (panMatch && !pan) {
          pan = panMatch[1];
          break;
        }
      }
    }
  }

  // Fallback for Score if not found by text
  if (score === null) {
    for (let i = 0; i < Math.min(lines.length, 60); i++) {
      if (lines[i] === "300" && lines[i + 1] === "900" && i + 2 < lines.length) {
        const potential = parseInt(lines[i + 2], 10);
        if (!isNaN(potential) && potential >= 300 && potential <= 900) {
          score = potential;
          break;
        }
      }
    }
  }

  if (!fullName) {
    fullName = "Report Subject";
    warnings.push({
      code: "MISSING_NAME",
      severity: "warning",
      message: "Applicant name could not be automatically extracted from CIBIL header.",
    });
  }

  const customerProfile: BureauCustomerProfile = {
    fullName,
    dob,
    gender,
    panMasked: maskPan(pan),
    mobileMasked: null,
    emailMasked: null,
    address: null,
    bureauName: "TransUnion CIBIL",
    score,
    scoreType: "CIBIL Score Version 3.0",
    scoreBand: getCreditScoreBand(score),
    reportDate,
    reportControlNumber: controlNumber,
  };

  // ================= 2. ACCOUNT BLOCKS EXTRACTION =================
  const subIndices: number[] = [];
  lines.forEach((l, idx) => {
    if (/SUB:Substandard/i.test(l)) {
      subIndices.push(idx);
    }
  });

  const closedSectionIdx = lines.findIndex((l) => l === "CLOSED ACCOUNTS");
  let prevEnd = lines.findIndex((l) => l === "OPEN ACCOUNTS");
  if (prevEnd === -1) prevEnd = 0;

  const accounts: BureauLoanAccount[] = [];

  for (let k = 0; k < subIndices.length; k++) {
    const endIdx = subIndices[k];
    const accLines = lines.slice(prevEnd, endIdx + 1);
    prevEnd = endIdx + 1;

    let lender: string | null = null;
    let accountType: string | null = null;
    let rawAccountNumber: string | null = null;
    let ownership = "Individual";
    let sanctionedRaw: string | null = null;
    let balanceRaw: string | null = null;
    let emiRaw: string | null = null;
    let overdueRaw: string | null = null;
    let rateRaw: string | null = null;
    let tenureRaw: string | null = null;
    let pmtFreqRaw: string | null = null;
    let openDateRaw: string | null = null;
    let closedDateRaw: string | null = null;
    let lastPaymentRaw: string | null = null;
    let reportedDateRaw: string | null = null;
    let writtenOffTotalRaw: string | null = null;
    let writtenOffPrincipalRaw: string | null = null;
    let settlementRaw: string | null = null;
    let suitFiledRaw: string | null = null;
    const paymentHistory: PaymentHistoryItem[] = [];

    for (let j = 0; j < accLines.length; j++) {
      const line = accLines[j];
      const tabParts = line.split(/\t+/).map((s) => s.trim());
      const label = tabParts[0];
      const val = tabParts[1] || "";

      // Multi-line labels: Member Name, Account Type, Account Number, Ownership
      if (/^Member Name$/i.test(line) && j + 1 < accLines.length) {
        lender = accLines[j + 1].trim();
      }
      if (/^Account Type$/i.test(line) && j + 1 < accLines.length) {
        accountType = accLines[j + 1].trim();
      }
      if (/^Account Number$/i.test(line) && j + 1 < accLines.length) {
        rawAccountNumber = accLines[j + 1].trim();
      }
      if (/^Ownership$/i.test(line) && j + 1 < accLines.length) {
        ownership = accLines[j + 1].trim();
      }

      // Tab-separated or inline fields
      if (/^Sanctioned Amount/i.test(label)) sanctionedRaw = val;
      if (/^Credit Limit/i.test(label) && !sanctionedRaw && val && val !== "-") {
        sanctionedRaw = val;
      }
      if (/^Current Balance/i.test(label)) balanceRaw = val;
      if (/^Amount Overdue/i.test(label)) overdueRaw = val;
      if (/^EMI Amount/i.test(label)) emiRaw = val;
      if (/^Rate of Interest/i.test(label)) rateRaw = val;
      if (/^Repayment Tenure/i.test(label)) tenureRaw = val;
      if (/^Payment Frequency/i.test(label)) pmtFreqRaw = val;
      if (/^Date Opened \/ Disbursed/i.test(label)) openDateRaw = val;
      if (/^Date Closed/i.test(label)) closedDateRaw = val;
      if (/^Date of Last Payment/i.test(label)) lastPaymentRaw = val;
      if (/^Date Reported And Certified/i.test(label)) reportedDateRaw = val;
      if (/^Written-off Amount \(Total\)/i.test(label)) writtenOffTotalRaw = val;
      if (/^Written-off Amount \(Principal\)/i.test(label)) writtenOffPrincipalRaw = val;
      if (/^Settlement Amount/i.test(label)) settlementRaw = val;
      if (/^Suit - Filed \/ Wilful Default/i.test(label)) suitFiledRaw = val;

      // Payment History records: e.g. "Jul 2026 \t 0" or "Sep 2026 \t 0"
      const pmtMatch = line.match(/^([A-Za-z]{3}\s+\d{4})\s*\t\s*(.+)$/);
      if (pmtMatch) {
        const rawStatus = pmtMatch[2].trim();
        paymentHistory.push({
          month: pmtMatch[1],
          status: rawStatus,
          dpdNumeric: /^\d+$/.test(rawStatus) ? parseInt(rawStatus, 10) : null,
        });
      }
    }

    if (!lender && !rawAccountNumber && !sanctionedRaw) {
      // Empty or invalid block, skip
      continue;
    }

    // Determine status:
    // Explicit evidence: valid Date Closed means Closed.
    // If Date Closed is '-' or empty, check if after CLOSED ACCOUNTS header AND has zero balance.
    const normalizedClosedDate = normalizeDate(closedDateRaw);
    const parsedCurrentBal = parseIndianCurrency(balanceRaw);
    let status: "Open" | "Closed" = "Open";

    if (normalizedClosedDate) {
      status = "Closed";
    } else if (closedSectionIdx !== -1 && endIdx > closedSectionIdx) {
      if (parsedCurrentBal === 0 || parsedCurrentBal === null) {
        status = "Closed";
      }
    }

    // Payment history analysis
    const pmtAnalysis = analyzePaymentHistory(paymentHistory);

    // Confidence and review checks
    const reviewReasons: string[] = [];
    if (!lender) reviewReasons.push("Lender name missing");
    if (!accountType) reviewReasons.push("Account type missing");
    if (status === "Open" && parsedCurrentBal === null) {
      reviewReasons.push("Current balance not available");
    }
    if (
      status === "Open" &&
      accountType &&
      /loan/i.test(accountType) &&
      !/gold/i.test(accountType) &&
      parseIndianCurrency(emiRaw) === null
    ) {
      reviewReasons.push("EMI missing on active term loan");
    }

    const confidence: "high" | "medium" | "low" =
      reviewReasons.length === 0 ? "high" : reviewReasons.length === 1 ? "medium" : "low";

    const id = `cibil-cons-${k + 1}-${rawAccountNumber ? rawAccountNumber.slice(-4) : Math.random().toString(36).substring(2, 6)}`;

    // Find source page for this account
    let sourcePage: number | null = null;
    if (rawAccountNumber) {
      const matchPg = pages.find((p) => p.text.includes(rawAccountNumber!));
      if (matchPg) sourcePage = matchPg.num;
    }

    accounts.push({
      id,
      lender: lender || "Unspecified Lender",
      accountType: accountType || "Loan",
      accountNumberMasked: maskAccountNumber(rawAccountNumber),
      ownership,
      status,
      sanctionAmount: parseIndianCurrency(sanctionedRaw),
      currentBalance: status === "Closed" ? 0 : parsedCurrentBal,
      amountOverdue: parseIndianCurrency(overdueRaw),
      monthlyEmi: parseIndianCurrency(emiRaw),
      interestRate: parseNumeric(rateRaw),
      repaymentTenure: parseNumeric(tenureRaw),
      paymentFrequency: pmtFreqRaw && pmtFreqRaw !== "-" ? pmtFreqRaw : null,
      openDate: normalizeDate(openDateRaw),
      closedDate: normalizedClosedDate,
      lastPaymentDate: normalizeDate(lastPaymentRaw),
      reportedDate: normalizeDate(reportedDateRaw),
      writtenOffTotal: parseIndianCurrency(writtenOffTotalRaw),
      writtenOffPrincipal: parseIndianCurrency(writtenOffPrincipalRaw),
      settlementAmount: parseIndianCurrency(settlementRaw),
      suitFiledWilfulDefault: suitFiledRaw && suitFiledRaw !== "-" ? suitFiledRaw : null,
      paymentHistory,
      maxDpd: pmtAnalysis.maxDpd,
      dpdSummaryString: pmtAnalysis.dpdSummaryString,
      sourcePage,
      confidence,
      needsReview: reviewReasons.length > 0,
      reviewReasons,
      toClose: false,
    });
  }

  // ================= 3. SUMMARY AGGREGATION & RECONCILIATION =================
  const openAccs = accounts.filter((a) => a.status === "Open");
  const closedAccs = accounts.filter((a) => a.status === "Closed");

  const aggregatedLiveBalance = openAccs.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const aggregatedLiveEmi = openAccs.reduce((sum, a) => sum + (a.monthlyEmi || 0), 0);
  const aggregatedTotalSanction = accounts.reduce((sum, a) => sum + (a.sanctionAmount || 0), 0);

  const reportSummary: BureauReportSummary = {
    totalAccountsReported: accounts.length,
    totalSanctionedReported: null, // Dhinakaran format doesn't have an upfront summary table
    totalCurrentBalanceReported: null,
    totalOverdueReported: null,
    zeroBalanceAccountsReported: closedAccs.length,
    aggregatedOpenAccounts: openAccs.length,
    aggregatedClosedAccounts: closedAccs.length,
    aggregatedLiveBalance,
    aggregatedLiveEmi,
    aggregatedTotalSanction,
    reconciliationDiscrepancies: [],
  };

  return {
    success: true,
    formatDetected: "cibil_consumer",
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
