import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PinCode from "@/lib/models/PinCode";
import { extractTokenFromRequest, verifyToken, requireAdminAuth } from "@/lib/auth";

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

    const totalCount = await PinCode.countDocuments({ isDeleted: { $ne: true } });

    const filter: any = {
      isDeleted: { $ne: true },
    };

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
    const hasFilter = Boolean(pin.trim() || query.trim() || state.trim() || lender.trim());

    const [pincodes, matchedCount] = await Promise.all([
      PinCode.find(filter)
        .sort({ pincode: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      hasFilter ? PinCode.countDocuments(filter) : totalCount,
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
    const auth = requireAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    await connectToDatabase();

    // Batch import support
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json(
          { error: "Batch PIN code list cannot be empty" },
          { status: 400 }
        );
      }
      const created = await PinCode.insertMany(body, { ordered: false });
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${created.length} PIN codes`,
      });
    }

    // Single document validation
    const pincode = (body.pincode || "").toString().trim();
    const area = (body.area || "").toString().trim();
    const city = (body.city || "").toString().trim();
    const state = (body.state || "").toString().trim();

    if (!pincode || !area || !city || !state) {
      return NextResponse.json(
        { error: "Pincode, area, city, and state are required" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: "Pincode must be exactly a 6-digit numeric postal code" },
        { status: 400 }
      );
    }

    const existing = await PinCode.findOne({ pincode, isDeleted: { $ne: true } });
    if (existing) {
      return NextResponse.json(
        { error: `PIN code "${pincode}" already exists in the database. Please edit it instead.` },
        { status: 409 }
      );
    }

    const softDeleted = await PinCode.findOne({ pincode, isDeleted: true });
    if (softDeleted) {
      softDeleted.area = area;
      softDeleted.city = city;
      softDeleted.state = state;
      softDeleted.isDeleted = false;
      softDeleted.deletedAt = null;
      softDeleted.deletedBy = "";
      if (Array.isArray(body.lenders) && body.lenders.length > 0) {
        softDeleted.lenders = body.lenders.map((l: any) => ({
          lender: (l.lender || "Other Lender").toString().trim(),
          isServiceable: l.isServiceable !== false,
          branchName: (l.branchName || `${city} Main`).toString().trim(),
          category: (l.category || "Standard").toString().trim(),
          products: Array.isArray(l.products) && l.products.length > 0
            ? l.products
            : ["Personal Loan", "Home Loan", "LAP"],
          tatDays: Number(l.tatDays) || 2,
        }));
      }
      await softDeleted.save();
      return NextResponse.json({
        success: true,
        message: `PIN code "${pincode}" restored and updated successfully`,
        pincode: softDeleted,
      });
    }

    let lenders = [];
    if (Array.isArray(body.lenders) && body.lenders.length > 0) {
      lenders = body.lenders.map((l: any) => ({
        lender: (l.lender || "Other Lender").toString().trim(),
        isServiceable: l.isServiceable !== false,
        branchName: (l.branchName || `${city} Main`).toString().trim(),
        category: (l.category || "Standard").toString().trim(),
        products: Array.isArray(l.products) && l.products.length > 0
          ? l.products
          : ["Personal Loan", "Home Loan", "LAP"],
        tatDays: Number(l.tatDays) || 2,
      }));
    } else {
      lenders = [
        {
          lender: "HDFC Bank",
          isServiceable: true,
          branchName: `${city} Main`,
          category: "Prime",
          products: ["Personal Loan", "Home Loan", "LAP"],
          tatDays: 2,
        },
        {
          lender: "Axis Bank",
          isServiceable: true,
          branchName: `${city} Branch`,
          category: "Standard",
          products: ["Personal Loan", "Home Loan", "Business Loan"],
          tatDays: 3,
        },
      ];
    }

    const newPin = await PinCode.create({
      pincode,
      area,
      city,
      state,
      lenders,
    });

    return NextResponse.json({
      success: true,
      message: `PIN code "${pincode}" created successfully`,
      pincode: newPin,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A record with this PIN code already exists in the database." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to save pincode" },
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
    const targetPin = (body.pincode || "").toString().trim();

    if (!id && !targetPin) {
      return NextResponse.json(
        { error: "PIN code ID or 6-digit PIN code is required for update" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const pinDoc = id
      ? await PinCode.findById(id)
      : await PinCode.findOne({ pincode: targetPin });

    if (!pinDoc) {
      return NextResponse.json(
        { error: "PIN code record not found" },
        { status: 404 }
      );
    }

    // If pincode is changing, validate 6-digit format and check collision
    if (body.pincode && body.pincode.toString().trim() !== pinDoc.pincode) {
      const cleanPin = body.pincode.toString().trim();
      if (!/^\d{6}$/.test(cleanPin)) {
        return NextResponse.json(
          { error: "Pincode must be exactly a 6-digit numeric postal code" },
          { status: 400 }
        );
      }
      const collision = await PinCode.findOne({ pincode: cleanPin });
      if (collision && collision._id.toString() !== pinDoc._id.toString()) {
        return NextResponse.json(
          { error: `PIN code "${cleanPin}" is already assigned to another location.` },
          { status: 409 }
        );
      }
      pinDoc.pincode = cleanPin;
    }

    if (body.area !== undefined && body.area.toString().trim()) {
      pinDoc.area = body.area.toString().trim();
    }
    if (body.city !== undefined && body.city.toString().trim()) {
      pinDoc.city = body.city.toString().trim();
    }
    if (body.state !== undefined && body.state.toString().trim()) {
      pinDoc.state = body.state.toString().trim();
    }

    if (Array.isArray(body.lenders)) {
      pinDoc.lenders = body.lenders.map((l: any) => ({
        lender: (l.lender || "Other Lender").toString().trim(),
        isServiceable: l.isServiceable !== false,
        branchName: (l.branchName || "Main Branch").toString().trim(),
        category: (l.category || "Standard").toString().trim(),
        products: Array.isArray(l.products) && l.products.length > 0
          ? l.products
          : ["Personal Loan", "Home Loan", "LAP"],
        tatDays: Number(l.tatDays) || 2,
      }));
    }

    await pinDoc.save();

    return NextResponse.json({
      success: true,
      message: `PIN code "${pinDoc.pincode}" updated successfully`,
      pincode: pinDoc,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A record with this PIN code already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update pincode" },
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
    let pin = searchParams.get("pin");

    if (!id && !pin) {
      try {
        const body = await request.json();
        id = body._id || body.id;
        pin = body.pincode || body.pin;
      } catch {
        // empty body
      }
    }

    if (!id && !pin) {
      return NextResponse.json(
        { error: "PIN code ID or 6-digit PIN code is required for deletion" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query = id
      ? { _id: id, isDeleted: { $ne: true } }
      : { pincode: pin?.trim(), isDeleted: { $ne: true } };

    const deleted = await PinCode.findOneAndUpdate(
      query,
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
        { error: "PIN code record not found or already in recycle bin" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `PIN code "${deleted.pincode}" (${deleted.city}, ${deleted.state}) moved to recycle bin`,
      deletedId: deleted._id,
      pincode: deleted.pincode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete pincode" },
      { status: 500 }
    );
  }
}
