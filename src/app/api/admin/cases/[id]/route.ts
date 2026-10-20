import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CaseEntry from "@/lib/models/CaseEntry";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireSuperadmin(request: Request) {
  const token = extractTokenFromRequest(request);
  if (!token) return { error: "Not authenticated", status: 401 };

  const payload = verifyToken(token);
  if (!payload) return { error: "Invalid token", status: 401 };

  if (payload.role !== "superadmin") {
    return {
      error: "Access denied. Only Superadmin can modify this locked vault.",
      status: 403,
    };
  }

  return { payload };
}

// GET /api/admin/cases/[id] - fetch a single case entry (Superadmin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const caseItem = await CaseEntry.findById(id).lean();
    if (!caseItem) {
      return NextResponse.json(
        { error: "Case entry not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      caseItem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch case entry" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/cases/[id] - update a case entry (Superadmin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    const existingCase = await CaseEntry.findById(id);
    if (!existingCase) {
      return NextResponse.json(
        { error: "Case entry not found." },
        { status: 404 }
      );
    }

    if (body.name !== undefined) existingCase.name = body.name.trim().toUpperCase();
    if (body.bankName !== undefined) existingCase.bankName = body.bankName.trim().toUpperCase();
    if (body.location !== undefined) existingCase.location = body.location.trim().toUpperCase();
    if (body.status !== undefined) existingCase.status = body.status;
    if (body.applicationNo !== undefined) existingCase.applicationNo = body.applicationNo.trim();
    if (body.remarks !== undefined) existingCase.remarks = body.remarks.trim();
    if (body.contactNo !== undefined) existingCase.contactNo = body.contactNo.trim();
    if (body.product !== undefined) existingCase.product = body.product.trim();
    if (body.panCard !== undefined) existingCase.panCard = body.panCard.trim().toUpperCase();
    if (body.appliedAmount !== undefined) existingCase.appliedAmount = Number(body.appliedAmount) || 0;
    if (body.approvedAmount !== undefined) existingCase.approvedAmount = Number(body.approvedAmount) || 0;
    existingCase.lastUpdateDate = new Date();

    await existingCase.save();

    return NextResponse.json({
      success: true,
      message: "Case entry updated successfully",
      caseItem: existingCase,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update case entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/cases/[id] - delete a case entry (Superadmin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;

    await connectToDatabase();

    const deleted = await CaseEntry.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Case entry not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Case entry deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete case entry" },
      { status: 500 }
    );
  }
}
