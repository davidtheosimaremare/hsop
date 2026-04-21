"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getCategoriesTree() {
    // Fetch categories with basic hierarchy (assuming 1 level for now based on UI)
    // The UI shows "Categories" and "Subcategories".
    // DB has parentId.
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

    // Filter root categories (those without parentId or user logic)
    // If your categories form a tree, we usually want top-level ones.
    const rootCategories = categories.filter(c => !c.parentId);
    return rootCategories;
}

export async function getBrands() {
    // Fetch only visible brands
    const brands = await db.brand.findMany({
        where: { isVisible: true },
        orderBy: { name: 'asc' }
    });

    // We need counts for each brand
    // For now, let's get the counts from the product table
    const products = await db.product.findMany({
        where: { isVisible: true },
        select: { brand: true }
    });

    const brandCounts: Record<string, number> = {};
    products.forEach(p => {
        if (p.brand) {
            const b = p.brand.toUpperCase();
            brandCounts[b] = (brandCounts[b] || 0) + 1;
        }
    });

    return brands.map(b => ({
        name: b.name,
        displayName: b.alias || b.name,
        count: brandCounts[b.name.toUpperCase()] || 0
    })).filter(b => b.count > 0);
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

    // Fetch hidden categories to exclude their products
    const hiddenCategories = await db.category.findMany({
        where: { isVisible: false },
        select: { name: true }
    });
    const hiddenCategoryNames = hiddenCategories.map(c => c.name);

    // Fetch hidden brands
    const hiddenBrands = await db.brand.findMany({
        where: { isVisible: false },
        select: { name: true }
    });
    const hiddenBrandNames = hiddenBrands.map(b => b.name);

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


export async function getPublicProductBySlug(slug: string) {
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

    // 4. Try legacy ID
    return await db.product.findUnique({
        where: { id: slug },
    });
}

export async function getRelatedProducts(category: string, excludeId: string, name: string = "") {
    const hiddenCategories = await db.category.findMany({
        where: { isVisible: false },
        select: { name: true }
    });
    const hiddenCategoryNames = hiddenCategories.map(c => c.name);

    // Clean name for better matching
    // We take the first 2 words of the name which usually contain the series/model info
    const nameWords = name.split(/[\s-]+/).filter(w => w.length >= 3).slice(0, 2);

    // We'll try to find products that match name words first
    const relatedProducts = await db.product.findMany({
        where: {
            category: category ? { contains: category, mode: "insensitive" } : (hiddenCategoryNames.length > 0 ? { notIn: hiddenCategoryNames } : undefined),
            id: { not: excludeId },
            isVisible: true,
            AND: nameWords.map(word => ({
                name: { contains: word, mode: "insensitive" }
            }))
        },
        take: 8,
        orderBy: { name: 'asc' }
    });

    // If we didn't find enough products with ALL keywords, try matching ANY keyword
    let finalProducts = [...relatedProducts];
    if (finalProducts.length < 4) {
        const anyWordProducts = await db.product.findMany({
            where: {
                category: category ? { contains: category, mode: "insensitive" } : (hiddenCategoryNames.length > 0 ? { notIn: hiddenCategoryNames } : undefined),
                id: {
                    not: excludeId,
                    notIn: finalProducts.map(p => p.id)
                },
                isVisible: true,
                OR: nameWords.map(word => ({
                    name: { contains: word, mode: "insensitive" }
                }))
            },
            take: 8 - finalProducts.length,
            orderBy: { name: 'asc' }
        });
        finalProducts = [...finalProducts, ...anyWordProducts];
    }

    // Fallback: If still not enough, just get any from the same category
    if (finalProducts.length < 8) {
        const fallbackProducts = await db.product.findMany({
            where: {
                category: category ? { contains: category, mode: "insensitive" } : (hiddenCategoryNames.length > 0 ? { notIn: hiddenCategoryNames } : undefined),
                AND: [
                    { id: { not: excludeId } },
                    { id: { notIn: finalProducts.map(p => p.id) } }
                ],
                isVisible: true
            },
            take: 8 - finalProducts.length,
            orderBy: { createdAt: 'desc' }
        });
        finalProducts = [...finalProducts, ...fallbackProducts];
    }

    return finalProducts.slice(0, 8);
}

