import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Generates a realistic mock CIBIL report PDF for demo/testing purposes
 */
export async function generateDemoCibilPdf(
  applicantName = "Rahul Sharma",
  cibilScore = 785,
  pan = "ABCPR1234K"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { height } = page.getSize();

  let y = height - 50;

  // Header
  page.drawText("TRANSUNION CIBIL CREDIT INFORMATION REPORT", {
    x: 50,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.38),
  });
  y -= 20;

  page.drawText("CONFIDENTIAL - FOR AUTHORIZED FINANCIAL INSTITUTION USE ONLY", {
    x: 50,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 30;

  // Applicant & Score Box
  page.drawRectangle({
    x: 50,
    y: y - 75,
    width: 495,
    height: 85,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
    color: rgb(0.96, 0.98, 1),
  });

  page.drawText(`CONSUMER NAME: ${applicantName.toUpperCase()}`, {
    x: 65,
    y: y - 20,
    size: 10,
    font: boldFont,
  });

  page.drawText(`PAN: ${pan}`, {
    x: 65,
    y: y - 36,
    size: 9,
    font,
  });

  page.drawText("DATE OF REPORT: 18/10/2026", {
    x: 65,
    y: y - 52,
    size: 9,
    font,
  });

  page.drawText("TELEPHONE: +91 98765 43210", {
    x: 65,
    y: y - 68,
    size: 9,
    font,
  });

  page.drawText("TRANSUNION CIBIL SCORE", {
    x: 350,
    y: y - 22,
    size: 9,
    font: boldFont,
    color: rgb(0.08, 0.22, 0.38),
  });

  page.drawText(String(cibilScore), {
    x: 380,
    y: y - 58,
    size: 32,
    font: boldFont,
    color: rgb(0.09, 0.42, 0.25),
  });

  y -= 110;

  // Accounts Header
  page.drawText("ACCOUNT INFORMATION & TRADE LINES", {
    x: 50,
    y,
    size: 11,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.3),
  });
  y -= 25;

  const accounts = [
    {
      lender: "HDFC Bank",
      type: "Personal Loan",
      sanction: "7,50,000",
      balance: "3,80,000",
      emi: "19,400",
      dpd: "000/000/000 (Clear)",
      status: "OPEN / ACTIVE",
    },
    {
      lender: "SBI Cards",
      type: "Credit Card",
      sanction: "2,50,000",
      balance: "48,500",
      emi: "2,425",
      dpd: "030/000/000 (1 delayed payment)",
      status: "ACTIVE",
    },
    {
      lender: "Bajaj Finance",
      type: "Consumer Durable Loan",
      sanction: "65,000",
      balance: "0",
      emi: "0",
      dpd: "000/000 (Clear)",
      status: "CLOSED / PAID",
    },
    {
      lender: "ICICI Bank",
      type: "Auto Loan",
      sanction: "9,00,000",
      balance: "2,15,000",
      emi: "18,200",
      dpd: "000/000/000 (Clear)",
      status: "ACTIVE",
    },
  ];

  for (const acc of accounts) {
    page.drawRectangle({
      x: 50,
      y: y - 65,
      width: 495,
      height: 60,
      borderColor: rgb(0.88, 0.9, 0.92),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    page.drawText(`LENDER: ${acc.lender}   |   ACCOUNT TYPE: ${acc.type}   |   STATUS: ${acc.status}`, {
      x: 60,
      y: y - 18,
      size: 9,
      font: boldFont,
      color: rgb(0.15, 0.2, 0.25),
    });

    page.drawText(
      `SANCTION AMOUNT: INR ${acc.sanction}    CURRENT BALANCE: INR ${acc.balance}    MONTHLY EMI: INR ${acc.emi}`,
      {
        x: 60,
        y: y - 35,
        size: 8.5,
        font,
      }
    );

    page.drawText(`DPD TRACK & ASSET CLASSIFICATION: ${acc.dpd}`, {
      x: 60,
      y: y - 50,
      size: 8,
      font,
      color: rgb(0.4, 0.45, 0.5),
    });

    y -= 75;
  }

  y -= 10;
  page.drawText("END OF CREDIT INFORMATION REPORT", {
    x: 220,
    y,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });

  return await pdfDoc.save();
}
