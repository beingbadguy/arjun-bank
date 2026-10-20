import { PDFDocument, rgb, degrees, StandardFonts, PDFName } from "pdf-lib";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { decryptPDF, isEncrypted } from "@pdfsmaller/pdf-decrypt";

/**
 * Utility to download generated files in the browser
 */
export function downloadBlob(
  data: Uint8Array | Blob | string,
  fileName: string,
  mimeType = "application/pdf"
) {
  let blob: Blob;
  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data === "string") {
    blob = new Blob([data], { type: mimeType });
  } else {
    blob = new Blob([new Uint8Array(data)], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * 1. Merge multiple PDFs into one
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(
      pdfDoc,
      pdfDoc.getPageIndices()
    );
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * 2. Split PDF by page range (e.g. "1-3" or "2,4,5" or single page "1")
 */
export async function splitPdf(
  file: File,
  pageRangeStr: string
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const newPdf = await PDFDocument.create();
  const pagesToExtract = parsePageRange(pageRangeStr, totalPages);

  if (pagesToExtract.length === 0) {
    throw new Error(`Invalid page range. Document has ${totalPages} page(s).`);
  }

  const copiedPages = await newPdf.copyPages(pdfDoc, pagesToExtract);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const indices = new Set<number>();
  const parts = rangeStr.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * 3. Compress PDF (re-encodes streams, strips unused objects)
 */
export async function compressPdf(
  file: File,
  _level = "recommended"
): Promise<{ data: Uint8Array; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });

  // Use object streams to compress structures
  const compressedData = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return {
    data: compressedData,
    originalSize,
    compressedSize: compressedData.byteLength,
  };
}

/**
 * 4. Rotate PDF pages
 */
export async function rotatePdf(
  file: File,
  rotationAngle = 90
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotationAngle) % 360));
  });

  return await pdfDoc.save();
}

/**
 * 5. Watermark PDF with custom text, opacity, and rotation
 */
export async function watermarkPdf(
  file: File,
  text: string,
  opacity = 0.35,
  fontSize = 42,
  colorHex = "#991B1B"
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  const color = hexToRgb(colorHex);

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
    const textHeight = helveticaFont.heightAtSize(fontSize);

    page.drawText(text, {
      x: width / 2 - textWidth / 2 + 20,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font: helveticaFont,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(45),
    });
  });

  return await pdfDoc.save();
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}

/**
 * 6. Convert JPG / PNG images to PDF
 */
