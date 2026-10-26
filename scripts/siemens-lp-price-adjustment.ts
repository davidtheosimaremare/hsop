/**
 * Script: siemens-lp-price-adjustment.ts
 *
 * Tujuan:
 *   Mengirimkan dokumen Penyesuaian Harga (Selling Price Adjustment) ke Accurate Online
 *   khusus untuk produk Siemens dalam kategori "Siemens LP" sesuai mapping di:
 *   https://shop.hokiindo.co.id/admin/products/categories
 *
 * Kategori Siemens LP:
 *   - ACB
 *   - MCB
 *   - MCCB
 *   - MEASURING DEVICES
 *   - MCB BOX
 *   - MONITORING RELAYS
 *
 * Konfigurasi Default:
 *   - Markup: +5% (pembulatan ke ratusan terdekat)
 *   - Target: Khusus produk merk Siemens (2.806 produk)
 *   - Tipe Penyesuaian: ITEM_PRICE_TYPE
 *   - Kategori Harga: "Umum"
 *   - Max item per dokumen: 1000 item (menjadi ~3 dokumen)
 *
 * Cara Jalankan:
 *   # DRY RUN (Simulasi tanpa menyimpan ke Accurate):
 *   npm run siemens:lp:dry-run
 *   atau:
 *   DRY_RUN=true npx ts-node --esm scripts/siemens-lp-price-adjustment.ts
 *
 *   # LIVE (Simpan ke Accurate):
 *   npx ts-node --esm scripts/siemens-lp-price-adjustment.ts --live
 */

import { PrismaClient } from "@prisma/client";
import { generateAccurateAuthHeaders } from "../src/lib/accurate.ts";

const db = new PrismaClient();

// ─── Argument & Konfigurasi ───────────────────────────────────────────────────

const args = process.argv.slice(2);
const isLiveArg = args.includes("--live");
const isDryRunArg = args.includes("--dry-run");

// Default DRY_RUN adalah TRUE kecuali dipanggil dengan --live atau LIVE=true
const DRY_RUN = isDryRunArg || (!isLiveArg && process.env.DRY_RUN !== "false" && process.env.LIVE !== "true");

// Ambil persen markup dari argumen --percent atau env MARKUP_PERCENT (default: 5)
const percentArgIdx = args.indexOf("--percent");
const MARKUP_PERCENT = percentArgIdx !== -1 && args[percentArgIdx + 1]
    ? parseFloat(args[percentArgIdx + 1])
    : (process.env.MARKUP_PERCENT ? parseFloat(process.env.MARKUP_PERCENT) : 5);

const PRICE_CATEGORY_NAME = "Umum";
const ADJUSTMENT_TYPE = "ITEM_PRICE_TYPE";
const MAX_ITEM_PER_DOC = 1000;
const HOST = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayFormatted(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    return formatter.format(now); // "DD/MM/YYYY"
}

function roundToNearest(value: number, nearest: number = 100): number {
    return Math.round(value / nearest) * nearest;
}

function isInactiveOrNotFoundError(message: string): boolean {
    const lower = message.toLowerCase();
    return (
        lower.includes("non aktif") ||
        lower.includes("tidak ditemukan") ||
        lower.includes("sudah dihapus")
    );
}

interface DetailItem {
    itemNo: string;
    name?: string;
    price: number;
    priceCategoryName: string;
}

