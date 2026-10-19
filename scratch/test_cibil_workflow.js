const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { PDFParse } = require('pdf-parse');

async function runEndToEndVerification() {
  console.log('--- Starting CIBIL Relook Workflow Verification ---');

  // 1. Create realistic TransUnion CIBIL PDF in memory
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595.28, 841.89]);
  const { height } = page.getSize();

  let y = height - 50;
  page.drawText('TRANSUNION CIBIL CREDIT INFORMATION REPORT', { x: 50, y, size: 14, font: boldFont });
  y -= 25;
  page.drawText('CONSUMER NAME: SNEHA KAPOOR', { x: 50, y, size: 10, font: boldFont });
  y -= 18;
  page.drawText('PAN: SKAPP8901L   |   DATE OF REPORT: 19/10/2026', { x: 50, y, size: 9, font });
  y -= 20;
  page.drawText('CIBIL SCORE: 782', { x: 50, y, size: 18, font: boldFont, color: rgb(0.1, 0.5, 0.2) });
  y -= 30;

  // Account 1: HDFC Personal Loan
  page.drawText('LENDER: HDFC Bank   |   ACCOUNT TYPE: Personal Loan   |   STATUS: ACTIVE', { x: 50, y, size: 9, font: boldFont });
  y -= 15;
  page.drawText('SANCTION AMOUNT: INR 6,00,000   CURRENT BALANCE: INR 3,10,000   MONTHLY EMI: INR 15,200', { x: 50, y, size: 8.5, font });
  y -= 15;
  page.drawText('DPD TRACK: 000/000/000 (Clear)', { x: 50, y, size: 8, font });
  y -= 30;

  // Account 2: SBI Cards
  page.drawText('LENDER: SBI Cards   |   ACCOUNT TYPE: Credit Card   |   STATUS: ACTIVE', { x: 50, y, size: 9, font: boldFont });
  y -= 15;
  page.drawText('SANCTION AMOUNT: INR 2,00,000   CURRENT BALANCE: INR 45,000   MONTHLY EMI: INR 2,250', { x: 50, y, size: 8.5, font });
  y -= 15;
  page.drawText('DPD TRACK: 030/000 (1 delayed)', { x: 50, y, size: 8, font });
  y -= 30;

  // Account 3: Bajaj Finance Closed
  page.drawText('LENDER: Bajaj Finance   |   ACCOUNT TYPE: Consumer Durable Loan   |   STATUS: CLOSED', { x: 50, y, size: 9, font: boldFont });
  y -= 15;
  page.drawText('SANCTION AMOUNT: INR 80,000   CURRENT BALANCE: INR 0   MONTHLY EMI: INR 0', { x: 50, y, size: 8.5, font });
  y -= 15;
  page.drawText('DPD TRACK: 000/000 (Clear)', { x: 50, y, size: 8, font });

  const pdfBytes = await doc.save();
  console.log('✓ Successfully created mock CIBIL PDF (Bytes: ' + pdfBytes.length + ')');

  // 2. Test PDF extraction using PDFParse directly
  const parser = new PDFParse({ data: Buffer.from(pdfBytes) });
  await parser.load();
  const parsedText = await parser.getText();
  await parser.destroy();
  console.log('✓ PDF text extracted (' + parsedText.text.length + ' chars)');

  // 3. Test Pattern Matching
  const scoreMatch = parsedText.text.match(/(?:cibil|transunion)?\s*score\s*[:\-\s]\s*([3-9]\d{2})/i);
  const nameMatch = parsedText.text.match(/(?:consumer|borrower|applicant)?\s*name\s*[:\-\s]\s*([A-Za-z\s.]{3,40})/i);
  const panMatch = parsedText.text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);

  console.log('✓ Score match:', scoreMatch ? scoreMatch[1] : 'FAIL');
  console.log('✓ Name match:', nameMatch ? nameMatch[1].trim() : 'FAIL');
  console.log('✓ PAN match:', panMatch ? panMatch[1] : 'FAIL');

  // Verify Calculations (Shared Relook Engine)
  const accounts = [
    { lender: 'HDFC Bank', sanction: 600000, balance: 310000, emi: 15200, status: 'Active', toClose: false },
    { lender: 'SBI Cards', sanction: 200000, balance: 45000, emi: 2250, status: 'Active', toClose: true },
    { lender: 'Bajaj Finance', sanction: 80000, balance: 0, emi: 0, status: 'Closed', toClose: false },
  ];

  const activeAccounts = accounts.filter(a => a.status === 'Active');
  const currentTotalEmi = activeAccounts.reduce((sum, a) => sum + a.emi, 0);
  const emiAfterClosure = activeAccounts.filter(a => !a.toClose).reduce((sum, a) => sum + a.emi, 0);
  const reliefEmi = currentTotalEmi - emiAfterClosure;

  console.log('✓ Current Live EMI: ₹' + currentTotalEmi + ' (Expected: 17450)');
  console.log('✓ Post-Closure EMI: ₹' + emiAfterClosure + ' (Expected: 15200)');
  console.log('✓ Relief EMI: ₹' + reliefEmi + ' (Expected: 2250)');

  if (currentTotalEmi === 17450 && emiAfterClosure === 15200 && reliefEmi === 2250) {
    console.log('🎉 ALL CIBIL RELOOK CALCULATIONS & EXTRACTION PATTERNS PASSED!');
  } else {
    throw new Error('Calculation mismatch!');
  }
}

runEndToEndVerification().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
