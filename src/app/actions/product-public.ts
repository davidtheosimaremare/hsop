"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { cache } from "react";
import { memoryCache } from "@/lib/cache";

// Cached lookups for hidden categories/brands (rarely change, safe to cache 1h)
async function getHiddenCategoryNames() {
    return memoryCache.getOrFetch('hidden-categories', async () => {
        const cats = await db.category.findMany({ where: { isVisible: false }, select: { name: true } });
        return cats.map(c => c.name);
    }, 3600);
}

async function getHiddenBrandNames() {
    return memoryCache.getOrFetch('hidden-brands', async () => {
        const brands = await db.brand.findMany({ where: { isVisible: false }, select: { name: true } });
        return brands.map(b => b.name);
    }, 3600);
}

async function getCategoriesTreeCached() {
    return memoryCache.getOrFetch('categories-tree', async () => {
        const categories = await db.category.findMany({
            where: { isVisible: true },
            orderBy: { order: 'asc' },
            include: {
                children: {
                    where: { isVisible: true },
                    orderBy: { order: 'asc' }
                }
            }
        });

        const rootCategories = categories.filter(c => !c.parentId);
        return rootCategories;
    }, 3600);
}

export async function getCategoriesTree() {
    return getCategoriesTreeCached();
}

async function getBrandsCached() {
    return memoryCache.getOrFetch('brands-list', async () => {
        const brands = await db.brand.findMany({
            where: { isVisible: true },
            orderBy: { name: 'asc' }
        });

        const productCounts = await db.product.groupBy({
            by: ['brand'],
            where: { isVisible: true },
            _count: {
                brand: true
            }
        });

        const brandCounts: Record<string, number> = {};
        productCounts.forEach(pc => {
            if (pc.brand) {
                brandCounts[pc.brand.toUpperCase()] = pc._count.brand;
            }
        });

        return brands.map(b => ({
            name: b.name,
            displayName: b.alias || b.name,
            count: brandCounts[b.name.toUpperCase()] || 0
        })).filter(b => b.count > 0);
    }, 3600);
}

export async function getBrands() {
    return getBrandsCached();
}

export interface ProductFilterParams {
    query?: string;
    category?: string; // category name or id
    availability?: string; // 'ready', 'all'
    sort?: string; // 'newest', 'price-low', 'price-high', 'popular'
    page?: number;
    pageSize?: number;
    brand?: string;
    pole?: string;    // e.g. '3P', '4P'
    ampere?: string;  // e.g. '1000A', '63A'
    breakingCapacity?: string; // e.g. '55kA', '36kA'
}

