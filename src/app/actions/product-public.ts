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
    // Get all unique brands from products that are visible
    const brands = await db.product.groupBy({
        by: ['brand'],
        where: {
            isVisible: true,
            brand: { not: null }
        },
        _count: {
            brand: true
        },
        orderBy: {
            brand: 'asc'
        }
    });

    return brands.map(b => ({
        name: b.brand as string,
        count: b._count.brand
    })).filter(b => b.name && b.name.trim() !== "");
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

    const where: Prisma.ProductWhereInput = {
        isVisible: true,
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
        // If category is a name, we might need to find its ID and children
        // For simplicity, let's assume we match exact string on Product.category field 
        // OR we find the category by name and use its ID if Product.category stores ID/Name

        // CHECK: Schema says `category String?`. It might be storing Name or ID. 
        // Most legacy/simple apps store Name. Let's assume Name for now, or match both.
        where.category = { contains: category, mode: "insensitive" };
    }

    if (brand && brand !== "all") {
        where.brand = { contains: brand, mode: "insensitive" };
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

    // Default: Filter for "Siemens" in any field if no query is provided
    if (!query && (!brand || brand === "all")) {
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
    // If slug has a hyphen, the part after the FIRST hyphen is the SKU
    // e.g. siemens-3VJ10... or schneider-3VJ10...
    if (slug.includes("-")) {
        const firstHyphenIndex = slug.indexOf("-");
        const sku = slug.substring(firstHyphenIndex + 1);

        const product = await db.product.findUnique({
            where: { sku },
        });

        if (product) return product;
    }

    // Fallback: Try to find by ID (for backward compatibility)
    return await db.product.findUnique({
        where: { id: slug },
    });
}

export async function getRelatedProducts(category: string, excludeId: string) {
    return await db.product.findMany({
        where: {
            category: category ? { contains: category, mode: "insensitive" } : undefined,
            id: { not: excludeId },
            isVisible: true
        },
        take: 6,
        orderBy: { createdAt: 'desc' }
    });
}

export async function getCategoryMappings() {
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
