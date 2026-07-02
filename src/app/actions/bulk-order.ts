"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
import { getSession } from "@/lib/auth";
import { generateAccurateAuthHeaders } from "@/lib/accurate";
import { createAccurateHSQ } from "@/lib/accurate";

export interface BulkOrderProduct {
    id: string;
    sku: string;
    name: string;
    price: number;
    image: string | null;
    availableToSell: number;
    brand: string | null;
    category: string | null;
    isValid: boolean;
    error?: string;
    requestedQty?: number;
}

export interface BulkSearchFilters {
    query: string;
    category?: string;
    stockFilter?: 'all' | 'ready' | 'indent';
    pole?: string;
    ampere?: string;
    breakingCapacity?: string;
}

export async function searchBulkProducts(filters: BulkSearchFilters): Promise<BulkOrderProduct[]> {
    const { query, category, stockFilter } = filters;
    
    // Only return empty if everything is empty
    if ((!query || query.trim().length < 2) && (!category || category === 'all') && (!stockFilter || stockFilter === 'all')) {
        return [];
    }

    const terms = query?.trim() ? query.trim().split(/\s+/).filter(Boolean) : [];

    const hiddenCategories = await db.category.findMany({
        where: { isVisible: false },
        select: { name: true }
    });
    const hiddenCategoryNames = hiddenCategories.map(c => c.name);

    const where: any = {
        isVisible: true,
        category: hiddenCategoryNames.length > 0 ? { notIn: hiddenCategoryNames } : undefined,
    };

    if (terms.length > 0) {
        where.AND = terms.map(term => ({
            OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { sku: { contains: term, mode: 'insensitive' } },
            ]
        }));
    }

    if (category && category !== 'all') {
        where.category = { contains: category, mode: 'insensitive' };
    }

    if (stockFilter === 'ready') {
        where.availableToSell = { gt: 0 };
    } else if (stockFilter === 'indent') {
        where.availableToSell = { lte: 0 };
    }

    const specConditions: any[] = [];
    if (filters.pole) {
        specConditions.push({ name: { contains: `, ${filters.pole},`, mode: "insensitive" } });
    }
    if (filters.ampere) {
        specConditions.push({ name: { contains: filters.ampere, mode: "insensitive" } });
    }
    if (filters.breakingCapacity) {
        specConditions.push({ name: { contains: filters.breakingCapacity, mode: "insensitive" } });
    }

    if (specConditions.length > 0) {
        where.AND = [
            ...(Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : [])),
            ...specConditions
        ];
    }

    const products = await db.product.findMany({
        where,
        select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            image: true,
            availableToSell: true,
            brand: true,
            category: true,
        },
        orderBy: [
            { availableToSell: 'desc' },
            { name: 'asc' },
        ],
    });

    return products.map(p => ({
        id: p.id,
        sku: p.sku!,
        name: p.name,
        price: p.price,
        image: p.image,
        availableToSell: p.availableToSell || 0,
        brand: p.brand || '',
        category: p.category || null,
        isValid: true,
    }));
}

export async function getBulkOrderCategories(): Promise<string[]> {
    const hiddenCategories = await db.category.findMany({
        where: { isVisible: false },
        select: { name: true }
    });
    const hiddenCategoryNames = hiddenCategories.map(c => c.name);

    const rows = await db.product.findMany({
        where: {
            isVisible: true,
            category: { not: null, notIn: hiddenCategoryNames },
        },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
    });

    return rows.map(r => r.category!).filter(Boolean);
}

export async function searchProductsBySkus(terms: string[]): Promise<BulkOrderProduct[]> {
    if (!terms || terms.length === 0) return [];

    // 1. Fetch products from DB matching SKU or Name
    const products = await db.product.findMany({
        where: {
            OR: [
                { sku: { in: terms, mode: 'insensitive' } },
                { name: { in: terms, mode: 'insensitive' } }
            ],
            isVisible: true
        },
        select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            image: true,
            availableToSell: true,
            brand: true,
            category: true
        }
    });

    // 2. Map results back to original terms to identify valid/invalid?
    // Actually, we just need to return the products found.
    // The client will display what was found.
    // If the Term matches SKU, great. If it matches Name, great.

    return products.map(p => ({
        id: p.id,
        sku: p.sku!,
        name: p.name,
        price: p.price,
        image: p.image,
        availableToSell: p.availableToSell || 0,
        brand: p.brand || "",
        category: p.category || null,
        isValid: true
    }));
}

export async function searchProductBySku(sku: string): Promise<BulkOrderProduct | null> {
    if (!sku) return null;

    const product = await db.product.findFirst({
        where: {
            OR: [
                { sku: { equals: sku, mode: 'insensitive' } },
                { name: { equals: sku, mode: 'insensitive' } }
            ]
        },
    });

    if (!product) return null;

    return {
        id: product.id,
        sku: product.sku!,
        name: product.name,
        price: product.price,
        image: product.image,
        availableToSell: product.availableToSell || 0,
        brand: product.brand || "",
        category: product.category || null,
        isValid: true
    };
}

