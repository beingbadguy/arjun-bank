import { NextResponse } from "next/server";
import { syncPinDataFromTsv, DEFAULT_TSV_URL } from "@/lib/services/syncPinData";
import { connectToDatabase } from "@/lib/db";
import PinCode from "@/lib/models/PinCode";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const totalPincodes = await PinCode.countDocuments();
    
    // Aggregations
    const sample = await PinCode.find().limit(5).lean();

    return NextResponse.json({
      success: true,
      totalPincodes,
      sourceUrl: DEFAULT_TSV_URL,
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

    let url = DEFAULT_TSV_URL;
    try {
      const body = await request.json();
      if (body.url && typeof body.url === "string") {
        url = body.url;
      }
    } catch {}

    const result = await syncPinDataFromTsv(url);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Sync execution failed" },
      { status: 500 }
    );
  }
}
