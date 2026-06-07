/**
 * GET /api/mobile/auth/me
 *
 * Header: x-api-key, Authorization: Bearer <token>
 *
 * Response: { success, user }
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, mobileResponse } from "@/lib/mobile-api-auth";

export async function OPTIONS() {
  return mobileResponse({}, 204);
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("status" in authResult) return authResult; // NextResponse error

  const { user: tokenUser } = authResult;

  try {
    const user = await db.user.findUnique({
      where: { id: tokenUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        isVerified: true,
        isActive: true,
        customerId: true,
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            phone: true,
            type: true,
            discount1: true,
            discount2: true,
            discountCP: true,
            discountCPIndent: true,
            discountLP: true,
            discountLPIndent: true,
            discountLighting: true,
            discountLightingIndent: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return mobileResponse({ success: false, error: "User tidak ditemukan atau tidak aktif." }, 404);
    }

    return mobileResponse({ success: true, user });
  } catch (err: any) {
    console.error("[MOBILE] /me error:", err);
    return mobileResponse({ success: false, error: "Server error." }, 500);
  }
}
