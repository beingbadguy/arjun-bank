import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "arjun_loan_ops_super_secret_jwt_key_2026_secure";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static assets and Next.js internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Allow login and logout public authentication endpoints
  if (pathname === "/api/auth/login" || pathname === "/api/auth/logout") {
    return NextResponse.next();
  }

  // 3. Extract authentication token from cookie or Authorization header
  let token = request.cookies.get("auth_token")?.value;
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  let isAuthenticated = false;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // 4. Protect ALL API routes
  if (pathname.startsWith("/api/")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: "Unauthorized: Please log in to access this resource.",
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. Page routes: proceed to Next.js page renderer (which locks workspace to LoginView if not authenticated)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
