"use server";

import { db } from "@/lib/db";
import { fetchAllProducts, updateAccurateItemBrand } from "@/lib/accurate";
import { revalidatePath } from "next/cache";

export interface BrandSyncItem {
    sku: string;
    name: string;
    accurateId: number | null;
    accurateBrandName: string | null;
    accurateBrandId: number | null;
    localBrandName: string | null;
    recommendedBrandName: string;
    recommendedBrandId: number;
    status: 'SAME' | 'DIFFERENT';
}

export interface SyncBrandResult {
    sku: string;
    success: boolean;
    message: string;
}

/**
 * Get all local brands that have an accurateId
 */
export async function getSyncableBrands() {
    try {
        return await db.brand.findMany({
            where: {
                accurateId: {
                    not: null
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
    } catch (error) {
        console.error("Failed to fetch syncable brands:", error);
        return [];
    }
}

/**
 * Fetch and compare product brands from Accurate vs our target brand.
 * Finds all products in Accurate that match target brand name prefix (e.g. starts with "SIEMENS")
 * and determines if their accurate itemBrand is correctly assigned.
 */
export async function compareBrandsForSync(targetBrandName: string, targetBrandAccurateId: number): Promise<BrandSyncItem[]> {
    try {
        const uppercaseTargetName = targetBrandName.toUpperCase();
        
        // 1. Fetch all products from Accurate
        const accurateProducts = await fetchAllProducts();

        // 2. Filter products that match target brand prefix in name, sku, or are already classified in local DB as this brand
        // We also load matching products from our local DB to read current local brand values
        const localProducts = await db.product.findMany({
            where: {
                OR: [
                    { brand: { equals: uppercaseTargetName, mode: 'insensitive' } },
                    { name: { startsWith: uppercaseTargetName, mode: 'insensitive' } },
                    { sku: { startsWith: uppercaseTargetName, mode: 'insensitive' } }
                ]
            },
            select: {
                sku: true,
                brand: true
            }
        });

        const localProductsMap = new Map(localProducts.map(p => [p.sku.toUpperCase(), p]));

        // Match Accurate products against criteria
        const filteredAccurate = accurateProducts.filter(p => {
            const skuUpper = p.no.toUpperCase();
            const nameUpper = p.name.toUpperCase();
            const localProduct = localProductsMap.get(skuUpper);

            // True if:
            // - Name starts with the target name (e.g. "SIEMENS ") or has it as prefix
            // - SKU starts with target name (e.g. "SIEMENS-")
            // - Local DB already has this product assigned to target brand
            const isNamePrefix = nameUpper.startsWith(uppercaseTargetName);
            const isSkuPrefix = skuUpper.startsWith(uppercaseTargetName);
            const isLocalAssigned = localProduct?.brand?.toUpperCase() === uppercaseTargetName;

            return isNamePrefix || isSkuPrefix || isLocalAssigned;
        });

        // Map into BrandSyncItem list
        return filteredAccurate.map(p => {
            const skuUpper = p.no.toUpperCase();
            const localProduct = localProductsMap.get(skuUpper);
            
            const accBrandId = p.itemBrand?.id || null;
            const accBrandName = p.itemBrand?.name || null;
            const locBrandName = localProduct?.brand || null;

            const isSame = accBrandId === targetBrandAccurateId;

            return {
                sku: p.no,
                name: p.name,
                accurateId: p.id,
                accurateBrandName: accBrandName,
                accurateBrandId: accBrandId,
                localBrandName: locBrandName,
                recommendedBrandName: uppercaseTargetName,
                recommendedBrandId: targetBrandAccurateId,
                status: isSame ? ('SAME' as const) : ('DIFFERENT' as const)
            };
        });

    } catch (error) {
        console.error("Error comparing brand lists:", error);
        return [];
    }
}

/**
 * Update product brands in Accurate and the local database.
 */
export async function updateAccurateBrands(
    items: { sku: string; accurateId: number | null; targetBrandId: number; targetBrandName: string }[]
): Promise<SyncBrandResult[]> {
    if (!items || items.length === 0) return [];

    const results: SyncBrandResult[] = [];

    for (const item of items) {
        try {
            // 1. Sync to Accurate first
            const syncRes = await updateAccurateItemBrand(item.sku, item.accurateId, item.targetBrandId, item.targetBrandName);

            if (syncRes.success) {
                // 2. If accurate sync succeeds, update local product database brand as well
                await db.product.updateMany({
                    where: { sku: item.sku },
                    data: { brand: item.targetBrandName.toUpperCase() }
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
                    message: syncRes.message || "Gagal update brand di Accurate"
                });
            }
        } catch (err: any) {
            console.error(`Error syncing brand for SKU ${item.sku}:`, err);
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
