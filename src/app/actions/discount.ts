"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getDiscountRules() {
    try {
        const rules = await db.discountRule.findMany({
            orderBy: { categoryGroup: 'asc' }
        });
        return rules;
    } catch (error) {
        console.error("Failed to fetch discount rules:", error);
        return [];
    }
}

export async function saveDiscountRule(data: {
    categoryGroup: string;
    description: string;
    stockDiscount: string;
    indentDiscount: string;
}) {
    try {
        await db.discountRule.upsert({
            where: { categoryGroup: data.categoryGroup },
            update: {
                description: data.description,
                stockDiscount: data.stockDiscount,
                indentDiscount: data.indentDiscount,
            },
            create: {
                categoryGroup: data.categoryGroup,
                description: data.description,
                stockDiscount: data.stockDiscount,
                indentDiscount: data.indentDiscount,
            }
        });
        revalidatePath("/admin/settings/discounts");

        // Revalidate public pages where prices are shown
        revalidatePath("/");
        revalidatePath("/pencarian");

        return { success: true };
    } catch (error) {
        console.error("Failed to save discount rule:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to save rule" };
    }
}

export async function getDistinctCategories() {
    try {
        const categories = await db.product.findMany({
            select: { category: true },
            distinct: ['category'],
            where: { category: { not: null } }
        });
        return categories.map(c => c.category).filter(Boolean) as string[];
    } catch (error) {
        console.error("Failed to fetch distinct categories:", error);
        return [];
    }
}
