"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { calculateMarkedUpPrice } from "@/lib/markup-utils";
import { getSiteSetting, updateSiteSetting } from "@/app/actions/settings";
import { MarkupExemptionRule, DEFAULT_MARKUP_EXEMPTIONS, isProductExemptFromMarkup } from "@/lib/pricing";

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
            select: { id: true, sku: true, basePrice: true, brand: true, category: true, price: true }
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

/**
 * Clear all local markup rules and reset all product prices to 100% match Accurate basePrice
 */
export async function clearAllMarkupRulesAndResetPrices() {
    try {
        console.log("Clearing all markup rules and resetting prices to Accurate basePrice...");
        await db.priceMarkupRule.deleteMany({});

        const products = await db.product.findMany({
            where: { basePrice: { gt: 0 } },
            select: { id: true, basePrice: true, price: true }
        });

        let updatedCount = 0;
        for (const p of products) {
            if (p.basePrice && Math.abs(p.basePrice - p.price) > 0.01) {
                await db.product.update({
                    where: { id: p.id },
                    data: { price: p.basePrice }
                });
                updatedCount++;
            }
        }

        revalidatePath("/");
        revalidatePath("/admin/products");
        revalidatePath("/admin/products/markup-rules");
        return { success: true, updatedCount };
    } catch (error) {
        console.error("Failed to clear markup rules and reset prices:", error);
        return { success: false, error: "Gagal mereset aturan markup." };
    }
}

// ─── MARKUP EXEMPTIONS (Pengecualian Kenaikan Harga) ──────────────────────────

const SETTING_KEY_EXEMPTIONS = "markup_exemption_rules";

/**
 * Ambil semua aturan pengecualian markup dari SiteSetting.
 * Jika belum ada di database, default aturan untuk Siemens MCCB 3VJ1 akan otomatis diberikan.
 */
export async function getMarkupExemptionRules(): Promise<MarkupExemptionRule[]> {
    try {
        const raw = await getSiteSetting(SETTING_KEY_EXEMPTIONS);
        if (Array.isArray(raw) && raw.length > 0) {
            return (raw as unknown) as MarkupExemptionRule[];
        }
        return DEFAULT_MARKUP_EXEMPTIONS;
    } catch (error) {
        console.error("Failed to get markup exemption rules:", error);
        return DEFAULT_MARKUP_EXEMPTIONS;
    }
}

/**
 * Simpan atau perbarui satu aturan pengecualian.
 */
