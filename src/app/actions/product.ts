"use server";

import { db } from "@/lib/db";
import { fetchAllProducts } from "@/lib/accurate";
import { revalidatePath } from "next/cache";

export async function syncProductsAction() {
    try {
        console.log("Starting product sync...");
        const accurateProducts = await fetchAllProducts();
        console.log(`Fetched ${accurateProducts.length} products from Accurate.`);

        // 1. Check for duplicates in the source data
        const idSet = new Set<number>();
        const skuToIdMap = new Map<string, number>();
        const duplicateIds: number[] = [];
        const duplicateSkus: string[] = [];

        for (const p of accurateProducts) {
            // Check for ID duplication (pagination artifact)
            if (idSet.has(p.id)) {
                // Silently track or ignore, don't warn user about API artifacts
                duplicateIds.push(p.id);
                continue;
            }
            idSet.add(p.id);

            // Check for SKU duplication (Real data issue: different IDs, same SKU)
            if (skuToIdMap.has(p.no)) {
                const existingId = skuToIdMap.get(p.no);
                if (existingId !== p.id) {
                    duplicateSkus.push(`${p.no} (IDs: ${existingId} & ${p.id})`);
                }
            } else {
                skuToIdMap.set(p.no, p.id);
            }
        }

        if (duplicateIds.length > 0) {
            console.log(`Info: ${duplicateIds.length} duplicate IDs found (likely pagination overlap). Auto-deduplicated.`);
        }
        if (duplicateSkus.length > 0) {
            console.warn("WARNING: Genuine Duplicate SKUs found (Different IDs):", duplicateSkus);
        }

        let syncedCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Deduplicate products based on accurateId
        const uniqueProducts = new Map();
        for (const p of accurateProducts) {
            if (!uniqueProducts.has(p.id)) {
                uniqueProducts.set(p.id, p);
            }
        }
        const productsToSync = Array.from(uniqueProducts.values());

        for (const ap of productsToSync) {
            try {
                // Determine stock (default to 0 if missing)
                const stock = ap.availableToSell || 0;

                // Determine category name
                const category = ap.itemCategory?.name || "Uncategorized";
                // Determine brand name
                const brand = ap.itemBrand?.name || null;

                await db.product.upsert({
                    where: { accurateId: ap.id }, // Use accurateId as unique identifier for sync
                    update: {
                        name: ap.name,
                        sku: ap.no,
                        price: ap.unitPrice || 0,
                        availableToSell: stock,
                        brand: brand,
                        category: category,
                        itemType: ap.itemType,
                        // Do NOT update isVisible on sync, preserve manual setting
                    },
                    create: {
                        accurateId: ap.id,
                        sku: ap.no, // Assuming 'no' is SKU
                        name: ap.name,
                        price: ap.unitPrice || 0,
                        availableToSell: stock,
                        brand: brand,
                        category: category,
                        itemType: ap.itemType,
                        description: `Imported from Accurate (${ap.itemType})`,
                        isVisible: true, // Default new items to visible
                    }
                });
                syncedCount++;
            } catch (err: any) {
                console.error(`Failed to sync product ${ap.no} (ID: ${ap.id}):`, err);
                errorCount++;
                errors.push(`${ap.no}: ${err.message}`);
            }
        }

        revalidatePath("/admin/products");

        // Construct detailed message
        let msg = `Sync complete. Fetched: ${accurateProducts.length}, Unique: ${productsToSync.length}, Synced: ${syncedCount}, Errors: ${errorCount}`;
        if (duplicateIds.length > 0) msg += `. Dupe IDs ignored: ${duplicateIds.length}`;
        if (duplicateSkus.length > 0) msg += `. Dupe SKUs: ${duplicateSkus.join(", ")}`;
        if (errors.length > 0) msg += `. First Error: ${errors[0]}`;

        return {
            success: true,
            message: msg
        };

    } catch (error) {
        console.error("Sync failed:", error);
        return { success: false, message: "Failed to sync products." };
    }
}

/**
 * Sync a single product by its item number (no)
 * Used by webhooks for real-time updates
 */
