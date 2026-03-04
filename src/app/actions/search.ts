"use server";

import { db } from "@/lib/db";

export interface QuickSearchResult {
    id: string;
    name: string;
    sku: string;
    brand: string | null;
    image: string | null;
    price: number;
}

export async function quickSearch(query: string): Promise<QuickSearchResult[]> {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const terms = query.trim().split(/\s+/).filter(Boolean);

    const hiddenCategories = await db.category.findMany({
        where: { isVisible: false },
        select: { name: true }
    });
    const hiddenCategoryNames = hiddenCategories.map(c => c.name);

    const products = await db.product.findMany({
        where: {
            isVisible: true,
            category: hiddenCategoryNames.length > 0 ? { notIn: hiddenCategoryNames } : undefined,
            AND: terms.map(term => ({
                OR: [
                    { name: { contains: term, mode: "insensitive" } },
                    { sku: { contains: term, mode: "insensitive" } },
                ]
            }))
        },
        select: {
            id: true,
            name: true,
            sku: true,
            brand: true,
            image: true,
            price: true,
        },
        take: 6,
        orderBy: { name: "asc" },
    });

    return products;
}
