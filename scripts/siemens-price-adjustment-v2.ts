/**
 * Script: siemens-price-adjustment-v2.ts
 *
 * Strategi baru (v2):
 *   1. Hapus semua dokumen SPA yang dibuat sebelumnya
 *   2. Submit ulang SEMUA produk Siemens dalam SATU dokumen tunggal
 *      dengan retry individual untuk item Non Aktif
 *
 * Cara jalankan:
 *
 *   # Langkah 1: Hapus dokumen lama (DRY RUN dulu)
 *   DRY_RUN=true npx ts-node --esm scripts/siemens-price-adjustment-v2.ts delete
 *
 *   # Langkah 1: Hapus dokumen lama (LIVE)
 *   npx ts-node --esm scripts/siemens-price-adjustment-v2.ts delete
 *
 *   # Langkah 2: Submit satu dokumen baru (DRY RUN dulu)
 *   DRY_RUN=true npx ts-node --esm scripts/siemens-price-adjustment-v2.ts submit
 *
 *   # Langkah 2: Submit satu dokumen baru (LIVE)
 *   npx ts-node --esm scripts/siemens-price-adjustment-v2.ts submit
 *
 *   # Atau jalankan keduanya sekaligus:
 *   npx ts-node --esm scripts/siemens-price-adjustment-v2.ts all
 */

import { PrismaClient } from "@prisma/client";
import { generateAccurateAuthHeaders } from "../src/lib/accurate.ts";

const db = new PrismaClient();

// ─── Konfigurasi ─────────────────────────────────────────────────────────────

const MARKUP_PERCENT = 10;
const PRICE_CATEGORY_NAME = "Umum";
const ADJUSTMENT_TYPE = "ITEM_PRICE_TYPE";
const DRY_RUN = process.env.DRY_RUN === "true";

// Daftar nomor dokumen yang perlu dihapus (hasil run sebelumnya)
// Format: SPA.2026.05.00001 s/d SPA.2026.05.00070 + dokumen retry individual
const DOCS_TO_DELETE_PREFIX = "SPA.2026.05."; // Prefix bulan ini
const DOCS_TO_DELETE_RANGE = { start: 1, end: 200 }; // Range aman (script akan skip jika tidak ada)

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
    return (
        message.includes("Non Aktif") ||
        message.includes("tidak ditemukan") ||
        message.includes("sudah dihapus")
    );
}

// ─── Accurate API Helpers ─────────────────────────────────────────────────────

async function getHeaders() {
    return await generateAccurateAuthHeaders();
}

const HOST = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";

// ─── STEP 1: Fetch list dokumen penyesuaian yang ada di Accurate ─────────────

