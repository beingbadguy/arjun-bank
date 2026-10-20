import { PaymentHistoryItem } from "./types";

/**
 * Parses Indian currency string to number or null.
 * Handles ₹ symbol, commas (e.g. 11,30,000 or 1,50,000), dashes (-), and empty values.
 */
export function parseIndianCurrency(val: string | null | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[₹\s,]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "nil") {
    return null;
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parses numeric value (e.g. tenure in months, interest rate)
 */
export function parseNumeric(val: string | null | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[%\s,]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned.toLowerCase() === "null") {
    return null;
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Standardizes dates to DD/MM/YYYY or returns null.
 */
export function normalizeDate(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "not reported") {
    return null;
  }

  // Handle DD/MM/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, "0");
    const m = slashMatch[2].padStart(2, "0");
    const y = slashMatch[3];
    return `${d}/${m}/${y}`;
  }

  // Handle DD-MM-YYYY
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const d = dashMatch[1].padStart(2, "0");
    const m = dashMatch[2].padStart(2, "0");
    const y = dashMatch[3];
    return `${d}/${m}/${y}`;
  }

  // Handle YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${d}/${m}/${y}`;
  }

  return trimmed;
}

/**
 * Masks sensitive account number, showing only last 4 digits.
 */
export function maskAccountNumber(acc: string | null | undefined): string {
  if (!acc) return "XXXX";
  const cleaned = acc.trim();
  if (cleaned.length <= 4) return "XXXX";
  return "XXXX-" + cleaned.slice(-4);
}

/**
 * Masks sensitive PAN (Permanent Account Number), e.g. BSWPD1012J -> BSW****12J
 */
export function maskPan(pan: string | null | undefined): string | null {
  if (!pan) return null;
  const cleaned = pan.trim().toUpperCase();
  if (cleaned.length !== 10) return cleaned.slice(0, 2) + "****" + cleaned.slice(-2);
  return `${cleaned.slice(0, 3)}****${cleaned.slice(-2)}`;
}

/**
 * Masks phone number
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX";
  return "XXXXXX" + digits.slice(-4);
}

/**
 * Masks email address
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const parts = email.trim().split("@");
  if (parts.length !== 2) return null;
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
  return `${maskedUser}@${domain}`;
}

/**
 * Interprets payment history status codes and calculates max DPD.
 * Distinct codes:
 * - "STD" / "000" / "0" = Standard / 0 DPD
 * - "SMA" = Special Mention Account (potential weakness)
 * - "SUB" = Substandard (< 12 months NPA)
 * - "DBT" = Doubtful (> 12 months NPA)
 * - "LSS" = Loss asset
 * - "XXX" = Not reported / No data available (NOT 0 DPD!)
 * - numeric digits (e.g. "030", "060", "090") = Days Past Due
 */
export function analyzePaymentHistory(items: PaymentHistoryItem[]): {
  maxDpd: number;
  dpdSummaryString: string;
  hasAdverseStatus: boolean;
  adverseRemarks: string[];
} {
  if (!items || items.length === 0) {
    return {
      maxDpd: 0,
      dpdSummaryString: "No history reported",
      hasAdverseStatus: false,
      adverseRemarks: [],
    };
  }

  let maxDpd = 0;
  let delayCount = 0;
  let unrecordedCount = 0;
  const adverseRemarks: string[] = [];

  for (const item of items) {
    const raw = item.status.trim().toUpperCase();
    if (raw === "XXX" || raw === "NR") {
      unrecordedCount++;
      continue;
    }

    if (raw === "STD" || raw === "0" || raw === "000") {
      continue;
    }

    if (raw === "SMA") {
      adverseRemarks.push(`Special Mention Account (SMA) in ${item.month}`);
      continue;
    }
    if (raw === "SUB") {
      maxDpd = Math.max(maxDpd, 90);
      adverseRemarks.push(`Substandard asset classification in ${item.month}`);
      continue;
    }
    if (raw === "DBT") {
      maxDpd = Math.max(maxDpd, 180);
      adverseRemarks.push(`Doubtful asset classification in ${item.month}`);
      continue;
    }
    if (raw === "LSS") {
      maxDpd = Math.max(maxDpd, 360);
      adverseRemarks.push(`Loss asset classification in ${item.month}`);
      continue;
    }

    const numeric = parseInt(raw, 10);
    if (!isNaN(numeric) && numeric > 0) {
      if (numeric > maxDpd) maxDpd = numeric;
      delayCount++;
    }
  }

  let dpdSummaryString = "000/000 (Clear)";
  if (maxDpd > 0) {
    dpdSummaryString = `${String(maxDpd).padStart(3, "0")} (Max ${maxDpd} DPD, ${delayCount} delayed cycle${delayCount > 1 ? "s" : ""})`;
  } else if (adverseRemarks.length > 0) {
    dpdSummaryString = adverseRemarks[0];
  } else if (unrecordedCount === items.length) {
    dpdSummaryString = "XXX (Not Reported by Member)";
  }

  return {
    maxDpd,
    dpdSummaryString,
    hasAdverseStatus: adverseRemarks.length > 0 || maxDpd >= 30,
    adverseRemarks,
  };
}

/**
 * Score band computation helper
 */
export function getCreditScoreBand(score: number | null): {
  label: string;
  color: string;
  bg: string;
} {
  if (score === null || isNaN(score) || score <= 0) {
    return { label: "Score Not Generated (NH/NA)", color: "text-slate-600", bg: "bg-slate-100" };
  }
  if (score >= 750) {
    return { label: "Excellent (Prime)", color: "text-[#17653C]", bg: "bg-[#DCF2E4]" };
  }
  if (score >= 700) {
    return { label: "Good (Standard)", color: "text-[#1E4E9E]", bg: "bg-[#E2ECFE]" };
  }
  if (score >= 650) {
    return { label: "Moderate Risk", color: "text-amber-800", bg: "bg-amber-100" };
  }
  return { label: "High Risk / Policy Deviation", color: "text-red-800", bg: "bg-red-100" };
}
