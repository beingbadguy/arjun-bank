export interface ScannedCheckResult {
  isScanned: boolean;
  totalChars: number;
  averageCharsPerPage: number;
  unusablePages: number[];
  reason?: string;
}

/**
 * Checks whether extracted PDF text represents a usable text layer or a scanned/image-only file.
 */
export function evaluatePdfTextQuality(
  fullText: string,
  pages: { num: number; text: string }[]
): ScannedCheckResult {
  const totalChars = fullText.trim().length;
  const pageCount = Math.max(1, pages.length);
  const averageCharsPerPage = totalChars / pageCount;

  const unusablePages: number[] = [];
  pages.forEach((p) => {
    if (p.text.trim().length < 25) {
      unusablePages.push(p.num);
    }
  });

  // If entire document has fewer than 60 characters or average < 30 chars/page, it's scanned or image-only
  if (totalChars < 60 || averageCharsPerPage < 30) {
    return {
      isScanned: true,
      totalChars,
      averageCharsPerPage,
      unusablePages,
      reason:
        "The uploaded PDF contains no readable text layer (scanned or flattened raster image).",
    };
  }

  // Check if common credit report terms are present
  const hasBureauKeywords =
    /cibil|experian|crif|equifax|score|account|loan|credit|sanction|balance|outstanding|enquiry/i.test(
      fullText
    );

  if (!hasBureauKeywords && totalChars < 200) {
    return {
      isScanned: true,
      totalChars,
      averageCharsPerPage,
      unusablePages,
      reason:
        "Document contains text, but no recognizable credit bureau structures or keywords were detected.",
    };
  }

  return {
    isScanned: false,
    totalChars,
    averageCharsPerPage,
    unusablePages,
  };
}

/**
 * OCR Fallback executor.
 * When local OCR (e.g. Tesseract) or cloud vision service is configured in env variables,
 * this function can be invoked. In absence of external OCR credentials, returns clear security notice.
 */
export async function attemptOcrFallback(
  _buffer: Buffer
): Promise<{ text: string | null; error?: string }> {
  // Check if OCR environment is configured
  const ocrServiceUrl = process.env.BUREAU_OCR_SERVICE_URL;
  if (!ocrServiceUrl) {
    return {
      text: null,
      error:
        "Scanned image credit report detected. Optical Character Recognition (OCR) is not configured in this environment. Please provide a digitally generated PDF or input accounts manually.",
    };
  }

  // If configured, forward securely to internal OCR microservice
  try {
    const res = await fetch(ocrServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        ...(process.env.BUREAU_OCR_API_KEY
          ? { Authorization: `Bearer ${process.env.BUREAU_OCR_API_KEY}` }
          : {}),
      },
      body: _buffer as any,
    });
    if (!res.ok) {
      throw new Error(`OCR service responded with HTTP ${res.status}`);
    }
    const data = await res.json();
    return { text: data.text || null };
  } catch (err: any) {
    return { text: null, error: err.message || "Failed to execute OCR fallback." };
  }
}
