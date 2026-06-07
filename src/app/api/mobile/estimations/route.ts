/**
 * Estimations API
 *
 * GET  /api/mobile/estimations         — Daftar estimasi milik user yang login
 * POST /api/mobile/estimations         — Simpan estimasi baru dari keranjang mobile
 *
 * Header: x-api-key + Authorization: Bearer <token> (required)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, mobileResponse } from "@/lib/mobile-api-auth";

// ─── Helper: Generate nomor quotation unik ───────────────────────────────────
async function generateQuotationNo(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const prefix = `MOB-${year}${month}${day}`;

  const lastToday = await db.salesQuotation.findFirst({
    where: { quotationNo: { startsWith: prefix } },
    orderBy: { quotationNo: "desc" },
  });

  const lastSeq = lastToday
    ? parseInt(lastToday.quotationNo.split("-").pop() || "0", 10)
    : 0;

  return `${prefix}-${String(lastSeq + 1).padStart(4, "0")}`;
}

export async function OPTIONS() {
  return mobileResponse({}, 204);
}

// ─── GET: Daftar estimasi user ────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("status" in authResult) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    const [estimations, total] = await Promise.all([
      db.salesQuotation.findMany({
        where: { userId: user.userId, isEstimation: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quotationNo: true,
          status: true,
          totalAmount: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productSku: true,
              productName: true,
              brand: true,
              quantity: true,
              price: true,
              stockStatus: true,
            },
          },
        },
      }),
      db.salesQuotation.count({ where: { userId: user.userId, isEstimation: true } }),
    ]);

    return mobileResponse({
      success: true,
      estimations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err: any) {
    console.error("[MOBILE] Get estimations error:", err);
    return mobileResponse({ success: false, error: "Gagal mengambil data estimasi." }, 500);
  }
}

// ─── POST: Simpan estimasi baru ───────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("status" in authResult) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();
    const { items, notes } = body;

    // Validasi
    if (!items || !Array.isArray(items) || items.length === 0) {
      return mobileResponse({ success: false, error: "Keranjang tidak boleh kosong." }, 400);
    }

    for (const item of items) {
      if (!item.sku || !item.name || !item.quantity || !item.price) {
        return mobileResponse({ success: false, error: "Data item tidak lengkap. Pastikan sku, name, quantity, dan price ada." }, 400);
      }
    }

    // Hitung total
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    // Cari data user lengkap
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { email: true, phone: true, customerId: true },
    });

    if (!dbUser) {
      return mobileResponse({ success: false, error: "User tidak ditemukan." }, 404);
    }

    const quotationNo = await generateQuotationNo();

    const estimation = await db.salesQuotation.create({
      data: {
        quotationNo,
        userId: user.userId,
        customerId: dbUser.customerId,
        email: dbUser.email,
        phone: dbUser.phone || "",
        status: "DRAFT",
        isEstimation: true,
        totalAmount,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productSku: item.sku,
            productName: item.name,
            brand: item.brand || "-",
            quantity: parseInt(item.quantity, 10),
            price: parseFloat(item.price),
            stockStatus: item.stockStatus || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return mobileResponse({
      success: true,
      message: "Estimasi berhasil disimpan!",
      estimation: {
        id: estimation.id,
        quotationNo: estimation.quotationNo,
        totalAmount: estimation.totalAmount,
        status: estimation.status,
        itemCount: estimation.items.length,
        createdAt: estimation.createdAt,
      },
    }, 201);
  } catch (err: any) {
    console.error("[MOBILE] Save estimation error:", err);
    return mobileResponse({ success: false, error: "Gagal menyimpan estimasi." }, 500);
  }
}
