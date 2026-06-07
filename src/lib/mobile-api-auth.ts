/**
 * Mobile API Security Helper
 *
 * Lapis 1: API Key Guard  → melindungi semua endpoint mobile dari akses luar.
 * Lapis 2: JWT Bearer     → verifikasi identitas user untuk endpoint yang memerlukan login.
 */

import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "hokiindo-mobile-dev-key";
const JWT_SECRET = process.env.JWT_SECRET || "secret-key-hokiindo";
const jwtKey = new TextEncoder().encode(JWT_SECRET);

// ─── CORS Headers untuk akses dari aplikasi mobile ───────────────────────────
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
};

/**
 * Lapis 1: Validasi API Key
 * Panggil di semua endpoint mobile sebelum melakukan apa pun.
 * Kembalikan null jika valid, kembalikan NextResponse jika tidak valid.
 */
export function validateApiKey(request: NextRequest): NextResponse | null {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== MOBILE_API_KEY) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: API Key tidak valid." },
      { status: 401, headers: CORS_HEADERS }
    );
  }
  return null;
}

/**
 * Buat JWT untuk mobile (expire 30 hari — lebih panjang dari web session)
 */
export async function createMobileToken(payload: {
  userId: string;
  email: string;
  role: string;
  customerId?: string | null;
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(jwtKey);
}

/**
 * Lapis 2: Verifikasi JWT dari header Authorization: Bearer <token>
 * Kembalikan payload user jika valid, kembalikan null jika tidak valid.
 */
export async function verifyMobileToken(
  request: NextRequest
): Promise<{ userId: string; email: string; role: string; customerId?: string } | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, jwtKey, {
      algorithms: ["HS256"],
    });

    return payload as { userId: string; email: string; role: string; customerId?: string };
  } catch {
    return null;
  }
}

/**
 * Helper: Endpoint yang butuh auth wajib pakai ini.
 * Kembalikan { user } jika valid, kembalikan NextResponse error jika tidak.
 */
export async function requireAuth(
  request: NextRequest
): Promise<
  | { user: { userId: string; email: string; role: string; customerId?: string } }
  | NextResponse
> {
  const apiKeyError = validateApiKey(request);
  if (apiKeyError) return apiKeyError;

  const user = await verifyMobileToken(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Token tidak valid atau sudah expired. Silakan login ulang." },
      { status: 401, headers: CORS_HEADERS }
    );
  }
  return { user };
}

/**
 * Buat response JSON dengan CORS headers
 */
export function mobileResponse(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}
