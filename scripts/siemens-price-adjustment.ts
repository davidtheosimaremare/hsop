/**
 * Script: siemens-price-adjustment.ts
 *
 * Tujuan:
 *   Mengirimkan dokumen Penyesuaian Harga ke Accurate Online (modul "Penyesuaian Harga/Diskon")
 *   untuk semua produk Siemens, dengan kenaikan 10% dari harga yang tersimpan di database lokal.
 *
 *   ✅ Harga LAMA di Accurate tetap tersimpan (karena kita pakai modul penyesuaian, bukan overwrite item)
 *   ✅ Penyesuaian baru tercatat sebagai dokumen tersendiri di Accurate
 *   ✅ Jika batch gagal karena item Non Aktif, script otomatis retry satu per satu
 *
 * Endpoint: POST /accurate/api/sellingprice-adjustment/save.do
 *
 * Cara jalankan:
 *   npx ts-node --esm scripts/siemens-price-adjustment.ts
 *
 *   Untuk DRY RUN (tidak ada perubahan ke Accurate):
 *   DRY_RUN=true npx ts-node --esm scripts/siemens-price-adjustment.ts
 */

import { PrismaClient } from "@prisma/client";
import { generateAccurateAuthHeaders } from "../src/lib/accurate.ts";

const db = new PrismaClient();

// ─── Konfigurasi ─────────────────────────────────────────────────────────────

const MARKUP_PERCENT = 10; // Kenaikan 10%
const PRICE_CATEGORY_NAME = "Umum"; // Kategori harga di Accurate (sesuaikan jika perlu, misal: "Harga Jual 1")
const ADJUSTMENT_TYPE = "ITEM_PRICE_TYPE"; // Penyesuaian Harga (bukan diskon)
const BATCH_SIZE = 50; // Jumlah produk per satu dokumen penyesuaian
const DRY_RUN = process.env.DRY_RUN === "true"; // Set DRY_RUN=true untuk preview saja

// ─── Helper ──────────────────────────────────────────────────────────────────

