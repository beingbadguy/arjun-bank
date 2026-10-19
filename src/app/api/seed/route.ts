import { NextResponse } from "next/server";
import { connectToDatabase, seedInitialData } from "@/lib/db";
import Company from "@/lib/models/Company";
import PinCode from "@/lib/models/PinCode";
import User from "@/lib/models/User";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "superadmin") {
      return NextResponse.json(
        { error: "Forbidden: Superadmin access required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    await seedInitialData();

    const companyCount = await Company.countDocuments();
    const pinCount = await PinCode.countDocuments();
    const userCount = await User.countDocuments();

    return NextResponse.json({
      success: true,
      message: "Data seeded and verified successfully",
      counts: {
        companies: companyCount,
        pincodes: pinCount,
        users: userCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to seed data" },
      { status: 500 }
    );
  }
}
