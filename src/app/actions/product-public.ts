"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { cache } from "react";
import { unstable_cache } from "next/cache";

// Cached lookups for hidden categories/brands (rarely change, safe to cache 1h)
const getHiddenCategoryNames = unstable_cache(
    async () => {
        const cats = await db.category.findMany({ where: { isVisible: false }, select: { name: true } });
        return cats.map(c => c.name);
    },
    ['hidden-categories'],
    { revalidate: 3600, tags: ['categories'] }
);

const getHiddenBrandNames = unstable_cache(
    async () => {
        const brands = await db.brand.findMany({ where: { isVisible: false }, select: { name: true } });
        return brands.map(b => b.name);
    },
    ['hidden-brands'],
    { revalidate: 3600, tags: ['brands'] }
);

const getCategoriesTreeCached = unstable_cache(
    async () => {
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
    },
    ['categories-tree'],
    { revalidate: 3600, tags: ['categories'] }
);

export async function getCategoriesTree() {
    return getCategoriesTreeCached();
}

const getBrandsCached = unstable_cache(
    async () => {
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
    },
    ['brands-list'],
    { revalidate: 3600, tags: ['brands'] }
);

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
}

export async function getPublicProducts({
    query,
    category,
    availability,
    sort = "abjad",
    page = 1,
    pageSize = 20,
    brand
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

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

    switch (sort) {
        case "price-low":
            orderBy = { price: "asc" };
            break;
        case "price-high":
            orderBy = { price: "desc" };
            break;
        case "popular":
            orderBy = { name: "asc" };
            break;
        case "newest":
            orderBy = { createdAt: "desc" };
            break;
        case "abjad":
        case "relevansi":
        default:
            orderBy = { name: "asc" };
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
    // 1. First try matching exact SKU (user preference)
    const productBySku = await db.product.findUnique({
        where: { sku: slug },
    });
    if (productBySku) return productBySku;

    // 2. Decode in case of special characters
    const decodedSlug = decodeURIComponent(slug);
    const productByDecodedSku = await db.product.findUnique({
        where: { sku: decodedSlug },
    });
    if (productByDecodedSku) return productByDecodedSku;

    // 2.1 Micro fix: Jika tidak ketemu, coba ganti - kembali ke / (untuk kasus SKU seperti TL/500 -> TL-500)
    if (slug.includes("-")) {
        const productBySlashFix = await db.product.findUnique({
            where: { sku: decodedSlug.replaceAll("-", "/") },
        });
        if (productBySlashFix) return productBySlashFix;
    }

    // 3. Fallback: Siemens prefix logic if still needed for old links
    if (slug.includes("-")) {
        const firstHyphenIndex = slug.indexOf("-");
        const skuFromSlug = slug.substring(firstHyphenIndex + 1);

        const p = await db.product.findUnique({
            where: { sku: skuFromSlug },
        });

        if (p) return p;
    }

    return await db.product.findUnique({
        where: { id: slug },
    });
});

export async function getPublicProductBySlug(slug: string) {
    return getPublicProductBySlugCached(slug);
}

const getRelatedProductsCached = unstable_cache(
    async (category: string, excludeId: string, name: string = "") => {
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
    },
    ['related-products'],
    { revalidate: 600, tags: ['products'] }
);

export async function getRelatedProducts(category: string, excludeId: string, name: string = "") {
    return getRelatedProductsCached(category, excludeId, name);
}

