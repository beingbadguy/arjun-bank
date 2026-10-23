import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";
import { serverCache } from "@/lib/cache";

export async function GET(request: Request) {
  try {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const cacheKey = `user:session:${payload.userId}`;
    const cachedUser = serverCache.get(cacheKey);
    if (cachedUser) {
      return NextResponse.json(cachedUser, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "private, max-age=30",
        },
      });
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select("-password").lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    const responsePayload = {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    };

    serverCache.set(cacheKey, responsePayload, 60, "users");

    return NextResponse.json(responsePayload, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch user session" },
      { status: 500 }
    );
  }
}
