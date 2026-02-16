import { DiscountRule, CategoryMapping as PrismaCategoryMapping } from "@prisma/client";

export interface CategoryMapping extends PrismaCategoryMapping { }

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

export interface PriceInfo {
    originalPrice: number;
    originalPriceWithPPN: number;
    discountedPrice: number;
    discountedPriceWithPPN: number;
    hasDiscount: boolean;
    isCustomerDiscount: boolean;
    discounts: number[];
    ruleName: string | null;
}

// Parse string discount like "10+5" into [10, 5]
function parseStringDiscount(disc: string): number[] {
    if (!disc || disc === "0") return [];
    return disc.split('+').map(d => parseFloat(d)).filter(d => !isNaN(d) && d > 0);
}

export function calculatePriceInfo(
    productPrice: number,
    productCategory: string | null,
    customer: CustomerDiscount | null,
    categoryMappings: CategoryMapping[],
    availableToSell: number = 0,
    discountRules: DiscountRule[] = []
): PriceInfo {
    const PPN = 1.11;
    let discounts: number[] = [];
    let ruleName: string | null = null;

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
        const mapping = categoryMappings.find(m => m.categoryName === productCategory);

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
        const mapping = categoryMappings.find(m => m.categoryName === productCategory);

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

    // Calculate Final Price
    let finalPrice = productPrice;
    for (const d of discounts) {
        finalPrice = finalPrice * (1 - d / 100);
    }

    return {
        originalPrice: productPrice,
        originalPriceWithPPN: productPrice * PPN,
        discountedPrice: finalPrice,
        discountedPriceWithPPN: finalPrice * PPN,
        hasDiscount: discounts.length > 0,
        isCustomerDiscount: !!(ruleName && ruleName.toLowerCase().includes("customer")),
        discounts,
        ruleName
    };
}
