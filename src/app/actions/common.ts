"use server";

import { db } from "@/lib/db";

export async function getGroupedCategoryMappings() {
    const mappings = await db.categoryMapping.findMany();

    // Group by discountType
    const grouped = {
        LP: [] as string[],
        CP: [] as string[],
        LIGHTING: [] as string[]
    };

    mappings.forEach(m => {
        if (m.discountType === "LP") grouped.LP.push(m.categoryName);
        else if (m.discountType === "CP") grouped.CP.push(m.categoryName);
        else if (m.discountType === "LIGHTING") grouped.LIGHTING.push(m.categoryName);
    });

    return grouped;
}