export async function getPublicProducts({
    query,
    category,
    availability,
    sort = "abjad",
    page = 1,
    pageSize = 20,
    brand,
    pole,
    ampere,
    breakingCapacity
}: ProductFilterParams) {
    const skip = (page - 1) * pageSize;

    // Use cached hidden categories/brands (they rarely change)
    const [hiddenCategoryNames, hiddenBrandNames] = await Promise.all([
        getHiddenCategoryNames(),
        getHiddenBrandNames()
    ]);

    const where: Prisma.ProductWhereInput = {
        isVisible: true,
        category: hiddenCategoryNames.length > 0 ? { notIn: hiddenCategoryNames } : undefined,
        brand: hiddenBrandNames.length > 0 ? { notIn: hiddenBrandNames } : undefined,
    };

    if (query) {
        const terms = query.trim().split(/\s+/).filter(Boolean);
        if (terms.length > 0) {
            where.AND = terms.map(term => ({
                OR: [
                    { name: { contains: term, mode: "insensitive" } },
                    { sku: { contains: term, mode: "insensitive" } },
                    { description: { contains: term, mode: "insensitive" } },
                ]
            }));
        }
    }

    if (category && category !== "all") {
        const catNode = await db.category.findFirst({
            where: { name: { equals: category, mode: "insensitive" } },
            include: { children: true }
        });

        if (catNode && catNode.children.length > 0) {
            const categoryNames = [catNode.name, ...catNode.children.map(c => c.name)];
            const categoryConditions = categoryNames.map(name => ({
                category: { contains: name, mode: "insensitive" as const }
            }));

            where.AND = [
                ...(Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND as any] : [])),
                { OR: categoryConditions }
            ];
        } else {
            where.category = { contains: category, mode: "insensitive" };
        }
    }

    if (brand && brand !== "all") {
        // If the brand has an alias, we should still search by the original name in the product table
        // because the product table stores the original name.
        where.brand = { equals: brand, mode: "insensitive" };
    }

    // Stock filter - use database value (synced from Accurate)
    if (availability === "ready") {
        where.availableToSell = { gt: 0 };
    } else if (availability === "indent") {
        where.availableToSell = { lte: 0 };
    }

    // === ELECTRICAL SPEC FILTERS (extracted from product name) ===
    // These filter by matching patterns in the product name
    const specConditions: Prisma.ProductWhereInput[] = [];

    if (pole) {
        // Match patterns like "3P," or "3P " or ", 3P," in product name
        // Using contains with the pole value surrounded by delimiters
        specConditions.push({
            name: { contains: `, ${pole},`, mode: "insensitive" }
        });
    }

    if (ampere) {
        // Match patterns like "1000A" or "1000A," in product name
        specConditions.push({
            name: { contains: ampere, mode: "insensitive" }
        });
    }

    if (breakingCapacity) {
        // Match patterns like "55kA" in product name
        specConditions.push({
            name: { contains: breakingCapacity, mode: "insensitive" }
        });
    }

    if (specConditions.length > 0) {
        where.AND = [
            ...(Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND as any] : [])),
            ...specConditions
        ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

    switch (sort) {
        case "price-low":
            orderBy = { price: "asc" };
            break;
        case "price-high":
            orderBy = { price: "desc" };
            break;
        case "popular":
            orderBy = [
                { sortWeight: "asc" },
                { name: "asc" }
            ] as any;
            break;
        case "newest":
            orderBy = { createdAt: "desc" };
            break;
        case "abjad":
        case "relevansi":
        default:
            orderBy = [
                { sortWeight: "asc" },
                { name: "asc" }
            ] as any;
            break;
    }

    // Default: Filter for "Siemens" in any field if no query, no category, and no brand is provided
    if (!query && (!category || category === "all") && (!brand || brand === "all")) {
        where.OR = [
            { name: { contains: "Siemens", mode: "insensitive" } },
            { brand: { contains: "Siemens", mode: "insensitive" } },
            { sku: { contains: "Siemens", mode: "insensitive" } },
            { description: { contains: "Siemens", mode: "insensitive" } },
        ];
    }

    // Simple DB pagination - stock is in database now
    const [products, total] = await Promise.all([
        db.product.findMany({
            where,
            orderBy,
            skip,
            take: pageSize,
        }),
        db.product.count({ where }),
    ]);

    return {
        products,
        pagination: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}


