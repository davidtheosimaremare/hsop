"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ── 1. Search Products ──
export async function chatProductSearch(query: string) {
    if (!query || query.length < 3) return { success: false, message: "Kata kunci terlalu pendek" };

    try {
        const products = await db.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { brand: { contains: query, mode: "insensitive" } },
                    { sku: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                sku: true, // Use SKU for linking if slug is missing
                price: true,
                image: true, // Single image string based on schema
            },
            take: 3,
        });

        return { success: true, products };
    } catch (error) {
        console.error("Chat Search Error:", error);
        return { success: false, message: "Gagal mencari produk" };
    }
}

// ── 2. Check Order Status ──
export async function chatOrderCheck(quotationNo: string) {
    if (!quotationNo) return { success: false, message: "Nomor pesanan tidak valid" };

    try {
        const quotation = await db.salesQuotation.findUnique({
            where: { quotationNo: quotationNo.toUpperCase() },
            select: {
                quotationNo: true,
                status: true,
                totalAmount: true,
                trackingNumber: true,
                shippingNotes: true,
                createdAt: true,
            },
        });

        if (!quotation) return { success: false, message: "Pesanan tidak ditemukan" };

        return { success: true, quotation };
    } catch (error) {
        console.error("Chat Order Check Error:", error);
        return { success: false, message: "Gagal mengecek pesanan" };
    }
}
