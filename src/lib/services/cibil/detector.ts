import { BureauReportFormat } from "./types";

export function detectBureauFormat(fullText: string): BureauReportFormat {
  const lower = fullText.toLowerCase();

  // Check for Format B (Institutional / BureauOne CIBIL)
  // Has "ACCOUNT DATES AMOUNTS STATUS" or "DAYS PAST DUE/ASSET CLASSIFICATION"
  if (
    /account dates amounts status/i.test(fullText) ||
    /days past due\/asset classification/i.test(fullText) ||
    (/cibil consumer credit information report/i.test(fullText) && /bureauone reference no/i.test(fullText))
  ) {
    return "cibil_institutional";
  }

  // Check for Format A (Standard Consumer CIBIL / MyScore)
  // Has "OPEN ACCOUNTS" and "CLOSED ACCOUNTS" or "CIBIL Score & Report"
  if (
    (/open accounts/i.test(fullText) && /account details/i.test(fullText)) ||
    /your cibil score is/i.test(fullText) ||
    /myscore\.cibil\.com/i.test(fullText)
  ) {
    return "cibil_consumer";
  }

  // CRIF High Mark
  if (/crif high mark/i.test(fullText) || /high mark credit/i.test(fullText)) {
    return "crif_highmark";
  }

  // Experian
  if (/experian/i.test(fullText)) {
    return "experian";
  }

  // Default to consumer CIBIL if CIBIL mentions exist
  if (/cibil/i.test(fullText)) {
    return "cibil_consumer";
  }

  return "generic";
}
