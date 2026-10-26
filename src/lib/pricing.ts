import type { DiscountRule, CategoryMapping as PrismaCategoryMapping } from "@prisma/client";

export type CategoryMapping = PrismaCategoryMapping;

export interface CustomerDiscount {
    discount1: number;
    discount2: number;
    discountCP: string; // "0" or "10+5" etc
    discountCPIndent?: string;
    discountLP: string;
    discountLPIndent?: string;
    discountLighting: string;
    discountLightingIndent?: string;
}

export interface HidePriceRules {
    brands: string[];
    categories: string[];
    contactPhone: string;
}

export interface PriceInfo {
    originalPrice: number;
    originalPriceWithPPN: number;
    discountedPrice: number;
    discountedPriceWithPPN: number;
    hasDiscount: boolean;
    isCustomerDiscount: boolean;
    discounts: number[];
    discountStr?: string;
    ruleName: string | null;
    isHidden: boolean;
    contactPhone: string | null;
    isMarkedUp?: boolean;
    markupPercent?: number;
    isMarkupExempt?: boolean;
}

export interface MarkupExemptionRule {
    id: string;
    name: string;
    skuPrefix?: string;
    skuPattern?: string; // e.g. "3DB, 5DB, 7DB"
    descriptionPrefix?: string;
    category?: string;
    brand?: string;
    isActive: boolean;
    note?: string;
    createdAt?: string;
}

export const DEFAULT_MARKUP_EXEMPTIONS: MarkupExemptionRule[] = [
    {
        id: "exemption-siemens-mccb-3vj1",
        name: "Siemens MCCB 3VJ1 (3DB, 5DB, 7DB)",
        skuPrefix: "3VJ1",
        skuPattern: "3DB, 5DB, 7DB",
        descriptionPrefix: "Siemens MCCB",
        category: "MCCB",
        brand: "SIEMENS",
        isActive: true,
        note: "Produk Siemens MCCB dengan kode 3VJ1 yang diikuti 3DB, 5DB, dan 7DB dikecualikan dari kenaikan harga 5%",
        createdAt: "2026-10-26T00:00:00.000Z",
    },
];

/**
 * Memeriksa apakah produk dikecualikan dari kenaikan harga kategori (misal: Siemens MCCB 3VJ1 dengan kode 3DB, 5DB, 7DB tidak naik 5%)
 */
export function isProductExemptFromMarkup(
    sku?: string | null,
    name?: string | null,
    category?: string | null,
    brand?: string | null,
    exemptionRules?: MarkupExemptionRule[] | null
): boolean {
    const rulesToEvaluate = (exemptionRules && exemptionRules.length > 0)
        ? exemptionRules
        : DEFAULT_MARKUP_EXEMPTIONS;

    const cleanSku = (sku || "").trim().toUpperCase();
    const cleanName = (name || "").trim().toUpperCase();
    const cleanCategory = (category || "").trim().toUpperCase();
    const cleanBrand = (brand || "").trim().toUpperCase();

    // Fast check for 3VJ1: Hanya produk yang diikuti dengan -3DB, -5DB, atau -7DB yang bebas markup 5%
    if (cleanSku.startsWith("3VJ1")) {
        const parts = cleanSku.split("-");
        const middle = parts.length > 1 ? parts[1].slice(0, 3) : "";
        const isDbVariant = middle === "3DB" || middle === "5DB" || middle === "7DB";
        
        // Selain 3DB, 5DB, dan 7DB (misal 3DA, 0DA, dll), produk 3VJ1 TETAP naik 5%
        if (!isDbVariant) {
            return false;
        }

        // Jika termasuk varian 3DB/5DB/7DB, periksa apakah aturan pengecualian aktif
        const matchingRule = rulesToEvaluate.find(r => 
            r.skuPrefix?.toUpperCase() === "3VJ1" || 
            r.id.includes("3vj1")
        );
        if (matchingRule) {
            return matchingRule.isActive;
        }
        return true;
    }

    return rulesToEvaluate.some((rule) => {
        if (!rule.isActive) return false;

        // Cek SKU Prefix jika didefinisikan
        if (rule.skuPrefix && rule.skuPrefix.trim()) {
            const prefix = rule.skuPrefix.trim().toUpperCase();
            if (!cleanSku.startsWith(prefix)) return false;
        }

        // Cek SKU Pattern jika didefinisikan (misal: "3DB, 5DB, 7DB")
        if (rule.skuPattern && rule.skuPattern.trim()) {
            const patterns = rule.skuPattern.split(/[,|]/).map(p => p.trim().toUpperCase()).filter(Boolean);
            const matchesPattern = patterns.some(p => {
                const cleanP = p.replace(/^-/, "");
                return cleanSku.includes(`-${cleanP}`) || cleanSku.includes(p);
            });
            if (!matchesPattern) return false;
        }

        // Cek prefix atau kata kunci nama/deskripsi jika didefinisikan
        if (rule.descriptionPrefix && rule.descriptionPrefix.trim()) {
            const desc = rule.descriptionPrefix.trim().toUpperCase();
            if (!cleanName.startsWith(desc) && !cleanName.includes(desc)) return false;
        }

        // Cek kategori jika didefinisikan
        if (rule.category && rule.category.trim()) {
            const cat = rule.category.trim().toUpperCase();
            if (cleanCategory && cleanCategory !== cat) return false;
        }

        // Cek brand jika didefinisikan
        if (rule.brand && rule.brand.trim()) {
            const br = rule.brand.trim().toUpperCase();
            if (cleanBrand && !cleanBrand.includes(br)) return false;
        }

        return true;
    });
}

