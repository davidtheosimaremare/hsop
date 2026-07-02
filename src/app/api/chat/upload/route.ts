import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculatePriceInfo } from "@/lib/pricing";
import * as XLSX from "xlsx";

export const maxDuration = 60;
// Allow larger body for file uploads
export const runtime = "nodejs";

// Format harga Rupiah
function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Fetch customer pricing data
async function getCustomerPricingData(customerId: string | null) {
    if (!customerId) return null;
    try {
        return await db.customer.findUnique({
            where: { id: customerId },
            select: {
                discount1: true,
                discount2: true,
                discountCP: true,
                discountCPIndent: true,
                discountLP: true,
                discountLPIndent: true,
                discountLighting: true,
                discountLightingIndent: true,
            },
        });
    } catch {
        return null;
    }
}

// Normalize SKU string for matching (remove spaces, dashes, slashes)
function normalizeSku(sku: string): string {
    return sku.replace(/[\s\-\/\.]/g, "").toUpperCase();
}

// Extract items from Excel/CSV buffer
async function parseExcel(buffer: Buffer): Promise<Array<{ sku: string; qty: number; rawRow: string }>> {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const items: Array<{ sku: string; qty: number; rawRow: string }> = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

        // Try to detect header row and SKU/Qty columns
        let skuColIndex = -1;
        let qtyColIndex = -1;

        for (let r = 0; r < Math.min(rows.length, 5); r++) {
            const row = rows[r];
            for (let c = 0; c < row.length; c++) {
                const cell = String(row[c] || "").toLowerCase().trim();
                if (["sku", "part number", "part no", "part no.", "kode", "item code", "material", "artikel", "product code", "product no"].some(k => cell.includes(k))) {
                    skuColIndex = c;
                }
                if (["qty", "quantity", "pcs", "jumlah", "unit", "amount"].some(k => cell.includes(k))) {
                    qtyColIndex = c;
                }
            }
            if (skuColIndex >= 0 && qtyColIndex >= 0) {
                // Process rows after header
                for (let i = r + 1; i < rows.length; i++) {
                    const dataRow = rows[i];
                    const rawSku = String(dataRow[skuColIndex] || "").trim();
                    const rawQty = dataRow[qtyColIndex];
                    if (!rawSku || rawSku.length < 3) continue;
                    const qty = parseFloat(String(rawQty).replace(",", ".")) || 1;
                    items.push({ sku: rawSku, qty: Math.ceil(qty), rawRow: dataRow.join(" | ") });
                }
                break;
            }
        }

        // Fallback: if no headers found, scan all cells for SKU-like patterns
        if (skuColIndex < 0) {
            for (let r = 0; r < rows.length; r++) {
                const row = rows[r];
                for (let c = 0; c < row.length; c++) {
                    const cell = String(row[c] || "").trim();
                    // Detect Siemens-like part numbers (e.g., 5SL6116-7, 3RT2015-1AB01)
                    if (/^[0-9][A-Z0-9]{3,}[-\/]?[A-Z0-9]+$/i.test(cell) && cell.length >= 6) {
                        // Try to find adjacent qty
                        let qty = 1;
                        for (let offset = 1; offset <= 3; offset++) {
                            const adjacent = String(row[c + offset] || "").trim();
                            const parsed = parseFloat(adjacent.replace(",", "."));
                            if (!isNaN(parsed) && parsed > 0 && parsed < 10000) {
                                qty = Math.ceil(parsed);
                                break;
                            }
                        }
                        items.push({ sku: cell, qty, rawRow: row.join(" | ") });
                    }
                }
            }
        }
    }

    return items;
}

// Extract text from PDF using pdf-parse
async function parsePdf(buffer: Buffer): Promise<string> {
    try {
        // Dynamic import to avoid issues with pdf-parse
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        return data.text || "";
    } catch (err) {
        console.error("PDF parse error:", err);
        return "";
    }
}

// Extract BOM items from text (for PDF or OCR result)
function extractItemsFromText(text: string): Array<{ sku: string; qty: number }> {
    const items: Array<{ sku: string; qty: number }> = [];
    const lines = text.split("\n");

    for (const line of lines) {
        // Match patterns like: "5SL6116-7  2 pcs" or "3RT2015-1AB01  Qty: 5"
        const partMatch = line.match(/([0-9][A-Z0-9]{3,}[-\/]?[A-Z0-9]+)/i);
        const qtyMatch = line.match(/(?:qty|pcs|pc|unit|jumlah|quantity)?[:\s]*([0-9]+(?:[.,][0-9]+)?)\s*(?:pcs|pc|unit|buah)?/i);

        if (partMatch && partMatch[1].length >= 6) {
            const qty = qtyMatch ? Math.ceil(parseFloat(qtyMatch[1].replace(",", "."))) || 1 : 1;
            items.push({ sku: partMatch[1].toUpperCase(), qty });
        }
    }

    return items;
}

