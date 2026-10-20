import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Company from "@/lib/models/Company";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to access companies." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || searchParams.get("cat") || "";
    const lender = searchParams.get("lender") || "";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "12", 10), 1), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);

    await connectToDatabase();

    const filter: any = {};

    if (query.trim()) {
      const clean = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: clean, $options: "i" };
    }

    if (category && category.toLowerCase() !== "all") {
      filter.category = category;
    }

    if (lender && lender.toLowerCase() !== "all") {
      filter["lenderCategories.lender"] = { $regex: lender.trim(), $options: "i" };
    }

    const skip = (page - 1) * limit;
    const totalCount = await Company.estimatedDocumentCount();
    const hasFilter = Object.keys(filter).length > 0;

    const [companies, matchedCount] = await Promise.all([
      Company.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      hasFilter ? Company.countDocuments(filter) : totalCount,
    ]);

    const totalPages = Math.max(1, Math.ceil(matchedCount / limit));

    return NextResponse.json({
      success: true,
      companies,
      totalCount,
      matchedCount,
      count: companies.length,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error("API /api/companies error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch companies" },
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

    // Check if bulk import or single item
    if (Array.isArray(body)) {
      const created = await Company.insertMany(body, { ordered: false });
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${created.length} companies`,
      });
    }

    if (!body.name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const newCompany = await Company.create(body);
    return NextResponse.json({
      success: true,
      company: newCompany,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save company" },
      { status: 500 }
    );
  }
}
