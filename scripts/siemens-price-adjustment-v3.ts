/**
 * Script: siemens-price-adjustment-v3.ts
 *
 * Strategi v3 (CERDAS + CEPAT):
 *   1. Test submit dengan SEMUA item → jika gagal karena item Non Aktif:
 *   2. Chunk test (500 item/chunk) untuk menemukan chunk bermasalah
 *   3. Di chunk bermasalah, test per-10 item untuk isolasi lebih cepat
 *   4. Di sub-chunk bermasalah, baru scan satu-per-satu (paling sedikit)
 *   5. Build exclusion list → submit 1 dokumen bersih
 *
 *   Hasil: Tetap 1 dokumen, tapi proses scan jauh lebih cepat
 *
 * Cara jalankan:
 *   npx ts-node --esm scripts/siemens-price-adjustment-v3.ts
 *   DRY_RUN=true npx ts-node --esm scripts/siemens-price-adjustment-v3.ts
 */

import { PrismaClient } from "@prisma/client";
import { generateAccurateAuthHeaders } from "../src/lib/accurate.ts";

const db = new PrismaClient();

// ─── Konfigurasi ─────────────────────────────────────────────────────────────

const MARKUP_PERCENT = 10;
const PRICE_CATEGORY_NAME = "Umum";
const ADJUSTMENT_TYPE = "ITEM_PRICE_TYPE";
const DRY_RUN = process.env.DRY_RUN === "true";

