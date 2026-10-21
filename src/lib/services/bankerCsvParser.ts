/**
 * CSV / Tabular Parser & Auto-Detector for Banker & Sales Manager Directories
 * Supports the exact format from Excel / Google Sheets:
 * SM name | Location | State Name | Bank Name | RM email id | CON
 * (Backwards compatible with 5-column format: SM Name | Location | State Name | SM Email id | CON)
 */

export interface ParsedBankerRow {
  name: string;
  bankName: string;
  designation: string;
  branch: string;
  city: string;
  phone: string;
  email: string;
  productsHandled: string[];
  isVerified: boolean;
  isDemo: boolean;
  notes: string;
  rawState?: string;
  originalRowIndex: number;
}

export interface ParseResult {
  valid: ParsedBankerRow[];
  warnings: string[];
  totalRows: number;
  banksDetected: Record<string, number>;
}

// Domain to Bank mapping
const EMAIL_BANK_MAP: Record<string, string> = {
  axisbank: "Axis Bank",
  axis: "Axis Bank",
  hdfcbank: "HDFC Bank",
  hdfc: "HDFC Bank",
  icicibank: "ICICI Bank",
  icici: "ICICI Bank",
  kotak: "Kotak Mahindra Bank",
  sbi: "State Bank of India (SBI)",
  statebankofindia: "State Bank of India (SBI)",
  tatacapital: "Tata Capital",
  bajajfinserv: "Bajaj Finserv",
  bajajfinance: "Bajaj Finserv",
  indusind: "IndusInd Bank",
  idfcfirstbank: "IDFC FIRST Bank",
  idfc: "IDFC FIRST Bank",
  poonawalla: "Poonawalla Fincorp",
  poonawallafincorp: "Poonawalla Fincorp",
  piramal: "Piramal Finance",
  ltfs: "L&T Finance",
  ltfinance: "L&T Finance",
  fullerton: "Fullerton (SMFG)",
  smfg: "Fullerton (SMFG)",
  yesbank: "Yes Bank",
  bankofbaroda: "Bank of Baroda",
  bob: "Bank of Baroda",
  pnb: "Punjab National Bank",
  punjabnational: "Punjab National Bank",
  canarabank: "Canara Bank",
  federalbank: "Federal Bank",
  rblbank: "RBL Bank",
  bandhanbank: "Bandhan Bank",
  aubank: "AU Small Finance Bank",
};

/**
 * Normalizes common variations in bank institution names
 * (e.g. "Icici Bank" -> "ICICI Bank", "hdfc bank" -> "HDFC Bank")
 */
export function normalizeBankName(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes("icici")) return "ICICI Bank";
  if (lower.includes("hdfc")) return "HDFC Bank";
  if (lower.includes("axis")) return "Axis Bank";
  if (lower.includes("kotak")) return "Kotak Mahindra Bank";
  if (lower.includes("sbi") || lower.includes("state bank")) return "State Bank of India (SBI)";
  if (lower.includes("tata capital")) return "Tata Capital";
  if (lower.includes("bajaj")) return "Bajaj Finserv";
  if (lower.includes("indusind")) return "IndusInd Bank";
  if (lower.includes("idfc")) return "IDFC FIRST Bank";
  if (lower.includes("poonawalla")) return "Poonawalla Fincorp";
  if (lower.includes("piramal")) return "Piramal Finance";
  if (lower.includes("ltfs") || lower.includes("l&t")) return "L&T Finance";
  if (lower.includes("fullerton") || lower.includes("smfg")) return "Fullerton (SMFG)";
  if (lower.includes("yes bank")) return "Yes Bank";
  if (lower.includes("baroda") || lower === "bob") return "Bank of Baroda";
  if (lower.includes("punjab national") || lower === "pnb") return "Punjab National Bank";
  if (lower.includes("canara")) return "Canara Bank";
  if (lower.includes("federal")) return "Federal Bank";
  if (lower.includes("rbl")) return "RBL Bank";
  if (lower.includes("bandhan")) return "Bandhan Bank";
  if (lower.includes("au small") || lower === "aubank") return "AU Small Finance Bank";

  return trimmed;
}