const getPublicProductBySlugCached = cache(async (slug: string) => {
    // 1. First try matching exact SKU (fastest path - 90%+ of cases)
    const productBySku = await db.product.findUnique({
        where: { sku: slug },
    });
    if (productBySku) return productBySku;

    // 2. Decode in case of special characters
    const decodedSlug = decodeURIComponent(slug);
    if (decodedSlug !== slug) {
        const productByDecodedSku = await db.product.findUnique({
            where: { sku: decodedSlug },
        });
        if (productByDecodedSku) return productByDecodedSku;
    }

    // 3. Smart slash recovery: batch-query all possible single-hyphen-to-slash variants
    // This handles SKUs like "TL-500-5.3m-F/P" which becomes "TL-500-5.3m-F-P" in URL
    if (slug.includes("-")) {
        const hyphenPositions: number[] = [];
        for (let i = 0; i < slug.length; i++) {
            if (slug[i] === '-') hyphenPositions.push(i);
        }

        // Build all single-slash candidates and query in ONE batch
        const singleSlashCandidates = hyphenPositions.map(pos =>
            slug.substring(0, pos) + '/' + slug.substring(pos + 1)
        );

        if (singleSlashCandidates.length > 0) {
            const found = await db.product.findFirst({
                where: { sku: { in: singleSlashCandidates } }
            });
            if (found) return found;
        }

        // Try pairs of hyphens as slashes (for SKUs with 2 slashes)
        if (hyphenPositions.length >= 2 && hyphenPositions.length <= 8) {
            const pairCandidates: string[] = [];
            for (let i = 0; i < hyphenPositions.length; i++) {
                for (let j = i + 1; j < hyphenPositions.length; j++) {
                    const chars = slug.split('');
                    chars[hyphenPositions[i]] = '/';
                    chars[hyphenPositions[j]] = '/';
                    pairCandidates.push(chars.join(''));
                }
            }
            if (pairCandidates.length > 0) {
                const found = await db.product.findFirst({
                    where: { sku: { in: pairCandidates } }
                });
                if (found) return found;
            }
        }
    }

    // 4. Fallback: Siemens prefix logic for old links (e.g. "siemens-3WA1110")
    if (slug.includes("-")) {
        const firstHyphenIndex = slug.indexOf("-");
        const skuFromSlug = slug.substring(firstHyphenIndex + 1);

        const p = await db.product.findUnique({
            where: { sku: skuFromSlug },
        });

        if (p) return p;
    }

    // 5. Last resort: search by ID
    return await db.product.findUnique({
        where: { id: slug },
    });
});

export async function getPublicProductBySlug(slug: string) {
    return getPublicProductBySlugCached(slug);
}

async function getRelatedProductsCached(category: string, excludeId: string, name: string = "") {
    const cacheKey = `related:${category}:${excludeId}:${name.slice(0, 20)}`;
    return memoryCache.getOrFetch(cacheKey, async () => {
        // Clean name for better matching
        const nameWords = name.split(/[\s-]+/).filter(w => w.length >= 3).slice(0, 2);

        // Initial search: Same category + matching keywords
        const relatedProducts = await db.product.findMany({
            where: {
                category: category ? { contains: category, mode: "insensitive" } : undefined,
                id: { not: excludeId },
                isVisible: true,
                OR: nameWords.length > 0 ? nameWords.map(word => ({
                    name: { contains: word, mode: "insensitive" }
                })) : undefined
            },
            take: 8,
            orderBy: { name: 'asc' }
        });

        // Fallback: If not enough related products, get from same category without keyword matching
        let finalProducts = [...relatedProducts];
        if (finalProducts.length < 8 && category) {
            const fallbackProducts = await db.product.findMany({
                where: {
                    category: { contains: category, mode: "insensitive" },
                    id: { 
                        not: excludeId,
                        notIn: finalProducts.map(p => p.id) 
                    },
                    isVisible: true
                },
                take: 8 - finalProducts.length,
                orderBy: { createdAt: 'desc' }
            });
            finalProducts = [...finalProducts, ...fallbackProducts];
        }

        return finalProducts.slice(0, 8);
    }, 600); // 10 min TTL
}

export async function getRelatedProducts(category: string, excludeId: string, name: string = "") {
    return getRelatedProductsCached(category, excludeId, name);
}


/**
 * Extract electrical spec filter options from product names.
 * Scans product names in the current search context to find unique:
 * - Pole values (1P, 2P, 3P, 4P)
 * - Ampere ratings (e.g. 63A, 100A, 1000A)
 * - Breaking capacity (e.g. 36kA, 55kA)
 * 
 * Example product name: "SIEMENS ACB, 3WA, 3P, 1000A, 55kA, D/O, ETU300-LSI"
 */