function extractBadSkuFromError(message: string, chunk?: DetailItem[]): string | null {
    // Case 1: Format Accurate untuk item Non Aktif:
    // Barang "SIEMENS ACC ACB, ..." berstatus Non Aktif. Barang ini tidak dapat digunakan.
    const quoteMatch = message.match(/Barang\s+"([^"]+)"/i);
    if (quoteMatch && chunk) {
        const text = quoteMatch[1].trim();
        const found = chunk.find(
            (i) =>
                (i.name && i.name.trim().toLowerCase() === text.toLowerCase()) ||
                i.itemNo.trim().toLowerCase() === text.toLowerCase()
        );
        if (found) return found.itemNo;
    }

    // Case 2: Format Accurate untuk item tidak ditemukan:
    // Barang & Jasa SKU tidak ditemukan atau sudah dihapus
    const m1 = message.match(/Barang\s+(?:&\s+Jasa\s+)?([^\s'"]+)/i);
    if (m1 && m1[1]) {
        const candidate = m1[1].replace(/['",]/g, "").trim();
        if (chunk) {
            const found = chunk.find((i) => i.itemNo.toLowerCase() === candidate.toLowerCase());
            if (found) return found.itemNo;
        }
        return candidate;
    }

    // Case 3: Format alternatif
    const m2 = message.match(/Item\s+([^\s'"]+)/i);
    if (m2 && m2[1]) return m2[1].replace(/['",]/g, "").trim();

    return null;
}

function isSiemensProduct(p: { sku: string; name: string; brand: string | null }): boolean {
    if (p.brand && p.brand.toLowerCase().includes("siemens")) return true;
    if (p.name && p.name.toLowerCase().includes("siemens")) return true;
    const sku = p.sku.toUpperCase();
    return (
        sku.startsWith("5S") ||
        sku.startsWith("3V") ||
        sku.startsWith("3W") ||
        sku.startsWith("7K") ||
        sku.startsWith("3K")
    );
}

// ─── API Accurate Helper ──────────────────────────────────────────────────────

async function callSave(items: DetailItem[], description: string): Promise<{ id?: number; number?: string }> {
    if (DRY_RUN) {
        await new Promise((r) => setTimeout(r, 100));
        const mockNumber = `DRY-SPA-${Date.now().toString().slice(-5)}`;
        return { id: 9999, number: mockNumber };
    }

    const headers = await generateAccurateAuthHeaders();
    if (!headers) throw new Error("Gagal membuat header otentikasi Accurate");

    // Bersihkan payload agar hanya mengirim field yang diterima API Accurate
    const cleanDetailItems = items.map((i) => ({
        itemNo: i.itemNo,
        price: i.price,
        priceCategoryName: i.priceCategoryName,
    }));

    const res = await fetch(`${HOST}/accurate/api/sellingprice-adjustment/save.do`, {
        method: "POST",
        headers: headers as HeadersInit,
        body: JSON.stringify({
            transDate: getTodayFormatted(),
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
}

// ─── Smart Scan Fallback (jika regex gagal menemukan SKU) ───────────────────────

async function findBadItemsFallback(items: DetailItem[], chunkSize: number = 100): Promise<Set<string>> {
    const badSkus = new Set<string>();
    const chunks: DetailItem[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const testRes = await callSave(chunk, `[TEST] Scan ${i + 1}/${chunks.length}`);
            // Jika berhasil disimpan dalam mode live, langsung hapus dokumen tes
            if (!DRY_RUN && testRes.id) {
                const headers = await generateAccurateAuthHeaders();
                if (headers) {
                    const delUrl = new URL(`${HOST}/accurate/api/sellingprice-adjustment/delete.do`);
                    delUrl.searchParams.set("id", String(testRes.id));
                    await fetch(delUrl.toString(), { method: "DELETE", headers: headers as HeadersInit });
                }
            }
        } catch (err: any) {
            if (isInactiveOrNotFoundError(err.message)) {
                if (chunkSize > 10) {
                    const subBad = await findBadItemsFallback(chunk, 10);
                    subBad.forEach((s) => badSkus.add(s));
                } else if (chunkSize > 1) {
                    const subBad = await findBadItemsFallback(chunk, 1);
                    subBad.forEach((s) => badSkus.add(s));
                } else {
                    badSkus.add(chunk[0].itemNo);
                    console.log(`   ⏭️  Item di-skip (Non Aktif/dihapus): ${chunk[0].itemNo}`);
                }
            } else {
                throw err;
            }
        }
    }

    return badSkus;
}

// ─── Main Execution ───────────────────────────────────────────────────────────

async function main() {
    console.log("══════════════════════════════════════════════════════════════════════");
    console.log("  ⚡ PENYESUAIAN HARGA ACCURATE — SIEMENS LP");
    console.log(`  Mode            : ${DRY_RUN ? "🟡 DRY RUN (Simulasi, tidak mengubah data di Accurate)" : "🔴 LIVE (Menyimpan langsung ke Accurate)"}`);
    console.log(`  Kenaikan Harga  : +${MARKUP_PERCENT}%`);
    console.log(`  Kategori Harga  : ${PRICE_CATEGORY_NAME}`);
    console.log(`  Tanggal Efektif : ${getTodayFormatted()}`);
    console.log(`  Maks Per Dokumen: ${MAX_ITEM_PER_DOC} item`);
    console.log("══════════════════════════════════════════════════════════════════════\n");

    // 1. Ambil kategori yang dipetakan ke "LP" dari database
    console.log("🔍 [1/4] Mengambil pemetaan kategori Siemens LP dari database...");
    const lpMappings = await db.categoryMapping.findMany({
        where: { discountType: "LP" },
        select: { categoryName: true },
    });

    const lpCategories = lpMappings.map((m) => m.categoryName);
    console.log(`✅ Ditemukan ${lpCategories.length} kategori LP: ${lpCategories.join(", ")}\n`);

    if (lpCategories.length === 0) {
        console.log("⚠️ Tidak ada kategori dengan discountType 'LP'. Script berhenti.");
        return;
    }

    // 2. Ambil produk dari database
    console.log("📦 [2/4] Mengambil produk dari database...");
    const allProducts = await db.product.findMany({
        where: {
            category: { in: lpCategories },
            status: "APPROVED",
            price: { gt: 0 },
        },
        select: {
            id: true,
            sku: true,
            name: true,
            brand: true,
            category: true,
            price: true,
        },
        orderBy: [{ category: "asc" }, { sku: "asc" }],
    });

    console.log(`   Total produk aktif dalam kategori LP: ${allProducts.length}`);

    // Filter khusus merk Siemens
    const siemensProducts = allProducts.filter(isSiemensProduct);
    const nonSiemensCount = allProducts.length - siemensProducts.length;

    console.log(`   Khusus merk Siemens                  : ${siemensProducts.length}`);
    if (nonSiemensCount > 0) {
        console.log(`   Non-Siemens diabaikan                : ${nonSiemensCount}`);
    }

    // Filter produk yang dikecualikan dari kenaikan harga LP (seperti Siemens MCCB 3VJ1)
    const exemptSiemensProducts = siemensProducts.filter(p => p.sku.toUpperCase().startsWith("3VJ1"));
    const eligibleSiemensProducts = siemensProducts.filter(p => !p.sku.toUpperCase().startsWith("3VJ1"));

    if (exemptSiemensProducts.length > 0) {
        console.log(`   🛡️ Pengecualian Markup (3VJ1 MCCB)   : ${exemptSiemensProducts.length} produk diabaikan (tidak naik 5%)`);
    }
    console.log(`   Produk yang akan dinaikkan harganya  : ${eligibleSiemensProducts.length}\n`);

    if (eligibleSiemensProducts.length === 0) {
        console.log("⚠️ Tidak ada produk Siemens yang memenuhi kriteria kenaikan harga. Script selesai.");
        return;
    }

    // 3. Preview perhitungan harga baru
    console.log("📋 [3/4] Preview 10 Produk Pertama:");
    console.log("─".repeat(95));
    console.log(
        "SKU".padEnd(25) +
        "Kategori".padEnd(18) +
        "Harga Lama".padStart(16) +
        "Harga Baru (+5%)".padStart(18) +
        "Kenaikan".padStart(16)
    );
    console.log("─".repeat(95));

    for (const p of eligibleSiemensProducts.slice(0, 10)) {
        const oldPrice = p.price;
        const newPrice = roundToNearest(oldPrice * (1 + MARKUP_PERCENT / 100));
        const diff = newPrice - oldPrice;
        console.log(
            p.sku.padEnd(25) +
            (p.category || "-").padEnd(18) +
            `Rp ${oldPrice.toLocaleString("id-ID")}`.padStart(16) +
            `Rp ${newPrice.toLocaleString("id-ID")}`.padStart(18) +
            `+Rp ${diff.toLocaleString("id-ID")}`.padStart(16)
        );
    }
    console.log(`... dan ${eligibleSiemensProducts.length - 10} produk lainnya.`);
    console.log("─".repeat(95) + "\n");

    // 4. Siapkan batch dan submit ke Accurate
    const allDetailItems: DetailItem[] = eligibleSiemensProducts.map((p) => ({
        itemNo: p.sku,
        price: roundToNearest(p.price * (1 + MARKUP_PERCENT / 100)),
        priceCategoryName: PRICE_CATEGORY_NAME,
    }));

    const chunks: DetailItem[][] = [];
    for (let i = 0; i < allDetailItems.length; i += MAX_ITEM_PER_DOC) {
        chunks.push(allDetailItems.slice(i, i + MAX_ITEM_PER_DOC));
    }

    console.log(`🚀 [4/4] Memproses ${allDetailItems.length} produk dalam ${chunks.length} dokumen Accurate...`);
    if (DRY_RUN) {
        console.log("ℹ️  MODE DRY RUN AKTIF: Tidak ada perubahan yang dikirim ke Accurate.");
    }

    let totalSuccessItems = 0;
    let totalSkippedItems = 0;
    const createdDocuments: Array<{ number: string; itemCount: number }> = [];

    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        const docLabel = `Dokumen ${i + 1}/${chunks.length}`;
        console.log(`\n📄 [${docLabel}] Mengirim ${chunk.length} item...`);

        const desc = `Kenaikan Harga Siemens LP +${MARKUP_PERCENT}% — ${docLabel} (${chunk.length} item) — ${getTodayFormatted()}`;

        let submitted = false;
        let attempt = 0;
        const maxAttempts = 50;

        while (!submitted && attempt < maxAttempts) {
            attempt++;
            try {
                const currentDesc = `Kenaikan Harga Siemens LP +${MARKUP_PERCENT}% — ${docLabel} (${chunk.length} item aktif) — ${getTodayFormatted()}`;
                const result = await callSave(chunk, currentDesc);
                console.log(`   ✅ BERHASIL: ${result.number || result.id} (${chunk.length} item)`);
                createdDocuments.push({
                    number: result.number || String(result.id),
                    itemCount: chunk.length,
                });
                totalSuccessItems += chunk.length;
                submitted = true;
            } catch (err: any) {
                const errMsg = err.message || "";
                if (!isInactiveOrNotFoundError(errMsg)) {
                    console.error(`   ❌ Error Sistem: ${errMsg}`);
                    break;
                }

                // Coba ambil SKU langsung dari pesan error Accurate
                const badSku = extractBadSkuFromError(errMsg);
                if (badSku) {
                    console.log(`   ⚠️ Item tidak valid terdeteksi: ${badSku} (di-skip)`);
                    chunk = chunk.filter((item) => item.itemNo !== badSku);
                    totalSkippedItems++;
                    continue;
                }

                // Jika pesan error tidak menyebut SKU spesifik, jalankan fallback scan
                console.log(`   ⚠️ Item non-aktif di dalam batch. Menjalankan smart filter...`);
                const badSkus = await findBadItemsFallback(chunk, 50);
                totalSkippedItems += badSkus.size;
                chunk = chunk.filter((item) => !badSkus.has(item.itemNo));

                const retryDesc = `Kenaikan Harga Siemens LP +${MARKUP_PERCENT}% — ${docLabel} (${chunk.length} aktif) — ${getTodayFormatted()}`;
                const retryRes = await callSave(chunk, retryDesc);
                console.log(`   ✅ BERHASIL setelah filter: ${retryRes.number || retryRes.id} (${chunk.length} item)`);
                createdDocuments.push({
                    number: retryRes.number || String(retryRes.id),
                    itemCount: chunk.length,
                });
                totalSuccessItems += chunk.length;
                submitted = true;
            }
        }
    }

    console.log("\n══════════════════════════════════════════════════════════════════════");
    console.log(`🎉 PROSES SELESAI ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
    console.log(`   Total item berhasil  : ${totalSuccessItems}`);
    console.log(`   Total item di-skip   : ${totalSkippedItems}`);
    console.log(`   Jumlah dokumen       : ${createdDocuments.length}`);
    createdDocuments.forEach((doc, idx) => {
        console.log(`     #${idx + 1} ${doc.number} (${doc.itemCount} item)`);
    });
    console.log("══════════════════════════════════════════════════════════════════════\n");
}

main()
    .catch((err) => {
        console.error("🔥 Fatal Error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
