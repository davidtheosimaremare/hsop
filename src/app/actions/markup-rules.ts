"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { calculateMarkedUpPrice } from "@/lib/markup-utils";

export type MarkupType = "PERCENTAGE" | "FIXED_ADDITION";
export type RuleType = "BRAND" | "CATEGORY";

export interface MarkupRulePayload {
    type: RuleType;
    targetValue: string;
    markupType: MarkupType;
    markupValue: number;
}

export async function getMarkupRules() {
    try {
        const rules = await db.priceMarkupRule.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, rules };
    } catch (error) {
        console.error("Failed to get markup rules:", error);
        return { success: false, rules: [] };
    }
}

export async function createMarkupRule(data: MarkupRulePayload) {
    try {
        // Convert to uppercase for standard comparison if it's a BRAND
        const targetValue = data.type === "BRAND" ? data.targetValue.toUpperCase() : data.targetValue;

        const rule = await db.priceMarkupRule.upsert({
            where: {
                type_targetValue: {
                    type: data.type,
                    targetValue: targetValue
                }
            },
            update: {
                markupType: data.markupType,
                markupValue: data.markupValue
            },
            create: {
                type: data.type,
                targetValue: targetValue,
                markupType: data.markupType,
                markupValue: data.markupValue
            }
        });

        revalidatePath("/admin/products/markup-rules");
        return { success: true, rule };
    } catch (error) {
        console.error("Failed to create markup rule:", error);
        return { success: false, error: "Gagal menyimpan aturan markup." };
    }
}

export async function deleteMarkupRule(id: string) {
    try {
        await db.priceMarkupRule.delete({
            where: { id }
        });
        revalidatePath("/admin/products/markup-rules");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete markup rule:", error);
        return { success: false, error: "Gagal menghapus aturan markup." };
    }
}

/**
 * Apply markup rules to ALL products immediately
 */
export async function applyAllMarkupRules() {
    try {
        console.log("Applying all markup rules...");
        const rules = await db.priceMarkupRule.findMany();
        
        // Fetch products that have basePrice
        const products = await db.product.findMany({
            where: { basePrice: { gt: 0 } },
            select: { id: true, basePrice: true, brand: true, category: true, price: true }
        });

        console.log(`Found ${products.length} products to evaluate.`);
        let updatedCount = 0;

        for (const p of products) {
            if (p.basePrice) {
                const newPrice = calculateMarkedUpPrice(p.basePrice, p.brand, p.category, rules);
                
                // Only update if there's a difference
                if (Math.abs(newPrice - p.price) > 0.01) {
                    await db.product.update({
                        where: { id: p.id },
                        data: { price: newPrice }
                    });
                    updatedCount++;
                }
            }
        }

        console.log(`Successfully updated prices for ${updatedCount} products based on rules.`);
        revalidatePath("/");
        revalidatePath("/admin/products");
        return { success: true, updatedCount };

    } catch (error) {
        console.error("Failed to apply all markup rules:", error);
        return { success: false, error: "Gagal menerapkan aturan markup secara massal." };
    }
}
