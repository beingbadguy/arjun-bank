import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "arjun_loan_ops_super_secret_jwt_key_2026_secure";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: "superadmin" | "operator" | "analyst";
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check Cookie header
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith("auth_token="));
    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split("=")[1]);
    }
  }

  return null;
}

export function requireAdminAuth(request: Request): {
  authorized: boolean;
  status: number;
  error?: string;
  payload?: TokenPayload;
} {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please log in with a Superadmin account.",
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      authorized: false,
      status: 401,
      error: "Invalid or expired session. Please log in again.",
    };
  }

  if (payload.role !== "superadmin") {
    return {
      authorized: false,
      status: 403,
      error: "Access denied. Only Superadmin can create, update, or delete records.",
    };
  }

  return { authorized: true, status: 200, payload };
}