const HOST = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayFormatted(): string {
    const now = new Date();
    return `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
}

function roundToNearest(value: number, nearest: number = 100): number {
    return Math.round(value / nearest) * nearest;
}

function isItemError(message: string): boolean {
    return (
        message.includes("Non Aktif") ||
        message.includes("tidak ditemukan") ||
        message.includes("sudah dihapus")
    );
}

interface DetailItem { itemNo: string; price: number; priceCategoryName: string; }

// ─── Core API calls ───────────────────────────────────────────────────────────

async function callSave(items: DetailItem[], description: string): Promise<{ id?: number; number?: string }> {
    const headers = await generateAccurateAuthHeaders();
    if (!headers) return { id: 0, number: "MOCK" };

    const res = await fetch(`${HOST}/accurate/api/sellingprice-adjustment/save.do`, {
        method: "POST",
        headers: headers as HeadersInit,
        body: JSON.stringify({
            transDate: getTodayFormatted(),
            salesAdjustmentType: ADJUSTMENT_TYPE,
            priceCategoryName: PRICE_CATEGORY_NAME,
            description,
            detailItem: items,
        }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const result = await res.json();
    if (!result.s) throw new Error(result.d?.[0] || result.message || "API error");
    return { id: result.r?.id, number: result.r?.number || result.r?.no };
}

async function callDelete(id: number): Promise<void> {
    const headers = await generateAccurateAuthHeaders();
    if (!headers) return;
    const url = new URL(`${HOST}/accurate/api/sellingprice-adjustment/delete.do`);
    url.searchParams.set("id", String(id));
    await fetch(url.toString(), { method: "DELETE", headers: headers as HeadersInit });
}

// ─── Smart scan: test chunk → jika gagal, isolasi bad items ──────────────────

/**
 * Test satu chunk. Jika berhasil, delete dokumen test dan return true.
 * Jika gagal karena item error, return false. Error lain di-throw.
 */
async function testChunk(items: DetailItem[], label: string): Promise<boolean> {
    try {
        const result = await callSave(items, `[TEST] ${label}`);
        // Berhasil → hapus dokumen test
        if (result.id) await callDelete(result.id);
        await new Promise(r => setTimeout(r, 200));
        return true;
    } catch (err: any) {
        if (isItemError(err.message)) return false;
        throw err; // Error lain (network, etc.) → throw
    }
}

/**
 * Divide & conquer untuk menemukan item-item bermasalah dalam sebuah array.
 * Complexity: O(bad_items × log(n)) jauh lebih efisien dari O(n).
 */
async function findBadItems(items: DetailItem[], chunkSize: number = 500): Promise<Set<string>> {
    const badSkus = new Set<string>();

    // Bagi items jadi chunks
    const chunks: DetailItem[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }

    console.log(`   🔍 Test ${chunks.length} chunk × ${chunkSize} item...`);

    for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const chunkOk = await testChunk(chunk, `chunk-${ci+1}/${chunks.length}`);
        process.stdout.write(`   Chunk ${ci+1}/${chunks.length}: ${chunkOk ? "✅ OK" : "❌ ada masalah"}\n`);

        if (!chunkOk) {
            // Isolasi lebih lanjut dengan sub-chunk 10 item
            if (chunkSize > 10) {
                const subBad = await findBadItems(chunk, 10);
                subBad.forEach(sku => badSkus.add(sku));
            } else if (chunkSize > 1) {
                // Sub-chunk 1 item → scan individual
                const subBad = await findBadItems(chunk, 1);
                subBad.forEach(sku => badSkus.add(sku));
            } else {
                // Sudah individual → ini pasti item bermasalah
                badSkus.add(chunk[0].itemNo);
                console.log(`   ⏭️  Bad item found: ${chunk[0].itemNo}`);
            }
        }

        await new Promise(r => setTimeout(r, 300));
    }

    return badSkus;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  Siemens Price Adjustment v3 — Smart Single Document");
    console.log(`  Mode   : ${DRY_RUN ? "🟡 DRY RUN" : "🔴 LIVE"}`);
    console.log(`  Tanggal: ${getTodayFormatted()}`);
    console.log("═══════════════════════════════════════════════════════\n");

    // 1. Ambil semua produk Siemens
    console.log("📦 Mengambil produk Siemens dari database...");
    const products = await db.product.findMany({
        where: {
            brand: { contains: "Siemens", mode: "insensitive" },
            status: "APPROVED",
            price: { gt: 0 },
        },
        select: { sku: true, name: true, price: true },
        orderBy: { sku: "asc" },
    });

    console.log(`✅ ${products.length} produk Siemens ditemukan.\n`);

    const allItems: DetailItem[] = products.map(p => ({
        itemNo: p.sku,
        price: roundToNearest(p.price * (1 + MARKUP_PERCENT / 100)),
        priceCategoryName: PRICE_CATEGORY_NAME,
    }));

    if (DRY_RUN) {
        console.log("🟡 DRY RUN — tidak ada perubahan ke Accurate.");
        console.log(`   Akan submit ${allItems.length} produk dalam 1 dokumen.`);
        console.log(`   Preview 5 pertama:`);
        allItems.slice(0, 5).forEach(i => {
            const p = products.find(x => x.sku === i.itemNo)!;
            console.log(`   ${i.itemNo}: Rp ${p.price.toLocaleString("id-ID")} → Rp ${i.price.toLocaleString("id-ID")}`);
        });
        return;
    }

    console.log("⚠️  Akan submit ke Accurate. Tekan Ctrl+C dalam 5 detik untuk batal.");
    await new Promise(r => setTimeout(r, 5000));

    // 2. Coba submit langsung 1 dokumen
    console.log(`\n🚀 Tahap 1: Submit langsung ${allItems.length} produk dalam 1 dokumen...`);
    const description = `Kenaikan Harga Siemens +${MARKUP_PERCENT}% — ${allItems.length} produk — ${getTodayFormatted()}`;

    try {
        const result = await callSave(allItems, description);
        // ✅ LANGSUNG BERHASIL
        console.log(`\n🎉 BERHASIL! 1 Dokumen: ${result.number} (ID: ${result.id})`);
        console.log(`   Total: ${allItems.length} produk`);
        console.log(`   Cek di Accurate → Penjualan → Penyesuaian Harga/Diskon → ${result.number}`);
        return;

    } catch (err: any) {
        if (!isItemError(err.message)) throw err;

        console.log(`\n⚠️  Ada item bermasalah: ${err.message}`);
        console.log(`\n🔍 Tahap 2: Smart scan untuk menemukan item Non Aktif...`);
        console.log(`   (Menggunakan divide & conquer — jauh lebih cepat dari scan satu-per-satu)\n`);
    }

    // 3. Smart scan: divide & conquer
    const badSkus = await findBadItems(allItems, 500);

    if (badSkus.size === 0) {
        console.log("\n⚠️  Tidak ada item bermasalah ditemukan tapi submit gagal. Coba lagi.");
        return;
    }

    console.log(`\n📋 Item bermasalah ditemukan (${badSkus.size} item):`);
    badSkus.forEach(sku => console.log(`   ❌ ${sku}`));

    // 4. Filter item bersih
    const cleanItems = allItems.filter(i => !badSkus.has(i.itemNo));
    const cleanDesc = `${description} (${cleanItems.length} aktif, ${badSkus.size} di-skip)`;

    console.log(`\n✅ Item aktif: ${cleanItems.length} produk`);
    console.log(`⏭️  Item di-skip: ${badSkus.size} produk (Non Aktif/tidak ditemukan)`);
    console.log(`\n🚀 Tahap 3: Submit 1 dokumen bersih dengan ${cleanItems.length} item...`);

    const finalResult = await callSave(cleanItems, cleanDesc);

    console.log(`\n🎉 BERHASIL! 1 Dokumen: ${finalResult.number} (ID: ${finalResult.id})`);
    console.log(`   Total item aktif : ${cleanItems.length} produk`);
    console.log(`   Item di-skip     : ${badSkus.size} produk (Non Aktif)`);
    console.log(`   Cek di Accurate  → Penjualan → Penyesuaian Harga/Diskon → ${finalResult.number}`);

    // 5. Ringkasan item yang di-skip
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  Item yang Di-skip (Non Aktif di Accurate):");
    badSkus.forEach(sku => {
        const p = products.find(x => x.sku === sku);
        console.log(`  - ${sku}${p ? ` | ${p.name.substring(0, 50)}` : ""}`);
    });
    console.log("═══════════════════════════════════════════════════════\n");
}

main()
    .catch(err => { console.error("🔥 Fatal:", err); process.exit(1); })
    .finally(async () => { await db.$disconnect(); });