// Parse string discount like "10+5" into [10, 5]
function parseStringDiscount(disc: string): number[] {
    if (!disc || disc === "0") return [];
    return disc.split('+').map(d => parseFloat(d)).filter(d => !isNaN(d) && d > 0);
}

/**
 * Hitung harga dengan kenaikan markup kategori:
 * - Kategori LP: +5% (dibulatkan ke ratusan terdekat)
 * - Kategori CP: +10% (dibulatkan ke ratusan terdekat)
 * Pengecualian diterapkan jika produk memenuhi kriteria MarkupExemptionRule (misal: 3VJ1 Siemens MCCB)
 */
export function getCategoryMarkedUpPrice(
    price: number,
    category: string | null,
    categoryMappings: CategoryMapping[],
    sku?: string | null,
    name?: string | null,
    brand?: string | null,
    exemptionRules?: MarkupExemptionRule[] | null
): number {
    if (!price || price <= 0 || !category) return price;

    // Periksa apakah produk dikecualikan dari markup
    if (isProductExemptFromMarkup(sku, name, category, brand, exemptionRules)) {
        return price;
    }

    const mapping = categoryMappings.find(
        (m) => m.categoryName.trim().toLowerCase() === category.trim().toLowerCase()
    );
    if (!mapping) return price;

    if (mapping.discountType === "LP") {
        return Math.round((price * 1.05) / 100) * 100;
    }
    if (mapping.discountType === "CP") {
        return Math.round((price * 1.10) / 100) * 100;
    }
    return price;
}

