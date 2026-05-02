import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProductSlug } from "@/lib/utils";

const BASE_URL = "https://shop.hokiindo.co.id";
const INDEXNOW_KEY = "hokiindo2026seo";
const BATCH_SIZE = 500; // IndexNow allows up to 10,000 per request

/**
 * Daily Auto-Indexing System
 * 
 * This endpoint submits URLs in rotating batches to search engines every day.
 * It ensures all product URLs get submitted over multiple days.
 * 
 * How it works:
 * 1. Fetches all product URLs from DB
 * 2. Calculates today's batch based on day-of-year rotation
 * 3. Submits batch to IndexNow (Bing/Yandex instant indexing)
 * 4. Pings Google & Bing sitemap
 * 
 * Setup: Call this endpoint daily via cron (e.g., Coolify cron, or external cron like cron-job.org)
 * 
 * GET  /api/seo/daily-index → Preview what would be submitted (no action)
 * POST /api/seo/daily-index → Execute the daily indexing
 * 
 * Optional query params:
 * - ?secret=YOUR_SECRET → Security key (set SEO_CRON_SECRET in .env)
 * - ?batch=2 → Force a specific batch number
 */

// Security: verify cron secret
function verifyAccess(request: NextRequest): boolean {
    const secret = request.nextUrl.searchParams.get("secret");
    const envSecret = process.env.SEO_CRON_SECRET;
    
    // If no secret is configured, allow access (for development)
    if (!envSecret) return true;
    
    return secret === envSecret;
}

// Get day of year (1-365) for batch rotation
function getDayOfYear(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Build all indexable URLs
async function getAllUrls(): Promise<string[]> {
    const urls: string[] = [];

    // 1. Static pages (highest priority)
    urls.push(
        BASE_URL,
        `${BASE_URL}/pencarian`,
        `${BASE_URL}/kategori`,
        `${BASE_URL}/berita`,
        `${BASE_URL}/pesanan-besar`,
        `${BASE_URL}/promo/siemens`,
    );

    // 2. Category pages
    const categories = await db.category.findMany({
        where: { isVisible: true },
        select: { name: true },
    });
    categories.forEach((cat) => {
        urls.push(`${BASE_URL}/pencarian?category=${encodeURIComponent(cat.name)}`);
    });

    // 3. Product pages
    const products = await db.product.findMany({
        where: { isVisible: true },
        select: { sku: true },
        orderBy: { updatedAt: "desc" }, // Newest first
    });
    products.forEach((product) => {
        urls.push(`${BASE_URL}/produk/${encodeURIComponent(getProductSlug(product))}`);
    });

    // 4. News pages
    const news = await db.news.findMany({
        where: { isPublished: true },
        select: { slug: true },
    });
    news.forEach((n) => {
        urls.push(`${BASE_URL}/berita/${n.slug}`);
    });

    // 5. CMS pages
    const pages = await db.page.findMany({
        where: { isPublished: true },
        select: { slug: true },
    });
    pages.forEach((p) => {
        urls.push(`${BASE_URL}/${p.slug}`);
    });

    return urls;
}

// Submit URLs to IndexNow
async function submitToIndexNow(urls: string[]): Promise<{ status: string; count: number; error?: string }> {
    try {
        const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                host: "shop.hokiindo.co.id",
                key: INDEXNOW_KEY,
                keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
                urlList: urls,
            }),
            signal: AbortSignal.timeout(30000),
        });

        // IndexNow returns 200 or 202 on success
        if (res.ok || res.status === 202) {
            return { status: "success", count: urls.length };
        }
        return { status: `failed (${res.status})`, count: 0, error: await res.text() };
    } catch (error: any) {
        return { status: "error", count: 0, error: error.message };
    }
}

// Ping Google sitemap
async function pingGoogle(): Promise<string> {
    try {
        const res = await fetch(
            `https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`,
            { method: "GET", signal: AbortSignal.timeout(10000) }
        );
        return res.ok ? "success" : `failed (${res.status})`;
    } catch (e: any) {
        return `error: ${e.message}`;
    }
}

// Ping Bing sitemap
async function pingBing(): Promise<string> {
    try {
        const res = await fetch(
            `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`,
            { method: "GET", signal: AbortSignal.timeout(10000) }
        );
        return res.ok ? "success" : `failed (${res.status})`;
    } catch (e: any) {
        return `error: ${e.message}`;
    }
}

// ===== GET: Preview =====
export async function GET(request: NextRequest) {
    if (!verifyAccess(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUrls = await getAllUrls();
    const totalBatches = Math.ceil(allUrls.length / BATCH_SIZE);
    const forceBatch = request.nextUrl.searchParams.get("batch");
    const batchIndex = forceBatch ? parseInt(forceBatch) : getDayOfYear() % totalBatches;
    const batchUrls = allUrls.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);

    return NextResponse.json({
        preview: true,
        totalUrls: allUrls.length,
        totalBatches,
        todayBatch: batchIndex,
        batchSize: batchUrls.length,
        sampleUrls: batchUrls.slice(0, 10),
        allBatchesCompleteIn: `${totalBatches} days`,
        note: "Use POST to execute. Static pages + categories are always included.",
    });
}

// ===== POST: Execute =====
export async function POST(request: NextRequest) {
    if (!verifyAccess(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    const allUrls = await getAllUrls();
    const totalBatches = Math.ceil(allUrls.length / BATCH_SIZE);
    const forceBatch = request.nextUrl.searchParams.get("batch");
    const batchIndex = forceBatch ? parseInt(forceBatch) : getDayOfYear() % totalBatches;

    // Today's batch of product/content URLs
    const batchUrls = allUrls.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);

    // Always include static pages in every submission (they're most important)
    const staticPages = [
        BASE_URL,
        `${BASE_URL}/pencarian`,
        `${BASE_URL}/kategori`,
        `${BASE_URL}/berita`,
    ];
    
    // Merge static pages with today's batch (deduplicate)
    const urlsToSubmit = [...new Set([...staticPages, ...batchUrls])];

    // Execute all in parallel
    const [indexNowResult, googlePing, bingPing] = await Promise.all([
        submitToIndexNow(urlsToSubmit),
        pingGoogle(),
        pingBing(),
    ]);

    const duration = Date.now() - startTime;

    const result = {
        success: true,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        summary: {
            totalUrlsInSite: allUrls.length,
            totalBatches,
            todayBatch: `${batchIndex + 1}/${totalBatches}`,
            urlsSubmitted: urlsToSubmit.length,
            allBatchesCompleteIn: `${totalBatches} days`,
        },
        results: {
            indexNow: indexNowResult,
            googleSitemapPing: googlePing,
            bingSitemapPing: bingPing,
        },
        nextBatch: `Batch ${((batchIndex + 1) % totalBatches) + 1} tomorrow`,
        sampleUrlsSubmitted: urlsToSubmit.slice(0, 5),
    };

    console.log(`[SEO Daily Index] Batch ${batchIndex + 1}/${totalBatches} | ${urlsToSubmit.length} URLs | IndexNow: ${indexNowResult.status} | Google: ${googlePing} | Bing: ${bingPing}`);

    return NextResponse.json(result);
}
