/**
 * GET /api/mobile/grid-categories
 *
 * Header: x-api-key (required)
 *
 * Response: { success, categories: [...] }
 * Returns categories that are configured to be displayed on the home page grid.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, mobileResponse } from "@/lib/mobile-api-auth";
import { getSiteSetting } from "@/app/actions/settings";

export async function OPTIONS(request: NextRequest) {
  return validateApiKey(request) ?? mobileResponse({}, 204);
}

export async function GET(request: NextRequest) {
  const apiKeyError = validateApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    const savedGridSettings = await getSiteSetting("homepage_grid_categories");
    
    let gridItems: { id: string; customName: string }[] = [];
    if (Array.isArray(savedGridSettings)) {
      gridItems = savedGridSettings.map((item: any) => ({
        id: typeof item === 'string' ? item : item.id,
        customName: typeof item === 'string' ? "" : (item.customName || "")
      }));
    }

    if (gridItems.length === 0) {
      return mobileResponse({ success: true, categories: [] });
    }

    const categoryIds = gridItems.map(item => item.id);
    
    const categories = await db.category.findMany({
      where: { id: { in: categoryIds }, isVisible: true },
      select: {
        id: true,
        name: true,
        alias: true,
        image: true,
      },
    });

    // Map back to the order defined in settings and apply custom names
    const orderedCategories = gridItems
      .map(item => {
        const cat = categories.find(c => c.id === item.id);
        if (!cat) return null;
        return {
          ...cat,
          // override name if customName exists
          name: item.customName || cat.name
        };
      })
      .filter(Boolean);

    return mobileResponse({ success: true, categories: orderedCategories });
  } catch (err: any) {
    console.error("[MOBILE] Grid categories error:", err);
    return mobileResponse({ success: false, error: "Gagal mengambil data grid kategori." }, 500);
  }
}
