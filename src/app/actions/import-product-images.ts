"use server";

import { db } from "@/lib/db";
import { saveImageFromUrl } from "@/app/actions/upload";
import { revalidatePath } from "next/cache";

interface ImportItem {
    sku: string;
    imageUrl: string;
}

export async function importProductImageBatchAction(items: ImportItem[]) {
    try {
        if (!items || items.length === 0) {
            return { success: true, processed: 0, failed: 0, errors: [] };
        }

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (const item of items) {
            const { sku, imageUrl } = item;

            if (!sku || !imageUrl) continue;

            try {
                // 1. Check if product exists
                const product = await db.product.findFirst({
                    where: { sku: sku }
                });

                if (!product) {
                    failCount++;
                    errors.push(`SKU ${sku}: Not found`);
                    continue;
                }

                // Format filename: (katapertama-{sku}) 
                // Getting first word from title
                const firstWord = product.name.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "product";
                const customPrefix = `${firstWord}-${sku}`;

                // 2. Download and Save Image to MinIO
                const saveResult = await saveImageFromUrl(imageUrl, customPrefix, "products");

                if (saveResult.success && saveResult.url) {
                    // 3. Update Product
                    await db.product.update({
                        where: { id: product.id },
                        data: { image: saveResult.url }
                    });
                    successCount++;
                } else {
                    failCount++;
                    errors.push(`SKU ${sku}: ${saveResult.error}`);
                }

            } catch (err: any) {
                failCount++;
                errors.push(`SKU ${sku}: System error (${err.message})`);
            }
        }

        revalidatePath("/admin/products");

        return {
            success: true,
            processed: successCount,
            failed: failCount,
            errors: errors
        };

    } catch (error) {
        console.error("Batch Import failed:", error);
        return { success: false, message: "Failed to process batch." };
    }
}
