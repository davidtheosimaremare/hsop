/**
 * Script: restore-siemens-price-adjustment.ts
 *
 * Tujuan:
 *   Melanjutkan pemulihan dokumen Penyesuaian Harga Siemens (+10%) ke Accurate Online.
 *   - Dokumen 1/5 (SPA.2026.05.00912) & Dokumen 2/5 (SPA.2026.05.00913) sudah berhasil tersimpan.
 *   - Script ini otomatis memeriksa dokumen yang sudah ada dan melanjutkan Dokumen 3, 4, 5.
 *   - Memiliki retry otomatis jika terjadi gangguan jaringan (fetch failed).
 */

import { PrismaClient } from "@prisma/client";
import { generateAccurateAuthHeaders } from "../src/lib/accurate.ts";

const db = new PrismaClient();

const MARKUP_PERCENT = 10;
const PRICE_CATEGORY_NAME = "Umum";
const ADJUSTMENT_TYPE = "ITEM_PRICE_TYPE";
const MAX_ITEM_PER_DOC = 1000;
const HOST = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
const TRANS_DATE = process.env.TRANS_DATE || "29/05/2026";

function roundToNearest(value: number, nearest: number = 100): number {
    return Math.round(value / nearest) * nearest;
}

function isSiemensProduct(p: { sku: string; name: string; brand: string | null }): boolean {
    if (p.brand && p.brand.toLowerCase().includes("siemens")) return true;
    if (p.name && p.name.toLowerCase().includes("siemens")) return true;
    const sku = (p.sku || "").toUpperCase();
    return (
        sku.startsWith("5S") ||
        sku.startsWith("3V") ||
        sku.startsWith("3W") ||
        sku.startsWith("7K") ||
        sku.startsWith("3K") ||
        sku.startsWith("3R") ||
        sku.startsWith("3T") ||
        sku.startsWith("6E") ||
        sku.startsWith("3U") ||
        sku.startsWith("3N") ||
        sku.startsWith("8U") ||
        sku.startsWith("3L")
    );
}

interface DetailItem {
    itemNo: string;
    name?: string;
    price: number;
    priceCategoryName: string;
}

