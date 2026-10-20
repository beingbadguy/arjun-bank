import { BureauLoanAccount } from "./types";

export interface RelookCalculationResult {
  // Live Obligations
  activeAccountsCount: number;
  closedAccountsCount: number;
  totalSanctionedAmount: number;
  totalLiveOutstanding: number;
  currentLiveMonthlyEmi: number;

  // Selected BT / Closure Details
  slatedForClosureCount: number;
  slatedClosureBalance: number;
  slatedClosureEmiRelief: number;
  slatedAccountsList: {
    id: string;
    lender: string;
    accountType: string;
    balance: number;
    emi: number;
  }[];

  // Post-Closure / After-BT Metrics
  remainingActiveOutstanding: number;
  postClosureMonthlyEmi: number;
  netMonthlyRelief: number;

  // Proposed New Consolidated BT Loan (Optional simulation)
  proposedBtLoanAmount: number;
  proposedBtTenureMonths: number;
  proposedBtAnnualRate: number;
  proposedNewLoanEmi: number;
  netObligationWithNewLoan: number;

  // Audit and Breakdown Information
  activeAccountsContributingToEmi: {
    id: string;
    lender: string;
    accountType: string;
    emi: number;
    balance: number;
  }[];
  activeNonEmiFacilities: {
    id: string;
    lender: string;
    accountType: string;
    balance: number;
    reason: string;
  }[];
  missingInputWarnings: string[];
}

export interface ProposedBtConfig {
  annualInterestRatePercent?: number; // e.g. 10.5
  tenureMonths?: number; // e.g. 60
  includeProcessingFeePercent?: number; // e.g. 1%
}

/**
 * Standard reducing-balance EMI formula:
 * P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEmi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePercent <= 0) return Math.round(principal / tenureMonths);

  const monthlyRate = annualRatePercent / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * Deterministic Financial Calculation Engine for Bureau & Case Relook
 */
export function calculateRelookMetrics(
  accounts: BureauLoanAccount[],
  proposedBtConfig?: ProposedBtConfig
): RelookCalculationResult {
  const missingInputWarnings: string[] = [];

  const activeAccounts = accounts.filter(
    (a) => a.status === "Open" || (a.status as any) === "Active"
  );
  const closedAccounts = accounts.filter(
    (a) => a.status === "Closed"
  );

  let totalSanctionedAmount = 0;
  accounts.forEach((a) => {
    if (a.sanctionAmount !== null) {
      totalSanctionedAmount += a.sanctionAmount;
    }
  });

  let totalLiveOutstanding = 0;
  let currentLiveMonthlyEmi = 0;

  const activeAccountsContributingToEmi: RelookCalculationResult["activeAccountsContributingToEmi"] = [];
  const activeNonEmiFacilities: RelookCalculationResult["activeNonEmiFacilities"] = [];

  activeAccounts.forEach((acc) => {
    const bal = acc.currentBalance ?? 0;
    totalLiveOutstanding += bal;

    const emi = acc.monthlyEmi;
    const isCreditCard = /credit card/i.test(acc.accountType);
    const isGoldLoan = /gold loan/i.test(acc.accountType);
    const isOverdraft = /overdraft/i.test(acc.accountType);

    if (emi !== null && emi > 0) {
      currentLiveMonthlyEmi += emi;
      activeAccountsContributingToEmi.push({
        id: acc.id,
        lender: acc.lender,
        accountType: acc.accountType,
        emi,
        balance: bal,
      });
    } else {
      let reason = "Non-amortizing revolving facility";
      if (isCreditCard) reason = "Credit card revolving limit (No fixed monthly EMI)";
      else if (isGoldLoan) reason = "Gold loan bullet repayment / interest-at-maturity";
      else if (isOverdraft) reason = "Overdraft line (Interest serviced against drawdown)";
      else if (bal > 0) {
        reason = "Active term facility missing verified EMI input";
        missingInputWarnings.push(
          `${acc.lender} (${acc.accountType}) has ₹${bal.toLocaleString("en-IN")} balance but missing EMI amount.`
        );
      }

      activeNonEmiFacilities.push({
        id: acc.id,
        lender: acc.lender,
        accountType: acc.accountType,
        balance: bal,
        reason,
      });
    }
  });

  // Accounts slated for closure / BT
  const slatedAccounts = activeAccounts.filter((a) => a.toClose);
  let slatedClosureBalance = 0;
  let slatedClosureEmiRelief = 0;

  const slatedAccountsList = slatedAccounts.map((a) => {
    const bal = a.currentBalance ?? 0;
    const emi = a.monthlyEmi ?? 0;
    slatedClosureBalance += bal;
    slatedClosureEmiRelief += emi;
    return {
      id: a.id,
      lender: a.lender,
      accountType: a.accountType,
      balance: bal,
      emi,
    };
  });

  const remainingActiveOutstanding = Math.max(0, totalLiveOutstanding - slatedClosureBalance);
  const postClosureMonthlyEmi = Math.max(0, currentLiveMonthlyEmi - slatedClosureEmiRelief);
  const netMonthlyRelief = currentLiveMonthlyEmi - postClosureMonthlyEmi;

  // Simulation: Proposed New BT Loan
  const annualRate = proposedBtConfig?.annualInterestRatePercent ?? 10.5;
  const tenure = proposedBtConfig?.tenureMonths ?? 60;
  const feePct = proposedBtConfig?.includeProcessingFeePercent ?? 0;

  let proposedBtLoanAmount = slatedClosureBalance;
  if (feePct > 0) {
    proposedBtLoanAmount += (slatedClosureBalance * feePct) / 100;
  }

  const proposedNewLoanEmi =
    slatedClosureBalance > 0 ? calculateEmi(proposedBtLoanAmount, annualRate, tenure) : 0;

  const netObligationWithNewLoan = postClosureMonthlyEmi + proposedNewLoanEmi;

  return {
    activeAccountsCount: activeAccounts.length,
    closedAccountsCount: closedAccounts.length,
    totalSanctionedAmount,
    totalLiveOutstanding,
    currentLiveMonthlyEmi,

    slatedForClosureCount: slatedAccounts.length,
    slatedClosureBalance,
    slatedClosureEmiRelief,
    slatedAccountsList,

    remainingActiveOutstanding,
    postClosureMonthlyEmi,
    netMonthlyRelief,

    proposedBtLoanAmount,
    proposedBtTenureMonths: tenure,
    proposedBtAnnualRate: annualRate,
    proposedNewLoanEmi,
    netObligationWithNewLoan,

    activeAccountsContributingToEmi,
    activeNonEmiFacilities,
    missingInputWarnings,
  };
}
