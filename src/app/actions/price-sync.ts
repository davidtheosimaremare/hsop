"use server";

import { db } from "@/lib/db";
import { updateAccurateItemPrice } from "@/lib/accurate";
import { revalidatePath } from "next/cache";

export interface ComparePriceItem {
    sku: string;
    name: string;
    currentPrice: number;
    newPrice: number;
    accurateId: number | null;
    status: 'SAME' | 'DIFFERENT' | 'NOT_FOUND';
}

export interface SyncPriceResult {
    sku: string;
    success: boolean;
    message: string;
}

/**
 * Compare list of SKU and prices from Excel against our local database.
 */
export async function comparePricesWithExcel(items: { sku: string; price: number }[]): Promise<ComparePriceItem[]> {
    if (!items || items.length === 0) return [];

    const skus = items.map(item => item.sku.trim());

    // Fetch matching products from our local database
    const products = await db.product.findMany({
        where: {
            sku: {
                in: skus
            }
        },
        select: {
            sku: true,
            name: true,
            price: true,
            accurateId: true
        }
    });

    const productMap = new Map(products.map(p => [p.sku.toUpperCase(), p]));

    return items.map(item => {
        const skuKey = item.sku.trim().toUpperCase();
        const existing = productMap.get(skuKey);

        if (!existing) {
            return {
                sku: item.sku,
                name: "Produk tidak ditemukan di database",
                currentPrice: 0,
                newPrice: item.price,
                accurateId: null,
                status: 'NOT_FOUND' as const
            };
        }

        const isDifferent = Math.abs(existing.price - item.price) > 0.01;

        return {
            sku: existing.sku,
            name: existing.name,
            currentPrice: existing.price,
            newPrice: item.price,
            accurateId: existing.accurateId,
            status: isDifferent ? ('DIFFERENT' as const) : ('SAME' as const)
        };
    });
}

/**
 * Update list of product prices in Accurate and then in local database.
 */
export async function updateAccuratePrices(items: { sku: string; accurateId: number | null; newPrice: number }[]): Promise<SyncPriceResult[]> {
    if (!items || items.length === 0) return [];

    const results: SyncPriceResult[] = [];

    for (const item of items) {
        try {
            // 1. Call Accurate API to save/update price
            const syncRes = await updateAccurateItemPrice(item.sku, item.accurateId, item.newPrice);

            if (syncRes.success) {
                // 2. If accurate sync succeeds, update local database price
                await db.product.update({
                    where: { sku: item.sku },
                    data: { price: item.newPrice }
                });

                results.push({
                    sku: item.sku,
                    success: true,
                    message: syncRes.message
                });
            } else {
                results.push({
                    sku: item.sku,
                    success: false,
                    message: syncRes.message || "Gagal update di Accurate"
                });
            }
        } catch (err: any) {
            console.error(`Error syncing price for SKU ${item.sku}:`, err);
            results.push({
                sku: item.sku,
                success: false,
                message: err.message || "Terjadi kesalahan internal"
            });
        }
    }

    revalidatePath("/admin/products");
    return results;
}