function extractBadSkuFromError(message: string, chunk: DetailItem[]): string | null {
    // 1. Format: Barang "..." berstatus Non Aktif.
    const quoteMatch = message.match(/Barang\s+"([^"]+)"/i);
    if (quoteMatch) {
        const text = quoteMatch[1].trim();
        const found = chunk.find(
            (i) =>
                (i.name && i.name.trim().toLowerCase() === text.toLowerCase()) ||
                i.itemNo.trim().toLowerCase() === text.toLowerCase()
        );
        if (found) return found.itemNo;
    }

    // 2. Format: Barang & Jasa SKU tidak ditemukan atau sudah dihapus
    const m1 = message.match(/Barang\s+(?:&\s+Jasa\s+)?([^\s'"]+)/i);
    if (m1 && m1[1]) {
        const candidate = m1[1].replace(/['",]/g, "").trim();
        const found = chunk.find((i) => i.itemNo.toLowerCase() === candidate.toLowerCase());
        if (found) return found.itemNo;
        return candidate;
    }

    // 3. Format: Item SKU ...
    const m2 = message.match(/Item\s+([^\s'"]+)/i);
    if (m2 && m2[1]) return m2[1].replace(/['",]/g, "").trim();

    return null;
}

function isItemError(message: string): boolean {
    const lower = message.toLowerCase();
    return (
        lower.includes("non aktif") ||
        lower.includes("tidak ditemukan") ||
        lower.includes("sudah dihapus")
    );
}

// Call Accurate API dengan retry otomatis jika error jaringan
async function callSaveWithRetry(
    items: DetailItem[],
    description: string,
    maxRetries = 5
): Promise<{ id?: number; number?: string }> {
    const cleanDetailItems = items.map((i) => ({
        itemNo: i.itemNo,
        price: i.price,
        priceCategoryName: i.priceCategoryName,
    }));

    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const headers = await generateAccurateAuthHeaders();
            if (!headers) throw new Error("Gagal membuat header otentikasi Accurate");

            const res = await fetch(`${HOST}/accurate/api/sellingprice-adjustment/save.do`, {
                method: "POST",
                headers: headers as HeadersInit,
                body: JSON.stringify({
                    transDate: TRANS_DATE,
                    salesAdjustmentType: ADJUSTMENT_TYPE,
                    priceCategoryName: PRICE_CATEGORY_NAME,
                    description,
                    detailItem: cleanDetailItems,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text}`);
            }

            const result = await res.json();
            if (!result.s) {
                const errMsg = result.d?.[0] || result.message || "Accurate API error";
                throw new Error(errMsg);
            }

            return {
                id: result.r?.id,
                number: result.r?.number || result.r?.no,
            };
        } catch (err: any) {
            lastError = err;
            const errMsg = err.message || "";
            // Jika error item non-aktif/tidak ditemukan, jangan retry jaringan — throw langsung ke handler item
            if (isItemError(errMsg)) {
                throw err;
            }

            console.warn(`   ⚠️ Jaringan terganggu (${errMsg}). Mencoba ulang (${attempt}/${maxRetries}) dalam 3 detik...`);
            await new Promise((r) => setTimeout(r, 3000));
        }
    }

    throw lastError;
}

// Cek dokumen yang sudah ada di Accurate
async function getExistingDocDescriptions(): Promise<Set<string>> {
    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) return new Set();

        const res = await fetch(
            `${HOST}/accurate/api/sellingprice-adjustment/list.do?fields=id,number,description&sp.pageSize=20&sp.sort=id|desc`,
            { headers: headers as HeadersInit }
        );
        const data = await res.json();
        const descs = new Set<string>();
        for (const d of data.d || []) {
            if (d.description) descs.add(d.description);
        }
        return descs;
    } catch {
        return new Set();
    }
}

// Daftar item yang sudah teridentifikasi non-aktif/tidak ditemukan
const KNOWN_INACTIVE_SKUS = new Set([
    "( - 6AA0x - )",
    "3UF7933-OBA00-0",
    "3WA1106-2AB02-0AA0-Z",
    "3WA1106-2AC12-0AA0-Z",
    "3WA1106-2CF02-0AA0-Z",
    "3WA1106-2CF62-0AA0-Z",
    "3WA1106-3AB42-0AA0-Z",
    "3WA1106-3AC12-0AA0-Z",
    "3WA1106-3AC32-0AA0-Z",
    "3WA1106-3AC42-0AA0-Z",
    "3WA1106-3CE12-0AA0-Z",
    "3WA1106-3CE62-0AA0-Z",
    "3WA1106-4AB12-0AA0-Z",
    "3WA1106-4AB42-0AA0-Z",
    "3WA1112-4CF62-0AA0-Z",
    "3WA1116-2CE62-0AA0-Z",
]);

async function main() {
    console.log("══════════════════════════════════════════════════════════════════════");
    console.log("  🔄 MELANJUTKAN PEMULIHAN PENYESUAIAN HARGA SIEMENS (+10%)");
    console.log(`  Tanggal Efektif : ${TRANS_DATE}`);
    console.log(`  Kenaikan Harga  : +${MARKUP_PERCENT}%`);
    console.log(`  Kategori Harga  : ${PRICE_CATEGORY_NAME}`);
    console.log(`  Maks Per Dokumen: ${MAX_ITEM_PER_DOC} item`);
    console.log("══════════════════════════════════════════════════════════════════════\n");

    // 1. Cek dokumen yang sudah ada di Accurate
    console.log("🔍 Memeriksa dokumen yang sudah ada di Accurate...");
    const existingDescs = await getExistingDocDescriptions();
    console.log(`   Ditemukan ${existingDescs.size} dokumen sebelumnya.`);

    // 2. Ambil produk dari database
    console.log("📦 Mengambil data produk Siemens dari database...");
    const allProducts = await db.product.findMany({
        where: {
            status: "APPROVED",
            price: { gt: 0 },
        },
        select: {
            id: true,
            sku: true,
            name: true,
            brand: true,
            price: true,
        },
        orderBy: { sku: "asc" },
    });

    const siemensProducts = allProducts.filter(isSiemensProduct);
    console.log(`✅ Ditemukan ${siemensProducts.length} produk Siemens aktif.`);

    const allItems: DetailItem[] = siemensProducts.map((p) => ({
        itemNo: p.sku,
        name: p.name,
        price: roundToNearest(p.price * (1 + MARKUP_PERCENT / 100)),
        priceCategoryName: PRICE_CATEGORY_NAME,
    }));

    // Split menjadi 5 chunk 1000 item
    const chunks: DetailItem[][] = [];
    for (let i = 0; i < allItems.length; i += MAX_ITEM_PER_DOC) {
        chunks.push(allItems.slice(i, i + MAX_ITEM_PER_DOC));
    }

    console.log(`🚀 Total ${chunks.length} dokumen yang harus ada di Accurate.\n`);

    const createdDocs: Array<{ number: string; itemCount: number; note: string }> = [];
    let totalSkipped = 0;

    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        const docLabel = `Dokumen ${i + 1}/${chunks.length}`;

        // Cek apakah dokumen ini sudah ada di Accurate
        const alreadyExists = Array.from(existingDescs).some((desc) => desc.includes(docLabel));
        if (alreadyExists) {
            console.log(`📄 [${docLabel}] ⏭️  SUDAH ADA di Accurate. Dilewati.`);
            createdDocs.push({
                number: `(Sudah ada: ${docLabel})`,
                itemCount: chunk.length,
                note: "Sudah tersimpan sebelumnya",
            });
            continue;
        }

        console.log(`\n📄 [${docLabel}] Memproses ${chunk.length} item...`);

        // Pre-filter item yang sudah diketahui non-aktif
        const initialCount = chunk.length;
        chunk = chunk.filter((item) => !KNOWN_INACTIVE_SKUS.has(item.itemNo));
        const preFiltered = initialCount - chunk.length;
        if (preFiltered > 0) {
            console.log(`   ℹ️  ${preFiltered} item yang sudah diketahui non-aktif dilewati otomatis.`);
            totalSkipped += preFiltered;
        }

        let submitted = false;
        let attempt = 0;
        const maxAttempts = 150;

        while (!submitted && attempt < maxAttempts) {
            attempt++;
            try {
                const desc = `Kenaikan Harga Siemens +${MARKUP_PERCENT}% — ${docLabel} (${chunk.length} aktif) — ${TRANS_DATE}`;
                const result = await callSaveWithRetry(chunk, desc);
                console.log(`   ✅ BERHASIL: ${result.number || result.id} (${chunk.length} item)`);
                createdDocs.push({
                    number: result.number || String(result.id),
                    itemCount: chunk.length,
                    note: "Berhasil dibuat",
                });
                submitted = true;
            } catch (err: any) {
                const errMsg = err.message || "";
                if (!isItemError(errMsg)) {
                    console.error(`   ❌ Error Fatal: ${errMsg}`);
                    break;
                }

                const badSku = extractBadSkuFromError(errMsg, chunk);
                if (badSku) {
                    console.log(`   ⚠️ Item non-aktif / dihapus: ${badSku} (di-skip)`);
                    chunk = chunk.filter((item) => item.itemNo !== badSku);
                    totalSkipped++;
                    continue;
                }

                console.error(`   ❌ Gagal mengekstrak SKU dari error: ${errMsg}`);
                break;
            }
        }
    }

    console.log("\n══════════════════════════════════════════════════════════════════════");
    console.log("🎉 STATUS PEMULIHAN DOKUMEN ACCURATE");
    console.log(`   Total dokumen berhasil/ada: ${createdDocs.length} dari ${chunks.length}`);
    console.log(`   Total item non-aktif di-skip : ${totalSkipped}`);
    createdDocs.forEach((d, idx) => {
        console.log(`     #${idx + 1} ${d.number} (${d.itemCount} item) - ${d.note}`);
    });
    console.log("══════════════════════════════════════════════════════════════════════\n");
}

main()
    .catch((err) => {
        console.error("🔥 Fatal:", err);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
