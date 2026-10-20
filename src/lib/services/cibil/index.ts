import { PDFParse } from "pdf-parse";
import path from "path";
import { pathToFileURL } from "url";
import fs from "fs";
import {
  NormalizedBureauReport,
  BureauReportFormat,
  ValidationWarning,
} from "./types";
import { detectBureauFormat } from "./detector";
import { parseCibilConsumerReport } from "./adapters/cibilConsumerAdapter";
import { parseCibilInstitutionalReport } from "./adapters/cibilInstitutionalAdapter";
import { validateNormalizedBureauReport } from "./validation";
import { evaluatePdfTextQuality, attemptOcrFallback } from "./ocrFallback";

export * from "./types";
export * from "./utils";
export * from "./calculator";
export * from "./justification";

let workerConfigured = false;

/**
 * Ensures PDF worker is configured properly with a file:// URL or base64 data-url
 * to prevent Next.js server chunk bundler resolution failures.
 */
export function ensurePdfWorkerConfigured(): void {
  if (workerConfigured) return;

  try {
    // 1. Check if legacy build worker exists locally on disk (fastest)
    const localWorkerPath = path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "legacy",
      "build",
      "pdf.worker.mjs"
    );
    if (fs.existsSync(localWorkerPath)) {
      const fileUrl = pathToFileURL(localWorkerPath).href;
      PDFParse.setWorker(fileUrl);
      workerConfigured = true;
      return;
    }
  } catch (err) {
    console.warn("[CIBIL Engine] Warning: Could not configure PDF worker file URL:", err);
  }

  try {
    // 2. Fallback to self-contained base64 data-url from local worker file
    const localWorkerMin = path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "legacy",
      "build",
      "pdf.worker.min.mjs"
    );
    if (fs.existsSync(localWorkerMin)) {
      const content = fs.readFileSync(localWorkerMin);
      const dataUrl = `data:text/javascript;base64,${content.toString("base64")}`;
      PDFParse.setWorker(dataUrl);
      workerConfigured = true;
      return;
    }
  } catch (err) {
    console.warn("[CIBIL Engine] Warning: Could not configure PDF worker data URL:", err);
  }
}

/**
 * Validates that buffer starts with standard PDF magic bytes "%PDF-"
 */
export function isValidPdfSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false;
  const header = buffer.subarray(0, 5).toString("ascii");
  return header === "%PDF-";
}

/**
 * Main Pipeline: Parses any supported credit bureau PDF buffer into a validated, normalized structure.
 */
export async function parseBureauPdf(
  buffer: Buffer,
  fileName?: string
): Promise<NormalizedBureauReport> {
  // 1. Validate File Signature (Security requirement 10)
  if (!isValidPdfSignature(buffer)) {
    throw new Error(
      "Invalid PDF file signature. The uploaded document is not a valid PDF file."
    );
  }

  // Ensure worker is configured before invoking PDFParse
  ensurePdfWorkerConfigured();

  // 2. Extract Text with pdf-parse in-memory
  let parsedPdf: any;
  try {
    parsedPdf = new PDFParse({ data: buffer });
    await parsedPdf.load();
  } catch (err: any) {
    const errMsg = (err.message || "").toLowerCase();
    if (errMsg.includes("password") || errMsg.includes("encrypted")) {
      throw new Error(
        "This credit report is password-protected. Please unlock or remove password protection before uploading."
      );
    }

    // Secondary recovery: if worker failed, explicitly force embedded dataUrl worker
    if (errMsg.includes("worker") || errMsg.includes("cannot find module")) {
      try {
        const localWorkerMin = path.join(
          process.cwd(),
          "node_modules",
          "pdfjs-dist",
          "legacy",
          "build",
          "pdf.worker.min.mjs"
        );
        if (fs.existsSync(localWorkerMin)) {
          const content = fs.readFileSync(localWorkerMin);
          const dataUrl = `data:text/javascript;base64,${content.toString("base64")}`;
          PDFParse.setWorker(dataUrl);
          parsedPdf = new PDFParse({ data: buffer });
          await parsedPdf.load();
        } else {
          throw err;
        }
      } catch (retryErr: any) {
        throw new Error(
          `Failed to parse PDF document structure: ${retryErr.message || err.message}`
        );
      }
    } else {
      throw new Error(
        `Failed to parse PDF document structure: ${err.message || "Corrupt or invalid PDF."}`
      );
    }
  }

  let textResult: any;
  try {
    textResult = await parsedPdf.getText();
  } catch (err: any) {
    await parsedPdf.destroy();
    throw new Error(`Failed to extract text from PDF: ${err.message}`);
  }

  await parsedPdf.destroy();

  const fullText = textResult.text || "";
  const pages: { num: number; text: string }[] = (textResult.pages || []).map(
    (p: any, idx: number) => ({
      num: p.num || idx + 1,
      text: p.text || "",
    })
  );

  // 3. Evaluate PDF Text Quality & Scanned Fallback
  const quality = evaluatePdfTextQuality(fullText, pages);
  let effectiveText = fullText;
  let ocrUsed = false;

  if (quality.isScanned) {
    const ocrResult = await attemptOcrFallback(buffer);
    if (ocrResult.text && ocrResult.text.length > 100) {
      effectiveText = ocrResult.text;
      ocrUsed = true;
    } else {
      throw new Error(
        quality.reason ||
          "The uploaded credit report is a scanned image with no readable text. Please upload an unlocked digital PDF or use the Manual Entry option."
      );
    }
  }

  // 4. Detect Bureau Format
  const detectedFormat = detectBureauFormat(effectiveText);

  // 5. Run Format Adapter
  let normalized: NormalizedBureauReport;

  switch (detectedFormat) {
    case "cibil_consumer":
      normalized = parseCibilConsumerReport(effectiveText, pages);
      break;

    case "cibil_institutional":
      normalized = parseCibilInstitutionalReport(effectiveText, pages);
      break;

    case "crif_highmark":
    case "experian":
    case "generic":
    default:
      // Fallback adapter: attempt institutional or consumer layout
      if (/account dates amounts status/i.test(effectiveText)) {
        normalized = parseCibilInstitutionalReport(effectiveText, pages);
      } else {
        normalized = parseCibilConsumerReport(effectiveText, pages);
      }
      normalized.warnings.push({
        code: "UNCONFIRMED_BUREAU_FORMAT",
        severity: "warning",
        message: `Detected format '${detectedFormat}'. Extraction adapter has run in best-effort mode. Please review all fields carefully.`,
      });
      break;
  }

  normalized.formatDetected = detectedFormat;
  normalized.meta.fileName = fileName;
  normalized.meta.ocrUsed = ocrUsed;
  normalized.meta.isScanned = quality.isScanned;

  // 6. Validation & Anomaly Checks
  const validationResult = validateNormalizedBureauReport(normalized);

  return validationResult.validatedReport;
}
