import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken, extractTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const expectedPassword = (
      process.env.PRIVATE_VAULT_PASSWORD ||
      process.env.NEXT_PUBLIC_PRIVATE_VAULT_PASSWORD ||
      process.env.DATA_UPDATE_PASSWORD ||
      "arjunProcess@2024"
    ).trim();

    const adminPassword = (
      process.env.DEFAULT_ADMIN_PASSWORD ||
      "SuperAdmin@2026"
    ).trim();

    const provided = (password || "").trim();

    if (!provided || (provided !== expectedPassword && provided !== adminPassword)) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Access denied." },
        { status: 401 }
      );
    }

    // Connect to DB and ensure superadmin privileges for vault operations
    await connectToDatabase();

    // Check if the current request already has a valid superadmin session
    const existingToken = extractTokenFromRequest(request);
    let hasSuperadminSession = false;

    if (existingToken) {
      const payload = verifyToken(existingToken);
      if (payload && payload.role === "superadmin") {
        hasSuperadminSession = true;
      }
    }

    let authTokenToSet: string | null = null;
    let superadminUser = null;

    if (!hasSuperadminSession) {
      // Find superadmin user to attach to session
      const adminEmail = (
        process.env.DEFAULT_ADMIN_EMAIL || "superadmin@arjungrewal.online"
      ).toLowerCase();
      superadminUser =
        (await User.findOne({ email: adminEmail })) ||
        (await User.findOne({ role: "superadmin" }));

      if (superadminUser) {
        authTokenToSet = signToken({
          userId: superadminUser._id.toString(),
          email: superadminUser.email,
          name: superadminUser.name,
          role: "superadmin",
        });
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Vault access granted",
      user: superadminUser
        ? {
            id: superadminUser._id,
            name: superadminUser.name,
            email: superadminUser.email,
            role: "superadmin",
          }
        : undefined,
    });

    // Set vault_unlocked session cookie
    response.cookies.set("vault_unlocked", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // If an auth token was generated, set it so all case APIs work seamlessly
    if (authTokenToSet) {
      response.cookies.set("auth_token", authTokenToSet, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (error: any) {
    console.error("Vault password verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const isUnlocked = cookieHeader.includes("vault_unlocked=true");

  return NextResponse.json({
    unlocked: isUnlocked,
  });
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Vault locked",
  });

  response.cookies.set("vault_unlocked", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