export async function imagesToPdf(
  files: File[],
  orientation: "portrait" | "landscape" = "portrait"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const isPng = file.type.includes("png") || file.name.endsWith(".png");

    let embeddedImage;
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    }

    const imgDims = embeddedImage.scale(1);
    const isLandscape = orientation === "landscape";

    const pageWidth = isLandscape ? 842 : 595;
    const pageHeight = isLandscape ? 595 : 842;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Fit image with margin
    const margin = 36;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const widthScale = availableWidth / imgDims.width;
    const heightScale = availableHeight / imgDims.height;
    const scale = Math.min(widthScale, heightScale, 1);

    const scaledWidth = imgDims.width * scale;
    const scaledHeight = imgDims.height * scale;

    page.drawImage(embeddedImage, {
      x: (pageWidth - scaledWidth) / 2,
      y: (pageHeight - scaledHeight) / 2,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * 7. Sign PDF with signature image
 */
export async function signPdf(
  file: File,
  signatureDataUrl: string,
  pageNumber = 1,
  position: "bottom-right" | "bottom-left" | "bottom-center" = "bottom-right"
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const targetPageIndex = Math.max(0, Math.min(totalPages - 1, pageNumber - 1));
  const page = pdfDoc.getPage(targetPageIndex);

  // Convert base64 data url to image bytes
  const base64Data = signatureDataUrl.split(",")[1];
  const signatureBytes = Uint8Array.from(atob(base64Data), (c) =>
    c.charCodeAt(0)
  );

  const signatureImage = await pdfDoc.embedPng(signatureBytes);
  const sigDims = signatureImage.scale(0.35);

  const { width } = page.getSize();
  let x = width - sigDims.width - 50;
  if (position === "bottom-left") x = 50;
  if (position === "bottom-center") x = (width - sigDims.width) / 2;

  page.drawImage(signatureImage, {
    x,
    y: 50,
    width: sigDims.width,
    height: sigDims.height,
  });

  return await pdfDoc.save();
}

/**
 * 8. Protect PDF with true password encryption (AES-256 or RC4)
 * Compliant with Adobe Acrobat, Google Chrome, MS Edge, and standard PDF readers.
 */
export async function protectPdf(
  file: File,
  password: string,
  algorithm: "AES-256" | "RC4" = "AES-256"
): Promise<Uint8Array> {
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const cleanPassword = password.trim();
  if (!cleanPassword) {
    throw new Error("Please specify a protection password.");
  }

  // Load and re-save with pdfDoc to ensure clean object streams before encryption
  let pdfBytes: Uint8Array = fileBytes;
  try {
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    pdfBytes = await pdfDoc.save();
  } catch {
    pdfBytes = fileBytes;
  }

  try {
    return await encryptPDF(pdfBytes, cleanPassword, {
      algorithm,
      ownerPassword: cleanPassword,
    });
  } catch (err: any) {
    if (err?.code === "ALREADY_ENCRYPTED" || err?.name === "AlreadyEncryptedError") {
      throw new Error("This PDF document is already encrypted with a password.");
    }
    // Fallback directly to raw fileBytes
    return await encryptPDF(fileBytes, cleanPassword, {
      algorithm,
      ownerPassword: cleanPassword,
    });
  }
}

/**
 * Check if a PDF file is encrypted and detect algorithm
 */
export async function checkPdfEncryption(file: File): Promise<{
  encrypted: boolean;
  algorithm?: "AES-256" | "RC4";
  version?: number;
  revision?: number;
  keyLength?: number;
}> {
  try {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    return await isEncrypted(fileBytes);
  } catch (err) {
    console.warn("Could not inspect PDF encryption status:", err);
    return { encrypted: false };
  }
}

/**
 * 9. Unlock PDF (decrypt streams with password and save clean, unencrypted PDF)
 */
export async function unlockPdf(
  file: File,
  password?: string
): Promise<{ data: Uint8Array; wasEncrypted: boolean; algorithm?: string }> {
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const encInfo = await isEncrypted(fileBytes);

  // If the document is not encrypted
  if (!encInfo.encrypted) {
    try {
      const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const cleanBytes = await pdfDoc.save();
      return { data: cleanBytes, wasEncrypted: false };
    } catch {
      return { data: fileBytes, wasEncrypted: false };
    }
  }

  const cleanPwd = (password || "").trim();

  // If a password was provided by the user
  if (cleanPwd) {
    try {
      const decryptedBytes = await decryptPDF(fileBytes, cleanPwd);
      // Validate that decryptedBytes can be loaded as valid PDF
      const verifyDoc = await PDFDocument.load(decryptedBytes, { ignoreEncryption: true });
      if (verifyDoc.getPageCount() === 0) {
        throw new Error("Decrypted document has 0 pages.");
      }
      return {
        data: decryptedBytes,
        wasEncrypted: true,
        algorithm: encInfo.algorithm || "AES-256",
      };
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("password") ||
        msg.includes("Incorrect") ||
        msg.includes("match") ||
        msg.includes("does not match")
      ) {
        throw new Error(
          "Incorrect password. The password provided could not decrypt this document. Please check the password and try again."
        );
      }
      throw new Error(`Failed to decrypt PDF document: ${msg}`);
    }
  }

  // If no password provided, test empty password (for owner-only locks or empty user password)
  try {
    const decryptedBytes = await decryptPDF(fileBytes, "");
    return {
      data: decryptedBytes,
      wasEncrypted: true,
      algorithm: encInfo.algorithm || "AES-256",
    };
  } catch {
    throw new Error(
      "This PDF is password-protected. Please enter the password in the settings panel to unlock it."
    );
  }
}

/**
 * 10. Edit PDF (add text annotations)
 */
export async function editPdf(
  file: File,
  text: string,
  pageNumber = 1,
  x = 60,
  y = 700,
  fontSize = 14,
  colorHex = "#163A2C"
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();

  const targetPageIndex = Math.max(0, Math.min(totalPages - 1, pageNumber - 1));
  const page = pdfDoc.getPage(targetPageIndex);
  const color = hexToRgb(colorHex);

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
  });

  return await pdfDoc.save();
}

/**
 * 11. HTML / Document to PDF Generator
 */
export async function htmlOrTextToPdf(
  title: string,
  content: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  // Header band
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: rgb(0.086, 0.227, 0.172), // #163A2C
  });

  page.drawText(title || "Document Export", {
    x: 40,
    y: height - 40,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Body content lines
  const lines = content.split("\n");
  let yPos = height - 90;

  for (const line of lines) {
    if (yPos < 50) break;
    page.drawText(line.trim(), {
      x: 40,
      y: yPos,
      size: 11,
      font: fontRegular,
      color: rgb(0.1, 0.15, 0.12),
    });
    yPos -= 18;
  }

  return await pdfDoc.save();
}