function getTodayFormatted(): string {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function roundToNearest(value: number, nearest: number = 100): number {
    return Math.round(value / nearest) * nearest;
}

function isInactiveItemError(message: string): boolean {
    return message.includes("Non Aktif") || message.includes("tidak ditemukan") || message.includes("sudah dihapus");
}

// ─── Fungsi utama kirim penyesuaian ke Accurate ──────────────────────────────

interface DetailItem {
    itemNo: string;
    price: number;
    priceCategoryName: string;
}

async function sendPriceAdjustmentToAccurate(
    detailItems: DetailItem[],
    batchIndex: number,
    description: string
): Promise<{ success: boolean; id?: number; number?: string; message?: string }> {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/sellingprice-adjustment/save.do`;

    const headers = await generateAccurateAuthHeaders();
    if (!headers) {
        console.log(`[DRY RUN / MOCK] Batch ${batchIndex}: Akan kirim ${detailItems.length} item ke Accurate`);
        return { success: true, id: 0, number: `MOCK-ADJ-${batchIndex}` };
    }

    const payload = {
        transDate: getTodayFormatted(),
        salesAdjustmentType: ADJUSTMENT_TYPE,
        priceCategoryName: PRICE_CATEGORY_NAME,
        description: description,
        detailItem: detailItems,
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: headers as HeadersInit,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const result = await response.json();

    if (!result.s) {
        throw new Error(result.d?.[0] || result.message || "Accurate API returned failure");
    }

    return {
        success: true,
        id: result.r?.id,
        number: result.r?.number || result.r?.no,
    };
}

/**
 * Retry satu batch yang gagal dengan mengirim satu-per-satu.
 * Item Non Aktif atau tidak ditemukan akan di-skip.
 * Item aktif lainnya tetap diproses.
 */
async function retryBatchIndividually(
    batchItems: DetailItem[],
    batchNum: number
): Promise<{ sentCount: number; skippedCount: number; docNumbers: string[] }> {
    let sentCount = 0;
    let skippedCount = 0;
    const docNumbers: string[] = [];

    for (const item of batchItems) {
        const desc = `Kenaikan Harga Siemens +${MARKUP_PERCENT}% — Retry Individual [${item.itemNo}]`;
        try {
            const result = await sendPriceAdjustmentToAccurate([item], batchNum, desc);
            console.log(`     → ✅ ${item.itemNo}: Dokumen ${result.number || result.id}`);
            if (result.number || result.id) {
                docNumbers.push(result.number || String(result.id));
            }
            sentCount++;
            // Jeda kecil antar item untuk menghindari rate-limit
            await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (err: any) {
            if (isInactiveItemError(err.message)) {
                console.log(`     → ⏭️  SKIP ${item.itemNo}: Non Aktif / tidak ditemukan`);
                skippedCount++;
            } else {
                console.error(`     → ❌ ${item.itemNo}: ${err.message}`);
                skippedCount++;
            }
        }
    }

    return { sentCount, skippedCount, docNumbers };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  Siemens Price Adjustment — Kenaikan Harga 10%");
    console.log(`  Mode: ${DRY_RUN ? "🟡 DRY RUN (tidak ada perubahan ke Accurate)" : "🔴 LIVE"}`);
    console.log(`  Kategori Harga : ${PRICE_CATEGORY_NAME}`);
    console.log(`  Tipe Penyesuaian: ${ADJUSTMENT_TYPE}`);
    console.log(`  Kenaikan       : +${MARKUP_PERCENT}%`);
    console.log(`  Tanggal        : ${getTodayFormatted()}`);
    console.log("═══════════════════════════════════════════════════════\n");

    // 1. Ambil semua produk Siemens dari database lokal
    console.log("📦 Mengambil data produk Siemens dari database lokal...");
    const siemensProducts = await db.product.findMany({
        where: {
            brand: {
                contains: "Siemens",
                mode: "insensitive",
            },
            status: "APPROVED",
            price: { gt: 0 },
        },
        select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            basePrice: true,
            brand: true,
            accurateId: true,
        },
        orderBy: { sku: "asc" },
    });

    if (siemensProducts.length === 0) {
        console.log("⚠️  Tidak ada produk Siemens ditemukan di database. Script selesai.");
        return;
    }

    console.log(`✅ Ditemukan ${siemensProducts.length} produk Siemens.\n`);

    // 2. Hitung harga baru (+10%)
    const detailItems: DetailItem[] = [];
    const preview: Array<{ sku: string; name: string; oldPrice: number; newPrice: number; diff: number }> = [];

    for (const product of siemensProducts) {
        // Gunakan harga saat ini di DB sebagai referensi
        const currentPrice = product.price;
        const newPrice = roundToNearest(currentPrice * (1 + MARKUP_PERCENT / 100));

        detailItems.push({
            itemNo: product.sku,
            price: newPrice,
            priceCategoryName: PRICE_CATEGORY_NAME,
        });

        preview.push({
            sku: product.sku,
            name: product.name.substring(0, 60),
            oldPrice: currentPrice,
            newPrice,
            diff: newPrice - currentPrice,
        });
    }

    // 3. Tampilkan preview
    console.log("📋 Preview Penyesuaian Harga (sample 10 pertama):");
    console.log("─".repeat(90));
    console.log(
        "SKU".padEnd(30) +
        "Harga Lama".padStart(15) +
        "Harga Baru".padStart(15) +
        "Selisih".padStart(12)
    );
    console.log("─".repeat(90));

    for (const item of preview.slice(0, 10)) {
        console.log(
            item.sku.padEnd(30) +
            `Rp ${item.oldPrice.toLocaleString("id-ID")}`.padStart(15) +
            `Rp ${item.newPrice.toLocaleString("id-ID")}`.padStart(15) +
            `+Rp ${item.diff.toLocaleString("id-ID")}`.padStart(12)
        );
    }
    if (preview.length > 10) {
        console.log(`... dan ${preview.length - 10} produk lainnya`);
    }
    console.log("─".repeat(90));

    const totalProducts = detailItems.length;
    const totalBatches = Math.ceil(totalProducts / BATCH_SIZE);
    console.log(`\n📦 Total: ${totalProducts} produk → ${totalBatches} batch (maks ${BATCH_SIZE}/batch)\n`);

    if (DRY_RUN) {
        console.log("🟡 DRY RUN aktif — tidak ada data yang dikirim ke Accurate.");
        console.log("   Hapus DRY_RUN=true atau set DRY_RUN=false untuk menjalankan sesungguhnya.");
        return;
    }

    // 4. Konfirmasi sebelum eksekusi (jika terminal interaktif)
    // Untuk keamanan, script ini tidak otomatis — harus dijalankan tanpa DRY_RUN
    console.log("⚠️  Akan mengirim penyesuaian harga ke Accurate...");
    console.log("   Tekan Ctrl+C dalam 5 detik untuk membatalkan.");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 5. Kirim batch per batch ke Accurate
    let successBatches = 0;
    let failedBatches = 0;
    let totalSkipped = 0;
    let totalRetried = 0;
    const results: Array<{ batch: number; status: string; docNumber?: string; error?: string; retriedItems?: number; skippedItems?: number }> = [];

    for (let i = 0; i < totalBatches; i++) {
        const batchItems = detailItems.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        const batchNum = i + 1;
        const skuRange = `${batchItems[0].itemNo} ... ${batchItems[batchItems.length - 1].itemNo}`;
        const description = `Kenaikan Harga Siemens +${MARKUP_PERCENT}% — Batch ${batchNum}/${totalBatches} (${batchItems.length} item)`;

        console.log(`\n🔄 Batch ${batchNum}/${totalBatches}: ${batchItems.length} item [${skuRange}]`);

        try {
            const result = await sendPriceAdjustmentToAccurate(batchItems, batchNum, description);

            console.log(`   ✅ Berhasil! Nomor Dokumen: ${result.number || result.id}`);
            successBatches++;
            results.push({
                batch: batchNum,
                status: "SUCCESS",
                docNumber: result.number || String(result.id),
            });

            // Jeda antar batch untuk menghindari rate-limit
            if (i < totalBatches - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        } catch (err: any) {
            const errMsg: string = err.message || "";
            console.error(`   ❌ Gagal: ${errMsg}`);

            // Jika ada item Non Aktif/tidak ditemukan → retry satu per satu
            if (isInactiveItemError(errMsg)) {
                console.log(`   🔁 Retry individual untuk melewati item Non Aktif...`);
                const retry = await retryBatchIndividually(batchItems, batchNum);
                totalRetried += retry.sentCount;
                totalSkipped += retry.skippedCount;

                if (retry.sentCount > 0) {
                    console.log(`   ✅ Retry berhasil: ${retry.sentCount} item diproses, ${retry.skippedCount} di-skip`);
                    successBatches++;
                    results.push({
                        batch: batchNum,
                        status: "RETRIED",
                        docNumber: retry.docNumbers.join(", "),
                        retriedItems: retry.sentCount,
                        skippedItems: retry.skippedCount,
                    });
                } else {
                    console.log(`   ⚠️  Semua item di batch ini Non Aktif (${retry.skippedCount} di-skip)`);
                    failedBatches++;
                    results.push({
                        batch: batchNum,
                        status: "ALL_INACTIVE",
                        error: `Semua ${retry.skippedCount} item Non Aktif`,
                    });
                }
            } else {
                failedBatches++;
                results.push({
                    batch: batchNum,
                    status: "FAILED",
                    error: errMsg,
                });
            }
        }
    }

    // 6. Ringkasan hasil
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  HASIL PENYESUAIAN HARGA SIEMENS");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Total Produk       : ${totalProducts}`);
    console.log(`  Batch Berhasil     : ${successBatches}/${totalBatches}`);
    console.log(`  Batch Gagal        : ${failedBatches}/${totalBatches}`);
    if (totalRetried > 0)  console.log(`  Item Retry Berhasil: ${totalRetried}`);
    if (totalSkipped > 0)  console.log(`  Item Di-skip (N/A) : ${totalSkipped}`);
    console.log("");

    console.log("  Nomor Dokumen di Accurate:");
    for (const r of results) {
        let icon = "✅";
        let detail = r.docNumber || "";
        if (r.status === "RETRIED") { icon = "🔁"; detail = `${r.docNumber} [${r.retriedItems} aktif, ${r.skippedItems} skip]`; }
        if (r.status === "ALL_INACTIVE") { icon = "⏭️ "; detail = r.error || ""; }
        if (r.status === "FAILED") { icon = "❌"; detail = r.error || ""; }
        console.log(`    ${icon} Batch ${r.batch}: ${detail}`);
    }

    console.log("═══════════════════════════════════════════════════════\n");

    if (failedBatches > 0) {
        console.log("⚠️  Ada batch yang gagal. Periksa log di atas untuk detail.");
        process.exit(1);
    } else {
        console.log("🎉 Penyesuaian harga berhasil dikirim ke Accurate!");
        console.log(`   Cek di Accurate: Menu Penjualan → Penyesuaian Harga/Diskon`);
    }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

main()
    .catch((err) => {
        console.error("🔥 Fatal Error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