// Extract items from image using Gemini Vision
async function parseImageWithGemini(buffer: Buffer, mimeType: string): Promise<Array<{ sku: string; qty: number }>> {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) return [];

        const base64 = buffer.toString("base64");
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Extract all product/part numbers and their quantities from this image. 
                                    Return ONLY a JSON array in this format: [{"sku": "PART-NUMBER", "qty": 1}]
                                    Rules:
                                    - Include all alphanumeric codes that look like product/part numbers (e.g., 5SL6116-7, MCB-16A, etc.)
                                    - For qty, look for numbers near "pcs", "qty", "unit", "jumlah", or quantity columns
                                    - If qty is not clear, default to 1
                                    - Return ONLY the JSON array, no other text`,
                                },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.1,
                    },
                }),
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
            return parsed.map((item: any) => ({
                sku: String(item.sku || item.part_number || item.code || "").toUpperCase().trim(),
                qty: Math.ceil(parseFloat(String(item.qty || item.quantity || 1).replace(",", "."))) || 1,
            })).filter(item => item.sku.length >= 3);
        }
        return [];
    } catch (err) {
        console.error("Gemini vision error:", err);
        return [];
    }
}

// Match extracted items with database products
async function matchProductsInDb(
    items: Array<{ sku: string; qty: number }>,
    customerData: any,
    categoryMappings: any[],
    discountRules: any[]
) {
    const results: any[] = [];

    for (const item of items) {
        // Try exact SKU match first
        let product = await db.product.findFirst({
            where: {
                isVisible: true,
                OR: [
                    { sku: { equals: item.sku, mode: "insensitive" } },
                    { sku: { equals: item.sku.replaceAll("-", "/"), mode: "insensitive" } },
                    { sku: { contains: item.sku, mode: "insensitive" } },
                    { name: { contains: item.sku, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                image: true,
                brand: true,
                category: true,
                availableToSell: true,
                indentTime: true,
                description: true,
            },
        });

        if (product) {
            const priceInfo = calculatePriceInfo(
                product.price,
                product.category,
                customerData,
                categoryMappings,
                product.availableToSell,
                discountRules,
                product.brand,
                null
            );

            results.push({
                requestedSku: item.sku,
                qty: item.qty,
                found: true,
                product: {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    brand: product.brand,
                    image: product.image,
                    availableToSell: product.availableToSell,
                    stockStatus: product.availableToSell > 0 ? "Ready" : "Indent",
                    indentTime: product.availableToSell === 0 ? product.indentTime : null,
                    // Pricing
                    unitPrice: priceInfo.discountedPriceWithPPN,
                    totalPrice: priceInfo.discountedPriceWithPPN * item.qty,
                    hasDiscount: priceInfo.hasDiscount,
                    discountStr: priceInfo.discountStr,
                    unitPriceDisplay: formatRupiah(priceInfo.discountedPriceWithPPN),
                    originalPriceDisplay: priceInfo.hasDiscount
                        ? formatRupiah(priceInfo.originalPriceWithPPN)
                        : null,
                    totalPriceDisplay: formatRupiah(priceInfo.discountedPriceWithPPN * item.qty),
                    productUrl: `/produk/${product.sku.replaceAll("/", "-")}`,
                },
            });
        } else {
            results.push({
                requestedSku: item.sku,
                qty: item.qty,
                found: false,
                product: null,
            });
        }
    }

    return results;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const customerId = (formData.get("customerId") as string) || null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const fileName = file.name.toLowerCase();
        const buffer = Buffer.from(await file.arrayBuffer());

        // Fetch pricing data
        const [customerData, categoryMappings, discountRules] = await Promise.all([
            getCustomerPricingData(customerId),
            db.categoryMapping.findMany(),
            db.discountRule.findMany(),
        ]);

        let extractedItems: Array<{ sku: string; qty: number }> = [];
        let parseMethod = "";

        // Parse based on file type
        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
            parseMethod = "excel";
            const excelItems = await parseExcel(buffer);
            extractedItems = excelItems.map(i => ({ sku: i.sku, qty: i.qty }));
        } else if (fileName.endsWith(".pdf")) {
            parseMethod = "pdf";
            const text = await parsePdf(buffer);
            extractedItems = extractItemsFromText(text);
        } else if (
            fileName.endsWith(".png") ||
            fileName.endsWith(".jpg") ||
            fileName.endsWith(".jpeg") ||
            fileName.endsWith(".webp")
        ) {
            parseMethod = "vision";
            const mimeType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
            extractedItems = await parseImageWithGemini(buffer, mimeType);
        } else {
            return NextResponse.json({ error: "File format tidak didukung. Gunakan: PDF, Excel (.xlsx/.xls), atau gambar (.jpg/.png)" }, { status: 400 });
        }

        if (extractedItems.length === 0) {
            return NextResponse.json({
                success: false,
                message: "Tidak ada kode produk yang berhasil diekstrak dari file. Pastikan file berisi kolom SKU/Part Number.",
                parseMethod,
                items: [],
            });
        }

        // Remove duplicates by SKU
        const uniqueItems = Array.from(
            extractedItems.reduce((map, item) => {
                const key = normalizeSku(item.sku);
                if (!map.has(key)) map.set(key, item);
                else map.get(key)!.qty += item.qty;
                return map;
            }, new Map<string, { sku: string; qty: number }>()).values()
        );

        // Match with database
        const matchedItems = await matchProductsInDb(uniqueItems, customerData, categoryMappings, discountRules);

        const foundCount = matchedItems.filter(i => i.found).length;
        const notFoundCount = matchedItems.filter(i => !i.found).length;

        // Calculate grand total
        const grandTotal = matchedItems
            .filter(i => i.found)
            .reduce((sum, i) => sum + i.product.totalPrice, 0);

        return NextResponse.json({
            success: true,
            parseMethod,
            fileName: file.name,
            totalExtracted: uniqueItems.length,
            foundCount,
            notFoundCount,
            hasCustomerPricing: !!customerData,
            grandTotal,
            grandTotalDisplay: formatRupiah(grandTotal),
            items: matchedItems,
        });
    } catch (err: any) {
        console.error("Upload parse error:", err);
        return NextResponse.json({ error: err.message || "Server error saat memproses file" }, { status: 500 });
    }
}
