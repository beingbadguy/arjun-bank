import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Company from "@/lib/models/Company";
import { extractTokenFromRequest, verifyToken, requireAdminAuth } from "@/lib/auth";
import { serverCache, buildCacheKey } from "@/lib/cache";

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

    const cacheKey = buildCacheKey("companies:query", {
      q: query,
      category,
      lender,
      limit,
      page,
    });

    const cachedData = serverCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      });
    }

    await connectToDatabase();

    const filter: Record<string, unknown> = {
      isDeleted: { $ne: true },
    };

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
    const hasFilter = Boolean(
      query.trim() ||
        (category && category.toLowerCase() !== "all") ||
        (lender && lender.toLowerCase() !== "all")
    );

    // Fast cached total active count
    const totalCount = await serverCache.getOrSet(
      "companies:totalCount",
      () => Company.countDocuments({ isDeleted: { $ne: true } }),
      600,
      "companies"
    );

    const [companies, matchedCount] = await Promise.all([
      Company.find(filter)
        .select("name industry category lenderCategories minSalary remarks createdAt")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      hasFilter ? Company.countDocuments(filter) : totalCount,
    ]);

    const totalPages = Math.max(1, Math.ceil(matchedCount / limit));

    const responsePayload = {
      success: true,
      companies,
      totalCount,
      matchedCount,
      count: companies.length,
      page,
      limit,
      totalPages,
    };

    serverCache.set(cacheKey, responsePayload, 300, "companies");

    return NextResponse.json(responsePayload, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
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
    const auth = requireAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    await connectToDatabase();

    // Check if bulk import or single item
    if (Array.isArray(body)) {
      const created = await Company.insertMany(body, { ordered: false });
      serverCache.invalidateGroup("companies");
      serverCache.invalidateGroup("recycle");
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${created.length} companies`,
      });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Company legal name is required" }, { status: 400 });
    }

    const companyData = {
      ...body,
      name: body.name.trim(),
      nameNormalized: (body.name || "").trim().toUpperCase(),
      category: body.category || "Cat A",
      industry: body.industry || "Corporate Enterprise",
      minSalary: typeof body.minSalary === "number" ? body.minSalary : 25000,
      remarks: body.remarks || "",
      lenderCategories: Array.isArray(body.lenderCategories) ? body.lenderCategories : [],
    };

    const newCompany = await Company.create(companyData);
    serverCache.invalidateGroup("companies");
    serverCache.invalidateGroup("recycle");

    return NextResponse.json({
      success: true,
      message: `Company "${newCompany.name}" added successfully`,
      company: newCompany,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save company" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const id = body._id || body.id;

    if (!id) {
      return NextResponse.json(
        { error: "Company ID is required for update" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const company = await Company.findById(id);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (body.name && body.name.trim()) {
      company.name = body.name.trim();
      company.nameNormalized = body.name.trim().toUpperCase();
    }

    if (body.industry !== undefined) {
      company.industry = body.industry.trim() || "Corporate Enterprise";
    }

    if (body.category !== undefined) {
      company.category = body.category.trim();
    }

    if (body.minSalary !== undefined) {
      company.minSalary = Number(body.minSalary) || 0;
    }

    if (body.remarks !== undefined) {
      company.remarks = body.remarks;
    }

    if (Array.isArray(body.lenderCategories)) {
      company.lenderCategories = body.lenderCategories;
    }

    await company.save();
    serverCache.invalidateGroup("companies");
    serverCache.invalidateGroup("recycle");

    return NextResponse.json({
      success: true,
      message: `Company "${company.name}" updated successfully`,
      company,
    });
  } catch (error: any) {
    console.error("API /api/companies PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update company" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body._id || body.id;
      } catch {
        // Body was empty or not JSON
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Company ID is required for deletion" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const deleted = await Company.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: auth.payload?.email || "superadmin",
        },
      },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "Company not found or already in recycle bin" },
        { status: 404 }
      );
    }

    serverCache.invalidateGroup("companies");
    serverCache.invalidateGroup("recycle");

    return NextResponse.json({
      success: true,
      message: `Company "${deleted.name}" moved to recycle bin.`,
      deletedId: id,
    });
  } catch (error: any) {
    console.error("API /api/companies DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete company" },
      { status: 500 }
    );
  }
}
