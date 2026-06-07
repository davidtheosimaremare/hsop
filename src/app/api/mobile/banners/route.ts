/**
 * GET /api/mobile/banners
 *
 * Header: x-api-key (required)
 *
 * Response: { success, banners: [...] }
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
    const banners = await db.appBanner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        image: true,
        link: true,
      },
    });

    return mobileResponse({ success: true, banners });
  } catch (err: any) {
    console.error("[MOBILE] Banners error:", err);
    return mobileResponse({ success: false, error: "Gagal mengambil data banner." }, 500);
  }
}
