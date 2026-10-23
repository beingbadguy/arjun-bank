import { NextResponse } from "next/server";
import { syncCompanyDataFromTsv, DEFAULT_COMPANY_TSV_URL } from "@/lib/services/syncCompanyData";
import { connectToDatabase } from "@/lib/db";
import Company from "@/lib/models/Company";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await connectToDatabase();
    const totalCompanies = await Company.estimatedDocumentCount();
    const sample = await Company.find().limit(5).lean();

    return NextResponse.json({
      success: true,
      totalCompanies,
      sourceUrl: "Master Corporate Dataset (company_master.tsv)",
      sample,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get sync status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    let url = "";
    try {
      const body = await request.json();
      if (body.url && typeof body.url === "string") {
        url = body.url;
      }
    } catch {}

    const result = await syncCompanyDataFromTsv(url);
    const { serverCache } = await import("@/lib/cache");
    serverCache.invalidateGroup("companies");
    serverCache.invalidateGroup("recycle");
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to sync company master" },
      { status: 500 }
    );
  }
}