export async function saveMarkupExemptionRule(ruleData: Omit<MarkupExemptionRule, "id"> & { id?: string }) {
    try {
        const currentRules = await getMarkupExemptionRules();
        let updatedRules: MarkupExemptionRule[];

        if (ruleData.id) {
            // Update existing
            updatedRules = currentRules.map((r) =>
                r.id === ruleData.id
                    ? {
                          ...r,
                          name: ruleData.name,
                          skuPrefix: ruleData.skuPrefix?.trim() || undefined,
                          skuPattern: ruleData.skuPattern?.trim() || undefined,
                          descriptionPrefix: ruleData.descriptionPrefix?.trim() || undefined,
                          category: ruleData.category?.trim() || undefined,
                          brand: ruleData.brand?.trim() || undefined,
                          isActive: ruleData.isActive,
                          note: ruleData.note?.trim() || undefined,
                      }
                    : r
            );
        } else {
            // Create new
            const newRule: MarkupExemptionRule = {
                id: `exemption-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: ruleData.name.trim(),
                skuPrefix: ruleData.skuPrefix?.trim() || undefined,
                skuPattern: ruleData.skuPattern?.trim() || undefined,
                descriptionPrefix: ruleData.descriptionPrefix?.trim() || undefined,
                category: ruleData.category?.trim() || undefined,
                brand: ruleData.brand?.trim() || undefined,
                isActive: ruleData.isActive ?? true,
                note: ruleData.note?.trim() || undefined,
                createdAt: new Date().toISOString(),
            };
            updatedRules = [...currentRules, newRule];
        }

        const res = await updateSiteSetting(SETTING_KEY_EXEMPTIONS, updatedRules);
        if (!res.success) throw new Error(res.error);

        revalidatePath("/admin/products/markup-rules");
        revalidatePath("/");
        revalidatePath("/pencarian");
        revalidatePath("/kategori", "layout");
        revalidatePath("/pesanan-besar");
        return { success: true, rules: updatedRules };
    } catch (error: any) {
        console.error("Failed to save markup exemption rule:", error);
        return { success: false, error: error.message || "Gagal menyimpan aturan pengecualian." };
    }
}

/**
 * Toggle status aktif/non-aktif aturan pengecualian.
 */
export async function toggleMarkupExemptionRule(id: string, isActive: boolean) {
    try {
        const currentRules = await getMarkupExemptionRules();
        const updatedRules = currentRules.map((r) =>
            r.id === id ? { ...r, isActive } : r
        );

        const res = await updateSiteSetting(SETTING_KEY_EXEMPTIONS, updatedRules);
        if (!res.success) throw new Error(res.error);

        revalidatePath("/admin/products/markup-rules");
        revalidatePath("/");
        revalidatePath("/pencarian");
        revalidatePath("/kategori", "layout");
        revalidatePath("/pesanan-besar");
        return { success: true, rules: updatedRules };
    } catch (error: any) {
        console.error("Failed to toggle markup exemption rule:", error);
        return { success: false, error: error.message || "Gagal mengubah status aturan." };
    }
}

/**
 * Hapus aturan pengecualian berdasarkan ID.
 */
export async function deleteMarkupExemptionRule(id: string) {
    try {
        const currentRules = await getMarkupExemptionRules();
        const updatedRules = currentRules.filter((r) => r.id !== id);

        const res = await updateSiteSetting(SETTING_KEY_EXEMPTIONS, updatedRules);
        if (!res.success) throw new Error(res.error);

        revalidatePath("/admin/products/markup-rules");
        revalidatePath("/");
        revalidatePath("/pencarian");
        revalidatePath("/kategori", "layout");
        revalidatePath("/pesanan-besar");
        return { success: true, rules: updatedRules };
    } catch (error: any) {
        console.error("Failed to delete markup exemption rule:", error);
        return { success: false, error: error.message || "Gagal menghapus aturan pengecualian." };
    }
}

/**
 * Menghitung dan melihat preview produk yang terdampak oleh aturan pengecualian.
 */
export async function previewExemptedProducts(criteria?: {
    skuPrefix?: string;
    skuPattern?: string;
    descriptionPrefix?: string;
    category?: string;
    brand?: string;
}) {
    try {
        const whereClause: any = {
            status: "APPROVED",
        };

        if (criteria?.skuPrefix && criteria.skuPrefix.trim()) {
            whereClause.sku = { startsWith: criteria.skuPrefix.trim(), mode: "insensitive" };
        }
        if (criteria?.descriptionPrefix && criteria.descriptionPrefix.trim()) {
            whereClause.OR = [
                { name: { contains: criteria.descriptionPrefix.trim(), mode: "insensitive" } },
                { description: { contains: criteria.descriptionPrefix.trim(), mode: "insensitive" } },
            ];
        }
        if (criteria?.category && criteria.category.trim()) {
            whereClause.category = { equals: criteria.category.trim(), mode: "insensitive" };
        }
        if (criteria?.brand && criteria.brand.trim()) {
            whereClause.brand = { contains: criteria.brand.trim(), mode: "insensitive" };
        }

        const candidateProducts = await db.product.findMany({
            where: whereClause,
            select: {
                id: true,
                sku: true,
                name: true,
                category: true,
                brand: true,
                price: true,
                availableToSell: true,
            },
            orderBy: { sku: "asc" },
        });

        const ruleToTest: MarkupExemptionRule = {
            id: "test",
            name: "Test",
            skuPrefix: criteria?.skuPrefix,
            skuPattern: criteria?.skuPattern,
            descriptionPrefix: criteria?.descriptionPrefix,
            category: criteria?.category,
            brand: criteria?.brand,
            isActive: true,
        };

        const filteredProducts = candidateProducts.filter((p) =>
            isProductExemptFromMarkup(p.sku, p.name, p.category, p.brand, [ruleToTest])
        );

        const totalCount = filteredProducts.length;
        const sampleProducts = filteredProducts.slice(0, 50);

        // Ambil pemetaan kategori saat ini
        const categoryMappings = await db.categoryMapping.findMany();

        return {
            success: true,
            totalCount,
            products: sampleProducts.map((p) => {
                const mapping = categoryMappings.find(
                    (m) => m.categoryName.trim().toLowerCase() === (p.category || "").trim().toLowerCase()
                );
                return {
                    ...p,
                    categoryGroup: mapping?.discountType || null,
                    normalMarkupPct: (mapping?.discountType === "LP" || mapping?.discountType === "CP") ? 4.545 : 0,
                };
            }),
        };
    } catch (error: any) {
        console.error("Failed to preview exempted products:", error);
        return { success: false, totalCount: 0, products: [] };
    }
}


