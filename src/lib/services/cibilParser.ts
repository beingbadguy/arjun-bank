import { PDFParse } from "pdf-parse";

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
}

export interface ExtractedCibilData {
  success: boolean;
  score: number | null;
  scoreBand: { label: string; color: string; bg: string };
  applicantName: string;
  pan?: string;
  reportDate?: string;
  mobile?: string;
  bureauType: "TransUnion CIBIL" | "Experian" | "CRIF High Mark" | "Equifax" | "Bureau Report";
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
  };
}

const COMMON_LENDERS = [
  "HDFC Bank",
  "State Bank of India",
  "SBI Cards",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bajaj Finance",
  "Bajaj Finserv",
  "Tata Capital",
  "IDFC FIRST Bank",
  "IndusInd Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Federal Bank",
  "Yes Bank",
  "RBL Bank",
  "Fullerton India",
  "SMFG India Credit",
  "Aditya Birla Capital",
  "L&T Finance",
  "InCred Financial",
  "Finnable",
  "Piramal Finance",
  "Home Credit",
  "Standard Chartered",
  "Citibank",
  "HSBC",
  "AU Small Finance Bank",
  "Equitas Small Finance Bank",
  "Hero FinCorp",
  "Muthoot Finance",
  "Manappuram Finance",
  "Cholamandalam Finance",
  "Shriram Finance",
  "Poonawalla Fincorp",
  "American Express",
  "Paytm Postpaid",
  "KrazyBee Services",
  "KreditBee",
  "Dhani Loans",
];

const COMMON_LOAN_TYPES = [
  "Personal Loan",
  "Auto Loan",
  "Car Loan",
  "Housing Loan",
  "Home Loan",
  "Credit Card",
  "Consumer Durable Loan",
  "Two-Wheeler Loan",
  "Loan Against Property",
  "Business Loan",
  "Education Loan",
  "Commercial Vehicle Loan",
  "Gold Loan",
  "Overdraft",
  "Flexi Loan",
  "Kisan Credit Card",
  "Microfinance Loan",
];

