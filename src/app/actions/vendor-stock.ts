"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getVendorUser() {
    const session = await getSession();
    if (!session || !session.user || (session.user.role !== "VENDOR" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

export async function verifyStockUpdateDataAction(data: {sku: string, stock: number}[]) {
    try {
        const user = await getVendorUser();
        
        const results = await Promise.all(data.map(async (item) => {
            const product = await db.product.findUnique({
                where: { sku: item.sku },
                select: { id: true, name: true, sku: true, availableToSell: true, vendorId: true }
            });

            if (!product) {
                return { ...item, status: "NOT_FOUND", message: "SKU tidak ditemukan" };
            }

            if (product.vendorId !== user.id && user.role !== "SUPER_ADMIN") {
                return { ...item, status: "NOT_AUTHORIZED", message: "Bukan produk Anda" };
            }

            return { 
                ...item, 
                productId: product.id,
                name: product.name,
                oldStock: product.availableToSell,
                status: "FOUND" 
            };
        }));

        return { success: true, results };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function confirmStockUpdateAction(updates: {productId: string, oldStock: number, newStock: number, source: string}[]) {
    try {
        const user = await getVendorUser();
        
        // Execute in a transaction to ensure consistency
        const result = await db.$transaction(async (tx) => {
            const logs = [];
            
            for (const update of updates) {
                // Update product stock
                const product = await tx.product.update({
                    where: { id: update.productId },
                    data: { availableToSell: update.newStock }
                });

                // Create log entry
                const log = await tx.productStockLog.create({
                    data: {
                        productId: update.productId,
                        vendorId: user.id,
                        oldStock: update.oldStock,
                        newStock: update.newStock,
                        changeValue: update.newStock - update.oldStock,
                        source: update.source || "MANUAL"
                    }
                });
                logs.push(log);
            }
            return logs;
        });

        revalidatePath("/vendor/products");
        revalidatePath("/vendor/stock-update");
        return { success: true, count: result.length };
    } catch (error: any) {
        console.error("Stock update error:", error);
        return { success: false, error: error.message };
    }
}

export async function getVendorStockLogsAction() {
    try {
        const user = await getVendorUser();
        const logs = await db.productStockLog.findMany({
            where: {
                vendorId: user.id
            },
            include: {
                product: {
                    select: { name: true, sku: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 50 // Limit to last 50 entries
        });
        return { success: true, logs };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