/**
 * Auto-detects Bank Name from email domain.
 */
export function detectBankFromEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const domainPart = email.toLowerCase().split("@")[1] || "";
  const domainName = domainPart.split(".")[0];

  for (const [key, bankName] of Object.entries(EMAIL_BANK_MAP)) {
    if (domainPart.includes(key) || domainName.includes(key)) {
      return bankName;
    }
  }
  return "";
}

/**
 * Cleans phone contact fields (e.g. "CON_9556614650" or "8797672449" -> clean 10-digit number)
 */
export function cleanPhoneNumber(conStr: string): string {
  if (!conStr) return "";
  let clean = conStr.trim();
  // Strip CON_, CON-, CON: or non-digits at the beginning
  clean = clean.replace(/^CON[_-]?/i, "").trim();

  // Remove spaces, hyphens, parentheses
  const digitsOnly = clean.replace(/[^0-9+]/g, "");

  // Format 10-digit Indian numbers cleanly if exactly 10 digits
  if (/^\d{10}$/.test(digitsOnly)) {
    return digitsOnly;
  }
  return digitsOnly || clean;
}

/**
 * Splits CSV / TSV line accounting for quoted fields.
 */
function parseLineTokens(line: string, delimiter: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      tokens.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  tokens.push(current.trim());
  return tokens;
}

/**
 * Parses raw CSV or TSV string into structured banker contacts.
 * Supports:
 * Format A: SM name | Location | State Name | Bank Name | RM email id | CON
 * Format B: SM Name | Location | State Name | SM Email id | CON
 */
