import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { extractTokenFromRequest, verifyToken, hashPassword } from "@/lib/auth";

async function requireSuperadmin(request: Request) {
  const token = extractTokenFromRequest(request);
  if (!token) return { error: "Not authenticated", status: 401 };

  const payload = verifyToken(token);
  if (!payload) return { error: "Invalid token", status: 401 };

  if (payload.role !== "superadmin") {
    return { error: "Access denied. Only Superadmin can perform this action.", status: 403 };
  }

  return { payload };
}

// PATCH /api/admin/users/[id] - Update user (status, role, reset password)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const { status, role, newPassword } = await request.json();

    await connectToDatabase();
    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety: Cannot deactivate the default superadmin if it's the only one
    if (userToUpdate._id.toString() === authCheck.payload?.userId && status === "inactive") {
      return NextResponse.json(
        { error: "You cannot deactivate your own superadmin account." },
        { status: 400 }
      );
    }

    if (status && ["active", "inactive"].includes(status)) {
      userToUpdate.status = status;
    }

    if (role && ["superadmin", "operator", "analyst"].includes(role)) {
      userToUpdate.role = role;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }
      userToUpdate.password = await hashPassword(newPassword);
    }

    await userToUpdate.save();

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: userToUpdate._id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        role: userToUpdate.role,
        status: userToUpdate.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;

    // Safety: Superadmin cannot delete themselves
    if (authCheck.payload?.userId === id) {
      return NextResponse.json(
        { error: "You cannot delete your own active superadmin account." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const deleted = await User.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: authCheck.payload?.email || "superadmin",
        },
      },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json({ error: "User not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${deleted.name} (${deleted.email}) moved to recycle bin successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
