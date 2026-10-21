/**
 * CSV / Tabular Parser & Auto-Detector for Banker & Sales Manager Directories
 * Supports the exact format from Excel/Google Sheets:
 * SM Name | Location | State Name | SM Email id | CON
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
 * Cleans phone contact fields (e.g. "CON_9556614650" -> "9556614650" or "+91 95566 14650")
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
  const headerTokens = parseLineTokens(lines[0], delimiter).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  // Column index identification
  let nameIdx = -1;
  let locIdx = -1;
  let stateIdx = -1;
  let emailIdx = -1;
  let conIdx = -1;
  let bankIdx = -1;
  let desigIdx = -1;

  headerTokens.forEach((token, idx) => {
    if (token === "smname" || token === "name" || token === "bankername" || token === "salesmanager" || token === "contactperson") {
      nameIdx = idx;
    } else if (token === "location" || token === "branch" || token === "city" || token === "district") {
      locIdx = idx;
    } else if (token === "statename" || token === "state" || token === "region" || token === "zone") {
      stateIdx = idx;
    } else if (token === "smemailid" || token === "smemail" || token === "emailid" || token === "email" || token === "mail") {
      emailIdx = idx;
    } else if (token === "con" || token === "contact" || token === "phone" || token === "mobile" || token === "phonenumber") {
      conIdx = idx;
    } else if (token === "bank" || token === "bankname" || token === "institution" || token === "lender") {
      bankIdx = idx;
    } else if (token === "designation" || token === "role" || token === "title") {
      desigIdx = idx;
    }
  });

  const hasRecognizedHeaders =
    nameIdx !== -1 || locIdx !== -1 || emailIdx !== -1 || conIdx !== -1;

  let startIndex = 0;
  if (hasRecognizedHeaders) {
    startIndex = 1;
  } else {
    // If no explicit headers found, default to positional order matching Image 2:
    // [SM Name, Location, State Name, SM Email id, CON]
    nameIdx = 0;
    locIdx = 1;
    stateIdx = 2;
    emailIdx = 3;
    conIdx = 4;
    startIndex = 0;
  }

  const defaultDesignation = options?.defaultDesignation || "Sales Manager";
  const defaultProduct = options?.defaultProduct || "Personal Loan";
  const overrideBank = options?.defaultBank;

  for (let i = startIndex; i < lines.length; i++) {
    const rowTokens = parseLineTokens(lines[i], delimiter);
    if (rowTokens.length === 0 || rowTokens.every((t) => !t)) continue;

    result.totalRows++;

    const rawName = nameIdx >= 0 && nameIdx < rowTokens.length ? rowTokens[nameIdx] : "";
    const rawLoc = locIdx >= 0 && locIdx < rowTokens.length ? rowTokens[locIdx] : "";
    const rawState = stateIdx >= 0 && stateIdx < rowTokens.length ? rowTokens[stateIdx] : "";
    const rawEmail = emailIdx >= 0 && emailIdx < rowTokens.length ? rowTokens[emailIdx] : "";
    const rawCon = conIdx >= 0 && conIdx < rowTokens.length ? rowTokens[conIdx] : "";
    const rawBank = bankIdx >= 0 && bankIdx < rowTokens.length ? rowTokens[bankIdx] : "";
    const rawDesig = desigIdx >= 0 && desigIdx < rowTokens.length ? rowTokens[desigIdx] : "";

    const cleanName = rawName.trim();
    const cleanPhone = cleanPhoneNumber(rawCon);
    const cleanEmail = rawEmail.trim();
    const cleanLoc = rawLoc.trim();
    const cleanState = rawState.trim();

    // Determine bank name
    let detectedBank = "";
    if (overrideBank && overrideBank !== "auto") {
      detectedBank = overrideBank;
    } else if (rawBank.trim()) {
      detectedBank = rawBank.trim();
    } else if (cleanEmail) {
      detectedBank = detectBankFromEmail(cleanEmail);
    }

    if (!detectedBank) {
      detectedBank = "Axis Bank"; // Sensible default matching the provided master sheet
    }

    // Determine location and branch
    const branch = cleanLoc ? (cleanState ? `${cleanLoc}, ${cleanState}` : cleanLoc) : "Main Branch";
    const city = cleanLoc || cleanState || "All India";
    const designation = rawDesig.trim() || defaultDesignation;

    // Validation
    if (!cleanName) {
      result.warnings.push(`Row ${i + 1}: Banker name is empty, skipped.`);
      continue;
    }

    if (!cleanPhone && !cleanEmail) {
      result.warnings.push(`Row ${i + 1} (${cleanName}): Missing both phone and email.`);
    }

    // Build notes
    const noteParts: string[] = [];
    if (cleanState) noteParts.push(`State: ${cleanState}`);
    if (rawCon.startsWith("CON_")) noteParts.push(`Ref: ${rawCon}`);

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
      rawState: cleanState,
      originalRowIndex: i + 1,
    });

    result.banksDetected[detectedBank] = (result.banksDetected[detectedBank] || 0) + 1;
  }

  return result;
}

/**
 * The exact 26 sample records from the user's reference screenshot (Axis Bank, Odisha).
 */
