"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";

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
