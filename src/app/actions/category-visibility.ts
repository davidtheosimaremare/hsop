"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleCategoryVisibility(categoryId: string, isVisible: boolean) {
    try {
        await db.category.update({
            where: { id: categoryId },
            data: { isVisible },
        });

        // Revalidate public products pages and category menu
        revalidatePath("/");
        revalidatePath("/admin/products/hidden-categories");
        revalidatePath("/admin/products");

        return { success: true, message: `Kategori berhasil ${isVisible ? 'ditampilkan' : 'disembunyikan'}.` };
    } catch (error) {
        console.error("[CATEGORY_VISIBILITY_ERROR]", error);
        return { success: false, message: "Gagal mengubah visibilitas kategori." };
    }
}
