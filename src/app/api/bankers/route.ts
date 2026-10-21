import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Banker from "@/lib/models/Banker";
import { requireAdminAuth } from "@/lib/auth";

const INITIAL_DEMO_BANKERS = [
  {
    name: "Rohan Malhotra",
    bankName: "HDFC Bank",
    designation: "Senior Branch Credit Manager",
    branch: "Connaught Place, New Delhi",
    city: "New Delhi",
    phone: "+91 98110 24890",
    email: "rohan.malhotra@hdfcbank.com",
    productsHandled: ["Personal Loan", "Business Loan", "LAP"],
    isVerified: true,
    isDemo: true,
    notes: "Specialized in high-value salaried PL and doctor loans.",
  },
  {
    name: "Pooja Varma",
    bankName: "ICICI Bank",
    designation: "Relationship Manager - Retail Lending",
    branch: "Bandra Kurla Complex (BKC)",
    city: "Mumbai",
    phone: "+91 98201 45892",
    email: "pooja.varma@icicibank.com",
    productsHandled: ["Home Loan", "Balance Transfer", "Personal Loan"],
    isVerified: true,
    isDemo: true,
    notes: "Handles corporate salary account tie-ups and priority home loans.",
  },
  {
    name: "Sandeep Rao",
    bankName: "Axis Bank",
    designation: "Assistant Vice President - DSA Liaison",
    branch: "MG Road, Bengaluru",
    city: "Bengaluru",
    phone: "+91 97415 67210",
    email: "sandeep.rao@axisbank.com",
    productsHandled: ["Working Capital", "Business Loan", "Doctor Loans"],
    isVerified: true,
    isDemo: true,
    notes: "Direct contact for fast-track DSA file approvals.",
  },
  {
    name: "Anil Kulkarni",
    bankName: "State Bank of India (SBI)",
    designation: "Chief Manager (SME & Retail)",
    branch: "FC Road, Pune",
    city: "Pune",
    phone: "+91 94220 89134",
    email: "anil.kulkarni@sbi.co.in",
    productsHandled: ["Home Loan", "CGTMSE SME", "Auto Loan"],
    isVerified: true,
    isDemo: true,
    notes: "Government PSU loan schemes and CGTMSE SME approvals.",
  },
];

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const bank = searchParams.get("bank") || "all";

    const filter: Record<string, any> = {};

    if (bank && bank !== "all") {
      filter.bankName = { $regex: new RegExp(bank, "i") };
    }

    if (search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [
        { name: regex },
        { bankName: regex },
        { branch: regex },
        { city: regex },
        { designation: regex },
        { phone: regex },
        { productsHandled: { $in: [regex] } },
      ];
    }

    const bankers = await Banker.find(filter)
      .sort({ isDemo: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: bankers.length,
      bankers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch bankers" },
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

    await connectToDatabase();
    const body = await request.json();

    const {
      name,
      bankName,
      designation,
      branch,
      city,
      phone,
      email,
      productsHandled,
      isVerified,
      notes,
    } = body;

    if (!name || !bankName || !designation || !branch || !city || !phone) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: Name, Bank Name, Designation, Branch, City, and Phone are required.",
        },
        { status: 400 }
      );
    }

    const newBanker = await Banker.create({
      name: name.trim(),
      bankName: bankName.trim(),
      designation: designation.trim(),
      branch: branch.trim(),
      city: city.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      productsHandled: Array.isArray(productsHandled)
        ? productsHandled.filter(Boolean)
        : ["Personal Loan"],
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
      isDemo: false,
      notes: (notes || "").trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Banker record for "${newBanker.name}" created successfully.`,
        banker: newBanker,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create banker record" },
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

    await connectToDatabase();
    const body = await request.json();

    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json(
        { error: "Banker ID is required for update" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.bankName !== undefined) updateData.bankName = body.bankName.trim();
    if (body.designation !== undefined)
      updateData.designation = body.designation.trim();
    if (body.branch !== undefined) updateData.branch = body.branch.trim();
    if (body.city !== undefined) updateData.city = body.city.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.email !== undefined) updateData.email = body.email.trim();
    if (body.notes !== undefined) updateData.notes = body.notes.trim();
    if (body.isVerified !== undefined)
      updateData.isVerified = Boolean(body.isVerified);
    if (body.productsHandled !== undefined) {
      updateData.productsHandled = Array.isArray(body.productsHandled)
        ? body.productsHandled.filter(Boolean)
        : [];
    }

    const updatedBanker = await Banker.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBanker) {
      return NextResponse.json(
        { error: "Banker record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Banker record for "${updatedBanker.name}" updated successfully.`,
      banker: updatedBanker,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update banker record" },
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
      const deleteResult = await Banker.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `Successfully deleted all ${deleteResult.deletedCount} banker records.`,
        deletedCount: deleteResult.deletedCount,
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Banker ID is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = await Banker.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Banker record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Banker record for "${deleted.name}" has been deleted.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete banker record" },
      { status: 500 }
    );
  }
}
