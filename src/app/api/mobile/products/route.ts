/**
 * GET /api/mobile/products
 *
 * Query Params:
 *   ?search=    — search by name / SKU
 *   ?category=  — filter by category name
 *   ?brand=     — filter by brand name
 *   ?page=      — halaman (default: 1)
 *   ?limit=     — jumlah per halaman (default: 20, max: 50)
 *   ?stockStatus= — "all" | "ready" | "indent"
 *
 * Header: x-api-key (required)
 *
 * Response: { success, products: [...], pagination: {...} }
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
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";
    const stockStatus = searchParams.get("stockStatus") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      isVisible: true,
      status: "APPROVED",
    };

    // Full-text search: match ALL words in name or SKU
    if (search.trim()) {
      const terms = search.trim().split(/\s+/).filter(Boolean);
      where.AND = terms.map((term: string) => ({
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { sku: { contains: term, mode: "insensitive" } },
        ],
      }));
    }

    if (category) where.category = { equals: category, mode: "insensitive" };
    if (brand) where.brand = { equals: brand, mode: "insensitive" };

    if (stockStatus === "ready") where.availableToSell = { gt: 0 };
    else if (stockStatus === "indent") where.availableToSell = { lte: 0 };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortWeight: "asc" }, { name: "asc" }],
        select: {
          id: true,
          sku: true,
          name: true,
          price: true,
          basePrice: true,
          brand: true,
          category: true,
          image: true,
          availableToSell: true,
          itemType: true,
          indentTime: true,
          description: true,
        },
      }),
      db.product.count({ where }),
    ]);

    return mobileResponse({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err: any) {
    console.error("[MOBILE] Products error:", err);
    return mobileResponse({ success: false, error: "Gagal mengambil data produk." }, 500);
  }
}