async function fetchExistingAdjustmentDocs(): Promise<Array<{ id: number; number: string; transDate: string }>> {
    const headers = await getHeaders();
    if (!headers) return [];

    const url = new URL(`${HOST}/accurate/api/sellingprice-adjustment/list.do`);
    url.searchParams.set("fields", "id,number,transDate");
    url.searchParams.set("sp.pageSize", "200");
    url.searchParams.set("sp.page", "1");
    url.searchParams.set("sp.sort", "id|desc");

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: headers as HeadersInit,
    });

    if (!response.ok) {
        throw new Error(`Gagal fetch list: HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result.s) throw new Error(result.d?.[0] || "Gagal fetch list dokumen");

    return (result.d || []).map((item: any) => ({
        id: item.id,
        number: item.number || item.no || "",
        transDate: item.transDate || "",
    }));
}

// ─── STEP 2: Delete satu dokumen by nomor ─────────────────────────────────────

async function deleteAdjustmentDoc(docNumber: string, docId: number): Promise<{ success: boolean; message: string }> {
    const headers = await getHeaders();
    if (!headers) {
        console.log(`[MOCK] Delete dokumen: ${docNumber}`);
        return { success: true, message: "MOCK deleted" };
    }

    const url = new URL(`${HOST}/accurate/api/sellingprice-adjustment/delete.do`);
    url.searchParams.set("id", docId.toString());

    const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: headers as HeadersInit,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const result = await response.json();
    if (!result.s) {
        throw new Error(result.d?.[0] || result.message || "Gagal hapus dokumen");
    }

    return { success: true, message: "OK" };
}

// ─── STEP 3: Submit satu dokumen besar ─────────────────────────────────────────

interface DetailItem {
    itemNo: string;
    price: number;
    priceCategoryName: string;
}

async function submitSingleAdjustmentDoc(
    allItems: DetailItem[],
    description: string
): Promise<{ success: boolean; id?: number; number?: string }> {
    const headers = await getHeaders();
    if (!headers) {
        console.log(`[MOCK] Submit 1 dokumen dengan ${allItems.length} item`);
        return { success: true, id: 0, number: "MOCK-SPA-SINGLE" };
    }

    const payload = {
        transDate: getTodayFormatted(),
        salesAdjustmentType: ADJUSTMENT_TYPE,
        priceCategoryName: PRICE_CATEGORY_NAME,
        description,
        detailItem: allItems,
    };

    const response = await fetch(`${HOST}/accurate/api/sellingprice-adjustment/save.do`, {
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
        throw new Error(result.d?.[0] || result.message || "Gagal submit dokumen");
    }

    return { success: true, id: result.r?.id, number: result.r?.number || result.r?.no };
}

// ─── COMMAND: delete ──────────────────────────────────────────────────────────

async function runDelete() {
    console.log("\n🗑️  TAHAP 1: Hapus Dokumen Penyesuaian Harga Sebelumnya");
    console.log("─".repeat(60));

    // Fetch semua dokumen yang ada
    console.log("📋 Mengambil daftar dokumen dari Accurate...");
    let docs: Array<{ id: number; number: string; transDate: string }> = [];

    if (DRY_RUN) {
        console.log("[DRY RUN] Simulasi fetch dokumen...");
        // Buat simulasi dokumen SPA.2026.05.00001 s/d 00072
        for (let i = 1; i <= 72; i++) {
            docs.push({ id: i, number: `SPA.2026.05.${String(i).padStart(5, "0")}`, transDate: "29/05/2026" });
        }
    } else {
        docs = await fetchExistingAdjustmentDocs();
    }

    // Filter hanya dokumen bulan ini yang berprefix SPA.2026.05.
    const targetDocs = docs.filter(d => d.number.startsWith(DOCS_TO_DELETE_PREFIX));

    if (targetDocs.length === 0) {
        console.log("✅ Tidak ada dokumen yang perlu dihapus.");
        return;
    }

    console.log(`📄 Ditemukan ${targetDocs.length} dokumen yang akan dihapus:`);
    targetDocs.forEach(d => console.log(`   - ${d.number} (ID: ${d.id})`));

    if (DRY_RUN) {
        console.log(`\n🟡 DRY RUN: ${targetDocs.length} dokumen akan dihapus (tidak ada perubahan nyata).`);
        return;
    }

    console.log(`\n⚠️  Akan menghapus ${targetDocs.length} dokumen. Tekan Ctrl+C dalam 5 detik untuk batal.`);
    await new Promise(r => setTimeout(r, 5000));

    let deleted = 0;
    let failed = 0;

    for (const doc of targetDocs) {
        try {
            await deleteAdjustmentDoc(doc.number, doc.id);
            console.log(`   ✅ Terhapus: ${doc.number}`);
            deleted++;
            await new Promise(r => setTimeout(r, 300)); // Jeda kecil
        } catch (err: any) {
            console.error(`   ❌ Gagal hapus ${doc.number}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n✅ Selesai hapus: ${deleted} berhasil, ${failed} gagal.`);
}

// ─── COMMAND: submit ──────────────────────────────────────────────────────────

async function runSubmit() {
    console.log("\n📤 TAHAP 2: Submit SATU Dokumen Penyesuaian Harga Siemens +10%");
    console.log("─".repeat(60));

    // Ambil semua produk Siemens
    console.log("📦 Mengambil data produk Siemens dari database lokal...");
    const siemensProducts = await db.product.findMany({
        where: {
            brand: { contains: "Siemens", mode: "insensitive" },
            status: "APPROVED",
            price: { gt: 0 },
        },
        select: { id: true, sku: true, name: true, price: true },
        orderBy: { sku: "asc" },
    });

    console.log(`✅ Ditemukan ${siemensProducts.length} produk Siemens.\n`);

    // Hitung harga baru
    const allItems: DetailItem[] = siemensProducts.map(p => ({
        itemNo: p.sku,
        price: roundToNearest(p.price * (1 + MARKUP_PERCENT / 100)),
        priceCategoryName: PRICE_CATEGORY_NAME,
    }));

    // Preview 10 item pertama
    console.log("📋 Preview (10 pertama):");
    console.log("─".repeat(80));
    console.log("SKU".padEnd(30) + "Harga Lama".padStart(15) + "Harga Baru".padStart(15) + "Selisih".padStart(12));
    console.log("─".repeat(80));
    for (const p of siemensProducts.slice(0, 10)) {
        const newPrice = roundToNearest(p.price * (1 + MARKUP_PERCENT / 100));
        console.log(
            p.sku.padEnd(30) +
            `Rp ${p.price.toLocaleString("id-ID")}`.padStart(15) +
            `Rp ${newPrice.toLocaleString("id-ID")}`.padStart(15) +
            `+Rp ${(newPrice - p.price).toLocaleString("id-ID")}`.padStart(12)
        );
    }
    console.log(`... dan ${siemensProducts.length - 10} produk lainnya`);
    console.log("─".repeat(80));
    console.log(`\n📦 Total: ${allItems.length} produk dalam 1 dokumen\n`);

    if (DRY_RUN) {
        console.log("🟡 DRY RUN aktif — tidak ada data yang dikirim ke Accurate.");
        return;
    }

    console.log("⚠️  Akan submit ke Accurate. Tekan Ctrl+C dalam 5 detik untuk batal.");
    await new Promise(r => setTimeout(r, 5000));

    const description = `Kenaikan Harga Siemens +${MARKUP_PERCENT}% — ${siemensProducts.length} produk — ${getTodayFormatted()}`;

    console.log("🚀 Mengirim dokumen ke Accurate...");

    try {
        const result = await submitSingleAdjustmentDoc(allItems, description);
        console.log(`\n🎉 BERHASIL! Nomor Dokumen: ${result.number}`);
        console.log(`   ID: ${result.id}`);
        console.log(`   Total item: ${allItems.length} produk`);
        console.log(`   Cek di Accurate: Menu Penjualan → Penyesuaian Harga/Diskon → ${result.number}`);

    } catch (err: any) {
        const errMsg: string = err.message || "";
        console.error(`\n❌ Gagal submit dalam 1 dokumen: ${errMsg}`);

        // Jika ada item Non Aktif → retry dengan melewati item bermasalah
        if (isInactiveItemError(errMsg)) {
            console.log("\n🔁 Ada item Non Aktif. Mencoba filter item Non Aktif satu per satu...");
            console.log("   (Ini mungkin butuh beberapa menit)");

            // Cek item mana yang aktif dengan cara submit 1 per 1
            const activeItems: DetailItem[] = [];
            let skipped = 0;

            for (let i = 0; i < allItems.length; i++) {
                const item = allItems[i];
                if (i % 100 === 0) console.log(`   Scan: ${i}/${allItems.length}...`);

                try {
                    // Test satu item — jika berhasil, aktif
                    const testResult = await submitSingleAdjustmentDoc(
                        [item],
                        `[SCAN] ${item.itemNo}`
                    );
                    // Langsung hapus dokumen test ini agar tidak kotor
                    if (testResult.id) {
                        const headers = await getHeaders();
                        if (headers) {
                            const url = new URL(`${HOST}/accurate/api/sellingprice-adjustment/delete.do`);
                            url.searchParams.set("id", String(testResult.id));
                            await fetch(url.toString(), { method: "DELETE", headers: headers as HeadersInit });
                        }
                    }
                    activeItems.push(item);
                    await new Promise(r => setTimeout(r, 200));
                } catch (scanErr: any) {
                    if (isInactiveItemError(scanErr.message)) {
                        skipped++;
                    } else {
                        activeItems.push(item); // Kemungkinan error lain, tetap coba
                    }
                }
            }

            console.log(`\n✅ Scan selesai: ${activeItems.length} item aktif, ${skipped} di-skip (Non Aktif)`);
            console.log("🚀 Submit ulang dengan item aktif saja...");

            const finalResult = await submitSingleAdjustmentDoc(
                activeItems,
                `${description} (${activeItems.length} item aktif, ${skipped} di-skip)`
            );

            console.log(`\n🎉 BERHASIL! Nomor Dokumen: ${finalResult.number}`);
            console.log(`   Total item aktif: ${activeItems.length} produk`);
            console.log(`   Item Non Aktif di-skip: ${skipped}`);
        } else {
            throw err;
        }
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const command = process.argv[2] || "all";

    console.log("═══════════════════════════════════════════════════════");
    console.log("  Siemens Price Adjustment v2 — Kenaikan Harga 10%");
    console.log(`  Mode   : ${DRY_RUN ? "🟡 DRY RUN" : "🔴 LIVE"}`);
    console.log(`  Command: ${command}`);
    console.log(`  Tanggal: ${getTodayFormatted()}`);
    console.log("═══════════════════════════════════════════════════════");

    if (command === "delete" || command === "all") {
        await runDelete();
    }

    if (command === "submit" || command === "all") {
        await runSubmit();
    }

    if (!["delete", "submit", "all"].includes(command)) {
        console.log("\nUsage:");
        console.log("  npx ts-node --esm scripts/siemens-price-adjustment-v2.ts delete   # Hapus dokumen lama");
        console.log("  npx ts-node --esm scripts/siemens-price-adjustment-v2.ts submit   # Submit 1 dokumen baru");
        console.log("  npx ts-node --esm scripts/siemens-price-adjustment-v2.ts all      # Hapus + Submit");
    }
}

main()
    .catch(err => {
        console.error("🔥 Fatal Error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
