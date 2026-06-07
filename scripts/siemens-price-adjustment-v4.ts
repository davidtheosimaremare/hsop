/**
 * Script: siemens-price-adjustment-v4.ts
 *
 * Strategi v4 (BALANCE):
 *   1. Hapus semua dokumen sebelumnya (untuk menghindari duplikasi dari tes)
 *   2. Submit 1000 item per dokumen (menjadi 5 dokumen)
 *   3. Jika dalam 1 dokumen ada item Non Aktif, filter otomatis
 *
 * Cara jalankan:
 *   npx ts-node --esm scripts/siemens-price-adjustment-v4.ts
 */

import { PrismaClient } from "@prisma/client";
import { generateAccurateAuthHeaders } from "../src/lib/accurate.ts";

const db = new PrismaClient();

const MARKUP_PERCENT = 10;
const PRICE_CATEGORY_NAME = "Umum";
const ADJUSTMENT_TYPE = "ITEM_PRICE_TYPE";
const MAX_ITEM_PER_DOC = 1000;
const DOCS_TO_DELETE_PREFIX = "SPA.2026.05.";

const HOST = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";

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

async function getHeaders() { return await generateAccurateAuthHeaders(); }

async function callSave(items: DetailItem[], description: string): Promise<{ id?: number; number?: string }> {
    const headers = await getHeaders();
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

// ─── Hapus Semua Dokumen SPA.2026.05.* ────────────────────────────────────────

async function cleanOldDocuments() {
    console.log("\n🗑️  Membersihkan dokumen SPA bulan ini...");
    const headers = await getHeaders();
    if (!headers) return;

    const url = new URL(`${HOST}/accurate/api/sellingprice-adjustment/list.do`);
    url.searchParams.set("fields", "id,number");
    url.searchParams.set("sp.pageSize", "200");
    url.searchParams.set("sp.page", "1");
    url.searchParams.set("sp.sort", "id|desc");

    const res = await fetch(url.toString(), { method: "GET", headers: headers as HeadersInit });
    if (!res.ok) throw new Error("Gagal fetch list");
    const result = await res.json();
    if (!result.s) throw new Error(result.d?.[0] || "Gagal fetch list");

    const docs = (result.d || []).filter((d: any) => (d.number || "").startsWith(DOCS_TO_DELETE_PREFIX));
    if (docs.length === 0) {
        console.log("   ✅ Bersih. Tidak ada dokumen yang perlu dihapus.");
        return;
    }

    console.log(`   Ditemukan ${docs.length} dokumen. Menghapus...`);
    for (const doc of docs) {
        const delUrl = new URL(`${HOST}/accurate/api/sellingprice-adjustment/delete.do`);
        delUrl.searchParams.set("id", String(doc.id));
        try {
            await fetch(delUrl.toString(), { method: "DELETE", headers: headers as HeadersInit });
            process.stdout.write(`✅ ${doc.number} `);
        } catch (err: any) {
            console.error(`\n❌ Gagal hapus ${doc.number}: ${err.message}`);
        }
    }
    console.log("\n   Pembersihan selesai.");
}

// ─── Smart scan ───────────────────────────────────────────────────────────────

async function testChunk(items: DetailItem[], label: string): Promise<boolean> {
    try {
        const result = await callSave(items, `[TEST] ${label}`);
        if (result.id) {
            const headers = await getHeaders();
            if (headers) {
                const delUrl = new URL(`${HOST}/accurate/api/sellingprice-adjustment/delete.do`);
                delUrl.searchParams.set("id", String(result.id));
                await fetch(delUrl.toString(), { method: "DELETE", headers: headers as HeadersInit });
            }
        }
        await new Promise(r => setTimeout(r, 200));
        return true;
    } catch (err: any) {
        if (isItemError(err.message)) return false;
        throw err; 
    }
}

async function findBadItems(items: DetailItem[], chunkSize: number = 200): Promise<Set<string>> {
    const badSkus = new Set<string>();
    const chunks: DetailItem[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) chunks.push(items.slice(i, i + chunkSize));

    for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const chunkOk = await testChunk(chunk, `chunk-${ci+1}/${chunks.length}`);
        if (!chunkOk) {
            if (chunkSize > 10) {
                const subBad = await findBadItems(chunk, 10);
                subBad.forEach(sku => badSkus.add(sku));
            } else if (chunkSize > 1) {
                const subBad = await findBadItems(chunk, 1);
                subBad.forEach(sku => badSkus.add(sku));
            } else {
                badSkus.add(chunk[0].itemNo);
                console.log(`   ⏭️  Di-skip (Non Aktif): ${chunk[0].itemNo}`);
            }
        }
    }
    return badSkus;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Siemens Price Adjustment v4 — Max ${MAX_ITEM_PER_DOC} item / doc`);
    console.log(`  Tanggal: ${getTodayFormatted()}`);
    console.log("═══════════════════════════════════════════════════════\n");

    // 1. Bersihkan sisa dokumen tes (jika ada)
    await cleanOldDocuments();

    // 2. Ambil produk
    console.log("\n📦 Mengambil produk Siemens dari database...");
    const products = await db.product.findMany({
        where: { brand: { contains: "Siemens", mode: "insensitive" }, status: "APPROVED", basePrice: { gt: 0 } },
        select: { sku: true, basePrice: true },
        orderBy: { sku: "asc" },
    });
    console.log(`✅ ${products.length} produk Siemens ditemukan.\n`);

    const allItems: DetailItem[] = products.map(p => ({
        itemNo: p.sku,
        price: roundToNearest((p.basePrice || 0) * (1 + MARKUP_PERCENT / 100)),
        priceCategoryName: PRICE_CATEGORY_NAME,
    }));

    // 3. Split jadi dokumen 1000 item
    const chunks: DetailItem[][] = [];
    for (let i = 0; i < allItems.length; i += MAX_ITEM_PER_DOC) {
        chunks.push(allItems.slice(i, i + MAX_ITEM_PER_DOC));
    }

    console.log(`🚀 Akan memproses dalam ${chunks.length} Dokumen...`);
    
    let badItemsTotal = 0;

    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        const docName = `Dokumen ${i + 1}/${chunks.length}`;
        console.log(`\n📄 [${docName}] Memproses ${chunk.length} item...`);
        const desc = `Kenaikan Harga Siemens +${MARKUP_PERCENT}% — ${docName} (${chunk.length} item) — ${getTodayFormatted()}`;

        try {
            const result = await callSave(chunk, desc);
            console.log(`   ✅ BERHASIL: ${result.number}`);
        } catch (err: any) {
            if (!isItemError(err.message)) {
                console.error(`   ❌ Error Sistem: ${err.message}`);
                continue;
            }

            console.log(`   ⚠️ Ada item Non Aktif. Memfilter (Smart Scan)...`);
            const badSkus = await findBadItems(chunk, 100);
            badItemsTotal += badSkus.size;

            const cleanItems = chunk.filter(item => !badSkus.has(item.itemNo));
            const cleanDesc = `Kenaikan Harga Siemens +${MARKUP_PERCENT}% — ${docName} (${cleanItems.length} aktif) — ${getTodayFormatted()}`;

            console.log(`   ✅ Filter selesai: ${cleanItems.length} aktif, ${badSkus.size} di-skip`);
            const retryRes = await callSave(cleanItems, cleanDesc);
            console.log(`   ✅ BERHASIL (Clean): ${retryRes.number}`);
        }
    }

    console.log("\n═══════════════════════════════════════════════════════");
    console.log(`🎉 PROSES SELESAI`);
    console.log(`   Berhasil membuat ${chunks.length} dokumen di Accurate.`);
    if (badItemsTotal > 0) console.log(`   Total item Non Aktif di-skip: ${badItemsTotal}`);
    console.log("═══════════════════════════════════════════════════════\n");
}

main()
    .catch(err => { console.error("🔥 Fatal:", err); process.exit(1); })
    .finally(async () => { await db.$disconnect(); });
