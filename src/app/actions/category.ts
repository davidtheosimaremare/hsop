"use server";

import { db } from "@/lib/db";
import { fetchAllItemCategories, AccurateItemCategory } from "@/lib/accurate";
import { revalidatePath } from "next/cache";

export async function syncCategoriesFromAccurateAction() {
    try {
        const accurateCategories = await fetchAllItemCategories();

        let count = 0;
        const accurateIdToDbId = new Map<number, string>();

        // 1. First Pass: Upsert all categories (ignoring parent for now)
        for (const cat of accurateCategories) {
            const upserted = await db.category.upsert({
                where: { accurateId: cat.id },
                update: {
                    name: cat.name,
                    // If image is missing in DB, we could try to fetch it? Accurate cat doesn't have image URL usually.
                },
                create: {
                    name: cat.name,
                    accurateId: cat.id,
                    isVisible: true,
                    order: 0 // Default order
                }
            });
            accurateIdToDbId.set(cat.id, upserted.id);
            count++;
        }

        // 2. Second Pass: Update Parent Relationships
        for (const cat of accurateCategories) {
            if (cat.parent && cat.parent.id) {
                const dbId = accurateIdToDbId.get(cat.id);
                const parentDbId = accurateIdToDbId.get(cat.parent.id);

                if (dbId && parentDbId) {
                    await db.category.update({
                        where: { id: dbId },
                        data: { parentId: parentDbId }
                    });
                }
            } else {
                // Ensure no parent if Accurate says no parent (in case it was moved to root)
                const dbId = accurateIdToDbId.get(cat.id);
                if (dbId) {
                    // Check if currently has parent, if so remove it?
                    // Optional but good for consistency.
                    // Doing update always is safe but potentially slow if many cats.
                    // For now, let's assume if cat.parent is null, we set parentId to null.
                    await db.category.update({
                        where: { id: dbId },
                        data: { parentId: null }
                    });
                }
            }
        }

        revalidatePath("/admin/settings/categories");
        revalidatePath("/admin/products/categories");

        // Return success with count
        return { success: true, count };

    } catch (error: any) {
        console.error("Sync Categories Error:", error);
        return { success: false, error: error.message || "Gagal sinkronisasi kategori." };
    }
}