export const SAMPLE_AXIS_BANK_CSV = `SM Name,Location,State Name,SM Email id,CON
Sujata Mohanty,Bhubaneshwar,Odisha,Sujata2.Mohanty@axisbank.com,CON_9556614650
Krushna Chandra Shoo,Cuttack,Odisha,80487@axisbank.com,CON_9853502521
Sujata Mohanty,Puri,Odisha,Sujata2.Mohanty@axisbank.com,CON_9556614650
Sujata Mohanty,Khorda,Odisha,Sujata2.Mohanty@axisbank.com,CON_9556614650
Rajat Sutar,Jatni,Odisha,rajat.sutar@axisbank.com,CON_9124188366
Nandalal Panigrahi,Angul,Odisha,184135@axisbank.com,CON_9777155784
Satya Ranjan Kar,Jajpur,Odisha,423201@axisbank.com,CON_9938011614
Manas Patra,Bhadrak,Odisha,439590@axisbank.com,CON_9937172175
Manas Patra,Keonjhar,Odisha,439590@axisbank.com,CON_9937172175
Nandalal Panigrahi,Talcher,Odisha,184135@axisbank.com,CON_9777155784
Kabijit Jena,Balasore,Odisha,421702@axisbank.com,CON_7838570119
Krushna Chandra Shoo,Paradip,Odisha,80487@axisbank.com,CON_9853502521
Krushna Chandra Shoo,Kendrapara,Odisha,80487@axisbank.com,CON_9853502521
Amit Purohit,Nuapada,Odisha,amit5.purohit@axisbank.com,CON_8249427077
Amit Purohit,Bolangir,Odisha,amit5.purohit@axisbank.com,CON_8249427077
Amit Purohit,Sonepur,Odisha,amit5.purohit@axisbank.com,CON_8249427077
Amit Purohit,Boudhgarh,Odisha,amit5.purohit@axisbank.com,CON_8249427077
Nandalal Panigrahi,Sambalpur,Odisha,184135@axisbank.com,CON_9777155784
Nandalal Panigrahi,Bargarh,Odisha,184135@axisbank.com,CON_9777155784
Nandalal Panigrahi,Deogarh,Odisha,184135@axisbank.com,CON_9777155784
Prasanna Sahani,Nabrangpur,Odisha,prasanna.sahani@axisbank.com,CON_7008559734
Prasanna Sahani,Jaypore,Odisha,prasanna.sahani@axisbank.com,CON_7008559734
Prasanna Sahani,Rayagada,Odisha,prasanna.sahani@axisbank.com,CON_7008559734
Prasanna Sahani,Koraput,Odisha,prasanna.sahani@axisbank.com,CON_7008559734
Prasanna Sahani,Malkangiri,Odisha,prasanna.sahani@axisbank.com,CON_7008559734
Prasanna Sahani,Gajapati,Odisha,prasanna.sahani@axisbank.com,CON_7008559734`;

/**
 * Generates a clean CSV file download for the user.
 */
export function downloadSampleCsvTemplate() {
  const blob = new Blob([SAMPLE_AXIS_BANK_CSV], {
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
