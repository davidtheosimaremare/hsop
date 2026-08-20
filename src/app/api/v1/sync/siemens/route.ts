/**
 * GET /api/v1/sync/siemens
 * 
 * Endpoint khusus untuk sinkronisasi data produk Siemens ke sistem external (seperti hso.hokiindo.co.id).
 * 
 * Headers Wajib:
 *   x-api-key: <HSO_SYNC_API_KEY>
 *   ATAU
 *   Authorization: Bearer <HSO_SYNC_API_KEY>
 * 
 * Query Parameters (Opsional):
 *   ?updatedAfter=  — Filter produk yang di-update setelah tanggal ini (ISO-8601 string, e.g. 2026-08-01T00:00:00Z)
 *   ?page=          — Nomor halaman (default: 1)
 *   ?limit=         — Jumlah item per halaman (default: 100, max: 1000). Gunakan ?limit=all atau ?all=true untuk ambil semua
 *   ?category=      — Filter berdasarkan nama kategori (e.g. "Low Voltage")
 *   ?stockStatus=   — Filter stok: "all" | "ready" | "indent" (default: "all")
 *   ?includeInactive= — "true" | "false" (default: false, hanya ambil produk aktif/visible & APPROVED)
 *   ?search=        — Cari berdasarkan SKU atau Nama produk
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
};

const SYNC_API_KEY =
  process.env.HSO_SYNC_API_KEY ||
  process.env.SYNC_API_KEY ||
  "hso_sync_siemens_9a7d3b5c1e2f4088";

function validateSyncAuth(request: NextRequest): boolean {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey && headerKey === SYNC_API_KEY) return true;

  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerKey = authHeader.substring(7).trim();
    if (bearerKey === SYNC_API_KEY) return true;
  }

  return false;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  // 1. Auth Guard
  if (!validateSyncAuth(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: x-api-key atau Bearer token tidak valid atau belum dikirimkan.",
      },
      {
        status: 401,
        headers: CORS_HEADERS,
      }
    );
  }

  try {
    const { searchParams } = request.nextUrl;

    const updatedAfterParam = searchParams.get("updatedAfter");
    const categoryParam = searchParams.get("category");
    const stockStatus = searchParams.get("stockStatus") || "all";
    const includeInactive = searchParams.get("includeInactive") === "true";
    const search = searchParams.get("search")?.trim() || "";
    const isAll = searchParams.get("all") === "true" || searchParams.get("limit") === "all";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = isAll ? 5000 : Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));
    const skip = isAll ? 0 : (page - 1) * limit;

    // 2. Build Where Filter
    const where: any = {
      AND: [],
    };

    // Filter Brand Siemens (brand / name / sku / description matches Siemens)
    where.AND.push({
      OR: [
        { brand: { contains: "Siemens", mode: "insensitive" } },
        { name: { contains: "Siemens", mode: "insensitive" } },
        { sku: { contains: "Siemens", mode: "insensitive" } },
        { description: { contains: "Siemens", mode: "insensitive" } },
      ],
    });

    // Active status filter
    if (!includeInactive) {
      where.AND.push({
        isVisible: true,
        status: "APPROVED",
      });
    }

    // Incremental Sync filter: updatedAfter
    if (updatedAfterParam) {
      const parsedDate = new Date(updatedAfterParam);
      if (!isNaN(parsedDate.getTime())) {
        where.AND.push({
          updatedAt: {
            gte: parsedDate,
          },
        });
      }
    }

    // Category filter
    if (categoryParam) {
      where.AND.push({
        category: {
          equals: categoryParam,
          mode: "insensitive",
        },
      });
    }

    // Stock Status filter
    if (stockStatus === "ready") {
      where.AND.push({ availableToSell: { gt: 0 } });
    } else if (stockStatus === "indent") {
      where.AND.push({ availableToSell: { lte: 0 } });
    }

    // Keyword Search filter
    if (search) {
      const terms = search.split(/\s+/).filter(Boolean);
      for (const term of terms) {
        where.AND.push({
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { sku: { contains: term, mode: "insensitive" } },
          ],
        });
      }
    }

    // 3. Query Database
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ updatedAt: "desc" }, { sortWeight: "asc" }, { sku: "asc" }],
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          longDescription: true,
          price: true,
          basePrice: true,
          availableToSell: true,
          brand: true,
          category: true,
          image: true,
          sliderImages: true,
          accurateId: true,
          itemType: true,
          isVisible: true,
          status: true,
          datasheet: true,
          specifications: true,
          metaTitle: true,
          metaDescription: true,
          indentTime: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.product.count({ where }),
    ]);

    // Format output
    const formattedProducts = products.map((p) => ({
      ...p,
      brand: p.brand || "SIEMENS",
      stockStatus: p.availableToSell > 0 ? "READY" : "INDENT",
    }));

    const totalPages = isAll ? 1 : Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        pagination: {
          page: isAll ? 1 : page,
          limit: isAll ? total : limit,
          total,
          totalPages,
          hasNext: !isAll && page * limit < total,
          hasPrev: !isAll && page > 1,
        },
        data: formattedProducts,
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error: any) {
    console.error("[SYNC_SIEMENS_API_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal server saat mengambil data produk Siemens.",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}
