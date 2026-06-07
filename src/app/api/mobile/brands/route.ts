/**
 * GET /api/mobile/brands
 *
 * Header: x-api-key (required)
 *
 * Response: { success, brands: [...] }
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, mobileResponse } from "@/lib/mobile-api-auth";

export async function OPTIONS(request: NextRequest) {
  return validateApiKey(request) ?? mobileResponse({}, 204);
}

export async function GET(request: NextRequest) {
  const apiKeyError = validateApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    const brands = await db.brand.findMany({
      where: { isVisible: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        alias: true,
      },
    });

    return mobileResponse({ success: true, brands });
  } catch (err: any) {
    console.error("[MOBILE] Brands error:", err);
    return mobileResponse({ success: false, error: "Gagal mengambil data brand." }, 500);
  }
}
