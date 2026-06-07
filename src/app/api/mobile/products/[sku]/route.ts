/**
 * GET /api/mobile/products/[sku]
 *
 * Header: x-api-key (required)
 *
 * Response: { success, product: { ...detail + sliderImages + specifications + datasheet } }
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, mobileResponse } from "@/lib/mobile-api-auth";

export async function OPTIONS(request: NextRequest) {
  return validateApiKey(request) ?? mobileResponse({}, 204);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  const apiKeyError = validateApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    const { sku } = await params;

    const product = await db.product.findUnique({
      where: { sku: decodeURIComponent(sku) },
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        longDescription: true,
        price: true,
        basePrice: true,
        brand: true,
        category: true,
        image: true,
        sliderImages: true,
        availableToSell: true,
        itemType: true,
        indentTime: true,
        specifications: true,
        datasheet: true,
        metaTitle: true,
        metaDescription: true,
        isVisible: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product || !product.isVisible || product.status !== "APPROVED") {
      return mobileResponse({ success: false, error: "Produk tidak ditemukan." }, 404);
    }

    return mobileResponse({ success: true, product });
  } catch (err: any) {
    console.error("[MOBILE] Product detail error:", err);
    return mobileResponse({ success: false, error: "Gagal mengambil detail produk." }, 500);
  }
}
