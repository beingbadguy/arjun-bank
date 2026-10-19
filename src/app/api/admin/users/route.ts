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

// GET /api/admin/users - list all users (Superadmin only)
export async function GET(request: Request) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Superadmin creates a new user (Strictly Superadmin only)
export async function POST(request: Request) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and initial password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const assignedRole = ["superadmin", "operator", "analyst"].includes(role)
      ? role
      : "operator";

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      status: "active",
      createdBy: authCheck.payload?.email || "superadmin",
    });

    return NextResponse.json({
      success: true,
      message: `User account for ${newUser.name} created successfully`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdBy: newUser.createdBy,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
