"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface ImportItem {
    sku: string;
    description: string;
}

export async function importProductDescriptionBatchAction(items: ImportItem[]) {
    try {
        if (!items || items.length === 0) {
            return { success: true, processed: 0, failed: 0, errors: [] };
        }

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (const item of items) {
            const { sku, description } = item;

            if (!sku) continue;

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

                // 2. Update Product Description
                await db.product.update({
                    where: { id: product.id },
                    data: { description: description }
                });
                successCount++;

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
