import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculatePriceInfo } from "@/lib/pricing";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const rateLimit = new Map<string, { count: number; lastReset: number }>();

const sumopod = createOpenAI({
    baseURL: "https://ai.sumopod.com/v1",
    apiKey: process.env.SUMOPOD_API_KEY || "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    compatibility: "strict", // Use strict mode
    fetch: async (url, init) => {
        if (init && typeof init.body === 'string') {
            try {
                const body = JSON.parse(init.body);
                // SumoPod (LiteLLM) STRICTLY requires type: "object" in tool schemas.
                // AI SDK sometimes strips this. We inject it back.
                if (body.tools) {
                    body.tools.forEach((t: any) => {
                        if (t.function && t.function.parameters) {
                            t.function.parameters.type = "object";
                        }
                    });
                }
                init.body = JSON.stringify(body);
            } catch (e) {
                // Ignore parse errors
            }
        }
        return fetch(url, init);
    }
});

// Format harga Rupiah
function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Fetch data customer + diskon dari DB
async function getCustomerPricingData(customerId: string | null) {
    if (!customerId) return null;
    try {
        const customer = await db.customer.findUnique({
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
        return customer;
    } catch {
        return null;
    }
}

// Fetch category mappings & discount rules
async function getPricingRules() {
    const [categoryMappings, discountRules] = await Promise.all([
        db.categoryMapping.findMany(),
        db.discountRule.findMany(),
    ]);
    return { categoryMappings, discountRules };
}

// Kalkulasi harga dengan diskon customer
function getDiscountedPrice(
    product: { price: number; category: string | null; availableToSell: number; brand: string | null },
    customerDiscount: any,
    categoryMappings: any[],
    discountRules: any[]
) {
    const priceInfo = calculatePriceInfo(
        product.price,
        product.category,
        customerDiscount,
        categoryMappings,
        product.availableToSell,
        discountRules,
        product.brand,
        null
    );
    return priceInfo;
}

// Scrape Sieportal untuk produk Siemens
async function searchSieportal(query: string): Promise<any[]> {
    try {
        // Gunakan iMall Siemens yang bisa diakses publik
        const searchUrl = `https://mall.industry.siemens.com/mall/en/ww/Catalog/Search?q=${encodeURIComponent(query)}&searchType=1`;
        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json, text/html",
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) return [];

        const html = await response.text();
        // Parse hasil HTML secara sederhana
        const results: any[] = [];
        const productMatches = html.matchAll(
            /data-productcode="([^"]+)"[^>]*>[\s\S]*?class="[^"]*product-name[^"]*"[^>]*>([^<]+)</g
        );
        for (const match of productMatches) {
            results.push({
                sku: match[1]?.trim(),
                name: match[2]?.trim(),
                source: "Siemens iMall",
                url: `https://mall.industry.siemens.com/mall/en/ww/Catalog/Product/${match[1]?.trim()}`,
            });
            if (results.length >= 5) break;
        }
        return results;
    } catch {
        return [];
    }
}