export async function parsePdfBulkOrder(formData: FormData): Promise<{ sku: string; qty: number }[]> {
    const file = formData.get("file") as File;
    if (!file) {
        throw new Error("No file uploaded");
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        // @ts-ignore
        const data = await pdf(buffer);
        const text = data.text || "";

        const lines = text.split('\n');
        const results: { sku: string; qty: number }[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Revised Heuristic:
            // 1. Find the QTY. Usually a standalone number. matches \b\d+\b
            // 2. The rest of the string (cleaned) is the Search Term (SKU/Name).

            // Find all standalone numbers
            const numberMatches = [...trimmed.matchAll(/\b(\d+)\b/g)];

            if (numberMatches.length > 0) {
                // Heuristic: QTY is often the *last* pure number number on the line (e.g. ItemName 12345 10)
                // However, if there are price numbers like 100.000, regex \b\d+\b matches 100 and 000 separately if using dot.
                // Assuming "qty" is an integer. 

                // Let's take the LAST number match as the most likely QTY candidate.
                const qtyMatch = numberMatches[numberMatches.length - 1];
                const potentialQty = parseInt(qtyMatch[0]);

                if (!isNaN(potentialQty) && potentialQty > 0) {
                    // Extract name by removing the QTY token
                    // We also want to remove other common noise if possible, but let's start with just removing the QTY.
                    // We remove the specific match instance to preserve other numbers (like in the product name).

                    // Actually, simpler: The search term is everything *before* the quantity? 
                    // Or just remove the quantity token.

                    // Let's reconstruct the string without the qty token.
                    // We use the index to be precise.
                    const pre = trimmed.slice(0, qtyMatch.index);
                    const post = trimmed.slice(qtyMatch.index + qtyMatch[0].length);

                    let potentialTerm = (pre + " " + post).trim();

                    // Clean up potentialTerm
                    // Remove "Rp", "pcs", commas, etc if they clutter the name
                    potentialTerm = potentialTerm.replace(/Rp\.?/gi, '').replace(/pcs/gi, '').replace(/,/g, '').trim();
                    potentialTerm = potentialTerm.replace(/\s+/g, ' '); // normalize spaces

                    if (potentialTerm.length > 2) {
                        results.push({ sku: potentialTerm, qty: potentialQty });
                    }
                }
            }
        }

        return results;

    } catch (error: any) {
        console.error("PDF Parse error:", error);
        throw new Error(`Failed to parse PDF: ${error.message || String(error)}`);
    }
}

export async function getNextQuotationNumber(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yearPrefix = `HSQ/${yy}/`;
    
    let highestNum = 0;

    // 1. Fetch from Accurate API as the main source of truth
    try {
        const headers = await generateAccurateAuthHeaders();
        const endpoint = `${process.env.ACCURATE_API_HOST || "https://zeus.accurate.id"}/accurate/api/sales-quotation/list.do`;
        
        const url = new URL(endpoint);
        url.searchParams.append('fields', 'id,number');
        url.searchParams.append('sp.sortMode', 'DESC');
        url.searchParams.append('sp.pageSize', '100');
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers,
            cache: 'no-store'
        });
        
        const res = await response.json();
        if (res.s && res.d && res.d.length > 0) {
            for (const item of res.d) {
                if (item.number && item.number.startsWith(yearPrefix)) {
                    const parts = item.number.split('/');
                    const lastPart = parts[parts.length - 1];
                    const match = lastPart.match(/^(\d+)/);
                    if (match) {
                        const num = parseInt(match[1]);
                        if (!isNaN(num) && num > highestNum) {
                            highestNum = num;
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch latest SQ from accurate", e);
    }

    const increment = highestNum + 1;
    return `HSQ/${yy}/${mm}/${String(increment).padStart(3, '0')}`;
}

export async function createSalesQuotationAccurate(items: any[], customerInfo: any, specialDiscount: number, notes?: string) {
    const session = await getSession();
    if (!session || session.user?.role !== 'SALES') {
        throw new Error("Unauthorized");
    }

    try {
        const quotationNo = await getNextQuotationNumber();
        
        let totalAmount = 0;
        const validItems = items.filter(item => item.isAvailable !== false);
        validItems.forEach(item => {
            totalAmount += (item.price * item.quantity);
        });
        
        if (specialDiscount > 0) {
             totalAmount = totalAmount - (totalAmount * specialDiscount / 100);
        }

        // Push to Accurate directly without saving locally
        const accuratePayload = {
            quotationNo,
            clientName: customerInfo.name || 'CASH',
            shippingAddress: customerInfo.address || '',
            items: validItems,
            specialDiscount,
            notes: notes || '',
            customer: customerInfo.customer
        };

        const accurateRes = await createAccurateHSQ(accuratePayload);

        if (accurateRes && !accurateRes.error && accurateRes.id) {
            return { success: true, quotationNo, accurateId: accurateRes.id };
        } else {
            // If failed to push to Accurate
            const accurateErrMsg = accurateRes?.message || "Unknown error";
            return { success: false, message: `Gagal membuat penawaran di Accurate: ${accurateErrMsg}`, quotationNo };
        }
    } catch (err: any) {
        console.error("Error creating Sales Quotation:", err);
        throw new Error(err.message || "Gagal membuat penawaran Sales.");
    }
}
