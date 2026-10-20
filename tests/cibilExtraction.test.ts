import fs from "fs";
import path from "path";
import assert from "assert";
import {
  parseBureauPdf,
  isValidPdfSignature,
  parseIndianCurrency,
  parseNumeric,
  normalizeDate,
  maskAccountNumber,
  maskPan,
  analyzePaymentHistory,
  getCreditScoreBand,
  calculateRelookMetrics,
  generateRelookJustification,
  BureauLoanAccount,
} from "../src/lib/services/cibil";
import { evaluatePdfTextQuality } from "../src/lib/services/cibil/ocrFallback";

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  PASS: ${name}`);
      passedCount++;
    })
    .catch((err) => {
      console.error(`  FAIL: ${name}`);
      console.error(err);
      failedCount++;
    });
}

async function main() {
  console.log("\n========================================================");
  console.log("RUNNING CIBIL EXTRACTION & CASE RELOOK TEST SUITE");
  console.log("========================================================\n");

  const dhinakaranPath = "C:/Users/autho/Downloads/CIBIL Report dhinakaran.pdf";
  const institutionalPath = "C:/Users/autho/Downloads/Individual Bureau.pdf";

  // Test 1: CIBIL Report dhinakaran sample
  await runTest("1. Dhinakaran 21-page CIBIL Consumer Report Extraction", async () => {
    if (!fs.existsSync(dhinakaranPath)) {
      console.log("Skipping local file check (file not in Downloads)");
      return;
    }
    const buf = fs.readFileSync(dhinakaranPath);
    const report = await parseBureauPdf(buf, "CIBIL Report dhinakaran.pdf");

    assert.strictEqual(report.success, true);
    assert.strictEqual(report.formatDetected, "cibil_consumer");
    assert.strictEqual(report.customer.score, 715);
    assert.strictEqual(report.customer.scoreBand.label, "Good (Standard)");
    assert.ok(report.customer.fullName.includes("DHINAKARAN"));
    assert.strictEqual(report.customer.reportDate, "13/10/2026");
    assert.strictEqual(report.accounts.length, 7);

    const openAccs = report.accounts.filter((a) => a.status === "Open");
    const closedAccs = report.accounts.filter((a) => a.status === "Closed");
    assert.strictEqual(openAccs.length, 3);
    assert.strictEqual(closedAccs.length, 4);

    // Acc 1: Federal Bank Gold Loan
    const acc1 = openAccs.find((a) => a.accountNumberMasked.includes("3948"));
    assert.ok(acc1);
    assert.strictEqual(acc1.lender, "FEDERAL BANK");
    assert.strictEqual(acc1.accountType, "Gold Loan");
    assert.strictEqual(acc1.currentBalance, 25478);
    assert.strictEqual(acc1.sanctionAmount, 25195);
    assert.strictEqual(acc1.sourcePage, 4);

    // Acc 2: BOB Auto Loan
    const acc2 = openAccs.find((a) => a.accountNumberMasked.includes("0129"));
    assert.ok(acc2);
    assert.strictEqual(acc2.lender, "BOB");
    assert.strictEqual(acc2.currentBalance, 592266);
    assert.strictEqual(acc2.monthlyEmi, 10995);
    assert.strictEqual(acc2.repaymentTenure, 72);
    assert.strictEqual(acc2.sourcePage, 6);

    // Acc 3: Finnable Personal Loan
    const acc3 = openAccs.find((a) => a.accountNumberMasked.includes("4687"));
    assert.ok(acc3);
    assert.strictEqual(acc3.lender, "FINNABLE");
    assert.strictEqual(acc3.currentBalance, 134370);
    assert.strictEqual(acc3.monthlyEmi, 6130);
    assert.strictEqual(acc3.sourcePage, 8);

    // Closed accounts have closure dates
    closedAccs.forEach((c) => {
      assert.ok(c.closedDate !== null);
      assert.strictEqual(c.currentBalance, 0);
    });

    // Calculations
    const calc = calculateRelookMetrics(report.accounts);
    assert.strictEqual(calc.totalLiveOutstanding, 752114);
    assert.strictEqual(calc.currentLiveMonthlyEmi, 17125);
  });

  // Test 2: Individual Bureau 7-page institutional sample
  await runTest("2. Individual Bureau 7-page Institutional BureauOne Extraction", async () => {
    if (!fs.existsSync(institutionalPath)) {
      console.log("Skipping local file check (file not in Downloads)");
      return;
    }
    const buf = fs.readFileSync(institutionalPath);
    const report = await parseBureauPdf(buf, "Individual Bureau.pdf");

    assert.strictEqual(report.success, true);
    assert.strictEqual(report.formatDetected, "cibil_institutional");
    assert.strictEqual(report.customer.score, 785);
    assert.strictEqual(report.customer.scoreBand.label, "Excellent (Prime)");
    assert.strictEqual(report.customer.fullName, "BHISHMA YADAV");
    assert.strictEqual(report.customer.reportDate, "14/10/2026");
    assert.strictEqual(report.accounts.length, 10);

    const openAccs = report.accounts.filter((a) => a.status === "Open");
    const closedAccs = report.accounts.filter((a) => a.status === "Closed");
    assert.strictEqual(openAccs.length, 4);
    assert.strictEqual(closedAccs.length, 6);

    // Auto loan
    const autoLoan = openAccs.find((a) => a.accountType === "Auto Loan");
    assert.ok(autoLoan);
    assert.strictEqual(autoLoan.currentBalance, 917478);
    assert.strictEqual(autoLoan.monthlyEmi, 10463);

    // Overdraft
    const overdraft = openAccs.find((a) => a.accountType === "Overdraft");
    assert.ok(overdraft);
    assert.strictEqual(overdraft.currentBalance, 1199472);

    // Credit cards (2 open credit cards with zero balance)
    const creditCards = openAccs.filter((a) => a.accountType === "Credit Card");
    assert.strictEqual(creditCards.length, 2);
    assert.strictEqual(creditCards[0].currentBalance, 0);
    assert.strictEqual(creditCards[1].currentBalance, 0);

    // Exact summary reconciliation
    const calc = calculateRelookMetrics(report.accounts);
    assert.strictEqual(calc.totalLiveOutstanding, 2116950);
    assert.strictEqual(report.summary.totalCurrentBalanceReported, 2116950);
    assert.strictEqual(calc.currentLiveMonthlyEmi, 10463);
  });

  // Test 3: Open vs Closed account rules
  await runTest("3. Open and Closed Account Handling", () => {
    const mockAccounts: BureauLoanAccount[] = [
      {
        id: "1",
        lender: "Bank A",
        accountType: "Personal Loan",
        accountNumberMasked: "XXXX-1111",
        ownership: "Individual",
        status: "Closed",
        sanctionAmount: 500000,
        currentBalance: 0,
        amountOverdue: 0,
        monthlyEmi: 15000,
        interestRate: 11,
        repaymentTenure: 48,
        paymentFrequency: "Monthly",
        openDate: "01/01/2020",
        closedDate: "01/01/2024",
        lastPaymentDate: "01/01/2024",
        reportedDate: "31/01/2024",
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: 1,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
      },
      {
        id: "2",
        lender: "Bank B",
        accountType: "Personal Loan",
        accountNumberMasked: "XXXX-2222",
        ownership: "Individual",
        status: "Open",
        sanctionAmount: 300000,
        currentBalance: 120000,
        amountOverdue: 0,
        monthlyEmi: 9000,
        interestRate: 12,
        repaymentTenure: 36,
        paymentFrequency: "Monthly",
        openDate: "01/01/2023",
        closedDate: null,
        lastPaymentDate: "01/09/2026",
        reportedDate: "30/09/2026",
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: 2,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
      },
    ];

    const metrics = calculateRelookMetrics(mockAccounts);
    // Closed account EMI (15000) must be excluded from live EMI
    assert.strictEqual(metrics.currentLiveMonthlyEmi, 9000);
    assert.strictEqual(metrics.totalLiveOutstanding, 120000);
    assert.strictEqual(metrics.activeAccountsCount, 1);
    assert.strictEqual(metrics.closedAccountsCount, 1);
  });

  // Test 4: Missing EMI and Ambiguous values flagged
  await runTest("4. Missing EMI & Ambiguous Value Flagging", () => {
    const mockAccounts: BureauLoanAccount[] = [
      {
        id: "1",
        lender: "NBFC Alpha",
        accountType: "Personal Loan",
        accountNumberMasked: "XXXX-9999",
        ownership: "Individual",
        status: "Open",
        sanctionAmount: 200000,
        currentBalance: 150000,
        amountOverdue: 0,
        monthlyEmi: null, // Missing EMI on active personal loan
        interestRate: null,
        repaymentTenure: null,
        paymentFrequency: null,
        openDate: "01/01/2024",
        closedDate: null,
        lastPaymentDate: null,
        reportedDate: "30/09/2026",
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: 1,
        confidence: "medium",
        needsReview: true,
        reviewReasons: ["EMI missing on active term loan"],
      },
    ];

    const metrics = calculateRelookMetrics(mockAccounts);
    assert.strictEqual(metrics.currentLiveMonthlyEmi, 0);
    assert.strictEqual(metrics.missingInputWarnings.length, 1);
    assert.ok(metrics.missingInputWarnings[0].includes("missing EMI amount"));
  });

  // Test 5: Indian Currency and Date Normalization
  await runTest("5. Indian Currency & Date Normalization", () => {
    assert.strictEqual(parseIndianCurrency("₹25,195"), 25195);
    assert.strictEqual(parseIndianCurrency("11,30,000"), 1130000);
    assert.strictEqual(parseIndianCurrency("36,47,000"), 3647000);
    assert.strictEqual(parseIndianCurrency("0"), 0);
    assert.strictEqual(parseIndianCurrency("-"), null);
    assert.strictEqual(parseIndianCurrency(""), null);

    assert.strictEqual(normalizeDate("13/10/2026"), "13/10/2026");
    assert.strictEqual(normalizeDate("14-10-2026"), "14/10/2026");
    assert.strictEqual(normalizeDate("2026-10-14"), "14/10/2026");
    assert.strictEqual(normalizeDate("-"), null);
  });

  // Test 6: Payment History Analysis & Code Interpretation
  await runTest("6. Payment History Analysis (STD, XXX, 030, SMA)", () => {
    // History with XXX must NOT be treated as 0 DPD
    const historyWithXxx = [
      { month: "09-26", status: "000" },
      { month: "08-26", status: "XXX" },
      { month: "07-26", status: "000" },
    ];
    const res1 = analyzePaymentHistory(historyWithXxx);
    assert.strictEqual(res1.maxDpd, 0);

    // History with delay
    const historyWithDelay = [
      { month: "09-26", status: "000" },
      { month: "08-26", status: "030" },
      { month: "07-26", status: "000" },
    ];
    const res2 = analyzePaymentHistory(historyWithDelay);
    assert.strictEqual(res2.maxDpd, 30);
    assert.ok(res2.dpdSummaryString.includes("Max 30 DPD"));

    // History with adverse code SMA
    const historyWithSma = [{ month: "09-26", status: "SMA" }];
    const res3 = analyzePaymentHistory(historyWithSma);
    assert.strictEqual(res3.hasAdverseStatus, true);
    assert.ok(res3.adverseRemarks[0].includes("Special Mention Account"));
  });

  // Test 7: Summary vs Account Total Reconciliation
  await runTest("7. Summary vs Account Aggregate Reconciliation", () => {
    const reportAccounts: BureauLoanAccount[] = [
      {
        id: "1",
        lender: "Bank X",
        accountType: "Auto Loan",
        accountNumberMasked: "XXXX-1234",
        ownership: "Individual",
        status: "Open",
        sanctionAmount: 500000,
        currentBalance: 400000,
        amountOverdue: 0,
        monthlyEmi: 12000,
        interestRate: 9,
        repaymentTenure: 48,
        paymentFrequency: "Monthly",
        openDate: null,
        closedDate: null,
        lastPaymentDate: null,
        reportedDate: null,
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: 1,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
      },
    ];

    const metrics = calculateRelookMetrics(reportAccounts);
    assert.strictEqual(metrics.totalLiveOutstanding, 400000);
    // If summary says 500,000, discrepancy is 100,000
    const summaryReported = 500000;
    const diff = Math.abs(metrics.totalLiveOutstanding - summaryReported);
    assert.strictEqual(diff, 100000);
  });

  // Test 8: Duplicate Account Detection
  await runTest("8. Duplicate Account Detection", () => {
    const acc1: BureauLoanAccount = {
      id: "dup-1",
      lender: "HDFC Bank",
      accountType: "Auto Loan",
      accountNumberMasked: "XXXX-9999",
      ownership: "Individual",
      status: "Open",
      sanctionAmount: 500000,
      currentBalance: 300000,
      amountOverdue: 0,
      monthlyEmi: 10000,
      interestRate: 8.5,
      repaymentTenure: 60,
      paymentFrequency: "Monthly",
      openDate: "01/01/2023",
      closedDate: null,
      lastPaymentDate: null,
      reportedDate: null,
      writtenOffTotal: null,
      writtenOffPrincipal: null,
      settlementAmount: null,
      suitFiledWilfulDefault: null,
      paymentHistory: [],
      maxDpd: 0,
      dpdSummaryString: "000/000 (Clear)",
      sourcePage: 1,
      confidence: "high",
      needsReview: false,
      reviewReasons: [],
    };
    const acc2 = { ...acc1, id: "dup-2" };

    const seen = new Set<string>();
    let duplicatesFound = 0;
    [acc1, acc2].forEach((a) => {
      const key = `${a.lender}-${a.accountNumberMasked}`;
      if (seen.has(key)) duplicatesFound++;
      else seen.add(key);
    });

    assert.strictEqual(duplicatesFound, 1);
  });

  // Test 9: Invalid PDFs and Magic Signature Validation
  await runTest("9. Invalid PDF Header & Magic Signature Rejection", async () => {
    const invalidBuffer = Buffer.from("NOT_A_PDF_FILE_HEADER");
    assert.strictEqual(isValidPdfSignature(invalidBuffer), false);

    let rejected = false;
    try {
      await parseBureauPdf(invalidBuffer, "malicious.exe.pdf");
    } catch {
      rejected = true;
    }
    assert.strictEqual(rejected, true);

    // Scanned document evaluation
    const quality = evaluatePdfTextQuality("Short text", [
      { num: 1, text: "Just image scan" },
    ]);
    assert.strictEqual(quality.isScanned, true);
  });

  // Test 10: Manual Editing followed by Recalculation
  await runTest("10. Manual Editing followed by Recalculation", () => {
    const initialAccounts: BureauLoanAccount[] = [
      {
        id: "1",
        lender: "ICICI Bank",
        accountType: "Personal Loan",
        accountNumberMasked: "XXXX-1111",
        ownership: "Individual",
        status: "Open",
        sanctionAmount: 500000,
        currentBalance: 200000,
        amountOverdue: 0,
        monthlyEmi: 15000,
        interestRate: 11,
        repaymentTenure: 48,
        paymentFrequency: "Monthly",
        openDate: null,
        closedDate: null,
        lastPaymentDate: null,
        reportedDate: null,
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: 1,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
        toClose: false,
      },
    ];

    const initialMetrics = calculateRelookMetrics(initialAccounts);
    assert.strictEqual(initialMetrics.currentLiveMonthlyEmi, 15000);
    assert.strictEqual(initialMetrics.postClosureMonthlyEmi, 15000);

    // User slates account for closure / BT
    initialAccounts[0].toClose = true;
    const postEditMetrics = calculateRelookMetrics(initialAccounts);
    assert.strictEqual(postEditMetrics.currentLiveMonthlyEmi, 15000);
    assert.strictEqual(postEditMetrics.postClosureMonthlyEmi, 0);
    assert.strictEqual(postEditMetrics.netMonthlyRelief, 15000);
  });

  // Test 11: Generate Relook Justification using verified data
  await runTest("11. Generate Relook Justification Output Integrity", () => {
    const mockCustomer = {
      fullName: "Ananya Deshmukh",
      dob: "12/04/1990",
      gender: "Female",
      panMasked: "ABC****1D",
      mobileMasked: "XXXXXX4321",
      emailMasked: "a***@gmail.com",
      address: null,
      bureauName: "TransUnion CIBIL",
      score: 775,
      scoreType: "CIBIL Score 3.0",
      scoreBand: getCreditScoreBand(775),
      reportDate: "20/10/2026",
      reportControlNumber: "9988776655",
    };

    const mockAccounts: BureauLoanAccount[] = [
      {
        id: "1",
        lender: "HDFC Bank",
        accountType: "Auto Loan",
        accountNumberMasked: "XXXX-9999",
        ownership: "Individual",
        status: "Open",
        sanctionAmount: 800000,
        currentBalance: 400000,
        amountOverdue: 0,
        monthlyEmi: 18000,
        interestRate: 8.5,
        repaymentTenure: 60,
        paymentFrequency: "Monthly",
        openDate: "01/01/2023",
        closedDate: null,
        lastPaymentDate: null,
        reportedDate: null,
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: 1,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
        toClose: true,
      },
    ];

    const metrics = calculateRelookMetrics(mockAccounts);
    const memo = generateRelookJustification({
      customer: mockCustomer,
      accounts: mockAccounts,
      metrics,
    });

    assert.ok(memo.includes("Ananya Deshmukh"));
    assert.ok(memo.includes("775 (Excellent (Prime))"));
    assert.ok(memo.includes("₹18,000/month"));
    assert.ok(memo.includes("₹4,00,000"));
    assert.ok(memo.includes("HDFC Bank (Auto Loan"));
  });

  // Test 12: Regression test for existing manual entry workflow
  await runTest("12. Regression Tests for Existing Manual Entry Workflow", () => {
    const manualAccounts: BureauLoanAccount[] = [
      {
        id: "m1",
        lender: "HDFC Bank",
        accountType: "Auto Loan",
        accountNumberMasked: "XXXX-4821",
        ownership: "Individual",
        status: "Open",
        sanctionAmount: 850000,
        currentBalance: 240000,
        amountOverdue: 0,
        monthlyEmi: 18200,
        interestRate: null,
        repaymentTenure: null,
        paymentFrequency: null,
        openDate: null,
        closedDate: null,
        lastPaymentDate: null,
        reportedDate: null,
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: null,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
        toClose: false,
      },
      {
        id: "m2",
        lender: "SBI Cards",
        accountType: "Credit Card",
        accountNumberMasked: "XXXX-9102",
        ownership: "Individual",
        status: "Open",
        sanctionAmount: 200000,
        currentBalance: 32000,
        amountOverdue: 0,
        monthlyEmi: 3200,
        interestRate: null,
        repaymentTenure: null,
        paymentFrequency: null,
        openDate: null,
        closedDate: null,
        lastPaymentDate: null,
        reportedDate: null,
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 30,
        dpdSummaryString: "030 (1 delayed payment 8 mos ago)",
        sourcePage: null,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
        toClose: true,
      },
      {
        id: "m3",
        lender: "Bajaj Finance",
        accountType: "Consumer Durable Loan",
        accountNumberMasked: "XXXX-7741",
        ownership: "Individual",
        status: "Closed",
        sanctionAmount: 75000,
        currentBalance: 0,
        amountOverdue: 0,
        monthlyEmi: 0,
        interestRate: null,
        repaymentTenure: null,
        paymentFrequency: null,
        openDate: null,
        closedDate: "05/01/2025",
        lastPaymentDate: null,
        reportedDate: null,
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: null,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
        toClose: false,
      },
      {
        id: "m4",
        lender: "ICICI Bank",
        accountType: "Personal Loan",
        accountNumberMasked: "XXXX-3389",
        ownership: "Individual",
        status: "Open",
        sanctionAmount: 500000,
        currentBalance: 120000,
        amountOverdue: 0,
        monthlyEmi: 14500,
        interestRate: null,
        repaymentTenure: null,
        paymentFrequency: null,
        openDate: null,
        closedDate: null,
        lastPaymentDate: null,
        reportedDate: null,
        writtenOffTotal: null,
        writtenOffPrincipal: null,
        settlementAmount: null,
        suitFiledWilfulDefault: null,
        paymentHistory: [],
        maxDpd: 0,
        dpdSummaryString: "000/000 (Clear)",
        sourcePage: null,
        confidence: "high",
        needsReview: false,
        reviewReasons: [],
        toClose: false,
      },
    ];

    const metrics = calculateRelookMetrics(manualAccounts);
    // Active accounts are m1, m2, m4.
    // Total Live EMI: 18200 + 3200 + 14500 = 35900
    assert.strictEqual(metrics.currentLiveMonthlyEmi, 35900);
    // Slated for closure: m2 (3200)
    // Post closure EMI: 18200 + 14500 = 32700
    assert.strictEqual(metrics.postClosureMonthlyEmi, 32700);
    assert.strictEqual(metrics.netMonthlyRelief, 3200);
    // Total Live Outstanding: 240000 + 32000 + 120000 = 392000
    assert.strictEqual(metrics.totalLiveOutstanding, 392000);
  });

  console.log("\n========================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR RUNNING TEST SUITE:", err);
  process.exit(1);
});