export async function POST(req: Request) {
    // Simple IP-based Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 30;

    const record = rateLimit.get(ip) || { count: 0, lastReset: now };
    if (now - record.lastReset > windowMs) {
        record.count = 0;
        record.lastReset = now;
    }
    if (record.count >= maxRequests) {
        return new Response("Too many requests. Please try again later.", { status: 429 });
    }
    record.count++;
    rateLimit.set(ip, record);

    let body: any = {};
    try {
        body = await req.json();
    } catch (e) {
        return new Response("Invalid JSON", { status: 400 });
    }
    const { messages = [], customerId } = body;

    // Convert frontend messages to CoreMessage format properly
    const coreMessages = messages.map((m: any) => {
        let content = m.content;
        if (!content && m.parts) {
            content = m.parts.map((p: any) => p.text || "").join("");
        }
        return {
            role: m.role,
            content: content || "",
        };
    });

    // Ambil session dari cookie untuk keamanan (optional override customerId)
    let resolvedCustomerId: string | null = customerId || null;

    // Ambil data pricing customer
    const [customerData, pricingRules] = await Promise.all([
        getCustomerPricingData(resolvedCustomerId),
        getPricingRules(),
    ]);

    const { categoryMappings, discountRules } = pricingRules;

    try {
        const result = streamText({
            model: sumopod.chat("gpt-4.1-mini", { structuredOutputs: false }),
            system: `Kamu adalah **Hokiindo AI Assistant**, asisten cerdas untuk "Shop Hokiindo" — Distributor Resmi Siemens Electrical di Indonesia.

IDENTITAS:
- Nama: Hokiindo AI
- Bahasa: Selalu gunakan Bahasa Indonesia yang ramah dan profesional
- Spesialisasi: Produk Siemens Electrical (MCB, MCCB, Contactor, Relay, Panel, PLC, dll)

KEMAMPUAN UTAMA:
1. Cari produk dari database stok kami (utamakan selalu dari sini)
2. Tampilkan deskripsi dan spesifikasi produk lengkap
3. Jika produk tidak ada di database → cari di Siemens iMall sebagai referensi
4. Cek status pesanan/quotation

ATURAN HARGA:
- Tampilkan harga dengan format "Rp X.XXX.XXX"
- Jika customer memiliki diskon khusus, tampilkan harga setelah diskon
- Produk dengan stok > 0 = "Ready" | stok = 0 = "Indent"

ATURAN TOOLS:
- Selalu gunakan 'searchProducts' DULU ketika user tanya produk
- Gunakan 'getProductDetail' untuk detail/spesifikasi produk spesifik
- Gunakan 'searchExternalSiemens' HANYA jika searchProducts tidak menemukan hasil
- Gunakan 'checkOrder' ketika user menyebut nomor quotation (misal "Q-2024-xxx")

FORMAT RESPONS:
- SANGAT PENTING: Jika menemukan produk, CUKUP katakan "Saya menemukan X produk yang sesuai, silakan lihat daftarnya di bawah ini."
- JANGAN PERNAH membuat daftar produk (1. 2. 3.) di dalam teks balasan Anda! Sistem kami akan otomatis memunculkan 'Card Produk' dengan gambar dan tombol secara visual.
- JANGAN PERNAH menampilkan URL gambar, harga, atau detail mentah di dalam teks obrolan.
- Jika tidak ditemukan di DB: beritahu dan tawarkan pencarian eksternal.

HANDOFF KE WHATSAPP:
Jika tidak bisa membantu: "Maaf, untuk informasi lebih lanjut silakan hubungi tim kami via WhatsApp di nomor yang tersedia."`,
            messages: coreMessages,
            stopWhen: stepCountIs(5),
            tools: {
                searchProducts: tool({
                    description:
                        "Cari produk dari database stok Hokiindo berdasarkan nama, brand, atau kode SKU. Gunakan tool ini PERTAMA KALI ketika user menanyakan produk.",
                    parameters: z.object({
                        query: z.string().describe("Kata kunci pencarian produk (contoh: 'MCB 16A', 'Contactor Siemens', '5SL6116')"),
                    }),
                    // @ts-ignore
                    execute: async (args: any) => {
                        const query = args.query || args.keyword || args.q || "";
                        if (!query) {
                            return { found: false, message: "Kata kunci pencarian kosong.", products: [] };
                        }
                        const limit = 6;
                        try {
                            // Normalisasi query untuk singkatan pole, ampere, volt, watt dll
                            let normalizedQuery = query.toLowerCase()
                                .replace(/(\d+)\s*-\s*poles?/g, "$1p")
                                .replace(/(\d+)\s+poles?/g, "$1p")
                                .replace(/(\d+)\s*ampere/g, "$1a")
                                .replace(/(\d+)\s*amp/g, "$1a")
                                .replace(/(\d+)\s+a\b/g, "$1a")
                                .replace(/(\d+)\s*kiloampere/g, "$1ka")
                                .replace(/(\d+)\s+ka\b/g, "$1ka")
                                .replace(/(\d+)\s*volts?/g, "$1v")
                                .replace(/(\d+)\s+v\b/g, "$1v")
                                .replace(/(\d+)\s*kilowatts?/g, "$1kw")
                                .replace(/(\d+)\s+kw\b/g, "$1kw")
                                .replace(/(\d+)\s*watts?/g, "$1w")
                                .replace(/(\d+)\s+w\b/g, "$1w")
                                .replace(/(\d+)\s*hertz?/g, "$1hz")
                                .replace(/(\d+)\s+hz\b/g, "$1hz");
                                
                            const rawWords = normalizedQuery.split(" ").filter((w: string) => w.trim().length > 0);
                            
                            // Generate variasi untuk kata kunci unit
                            const wordsWithVariations = rawWords.map((word: string) => {
                                const poleMatch = word.match(/^(\d+)p$/);
                                if (poleMatch) return [word, `${poleMatch[1]} pole`, `${poleMatch[1]}-pole`, `${poleMatch[1]} poles`, `${poleMatch[1]}-poles`];
                                
                                const kaMatch = word.match(/^(\d+)ka$/);
                                if (kaMatch) return [word, `${kaMatch[1]} ka`, `${kaMatch[1]}k a`];
                                
                                const ampMatch = word.match(/^(\d+)a$/);
                                if (ampMatch) return [word, `${ampMatch[1]} a`, `${ampMatch[1]}amp`, `${ampMatch[1]} amp`, `${ampMatch[1]}ampere`, `${ampMatch[1]} ampere`];
                                
                                const voltMatch = word.match(/^(\d+)v$/);
                                if (voltMatch) return [word, `${voltMatch[1]} v`, `${voltMatch[1]}volt`, `${voltMatch[1]} volt`, `${voltMatch[1]}vac`, `${voltMatch[1]} vac`, `${voltMatch[1]}vdc`, `${voltMatch[1]} vdc`];
                                
                                const kwMatch = word.match(/^(\d+)kw$/);
                                if (kwMatch) return [word, `${kwMatch[1]} kw`, `${kwMatch[1]}kilowatt`, `${kwMatch[1]} kilowatt`];
                                
                                const wattMatch = word.match(/^(\d+)w$/);
                                if (wattMatch) return [word, `${wattMatch[1]} w`, `${wattMatch[1]}watt`, `${wattMatch[1]} watt`];
                                
                                const hzMatch = word.match(/^(\d+)hz$/);
                                if (hzMatch) return [word, `${hzMatch[1]} hz`, `${hzMatch[1]}hertz`, `${hzMatch[1]} hertz`];
                                
                                return [word];
                            });

                            const products = await db.product.findMany({
                                where: {
                                    isVisible: true,
                                    status: "APPROVED",
                                    AND: wordsWithVariations.map((variations: string[]) => ({
                                        OR: variations.flatMap((v: string) => [
                                            { name: { contains: v, mode: "insensitive" } },
                                            { brand: { contains: v, mode: "insensitive" } },
                                            { sku: { contains: v, mode: "insensitive" } },
                                            { category: { contains: v, mode: "insensitive" } },
                                            { description: { contains: v, mode: "insensitive" } },
                                        ])
                                    }))
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
                                orderBy: [{ availableToSell: "desc" }, { sortWeight: "asc" }],
                                take: Math.min(limit, 10),
                            });

                            if (products.length === 0) {
                                return {
                                    found: false,
                                    message: `Tidak ada produk dengan kata kunci "${query}" di database kami.`,
                                    products: [],
                                };
                            }

                            // Kalkulasi harga dengan diskon
                            const productsWithPricing = products.map((p) => {
                                const priceInfo = getDiscountedPrice(p, customerData, categoryMappings, discountRules);
                                return {
                                    id: p.id,
                                    name: p.name,
                                    sku: p.sku,
                                    brand: p.brand,
                                    category: p.category,
                                    image: p.image,
                                    availableToSell: p.availableToSell,
                                    stockStatus: p.availableToSell > 0 ? "Ready" : "Indent",
                                    indentTime: p.availableToSell === 0 ? p.indentTime : null,
                                    description: p.description?.substring(0, 150),
                                    // Pricing
                                    originalPrice: priceInfo.originalPriceWithPPN,
                                    finalPrice: priceInfo.discountedPriceWithPPN,
                                    hasDiscount: priceInfo.hasDiscount,
                                    discountStr: priceInfo.discountStr,
                                    priceDisplay: formatRupiah(priceInfo.discountedPriceWithPPN),
                                    originalPriceDisplay: priceInfo.hasDiscount
                                        ? formatRupiah(priceInfo.originalPriceWithPPN)
                                        : null,
                                    // URL produk
                                    productUrl: `/produk/${p.sku.replaceAll("/", "-")}`,
                                };
                            });

                            return {
                                found: true,
                                count: productsWithPricing.length,
                                hasCustomerPricing: !!customerData,
                                products: productsWithPricing,
                            };
                        } catch (err) {
                            console.error("searchProducts error:", err);
                            return { found: false, message: "Terjadi kesalahan saat mencari produk.", products: [] };
                        }
                    },
                }),

                getProductDetail: tool({
                    description:
                        "Ambil detail lengkap produk termasuk deskripsi penuh, spesifikasi teknis, dan informasi datasheet berdasarkan SKU atau nama produk.",
                    parameters: z.object({
                        query: z.string().describe("SKU produk atau nama produk yang ingin dilihat detailnya"),
                    }),
                    // @ts-ignore
                    execute: async ({ query }: { query: string }) => {
                        try {
                            const product = await db.product.findFirst({
                                where: {
                                    isVisible: true,
                                    OR: [
                                        { sku: { equals: query, mode: "insensitive" } },
                                        { name: { contains: query, mode: "insensitive" } },
                                        { sku: { contains: query, mode: "insensitive" } },
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
                                    longDescription: true,
                                    specifications: true,
                                    datasheet: true,
                                },
                            });

                            if (!product) {
                                return {
                                    found: false,
                                    message: `Produk dengan SKU/nama "${query}" tidak ditemukan di database.`,
                                };
                            }

                            const priceInfo = getDiscountedPrice(product, customerData, categoryMappings, discountRules);

                            return {
                                found: true,
                                product: {
                                    id: product.id,
                                    name: product.name,
                                    sku: product.sku,
                                    brand: product.brand,
                                    category: product.category,
                                    image: product.image,
                                    stockStatus: product.availableToSell > 0 ? "Ready" : "Indent",
                                    availableToSell: product.availableToSell,
                                    indentTime: product.availableToSell === 0 ? product.indentTime : null,
                                    description: product.description,
                                    longDescription: product.longDescription?.substring(0, 500),
                                    specifications: product.specifications,
                                    datasheet: product.datasheet,
                                    finalPrice: priceInfo.discountedPriceWithPPN,
                                    hasDiscount: priceInfo.hasDiscount,
                                    discountStr: priceInfo.discountStr,
                                    priceDisplay: formatRupiah(priceInfo.discountedPriceWithPPN),
                                    originalPriceDisplay: priceInfo.hasDiscount
                                        ? formatRupiah(priceInfo.originalPriceWithPPN)
                                        : null,
                                    productUrl: `/produk/${product.sku.replaceAll("/", "-")}`,
                                },
                            };
                        } catch (err) {
                            console.error("getProductDetail error:", err);
                            return { found: false, message: "Terjadi kesalahan saat mengambil detail produk." };
                        }
                    },
                }),

                searchExternalSiemens: tool({
                    description:
                        "Cari produk di Siemens iMall (database eksternal Siemens) sebagai FALLBACK jika produk tidak ditemukan di database lokal Hokiindo.",
                    parameters: z.object({
                        query: z.string().describe("Kata kunci atau kode produk Siemens yang dicari"),
                    }),
                    // @ts-ignore
                    execute: async ({ query }: { query: string }) => {
                        try {
                            const results = await searchSieportal(query);
                            if (results.length === 0) {
                                return {
                                    found: false,
                                    message: `Produk "${query}" juga tidak ditemukan di Siemens iMall.`,
                                    products: [],
                                };
                            }
                            return {
                                found: true,
                                source: "Siemens iMall (Referensi Eksternal)",
                                note: "Produk ini adalah referensi dari Siemens iMall. Harga dan ketersediaan perlu dikonfirmasi. Hubungi tim Hokiindo untuk pemesanan.",
                                products: results,
                            };
                        } catch (err) {
                            console.error("searchExternalSiemens error:", err);
                            return { found: false, message: "Tidak dapat mengakses Siemens iMall saat ini.", products: [] };
                        }
                    },
                }),

                checkOrder: tool({
                    description: "Cek status sales quotation atau pesanan berdasarkan nomor quotation",
                    parameters: z.object({
                        quotationNo: z.string().describe("Nomor quotation (contoh: 'Q-2024-001' atau 'HSQ-2024-xxx')"),
                    }),
                    // @ts-ignore
                    execute: async ({ quotationNo }: { quotationNo: string }) => {
                        try {
                            const quotation = await db.salesQuotation.findUnique({
                                where: { quotationNo: quotationNo.toUpperCase() },
                                select: {
                                    quotationNo: true,
                                    status: true,
                                    totalAmount: true,
                                    trackingNumber: true,
                                    shippingNotes: true,
                                    createdAt: true,
                                    notes: true,
                                    items: {
                                        select: {
                                            productName: true,
                                            productSku: true,
                                            quantity: true,
                                            price: true,
                                            stockStatus: true,
                                        },
                                        take: 5,
                                    },
                                },
                            });
                            if (!quotation) {
                                return { found: false, message: `Quotation ${quotationNo} tidak ditemukan.` };
                            }
                            return {
                                found: true,
                                quotation: {
                                    ...quotation,
                                    totalAmountDisplay: quotation.totalAmount
                                        ? formatRupiah(quotation.totalAmount)
                                        : "Menunggu konfirmasi",
                                },
                            };
                        } catch (err) {
                            return { found: false, message: "Terjadi kesalahan saat mengecek pesanan." };
                        }
                    },
                }),
            },
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error("AI Error:", error.stack || error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
