/**
 * GET /api/mobile/categories
 *
 * Header: x-api-key (required)
 *
 * Response: { success, categories: [...tree] }
 * Tree structure: setiap category punya `children` array.
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
    const categories = await db.category.findMany({
      where: { isVisible: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        alias: true,
        parentId: true,
        image: true,
        order: true,
      },
    });

    // Susun tree: root categories + children
    const rootCategories = categories
      .filter((c) => !c.parentId)
      .map((c) => ({
        ...c,
        children: categories.filter((child) => child.parentId === c.id),
      }));

    return mobileResponse({ success: true, categories: rootCategories });
  } catch (err: any) {
    console.error("[MOBILE] Categories error:", err);
    return mobileResponse({ success: false, error: "Gagal mengambil data kategori." }, 500);
  }
}
