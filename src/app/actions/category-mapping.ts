"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type CategoryMappingData = {
    categoryName: string;
    discountType: string | null;
};

/**
 * Get all unique categories from products
 */
export async function getAllCategories() {
    const categories = await db.product.findMany({
        where: { category: { not: null } },
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
    });
    return categories.map((c) => c.category!).filter(Boolean);
}

/**
 * Get all category mappings
 */
export async function getCategoryMappings() {
    return db.categoryMapping.findMany({
        orderBy: { categoryName: "asc" },
    });
}

/**
 * Update or create a category mapping
 */
export async function updateCategoryMapping(categoryName: string, discountType: string | null) {
    try {
        if (!discountType) {
            // Remove mapping if no discount type
            await db.categoryMapping.deleteMany({
                where: { categoryName },
            });
        } else {
            await db.categoryMapping.upsert({
                where: { categoryName },
                update: { discountType },
                create: { categoryName, discountType },
            });
        }
        revalidatePath("/admin/products/categories");
        return { success: true };
    } catch (error) {
        console.error("Failed to update category mapping:", error);
        return { success: false };
    }
}

/**
 * Get discount type for a specific category
 */
export async function getDiscountTypeForCategory(categoryName: string): Promise<string | null> {
    const mapping = await db.categoryMapping.findUnique({
        where: { categoryName },
    });
    return mapping?.discountType || null;
}

/**
 * Bulk update category mappings
 */
export async function bulkUpdateCategoryMappings(mappings: CategoryMappingData[]) {
    try {
        for (const mapping of mappings) {
            if (mapping.discountType) {
                await db.categoryMapping.upsert({
                    where: { categoryName: mapping.categoryName },
                    update: { discountType: mapping.discountType },
                    create: { categoryName: mapping.categoryName, discountType: mapping.discountType },
                });
            } else {
                await db.categoryMapping.deleteMany({
                    where: { categoryName: mapping.categoryName },
                });
            }
        }
        revalidatePath("/admin/products/categories");
        return { success: true };
    } catch (error) {
        console.error("Failed to bulk update category mappings:", error);
        return { success: false };
    }
}
