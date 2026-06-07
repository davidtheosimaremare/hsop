/**
 * POST /api/mobile/auth/register
 *
 * Request Body:
 *   { name: string, email: string, password: string, phone?: string, company?: string }
 *
 * Response:
 *   { success, token, user }
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
    const { name, email, password, phone, company } = body;

    // Validasi input
    if (!name || !email || !password) {
      return mobileResponse({ success: false, error: "Nama, email, dan password wajib diisi." }, 400);
    }
    if (password.length < 8) {
      return mobileResponse({ success: false, error: "Password minimal 8 karakter." }, 400);
    }

    const emailNorm = email.toLowerCase().trim();

    // Cek apakah email sudah terdaftar
    const existing = await db.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return mobileResponse({ success: false, error: "Email sudah terdaftar. Silakan login." }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Buat Customer + User dalam satu transaksi
    const result = await db.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name,
          email: emailNorm,
          phone: phone || null,
          company: company || null,
          type: "BISNIS",
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email: emailNorm,
          password: hashedPassword,
          phone: phone || null,
          role: "CUSTOMER",
          isActive: true,
          isVerified: false,
          customerId: customer.id,
        },
      });

      return { user, customer };
    });

    const token = await createMobileToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      customerId: result.user.customerId,
    });

    return mobileResponse({
      success: true,
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        isVerified: result.user.isVerified,
        customerId: result.user.customerId,
      },
    }, 201);
  } catch (err: any) {
    console.error("[MOBILE] Register error:", err);
    return mobileResponse({ success: false, error: "Server error saat mendaftarkan akun." }, 500);
  }
}
