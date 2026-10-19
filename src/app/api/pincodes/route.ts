import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PinCode from "@/lib/models/PinCode";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to access PIN codes." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pin = searchParams.get("pin") || "";
    const query = searchParams.get("q") || "";
    const state = searchParams.get("state") || "";
    const lender = searchParams.get("lender") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);

    await connectToDatabase();

    const totalCount = await PinCode.estimatedDocumentCount();

    const filter: any = {};

    if (pin.trim()) {
      const cleanPin = pin.trim();
      if (/^\d{6}$/.test(cleanPin)) {
        filter.pincode = cleanPin;
      } else {
        filter.pincode = { $regex: `^${cleanPin}`, $options: "i" };
      }
    } else if (query.trim()) {
      const q = query.trim();
      if (/^\d+$/.test(q)) {
        filter.pincode = { $regex: `^${q}`, $options: "i" };
      } else {
        filter.$or = [
          { city: { $regex: q, $options: "i" } },
          { area: { $regex: q, $options: "i" } },
          { state: { $regex: q, $options: "i" } },
        ];
      }
    }

    if (state.trim()) {
      filter.state = { $regex: `^${state.trim()}$`, $options: "i" };
    }

    if (lender.trim()) {
      filter["lenders.lender"] = lender.trim();
    }

    const skip = (page - 1) * limit;

    const [pincodes, matchedCount] = await Promise.all([
      PinCode.find(filter)
        .sort({ pincode: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Object.keys(filter).length > 0 ? PinCode.countDocuments(filter) : totalCount,
    ]);

    return NextResponse.json({
      success: true,
      pincodes,
      totalCount,
      matchedCount,
      count: pincodes.length,
      page,
      limit,
      totalPages: Math.ceil(matchedCount / limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch pincodes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    if (Array.isArray(body)) {
      const created = await PinCode.insertMany(body, { ordered: false });
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${created.length} PIN codes`,
      });
    }

    if (!body.pincode || !body.area || !body.city || !body.state) {
      return NextResponse.json(
        { error: "Pincode, area, city, and state are required" },
        { status: 400 }
      );
    }

    const newPin = await PinCode.create(body);
    return NextResponse.json({
      success: true,
      pincode: newPin,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save pincode" },
      { status: 500 }
    );
  }
}
