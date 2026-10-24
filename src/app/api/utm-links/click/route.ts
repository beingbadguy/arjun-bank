import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import UtmLink from "@/lib/models/UtmLink";
import { serverCache } from "@/lib/cache";

// POST /api/utm-links/click - Track click counter on a UTM link
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || body._id;

    if (!id) {
      return NextResponse.json({ error: "Missing link ID" }, { status: 400 });
    }

    await connectToDatabase();
    await UtmLink.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
    serverCache.invalidateGroup("utmlinks");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to log click" },
      { status: 500 }
    );
  }
}