export function calculatePriceInfo(
    productPrice: number,
    productCategory: string | null,
    customer: CustomerDiscount | null,
    categoryMappings: CategoryMapping[],
    availableToSell: number = 0,
    discountRules: DiscountRule[] = [],
    productBrand: string | null = null,
    hidePriceRules: HidePriceRules | null = null,
    applyCategoryMarkup: boolean = true,
    productSku?: string | null,
    productName?: string | null,
    markupExemptions?: MarkupExemptionRule[] | null
): PriceInfo {
    const PPN = 1.11;
    let discounts: number[] = [];
    let ruleName: string | null = null;
    
    // Check if price should be hidden
    let isHidden = false;
    let contactPhone = null;
    if (hidePriceRules) {
        if (productBrand && hidePriceRules.brands.includes(productBrand)) {
            isHidden = true;
            contactPhone = hidePriceRules.contactPhone;
        } else if (productCategory && hidePriceRules.categories.includes(productCategory)) {
            isHidden = true;
            contactPhone = hidePriceRules.contactPhone;
        }
    }

    // Terapkan kenaikan harga kategori (LP: +5%, CP: +10%) dengan dukungan pengecualian
    let basePrice = productPrice;
    let isMarkedUp = false;
    let markupPercent = 0;
    const isExempt = isProductExemptFromMarkup(productSku, productName, productCategory, productBrand, markupExemptions);

    if (applyCategoryMarkup && productPrice > 0 && productCategory && !isExempt) {
        const markedUp = getCategoryMarkedUpPrice(
            productPrice,
            productCategory,
            categoryMappings,
            productSku,
            productName,
            productBrand,
            markupExemptions
        );
        if (markedUp !== productPrice) {
            basePrice = markedUp;
            isMarkedUp = true;
            const mapping = categoryMappings.find(
                (m) => m.categoryName.trim().toLowerCase() === productCategory.trim().toLowerCase()
            );
            markupPercent = mapping?.discountType === "LP" ? 5 : mapping?.discountType === "CP" ? 10 : 0;
        }
    }

    // 1. Logic Customer Discount (Priority 1)
    if (customer) {
        // ... (Legacy logic implementation, simplified for now or need to check usage)
        // If customer has specific discounts logic, implement here.
        // For now, let's assume if customer is logged in, we use their specific discounts.
        // If customer has general discounts:
        if (customer.discount1 > 0 || customer.discount2 > 0) {
            if (customer.discount1 > 0) discounts.push(customer.discount1);
            if (customer.discount2 > 0) discounts.push(customer.discount2);
            ruleName = "Customer Discount";
        }

        // Check for specific category discounts (LP, CP, Lighting)
        // 1. Find the mapping for this product category
        const mapping = productCategory ? categoryMappings.find(
            (m) => m.categoryName.trim().toLowerCase() === productCategory.trim().toLowerCase()
        ) : undefined;

        if (mapping) {
            const discountType = mapping.discountType; // "LP", "CP", "LIGHTING"
            const isReady = availableToSell > 0;

            let specificDiscountStr = "0";
            if (discountType === "CP") {
                specificDiscountStr = isReady ? customer.discountCP : (customer.discountCPIndent || customer.discountCP);
            } else if (discountType === "LP") {
                specificDiscountStr = isReady ? customer.discountLP : (customer.discountLPIndent || customer.discountLP);
            } else if (discountType === "LIGHTING") {
                specificDiscountStr = isReady ? customer.discountLighting : (customer.discountLightingIndent || customer.discountLighting);
            }

            const specificDiscounts = parseStringDiscount(specificDiscountStr);
            if (specificDiscounts.length > 0) {
                discounts = specificDiscounts;
                ruleName = `Customer ${discountType} (${isReady ? 'Stock' : 'Indent'})`;
            }
        }
    }

    // 2. Logic Default Discount (Priority 2 - Only if no customer discount applied)
    if (discounts.length === 0 && productCategory) {
        // Find mapping
        const mapping = categoryMappings.find(
            (m) => m.categoryName.trim().toLowerCase() === productCategory.trim().toLowerCase()
        );

        if (mapping) {
            // Find rule for this discount type
            const rule = discountRules.find(r => r.categoryGroup === mapping.discountType);

            if (rule) {
                let ruleDiscounts: number[] = [];
                const isReady = availableToSell > 0;

                if (isReady) {
                    ruleDiscounts = parseStringDiscount(rule.stockDiscount);
                } else {
                    ruleDiscounts = parseStringDiscount(rule.indentDiscount);
                }

                if (ruleDiscounts.length > 0) {
                    discounts = ruleDiscounts;
                    ruleName = `${rule.categoryGroup} (${isReady ? 'Stock' : 'Indent'})`;
                }
            }
        }
    }

    let finalPrice = basePrice;
    for (const d of discounts) {
        finalPrice = finalPrice * (1 - d / 100);
    }

    let discountStr: string | undefined = undefined;
    if (discounts.length > 0) {
        // Find if any string rules were applied, if we didn't store the exact string, we can format it from the array
        // However, we can also extract it from specificDiscountStr / rule.stockDiscount
        // Actually, we can just join the discounts array into a string. e.g. [30, 24] -> "30+24"
        discountStr = discounts.join("+");
    }

    return {
        originalPrice: basePrice,
        originalPriceWithPPN: Math.ceil((basePrice * PPN) / 1000) * 1000,
        discountedPrice: finalPrice,
        discountedPriceWithPPN: Math.ceil((finalPrice * PPN) / 1000) * 1000,
        hasDiscount: discounts.length > 0,
        isCustomerDiscount: !!(ruleName && ruleName.toLowerCase().includes("customer")),
        discounts,
        discountStr,
        ruleName,
        isHidden,
        contactPhone,
        isMarkedUp,
        markupPercent,
        isMarkupExempt: isExempt
    };
}
