/**
 * Requests (Permintaan / RFQ) API
 *
 * GET  /api/mobile/requests         — Daftar permintaan milik user yang login
 * POST /api/mobile/requests         — Kirim permintaan penawaran harga baru (RFQ)
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
  const prefix = `RFQ-${year}${month}${day}`;

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

// ─── GET: Daftar permintaan user ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("status" in authResult) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      db.salesQuotation.findMany({
        where: { userId: user.userId, isEstimation: false },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quotationNo: true,
          status: true,
          totalAmount: true,
          notes: true,
          shippingAddress: true,
          offeredAt: true,
          confirmedAt: true,
          shippedAt: true,
          completedAt: true,
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
      db.salesQuotation.count({ where: { userId: user.userId, isEstimation: false } }),
    ]);

    return mobileResponse({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err: any) {
    console.error("[MOBILE] Get requests error:", err);
    return mobileResponse({ success: false, error: "Gagal mengambil data permintaan." }, 500);
  }
}

// ─── POST: Kirim permintaan (RFQ) baru ───────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ("status" in authResult) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();
    const { items, notes, shippingAddress } = body;

    // Validasi
    if (!items || !Array.isArray(items) || items.length === 0) {
      return mobileResponse({ success: false, error: "Keranjang tidak boleh kosong." }, 400);
    }

    for (const item of items) {
      if (!item.sku || !item.name || !item.quantity || !item.price) {
        return mobileResponse({
          success: false,
          error: "Data item tidak lengkap. Pastikan sku, name, quantity, dan price ada.",
        }, 400);
      }
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.price) * parseInt(item.quantity, 10),
      0
    );

    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { email: true, phone: true, customerId: true, address: true },
    });

    if (!dbUser) {
      return mobileResponse({ success: false, error: "User tidak ditemukan." }, 404);
    }

    const quotationNo = await generateQuotationNo();

    const rfq = await db.salesQuotation.create({
      data: {
        quotationNo,
        userId: user.userId,
        customerId: dbUser.customerId,
        email: dbUser.email,
        phone: dbUser.phone || "",
        status: "PENDING",
        isEstimation: false,
        totalAmount,
        notes: notes || null,
        shippingAddress: shippingAddress || dbUser.address || null,
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
        activities: {
          create: {
            type: "CREATED",
            title: "Permintaan dibuat via Mobile App",
            description: `RFQ dari aplikasi mobile. Total ${items.length} item.`,
            performedBy: "MOBILE_APP",
          },
        },
      },
      include: {
        items: true,
      },
    });

    return mobileResponse({
      success: true,
      message: `Permintaan penawaran #${rfq.quotationNo} berhasil dikirim! Tim sales kami akan menghubungi Anda secepatnya.`,
      request: {
        id: rfq.id,
        quotationNo: rfq.quotationNo,
        totalAmount: rfq.totalAmount,
        status: rfq.status,
        itemCount: rfq.items.length,
        createdAt: rfq.createdAt,
      },
    }, 201);
  } catch (err: any) {
    console.error("[MOBILE] Create request error:", err);
    return mobileResponse({ success: false, error: "Gagal mengirim permintaan." }, 500);
  }
}