export async function getProductSpecFilters(params: {
    query?: string;
    category?: string;
    brand?: string;
}) {
    const cacheKey = `specs:${params.query || ''}:${params.category || ''}:${params.brand || ''}`;
    
    return memoryCache.getOrFetch(cacheKey, async () => {
        // Build a base where clause matching the current search context
        const [hiddenCategoryNames, hiddenBrandNames] = await Promise.all([
            getHiddenCategoryNames(),
            getHiddenBrandNames()
        ]);

        const where: Prisma.ProductWhereInput = {
            isVisible: true,
            category: hiddenCategoryNames.length > 0 ? { notIn: hiddenCategoryNames } : undefined,
            brand: hiddenBrandNames.length > 0 ? { notIn: hiddenBrandNames } : undefined,
        };

        if (params.query) {
            const terms = params.query.trim().split(/\s+/).filter(Boolean);
            if (terms.length > 0) {
                where.AND = terms.map(term => ({
                    OR: [
                        { name: { contains: term, mode: "insensitive" as const } },
                        { sku: { contains: term, mode: "insensitive" as const } },
                        { description: { contains: term, mode: "insensitive" as const } },
                    ]
                }));
            }
        }

        if (params.category && params.category !== "all") {
            const catNode = await db.category.findFirst({
                where: { name: { equals: params.category, mode: "insensitive" } },
                include: { children: true }
            });

            if (catNode && catNode.children.length > 0) {
                const categoryNames = [catNode.name, ...catNode.children.map(c => c.name)];
                const categoryConditions = categoryNames.map(name => ({
                    category: { contains: name, mode: "insensitive" as const }
                }));
                where.AND = [
                    ...(Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND as any] : [])),
                    { OR: categoryConditions }
                ];
            } else {
                where.category = { contains: params.category, mode: "insensitive" };
            }
        }

        if (params.brand && params.brand !== "all") {
            where.brand = { equals: params.brand, mode: "insensitive" };
        }

        // Default Siemens filter if no context
        if (!params.query && (!params.category || params.category === "all") && (!params.brand || params.brand === "all")) {
            where.OR = [
                { name: { contains: "Siemens", mode: "insensitive" } },
                { brand: { contains: "Siemens", mode: "insensitive" } },
            ];
        }

        // Fetch only names for extraction (lightweight query)
        const productNames = await db.product.findMany({
            where,
            select: { name: true },
            take: 5000, // Reasonable limit
        });

        // Extract specs from names using regex
        const poles = new Set<string>();
        const amperes = new Set<string>();
        const breakingCapacities = new Set<string>();

        // Regex patterns:
        // Pole: standalone "1P", "2P", "3P", "4P" (preceded/followed by comma, space, or boundary)
        const poleRegex = /(?:^|[\s,])(1P|2P|3P|4P)(?:[\s,]|$)/gi;
        // Ampere: number followed by "A" (e.g., 63A, 1000A, 1.6A)  
        const ampereRegex = /(?:^|[\s,])(\d+(?:\.\d+)?A)(?:[\s,]|$)/gi;
        // Breaking capacity: number followed by "kA" (e.g., 36kA, 55kA)
        const kaRegex = /(?:^|[\s,])(\d+(?:\.\d+)?kA)(?:[\s,]|$)/gi;

        for (const { name } of productNames) {
            let match;

            // Extract poles
            poleRegex.lastIndex = 0;
            while ((match = poleRegex.exec(name)) !== null) {
                poles.add(match[1].toUpperCase());
            }

            // Extract ampere
            ampereRegex.lastIndex = 0;
            while ((match = ampereRegex.exec(name)) !== null) {
                amperes.add(match[1].toUpperCase());
            }

            // Extract kA
            kaRegex.lastIndex = 0;
            while ((match = kaRegex.exec(name)) !== null) {
                breakingCapacities.add(match[1].toLowerCase().replace('ka', 'kA'));
            }
        }

        // Sort numerically
        const sortNumeric = (a: string, b: string) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            return numA - numB;
        };

        return {
            poles: Array.from(poles).sort(sortNumeric),
            amperes: Array.from(amperes).sort(sortNumeric),
            breakingCapacities: Array.from(breakingCapacities).sort(sortNumeric),
        };
    }, 600); // 10 minutes TTL
}
