"use server";

import { db } from "@/lib/db";
import { fetchAllProducts } from "@/lib/accurate";
import { revalidatePath } from "next/cache";

export async function syncProductsAction() {
    try {
        console.log("Starting product sync...");
        const accurateProducts = await fetchAllProducts();
        console.log(`Fetched ${accurateProducts.length} products from Accurate.`);

        let syncedCount = 0;
        let errorCount = 0;

        for (const ap of accurateProducts) {
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
            } catch (err) {
                console.error(`Failed to sync product ${ap.no}:`, err);
                errorCount++;
            }
        }

        revalidatePath("/admin/products");
        return {
            success: true,
            message: `Sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`
        };

    } catch (error) {
        console.error("Sync failed:", error);
        return { success: false, message: "Failed to sync products." };
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
