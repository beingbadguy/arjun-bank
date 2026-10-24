import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import UtmLink from "@/lib/models/UtmLink";
import { requireAdminAuth } from "@/lib/auth";
import { serverCache, buildCacheKey } from "@/lib/cache";

const DEFAULT_POONAWALLA_LINK = {
  tagName: "POONAWALA UTM LINK",
  url: "https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=113231&UTM_Partner_AgentCode=process.anuj@financebuddha.com&UTM_Partner_Name=FinBud_Financial_Services_Pvt_Ltd&UTM_SM_Name=anant.t@poonawallafincorp.com",
  category: "Poonawalla Fincorp",
  description: "Instant Pocket Loan via PrimePL - Partner Agent FinBud Financial Services Pvt Ltd",
  createdBy: "system_bootstrap",
};

// GET /api/utm-links - Fetch active UTM links (open to all workspace users)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const category = searchParams.get("category") || searchParams.get("cat") || "all";

    const cacheKey = buildCacheKey("utmlinks:query", { search, category });
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

    // Check if total count is 0, auto-seed the provided default Poonawalla link
    const totalCount = await UtmLink.countDocuments();
    if (totalCount === 0) {
      try {
        await UtmLink.create(DEFAULT_POONAWALLA_LINK);
      } catch (seedErr) {
        console.error("Auto-seed default UTM link error:", seedErr);
      }
    }

    const filter: Record<string, any> = {
      isDeleted: { $ne: true },
    };

    if (category && category !== "all") {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [
        { tagName: regex },
        { url: regex },
        { category: regex },
        { description: regex },
      ];
    }

    const links = await UtmLink.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const responsePayload = {
      success: true,
      count: links.length,
      links,
    };

    serverCache.set(cacheKey, responsePayload, 120, "utmlinks");

    return NextResponse.json(responsePayload, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    console.error("UTM Links API GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch UTM links" },
      { status: 500 }
    );
  }
}

// POST /api/utm-links - Create new UTM link (Admin only)
export async function POST(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectToDatabase();
    const body = await request.json();

    const { tagName, url, category, description } = body;

    if (!tagName || !tagName.trim()) {
      return NextResponse.json(
        { error: "Tag name is required (e.g., 'POONAWALA UTM LINK')." },
        { status: 400 }
      );
    }

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: "Destination URL is required." },
        { status: 400 }
      );
    }

    // Validate URL syntax
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      new URL(cleanUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL provided. Please provide a valid web address." },
        { status: 400 }
      );
    }

    const newLink = await UtmLink.create({
      tagName: tagName.trim(),
      url: cleanUrl,
      category: (category || "Poonawalla Fincorp").trim(),
      description: (description || "").trim(),
      createdBy: auth.payload?.email || "superadmin",
      isDeleted: false,
    });

    serverCache.invalidateGroup("utmlinks");
    serverCache.invalidateGroup("recycle");

    return NextResponse.json(
      {
        success: true,
        message: `UTM Link "${newLink.tagName}" created successfully.`,
        link: newLink,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("UTM Links API POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create UTM link" },
      { status: 500 }
    );
  }
}

// PUT /api/utm-links - Update UTM link (Admin only)
export async function PUT(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectToDatabase();
    const body = await request.json();

    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json(
        { error: "UTM Link ID is required for update." },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};

    if (body.tagName !== undefined) {
      if (!body.tagName.trim()) {
        return NextResponse.json(
          { error: "Tag name cannot be empty." },
          { status: 400 }
        );
      }
      updateData.tagName = body.tagName.trim();
    }

    if (body.url !== undefined) {
      let cleanUrl = body.url.trim();
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      try {
        new URL(cleanUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format." },
          { status: 400 }
        );
      }
      updateData.url = cleanUrl;
    }

    if (body.category !== undefined) {
      updateData.category = body.category.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description.trim();
    }

    const updatedLink = await UtmLink.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedLink) {
      return NextResponse.json(
        { error: "UTM Link record not found." },
        { status: 404 }
      );
    }

    serverCache.invalidateGroup("utmlinks");
    serverCache.invalidateGroup("recycle");

    return NextResponse.json({
      success: true,
      message: `UTM Link "${updatedLink.tagName}" updated successfully.`,
      link: updatedLink,
    });
  } catch (error: any) {
    console.error("UTM Links API PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update UTM link" },
      { status: 500 }
    );
  }
}

// DELETE /api/utm-links - Soft-delete UTM link -> move to Recycle Bin (Admin only)
export async function DELETE(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get("all") === "true";
    let id = searchParams.get("id");

    if (!id && !deleteAll) {
      try {
        const body = await request.json();
        id = body.id || body._id;
      } catch {}
    }

    if (deleteAll || id === "all") {
      const deleteResult = await UtmLink.updateMany(
        { isDeleted: { $ne: true } },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: auth.payload?.email || "superadmin",
          },
        }
      );

      serverCache.invalidateGroup("utmlinks");
      serverCache.invalidateGroup("recycle");

      return NextResponse.json({
        success: true,
        message: `Successfully moved ${deleteResult.modifiedCount} UTM links to recycle bin.`,
        deletedCount: deleteResult.modifiedCount,
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "UTM Link ID is required for deletion." },
        { status: 400 }
      );
    }

    const deleted = await UtmLink.findOneAndUpdate(
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
        { error: "UTM link not found or already in recycle bin." },
        { status: 404 }
      );
    }

    serverCache.invalidateGroup("utmlinks");
    serverCache.invalidateGroup("recycle");

    return NextResponse.json({
      success: true,
      message: `UTM Link "${deleted.tagName}" moved to recycle bin.`,
      doc: deleted,
    });
  } catch (error: any) {
    console.error("UTM Links API DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete UTM link" },
      { status: 500 }
    );
  }
}