export async function syncSingleProductAction(itemNo: string) {
    try {
        console.log(`Syncing single product: ${itemNo}`);
        const accurateProducts = await fetchAllProducts(); // Still fetching all for now, but will filter
        const ap = accurateProducts.find(p => p.no === itemNo);

        if (!ap) {
            console.error(`Product ${itemNo} not found in Accurate during sync.`);
            return { success: false, message: `Product ${itemNo} not found.` };
        }

        const stock = ap.availableToSell || 0;
        const category = ap.itemCategory?.name || "Uncategorized";
        const brand = ap.itemBrand?.name || null;

        await db.product.upsert({
            where: { accurateId: ap.id },
            update: {
                name: ap.name,
                sku: ap.no,
                price: ap.unitPrice || 0,
                availableToSell: stock,
                brand: brand,
                category: category,
                itemType: ap.itemType,
            },
            create: {
                accurateId: ap.id,
                sku: ap.no,
                name: ap.name,
                price: ap.unitPrice || 0,
                availableToSell: stock,
                brand: brand,
                category: category,
                itemType: ap.itemType,
                description: `Imported from Accurate (${ap.itemType})`,
                isVisible: true,
            }
        });

        // revalidatePath moved to caller (processQueueAction)

        return { success: true, message: `Synced ${itemNo}` };
    } catch (error: any) {
        console.error(`Failed to sync product ${itemNo}:`, error);
        return { success: false, message: error.message };
    }
}
export async function syncStockOnlyAction() {
    try {
        console.log("Starting stock-only sync...");
        const accurateProducts = await fetchAllProducts();
        console.log(`Fetched ${accurateProducts.length} products from Accurate for stock sync.`);

        let updatedCount = 0;
        let errorCount = 0;

        // Batch update for efficiency
        for (const ap of accurateProducts) {
            try {
                const stock = ap.availableToSell || 0;

                // Only update if product exists (by accurateId or sku)
                const updated = await db.product.updateMany({
                    where: {
                        OR: [
                            { accurateId: ap.id },
                            { sku: ap.no }
                        ]
                    },
                    data: { availableToSell: stock }
                });

                if (updated.count > 0) updatedCount++;
            } catch (err) {
                errorCount++;
            }
        }

        revalidatePath("/admin/products");
        revalidatePath("/pencarian");

        const timestamp = new Date().toLocaleString("id-ID");
        return {
            success: true,
            message: `Stock sync complete at ${timestamp}. Updated: ${updatedCount}, Errors: ${errorCount}`
        };

    } catch (error) {
        console.error("Stock sync failed:", error);
        return { success: false, message: "Failed to sync stock." };
    }
}

export async function toggleProductVisibility(id: string, isVisible: boolean) {
    try {
        await db.product.update({
            where: { id },
            data: { isVisible },
        });
        revalidatePath("/admin/products");
        revalidatePath(`/admin/products/${id}`);
        revalidatePath("/pencarian"); // Update public search pages
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle visibility:", error);
        return { success: false, error: "Failed to update visibility" };
    }
}

export async function updateProductDetails(
    id: string,
    data: {
        description?: string;
        specifications?: Record<string, string>;
        datasheet?: string;
        image?: string;
        brand?: string;
    }
) {
    try {
        await db.product.update({
            where: { id },
            data: {
                ...data,
                // Ensure specifications is stored as proper JSON
                specifications: data.specifications as any,
            },
        });

        revalidatePath("/admin/products");
        revalidatePath(`/admin/products/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update product details:", error);
        return { success: false, error: "Failed to update details" };
    }
}

export async function getProductExportData(filters: {
    query?: string;
    brand?: string;
    category?: string;
    stockStatus?: string;
}) {
    try {
        const { query, brand, category, stockStatus } = filters;
        // const Prisma = await import("@prisma/client").then(m => m.Prisma);

        const where: any = {};

        if (query) {
            const terms = query.split(/\s+/).filter(Boolean);
            if (terms.length > 0) {
                where.AND = terms.map((term: string) => ({
                    OR: [
                        { name: { contains: term, mode: "insensitive" } },
                        { sku: { contains: term, mode: "insensitive" } },
                    ]
                }));
            }
        }
        if (brand && brand !== "all") {
            where.brand = brand;
        }
        if (category && category !== "all") {
            where.category = category;
        }
        if (stockStatus === "available") {
            where.availableToSell = { gt: 0 };
        } else if (stockStatus === "out_of_stock") {
            where.availableToSell = { lte: 0 };
        }

        const products = await db.product.findMany({
            where,
            orderBy: { name: "asc" },
            select: {
                sku: true,
                name: true,
                brand: true,
                category: true,
                itemType: true,
                availableToSell: true,
                price: true,
                description: true,
                isVisible: true,
                createdAt: true,
            }
        });

        // Format for Excel
        return products.map(p => ({
            "SKU": p.sku,
            "Nama Produk": p.name,
            "Merk": p.brand || "-",
            "Kategori": p.category || "-",
            "Tipe": p.itemType || "-",
            "Stok": "Cek Online", // Placeholder
            "Harga": p.price,
            "Deskripsi": p.description || "-",
            "Status": p.isVisible ? "Aktif" : "Sembunyi",
            "Terdaftar": p.createdAt.toISOString().split("T")[0],
        }));

    } catch (error) {
        console.error("Failed to fetch export data:", error);
        throw new Error("Failed to fetch data for export");
    }
}

/**
 * Update the discount category for a product
 * Categories: "LP" (Low Voltage), "CP" (Control Product), "LIGHTING" (Portable Lighting), or null
 */
export async function updateProductDiscountCategory(productId: string, category: string | null) {
    try {
        await db.product.update({
            where: { id: productId },
            // data: { discountCategory: category }
            data: {}
        });
        revalidatePath(`/admin/products/${productId}`);
        revalidatePath("/admin/products");
        return { success: true };
    } catch (error) {
        console.error("Failed to update discount category:", error);
        return { success: false };
    }
}

/**
 * Bulk update discount category for multiple products
 */
export async function bulkUpdateDiscountCategory(productIds: string[], category: string | null) {
    try {
        await db.product.updateMany({
            where: { id: { in: productIds } },
            // data: { discountCategory: category }
            data: {}
        });
        revalidatePath("/admin/products");
        return { success: true, count: productIds.length };
    } catch (error) {
        console.error("Failed to bulk update discount category:", error);
        return { success: false, count: 0 };
    }
}
