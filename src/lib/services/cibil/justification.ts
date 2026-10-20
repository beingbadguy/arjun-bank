import { BureauCustomerProfile, BureauLoanAccount } from "./types";
import { RelookCalculationResult } from "./calculator";

export interface JustificationInput {
  customer: BureauCustomerProfile;
  accounts: BureauLoanAccount[];
  metrics: RelookCalculationResult;
  underwriterNotes?: string;
  maxHistoricalDpd?: number;
}

export function generateRelookJustification(input: JustificationInput): string {
  const { customer, accounts, metrics, underwriterNotes } = input;

  const applicant = customer.fullName || "Applicant";
  const scoreText = customer.score
    ? `${customer.score} (${customer.scoreBand.label})`
    : "No Hit (NH) / Score Not Generated";
  const panText = customer.panMasked ? ` | PAN: ${customer.panMasked}` : "";
  const reportDateText = customer.reportDate ? ` | Bureau Date: ${customer.reportDate}` : "";

  // DPD & Repayment Analysis
  let worstDpd = 0;
  let adverseCount = 0;
  const accountsWithDelays: string[] = [];

  accounts.forEach((acc) => {
    if (acc.maxDpd > worstDpd) worstDpd = acc.maxDpd;
    if (acc.maxDpd > 0) {
      adverseCount++;
      accountsWithDelays.push(
        `${acc.lender} (${acc.accountType}): Max ${acc.maxDpd} DPD [${acc.dpdSummaryString}]`
      );
    }
  });

  let dpdEvaluation = "";
  if (worstDpd === 0) {
    dpdEvaluation = "Pristine track record. Zero days-past-due (000/STD) across all active and closed trade lines.";
  } else if (worstDpd <= 30) {
    dpdEvaluation = `Minor isolated delinquency observed (Max ${worstDpd} DPD across ${adverseCount} facility). Zero 60+ or 90+ DPD default events. Satisfies standard deviation criteria subject to clear banking proofs.`;
  } else if (worstDpd <= 90) {
    dpdEvaluation = `Moderate delinquency detected: Max ${worstDpd} DPD recorded on ${accountsWithDelays.join("; ")}. Requires credit deviation approval with verification of cause (e.g. medical emergency, transition, technical bounce).`;
  } else {
    dpdEvaluation = `Critical adverse credit history: Max ${worstDpd} DPD / NPA event recorded. Exceptional policy deviation required with senior underwriter concurrence.`;
  }

  // BT / Closure Explanation
  const closedLendersList = metrics.slatedAccountsList
    .map(
      (a) =>
        `${a.lender} (${a.accountType} - Bal: ₹${a.balance.toLocaleString("en-IN")}, EMI: ₹${a.emi.toLocaleString("en-IN")})`
    )
    .join("\n    • ");

  let closureSection = "";
  if (metrics.slatedForClosureCount > 0) {
    closureSection =
      `• Proposed Balance Transfer / Debt Consolidation:\n` +
      `  - Accounts Slated for Closure (${metrics.slatedForClosureCount}):\n` +
      `    • ${closedLendersList}\n` +
      `  - Total Principal Slated to be Cleared: ₹${metrics.slatedClosureBalance.toLocaleString("en-IN")}\n` +
      `  - Immediate Monthly Obligation Relief: ₹${metrics.slatedClosureEmiRelief.toLocaleString("en-IN")}/month\n` +
      `  - Revised Net Monthly Live Obligation: ₹${metrics.postClosureMonthlyEmi.toLocaleString("en-IN")}/month (FOIR reduction)`;
  } else {
    closureSection =
      `• Debt Consolidation Proposal:\n` +
      `  - No active trade lines currently flagged for mandatory closure.\n` +
      `  - Current monthly debt obligation of ₹${metrics.currentLiveMonthlyEmi.toLocaleString("en-IN")} remains fully factored into borrower FOIR.`;
  }

  // Missing Information or Discrepancies
  let discrepanciesSection = "";
  if (metrics.missingInputWarnings.length > 0) {
    discrepanciesSection =
      `\n• UNRESOLVED VERIFICATION ITEMS:\n` +
      metrics.missingInputWarnings.map((w) => `  ! ${w}`).join("\n") +
      `\n  (Note: Underwriting figures are provisional until these inputs are verified with physical statements.)`;
  }

  const notesSection = underwriterNotes?.trim()
    ? `\n• Credit Analyst Remarks:\n  ${underwriterNotes}`
    : "";

  return (
    `CREDIT COMMITTEE CASE RELOOK MEMO\n` +
    `======================================================================\n` +
    `APPLICANT PROFILE:\n` +
    `• Borrower: ${applicant} | Bureau: ${customer.bureauName}\n` +
    `• Credit Score: ${scoreText}${panText}${reportDateText}\n` +
    `\n` +
    `EXPOSURE & OBLIGATION SUMMARY:\n` +
    `• Total Bureau Facilities Reported: ${accounts.length} (${metrics.activeAccountsCount} Live, ${metrics.closedAccountsCount} Settled/Closed)\n` +
    `• Cumulative Sanctioned Exposure: ₹${metrics.totalSanctionedAmount.toLocaleString("en-IN")}\n` +
    `• Verified Live Outstanding Debt: ₹${metrics.totalLiveOutstanding.toLocaleString("en-IN")}\n` +
    `• Current Live Monthly Obligation: ₹${metrics.currentLiveMonthlyEmi.toLocaleString("en-IN")}/month\n` +
    `\n` +
    `RELOOK JUSTIFICATION & CONSOLIDATION SCENARIO:\n` +
    `${closureSection}\n` +
    `\n` +
    `REPAYMENT INTEGRITY & DPD ASSESSMENT:\n` +
    `• ${dpdEvaluation}\n` +
    discrepanciesSection +
    notesSection +
    `\n` +
    `UNDERWRITING RECOMMENDATION:\n` +
    `• Case qualifies for Relook Review based on verified live debt obligations and post-BT FOIR relief. Sanction conditional upon verified repayment track and disbursal against debt closure proofs.\n` +
    `======================================================================`
  );
}