export function parseBankersCsv(
  rawContent: string,
  options?: {
    defaultBank?: string;
    defaultDesignation?: string;
    defaultProduct?: string;
  }
): ParseResult {
  const result: ParseResult = {
    valid: [],
    warnings: [],
    totalRows: 0,
    banksDetected: {},
  };

  if (!rawContent || !rawContent.trim()) {
    return result;
  }

  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return result;

  // Detect delimiter: tab or comma or semicolon
  const firstLine = lines[0];
  let delimiter = ",";
  if (firstLine.includes("\t")) {
    delimiter = "\t";
  } else if (firstLine.includes(";") && !firstLine.includes(",")) {
    delimiter = ";";
  }

  // Parse header line
  const rawFirstRowTokens = parseLineTokens(lines[0], delimiter);
  const headerTokens = rawFirstRowTokens.map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  // Column index identification
  let nameIdx = -1;
  let locIdx = -1;
  let stateIdx = -1;
  let bankIdx = -1;
  let emailIdx = -1;
  let conIdx = -1;
  let desigIdx = -1;

  headerTokens.forEach((token, idx) => {
    // Banker Name: SM name, RM name, Name, Banker name, etc.
    if (
      token === "smname" ||
      token === "rmname" ||
      token === "name" ||
      token === "bankername" ||
      token === "salesmanager" ||
      token === "contactperson"
    ) {
      nameIdx = idx;
    }
    // Location / Region: Location, Branch, Area, District
    else if (
      token === "location" ||
      token === "branch" ||
      token === "city" ||
      token === "district"
    ) {
      locIdx = idx;
    }
    // State Name: State Name, State, Region, Zone
    else if (
      token === "statename" ||
      token === "state" ||
      token === "region" ||
      token === "zone"
    ) {
      stateIdx = idx;
    }
    // Bank Name: Bank Name, Bank, Institution, Lender
    else if (
      token === "bankname" ||
      token === "bank" ||
      token === "institution" ||
      token === "lender"
    ) {
      bankIdx = idx;
    }
    // Email ID: RM email id, SM email id, Email id, Email, Mail
    else if (
      token === "rmemailid" ||
      token === "rmemail" ||
      token === "smemailid" ||
      token === "smemail" ||
      token === "emailid" ||
      token === "email" ||
      token === "mail"
    ) {
      emailIdx = idx;
    }
    // Contact Number: CON, Contact, Phone, Mobile, Phone number
    else if (
      token === "con" ||
      token === "contact" ||
      token === "phone" ||
      token === "mobile" ||
      token === "phonenumber"
    ) {
      conIdx = idx;
    }
    // Designation
    else if (token === "designation" || token === "role" || token === "title") {
      desigIdx = idx;
    }
  });

  const hasRecognizedHeaders =
    nameIdx !== -1 || locIdx !== -1 || emailIdx !== -1 || conIdx !== -1 || bankIdx !== -1;

  let startIndex = 0;
  if (hasRecognizedHeaders) {
    startIndex = 1;
  } else {
    // If no explicit header recognized, detect column count to apply positional mapping:
    // 6 Columns: [SM name, Location, State Name, Bank Name, RM email id, CON]
    // 5 Columns: [SM Name, Location, State Name, SM Email id, CON]
    if (rawFirstRowTokens.length >= 6) {
      nameIdx = 0;
      locIdx = 1;
      stateIdx = 2;
      bankIdx = 3;
      emailIdx = 4;
      conIdx = 5;
    } else {
      nameIdx = 0;
      locIdx = 1;
      stateIdx = 2;
      emailIdx = 3;
      conIdx = 4;
    }
    startIndex = 0;
  }

  const defaultDesignation = options?.defaultDesignation || "Relationship Manager";
  const defaultProduct = options?.defaultProduct || "Personal Loan";
  const overrideBank = options?.defaultBank;

  for (let i = startIndex; i < lines.length; i++) {
    const rowTokens = parseLineTokens(lines[i], delimiter);
    if (rowTokens.length === 0 || rowTokens.every((t) => !t)) continue;

    result.totalRows++;

    const rawName = nameIdx >= 0 && nameIdx < rowTokens.length ? rowTokens[nameIdx] : "";
    const rawLoc = locIdx >= 0 && locIdx < rowTokens.length ? rowTokens[locIdx] : "";
    const rawState = stateIdx >= 0 && stateIdx < rowTokens.length ? rowTokens[stateIdx] : "";
    const rawBank = bankIdx >= 0 && bankIdx < rowTokens.length ? rowTokens[bankIdx] : "";
    const rawEmail = emailIdx >= 0 && emailIdx < rowTokens.length ? rowTokens[emailIdx] : "";
    const rawCon = conIdx >= 0 && conIdx < rowTokens.length ? rowTokens[conIdx] : "";
    const rawDesig = desigIdx >= 0 && desigIdx < rowTokens.length ? rowTokens[desigIdx] : "";

    const cleanName = rawName.trim();
    const cleanPhone = cleanPhoneNumber(rawCon);
    const cleanEmail = rawEmail.trim();
    const cleanLoc = rawLoc.trim();
    const cleanState = rawState.trim();
    const cleanBankCol = rawBank.trim();

    // Determine bank name with priority:
    // 1. User override dropdown in modal (if specified and not 'auto')
    // 2. Direct 'Bank Name' column in CSV row (normalized)
    // 3. Auto-detected from email domain (e.g. @icicibank.com)
    // 4. Default fallback
    let detectedBank = "";
    if (overrideBank && overrideBank !== "auto") {
      detectedBank = overrideBank;
    } else if (cleanBankCol) {
      detectedBank = normalizeBankName(cleanBankCol);
    } else if (cleanEmail) {
      detectedBank = detectBankFromEmail(cleanEmail);
    }

    if (!detectedBank) {
      detectedBank = "ICICI Bank"; // Sensible default matching the latest format
    }

    // Determine location, branch and city:
    // Example: Location = "NCR", State Name = "Delhi" -> branch: "NCR - Delhi", city: "Delhi"
    let branch = "Main Branch";
    let city = "All India";

    if (cleanLoc && cleanState) {
      branch = `${cleanLoc} - ${cleanState}`;
      city = cleanState;
    } else if (cleanLoc) {
      branch = cleanLoc;
      city = cleanLoc;
    } else if (cleanState) {
      branch = cleanState;
      city = cleanState;
    }

    const designation = rawDesig.trim() || defaultDesignation;

    // Validation
    if (!cleanName) {
      result.warnings.push(`Row ${i + 1}: Banker name is empty, skipped.`);
      continue;
    }

    if (!cleanPhone && !cleanEmail) {
      result.warnings.push(`Row ${i + 1} (${cleanName}): Missing both phone and email.`);
    }

    // Build structured notes
    const noteParts: string[] = [];
    if (cleanLoc) noteParts.push(`Location: ${cleanLoc}`);
    if (cleanState) noteParts.push(`State: ${cleanState}`);
    if (rawCon && rawCon.startsWith("CON_")) noteParts.push(`Ref: ${rawCon}`);

    result.valid.push({
      name: cleanName,
      bankName: detectedBank,
      designation,
      branch,
      city,
      phone: cleanPhone || "Not Provided",
      email: cleanEmail,
      productsHandled: [defaultProduct],
      isVerified: true,
      isDemo: false,
      notes: noteParts.join(" | "),
      rawState: cleanState || cleanLoc,
      originalRowIndex: i + 1,
    });

    result.banksDetected[detectedBank] = (result.banksDetected[detectedBank] || 0) + 1;
  }

  return result;
}

