import { NextResponse } from "next/server";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";
import { parseCibilPdfBuffer } from "@/lib/services/cibilParser";

export async function POST(request: Request) {
  try {
    // 1. Authentication check (Data Security - Requirement 6)
    const token = extractTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required to extract credit reports.",
        },
        { status: 401 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        {
          success: false,
          error: "No PDF file provided. Please select a CIBIL credit report document to upload.",
        },
        { status: 400 }
      );
    }

    const fileObj = file as File;

    // 3. Validation: File type
    const fileName = fileObj.name || "report.pdf";
    if (!fileName.toLowerCase().endsWith(".pdf") && fileObj.type !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only PDF credit reports (.pdf) are supported.",
        },
        { status: 400 }
      );
    }

    // 4. Validation: File size (15MB limit)
    const MAX_SIZE_BYTES = 15 * 1024 * 1024;
    if (fileObj.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds 15MB limit (${(fileObj.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller credit report.`,
        },
        { status: 400 }
      );
    }

    // 5. In-memory buffer conversion (no file saved to disk - Data Security)
    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Extraction Execution
    const extractionResult = await parseCibilPdfBuffer(buffer, fileName);

    return NextResponse.json({
      ...extractionResult,
      fileName,
      fileSize: fileObj.size,
    });
  } catch (error: any) {
    console.error("CIBIL PDF extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred while analyzing the credit report.",
      },
      { status: 422 }
    );
  }
}
