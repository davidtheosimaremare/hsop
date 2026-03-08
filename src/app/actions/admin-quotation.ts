"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createAccurateHSQ } from "@/lib/accurate";
import { logActivity } from "./activity";

export async function createAdminQuotation(data: {
    customerId: string;
    notes?: string;
    items: {
        productSku: string;
        productName: string;
        brand: string;
        quantity: number;
        price: number;
    }[];
}) {
    const session = await getSession();
    if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    if (!data.customerId) {
        return { success: false, error: "Silakan pilih customer" };
    }

    if (!data.items || data.items.length === 0) {
        return { success: false, error: "Silakan tambahkan minimal satu produk" };
    }

    const { customerId, notes, items } = data;

    try {
        const customer = await db.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer) {
            return { success: false, error: "Customer tidak ditemukan" };
        }

        // Generate SQ/YY/MM/XXXXX
        const now = new Date();
        const year = String(now.getFullYear()).substring(2);
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const prefix = `SQ/${year}/${month}/`;

        const latest = await db.salesQuotation.findFirst({
            where: { quotationNo: { startsWith: prefix } },
            orderBy: { quotationNo: "desc" },
            select: { quotationNo: true },
        });

        let nextNum = 1;
        if (latest?.quotationNo) {
            const parts = latest.quotationNo.split("/");
            const lastPart = parts[parts.length - 1];
            const num = parseInt(lastPart, 10);
            if (!isNaN(num)) nextNum = num + 1;
        }
        const quotationNo = `${prefix}${String(nextNum)}`;

        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

        const newQuotation = await db.salesQuotation.create({
            data: {
                quotationNo,
                customerId: customer.id,
                email: customer.email || "no-email@hokiindo.com",
                phone: customer.phone || "-",
                notes,
                status: "OFFERED", // Auto offered out of the box? We can set PENDING or OFFERED.
                totalAmount,
                clientName: customer.company || customer.name,
                items: {
                    create: items.map(i => ({
                        productSku: i.productSku,
                        productName: i.productName,
                        brand: i.brand,
                        quantity: i.quantity,
                        price: i.price,
                        basePrice: i.price,
                        discountPercent: 0,
                        discountAmount: 0,
                        discountStr: "0"
                    }))
                }
            },
            include: {
                items: true,
                customer: true
            }
        });

        // Sync to Accurate
        if (customer.accurateId) {
            const accRes = await createAccurateHSQ(newQuotation);
            if (accRes && accRes.id) {
                await db.salesQuotation.update({
                    where: { id: newQuotation.id },
                    data: {
                        quotationNo: accRes.number || accRes.no || newQuotation.quotationNo,
                        accurateHsqId: accRes.id,
                        accurateHsqNo: accRes.number || accRes.no,
                        accurateSyncStatus: "SUCCESS"
                    }
                });
            } else {
                await db.salesQuotation.update({
                    where: { id: newQuotation.id },
                    data: { accurateSyncStatus: "FAILED" }
                });
            }
        }

        await logActivity(newQuotation.id, "SQ_CREATED", "SQ Dibuat", `Admin membuat SQ ${quotationNo} untuk customer ${customer.company || customer.name}`, "ADMIN");

        revalidatePath("/admin/sales/quotations");
        return { success: true, id: newQuotation.id };
    } catch (e: any) {
        console.error("Failed to create HRSQ:", e);
        return { success: false, error: e.message || "Terjadi kesalahan sistem" };
    }
}

export async function getCustomersForQuotation() {
    try {
        const customers = await db.customer.findMany({
            select: {
                id: true,
                accurateId: true,
                name: true,
                company: true,
                email: true,
                phone: true,
            },
            orderBy: { name: "asc" }
        });
        return { success: true, customers };
    } catch (e) {
        return { success: false, customers: [] };
    }
}

export async function getProductsForQuotation() {
    try {
        const products = await db.product.findMany({
            select: {
                sku: true,
                name: true,
                brand: true,
                price: true,
            },
            where: { isVisible: true },
            orderBy: { name: "asc" }
        });
        return { success: true, products };
    } catch (e) {
        return { success: false, products: [] };
    }
}