export function getScoreBand(val: number) {
  if (val >= 750) return { label: "Excellent (Prime)", color: "text-[#17653C]", bg: "bg-[#DCF2E4]" };
  if (val >= 700) return { label: "Good (Standard)", color: "text-[#1E4E9E]", bg: "bg-[#E2ECFE]" };
  if (val >= 650) return { label: "Moderate Risk", color: "text-amber-800", bg: "bg-amber-100" };
  return { label: "High Risk / Policy Deviation", color: "text-red-800", bg: "bg-red-100" };
}

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseAmount(valStr: string | undefined): number {
  if (!valStr) return 0;
  const cleaned = valStr.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Robust extraction of CIBIL/Bureau PDF report
 */
export async function parseCibilPdfBuffer(buffer: Buffer): Promise<ExtractedCibilData> {
  const warnings: string[] = [];

  // 1. Buffer verification
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty PDF file uploaded. Please upload a valid CIBIL report.");
  }

  const header = buffer.subarray(0, 10).toString("ascii");
  if (!header.includes("%PDF-")) {
    throw new Error("Invalid file format. The uploaded document is not a recognized PDF document.");
  }

  // 2. Extract text via PDFParse
  let rawText = "";
  let totalPages = 1;
  let parser: any = null;

  try {
    parser = new (PDFParse as any)({ data: buffer });
    await parser.load();
    const result = await parser.getText();
    rawText = result.text || "";
    totalPages = result.total || result.pages?.length || 1;
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("password") || msg.includes("encrypted")) {
      throw new Error(
        "The uploaded CIBIL report is password-protected. Please unlock the PDF or use the PDF Tools to remove the password, then re-upload."
      );
    }
    throw new Error(`Failed to read PDF document: ${err.message || "Corrupted file"}`);
  } finally {
    try {
      if (parser && typeof parser.destroy === "function") {
        await parser.destroy();
      }
    } catch {}
  }

  const charCount = rawText.trim().length;
  const isScanned = charCount < 60;

  if (isScanned) {
    throw new Error(
      "The uploaded PDF appears to be a scanned image or photograph without an extractable digital text layer. Please upload a digital credit report PDF downloaded directly from CIBIL, Experian, or your bank portal, or use Manual Entry to input trade lines."
    );
  }

  // 3. Bureau Type Detection
  let bureauType: ExtractedCibilData["bureauType"] = "Bureau Report";
  if (/transunion|cibil/i.test(rawText)) {
    bureauType = "TransUnion CIBIL";
  } else if (/crif|high\s*mark/i.test(rawText)) {
    bureauType = "CRIF High Mark";
  } else if (/experian/i.test(rawText)) {
    bureauType = "Experian";
  } else if (/equifax/i.test(rawText)) {
    bureauType = "Equifax";
  }

  // 4. Extract Credit Score
  let score: number | null = null;

  // Patterns for score
  const scorePatterns = [
    /(?:cibil|transunion|crif|experian|equifax)?\s*score\s*(?:version\s*\d+|v\d+|value)?\s*[:\-\s]\s*([3-9]\d{2})/i,
    /(?:credit|bureau)\s*score\s*[:\-\s]\s*([3-9]\d{2})/i,
    /score\s*[:\-\s]\s*([3-9]\d{2})/i,
    /\b([3-9]\d{2})\b(?=[\s\S]{0,40}(?:prime|standard|risk|score|cibil))/i,
  ];

  for (const regex of scorePatterns) {
    const match = rawText.match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 300 && parsed <= 900) {
        score = parsed;
        break;
      }
    }
  }

  if (!score) {
    warnings.push("Credit score could not be automatically detected. Defaulting to 750 (please verify score manually).");
    score = 750;
  }

  // 5. Extract Consumer Name
  let applicantName = "";
  const namePatterns = [
    /(?:consumer|borrower|applicant|client)\s*name\s*[:\-\s]\s*([A-Za-z\s.]{3,40})/i,
    /name\s*[:\-\s]\s*([A-Z\s.]{4,35})(?:\s+gender|\s+dob|\s+date|\s+pan|\s+voter|\n)/i,
    /(?:mr\.|ms\.|mrs\.|dr\.)\s+([A-Za-z\s.]{3,35})/i,
  ];

  for (const regex of namePatterns) {
    const match = rawText.match(regex);
    if (match && match[1]) {
      const candidate = match[1].replace(/[\r\n]+/g, " ").trim();
      if (candidate.length >= 3 && !/report|date|score|cibil|gender|male|female/i.test(candidate)) {
        applicantName = toTitleCase(candidate);
        break;
      }
    }
  }

  if (!applicantName) {
    applicantName = "Borrower (Verify Name)";
    warnings.push("Applicant name not found in header. Please verify applicant name.");
  }

  // 6. Extract PAN
  let pan: string | undefined;
  const panMatch = rawText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  if (panMatch) {
    pan = panMatch[1];
  }

  // 7. Extract Report Date
  let reportDate: string | undefined;
  const dateMatch = rawText.match(/(?:date\s*of\s*report|report\s*date|generated\s*on)\s*[:\-\s]\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i);
  if (dateMatch) {
    reportDate = dateMatch[1];
  }

  // 8. Extract Mobile
  let mobile: string | undefined;
  const mobileMatch = rawText.match(/(?:mobile|telephone|phone|contact)\s*[:\-\s]*(?:\+?91[\s\-]?)?([6-9]\d{9})/i);
  if (mobileMatch) {
    mobile = mobileMatch[1];
  }

  // 9. Extract Trade Lines / Loan Accounts
  const accounts: ExtractedLoanAccount[] = [];
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Parse lines for lenders & products
  const identifiedBlocks: Array<{
    lender: string;
    type: string;
    lineIndex: number;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains a known lender or lender pattern
    const matchedLender = COMMON_LENDERS.find((l) =>
      new RegExp(`\\b${l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(line)
    );

    // Check if line or nearby lines contain loan type
    let matchedType = COMMON_LOAN_TYPES.find((t) =>
      new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(line)
    );

    if (matchedLender) {
      if (!matchedType) {
        // Look within next 3 lines for loan type
        for (let j = 1; j <= 3 && i + j < lines.length; j++) {
          matchedType = COMMON_LOAN_TYPES.find((t) =>
            new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lines[i + j])
          );
          if (matchedType) break;
        }
      }

      identifiedBlocks.push({
        lender: matchedLender,
        type: matchedType || "Personal Loan",
        lineIndex: i,
      });
    }
  }

  // If no lender matched by exact keywords, scan for Account/Trade-line headers
  if (identifiedBlocks.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matchType = COMMON_LOAN_TYPES.find((t) =>
        new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(line)
      );
      if (matchType) {
        identifiedBlocks.push({
          lender: "Financial Institution",
          type: matchType,
          lineIndex: i,
        });
      }
    }
  }

  // De-duplicate blocks that are too close to each other (e.g. within 2 lines)
  const filteredBlocks = identifiedBlocks.filter((b, idx, arr) => {
    if (idx === 0) return true;
    return b.lineIndex - arr[idx - 1].lineIndex > 2;
  });

  // Extract metrics around each identified block
  for (let b = 0; b < filteredBlocks.length; b++) {
    const block = filteredBlocks[b];
    const startIndex = Math.max(0, block.lineIndex - 2);
    const endIndex = Math.min(lines.length, block.lineIndex + 18);
    const contextChunk = lines.slice(startIndex, endIndex).join(" ");

    // Sanction Amount
    const sanctionMatch = contextChunk.match(/(?:sanction(?:ed)?|high\s*credit|loan\s*amount|limit|credit\s*limit)\s*[:\-\s]*₹?\s*([0-9,]+)/i);
    const sanctionAmount = sanctionMatch ? parseAmount(sanctionMatch[1]) : 0;

    // Current Balance
    const balanceMatch = contextChunk.match(/(?:current\s*balance|balance|outstanding|cur\s*bal)\s*[:\-\s]*₹?\s*([0-9,]+)/i);
    let currentBalance = balanceMatch ? parseAmount(balanceMatch[1]) : 0;

    // Monthly EMI
    const emiMatch = contextChunk.match(/(?:monthly\s*emi|emi|installment|monthly\s*payment)\s*[:\-\s]*₹?\s*([0-9,]+)/i);
    let monthlyEmi = emiMatch ? parseAmount(emiMatch[1]) : 0;

    // DPD / Status
    const dpdMatch = contextChunk.match(/(?:dpd|days\s*past\s*due|asset\s*classification)\s*[:\-\s]*([0-9A-Za-z\/\-\s]+)/i);
    let dpdStatus = "000/000/000 (Clear)";
    if (dpdMatch && dpdMatch[1]) {
      const d = dpdMatch[1].trim().slice(0, 25);
      if (/030|060|090|sub|sma/i.test(d)) {
        dpdStatus = `${d} (Delayed track)`;
      } else if (/000|std|clear/i.test(d)) {
        dpdStatus = "000/000/000 (Clear)";
      }
    }

    // Account Status
    let status: "Active" | "Closed" = "Active";
    if (
      /closed|settled|paid\s*off|zero\s*balance/i.test(contextChunk) ||
      (currentBalance === 0 && sanctionAmount > 0)
    ) {
      status = "Closed";
      currentBalance = 0;
      monthlyEmi = 0;
    }

    let needsVerification = false;
    let verificationReason: string | undefined;

    // Flagging missing values (Requirement 3 & 5)
    if (status === "Active") {
      if (monthlyEmi === 0) {
        if (block.type === "Credit Card" && currentBalance > 0) {
          // Estimated min 5% obligation for credit card
          monthlyEmi = Math.round(currentBalance * 0.05);
          needsVerification = true;
          verificationReason = "Estimated 5% min obligation on credit card. Please verify with customer statement.";
        } else if (currentBalance > 0) {
          needsVerification = true;
          verificationReason = "EMI amount not stated in report. Please enter active monthly EMI.";
        }
      }

      if (sanctionAmount === 0 && currentBalance > 0) {
        needsVerification = true;
        verificationReason = verificationReason
          ? `${verificationReason} | Sanction limit unverified.`
          : "Sanction limit unverified. Please check sanction letter.";
      }
    }

    accounts.push({
      id: String(accounts.length + 1),
      lender: block.lender,
      type: block.type,
      sanctionAmount: sanctionAmount || (currentBalance > 0 ? currentBalance : 50000),
      currentBalance,
      monthlyEmi,
      dpdStatus,
      status,
      toClose: false,
      needsVerification,
      verificationReason,
    });
  }

  // Fallback: If no structured trade lines were found, provide informative message and sample structure
  if (accounts.length === 0) {
    warnings.push(
      "No discrete trade-line blocks could be reliably matched from the PDF layout. A starter template has been populated; please verify and add any active loan lines manually."
    );
    accounts.push({
      id: "1",
      lender: "HDFC Bank",
      type: "Personal Loan",
      sanctionAmount: 500000,
      currentBalance: 240000,
      monthlyEmi: 14500,
      dpdStatus: "000/000/000 (Clear)",
      status: "Active",
      toClose: false,
      needsVerification: true,
      verificationReason: "Auto-generated template trade line for review.",
    });
  }

  // Summary Metrics
  const activeAccounts = accounts.filter((a) => a.status === "Active");
  const totalSanctioned = accounts.reduce((sum, a) => sum + a.sanctionAmount, 0);
  const totalOutstanding = activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const currentLiveEmi = activeAccounts.reduce((sum, a) => sum + a.monthlyEmi, 0);
  const needsVerificationCount = accounts.filter((a) => a.needsVerification).length;

  return {
    success: true,
    score,
    scoreBand: getScoreBand(score),
    applicantName,
    pan,
    reportDate,
    mobile,
    bureauType,
    accounts,
    totalExtracted: accounts.length,
    needsVerificationCount,
    summary: {
      totalSanctioned,
      totalOutstanding,
      currentLiveEmi,
      activeAccountsCount: activeAccounts.length,
      closedAccountsCount: accounts.length - activeAccounts.length,
    },
    warnings,
    extractionDetails: {
      pagesCount: totalPages,
      charactersExtracted: charCount,
      isScannedWarning: isScanned,
    },
  };
}
