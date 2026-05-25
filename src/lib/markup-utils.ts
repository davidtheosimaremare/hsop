export function calculateMarkedUpPrice(
    basePrice: number,
    brand: string | null,
    category: string | null,
    rules: { type: string, targetValue: string, markupType: string, markupValue: number }[]
): number {
    if (!basePrice || basePrice <= 0) return basePrice;

    // 1. Try Category Rule (Priority)
    if (category) {
        const categoryRule = rules.find(r => r.type === "CATEGORY" && r.targetValue.toLowerCase() === category.toLowerCase());
        if (categoryRule) {
            if (categoryRule.markupType === "PERCENTAGE") {
                return basePrice + (basePrice * (categoryRule.markupValue / 100));
            } else if (categoryRule.markupType === "FIXED_ADDITION") {
                return basePrice + categoryRule.markupValue;
            }
        }
    }

    // 2. Try Brand Rule (Fallback)
    if (brand) {
        const brandRule = rules.find(r => r.type === "BRAND" && r.targetValue.toUpperCase() === brand.toUpperCase());
        if (brandRule) {
            if (brandRule.markupType === "PERCENTAGE") {
                return basePrice + (basePrice * (brandRule.markupValue / 100));
            } else if (brandRule.markupType === "FIXED_ADDITION") {
                return basePrice + brandRule.markupValue;
            }
        }
    }

    // No rules matched
    return basePrice;
}
