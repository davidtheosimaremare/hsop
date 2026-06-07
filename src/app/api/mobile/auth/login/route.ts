/**
 * POST /api/mobile/auth/login
 *
 * Request Body:
 *   { email: string, password: string }
 *
 * Response:
 *   { success, token, user: { id, name, email, role, phone, customerId } }
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { validateApiKey, createMobileToken, mobileResponse } from "@/lib/mobile-api-auth";

export async function OPTIONS(request: NextRequest) {
  return validateApiKey(request) ?? mobileResponse({}, 204);
}

export async function POST(request: NextRequest) {
  const apiKeyError = validateApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return mobileResponse({ success: false, error: "Email dan password wajib diisi." }, 400);
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            phone: true,
            type: true,
            discountCP: true,
            discountLP: true,
            discountLighting: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return mobileResponse({ success: false, error: "Email atau password tidak valid." }, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return mobileResponse({ success: false, error: "Email atau password tidak valid." }, 401);
    }

    const token = await createMobileToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
    });

    return mobileResponse({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        customerId: user.customerId,
        customer: user.customer,
      },
    });
  } catch (err: any) {
    console.error("[MOBILE] Login error:", err);
    return mobileResponse({ success: false, error: "Server error." }, 500);
  }
}