/**
 * Exact sample records matching the new 6-column sheet format (ICICI Bank, NCR / Delhi / Noida).
 */
export const SAMPLE_ICICI_BANK_CSV = `SM name,Location,State Name,Bank Name,RM email id,CON
Nishant Ranjan Singh,NCR,Delhi,Icici Bank,nishant.singh4@icicibank.com,8797672449
Pankaj Kumar,NCR,Delhi,Icici Bank,panka.kumar@icicibank.com,8527495080
Satish Goswami,NCR,Delhi,Icici Bank,satish.goswami@icici.bank.in,8700099767
Sonu Khan,NCR,Delhi,Icici Bank,sonu.khan@icicibank.com,9997951957
Akhilesh Verma,NCR,Delhi,Icici Bank,akhilesh.ku@icicibank.com,8860606265
shradha Jain,NCR,Delhi,Icici Bank,jain.shradha@icicibank.com,9968708869
Noorean,NCR,Delhi,Icici Bank,nooreen.zeba@icicibank.com,9560653230
Rajdeep,NCR,Delhi,Icici Bank,rajdeep.singh@icicibank.com,8527693391
Ashwani Yadav,NCR,Delhi,Icici Bank,ashwani.yadav1@icici.bank.in,9899818316
Shashi Singh,NCR,Delhi,Icici Bank,shashi.ranjan1@icicibank.com,8826292175
Rohit Pandey,NCR,Delhi,Icici Bank,kumar.pandey20@icici.bank.in,9899208895
Rohit Pandey,NCR,Noida,Icici Bank,kumar.pandey20@icici.bank.in,9899208895
Shashi Singh,NCR,Noida,Icici Bank,shashi.ranjan1@icicibank.com,8826292175
Naveen Singh,NCR,Noida,Icici Bank,naveen.singh2@icici.bank.in,9430469342
Shubham Tiwari,NCR,Noida,Icici Bank,shubham.tiwari2@icicibank.com,7607943938
Priyanka Singh,NCR,Noida,Icici Bank,priyanka.singh7@icicibank.com,9321912587
Tushar Mitra,NCR,Noida,Icici Bank,tushar.mitra@icicibank.com,9654100360`;

// Keep SAMPLE_AXIS_BANK_CSV for backwards compatibility
export const SAMPLE_AXIS_BANK_CSV = SAMPLE_ICICI_BANK_CSV;

/**
 * Generates a clean CSV file download matching the new 6-column sheet format.
 */
export function downloadSampleCsvTemplate() {
  const blob = new Blob([SAMPLE_ICICI_BANK_CSV], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "bankers_import_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
