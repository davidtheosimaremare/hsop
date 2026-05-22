import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProductSlug } from "@/lib/utils";
import { submitToGoogleIndexingAPI, submitToIndexNow, pingGoogleSitemap, pingBingSitemap } from "@/lib/google-indexing";

const BASE_URL = "https://shop.hokiindo.co.id";
const BATCH_SIZE = 500; // IndexNow allows up to 10,000 per request
const GOOGLE_API_DAILY_LIMIT = 200; // Google Indexing API limit per hari

/**
 * Daily Auto-Indexing System
 *
 * Strategi indexing:
 * 1. Google Indexing API (OAuth2) → Priority queue Google, crawl dalam hitungan jam
 * 2. IndexNow → Bing, Yandex, dll. (instant, tanpa auth)
 * 3. Google & Bing Sitemap Ping → Memberitahu update sitemap
 *
 * Rotasi batch harian agar semua URL ter-submit secara bergantian.
 *
 * GET  /api/seo/daily-index          → Preview batch hari ini (tidak ada aksi)
 * POST /api/seo/daily-index          → Eksekusi indexing harian
 * POST /api/seo/daily-index?batch=2  → Paksa batch tertentu (testing)
 *
 * Keamanan: tambahkan ?secret=YOUR_SECRET (set SEO_CRON_SECRET di .env)
 */

// Verifikasi cron secret
function verifyAccess(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get("secret");
  const envSecret = process.env.SEO_CRON_SECRET;

  // Jika tidak ada secret di .env, izinkan akses (untuk development)
  if (!envSecret) return true;

  return secret === envSecret;
}

// Hitung hari ke-N dalam tahun (untuk rotasi batch)
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Ambil semua URL yang bisa diindex
async function getAllUrls(): Promise<string[]> {
  const urls: string[] = [];

  // 1. Static pages (prioritas tertinggi)
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

  // 3. Product pages (diurutkan dari terbaru)
  const products = await db.product.findMany({
    where: { isVisible: true },
    select: { sku: true, name: true, brand: true, category: true },
    orderBy: { updatedAt: "desc" },
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
    todayBatch: batchIndex + 1,
    batchSize: batchUrls.length,
    sampleUrls: batchUrls.slice(0, 10),
    allBatchesCompleteIn: `${totalBatches} hari`,
    strategy: "IndexNow (Bing/Yandex) + Google Sitemap Ping",
    note: "Google Search Console crawl sitemap.xml secara otomatis. Gunakan POST untuk eksekusi.",
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

  // Batch URL produk/konten hari ini
  const batchUrls = allUrls.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);

  // Static pages selalu disertakan di setiap submission
  const staticPages = [
    BASE_URL,
    `${BASE_URL}/pencarian`,
    `${BASE_URL}/kategori`,
    `${BASE_URL}/berita`,
  ];

  // Gabungkan static + batch (deduplicate)
  const urlsToSubmit = [...new Set([...staticPages, ...batchUrls])];

  // Static pages + batch pertama untuk Google Indexing API (max 200/hari)
  const googleApiUrls = [...new Set([...staticPages, ...batchUrls])].slice(0, GOOGLE_API_DAILY_LIMIT);

  // Jalankan semua secara paralel
  const [googleIndexingResult, indexNowResult, googlePingResult, bingPingResult] = await Promise.all([
    submitToGoogleIndexingAPI(googleApiUrls),
    submitToIndexNow(urlsToSubmit),
    pingGoogleSitemap(),
    pingBingSitemap(),
  ]);

  const duration = Date.now() - startTime;

  const result = {
    success: true,
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    strategy: "Google Indexing API (priority) + IndexNow (Bing/Yandex) + Sitemap Ping",
    summary: {
      totalUrlsInSite: allUrls.length,
      totalBatches,
      todayBatch: `${batchIndex + 1}/${totalBatches}`,
      urlsSubmittedGoogleAPI: googleIndexingResult.submitted,
      urlsSubmittedIndexNow: urlsToSubmit.length,
      allBatchesCompleteIn: `${totalBatches} hari`,
    },
    results: {
      googleIndexingAPI: googleIndexingResult,
      indexNow: indexNowResult,
      googleSitemapPing: googlePingResult,
      bingSitemapPing: bingPingResult,
    },
    nextBatch: `Batch ${((batchIndex + 1) % totalBatches) + 1} besok`,
    sampleUrlsSubmitted: googleApiUrls.slice(0, 5),
    googleNote: `Google Indexing API aktif — ${googleIndexingResult.submitted} URL masuk priority queue Googlebot`,
  };

  console.log(
    `[SEO Daily Index] Batch ${batchIndex + 1}/${totalBatches} | ` +
    `Google API: ${googleIndexingResult.status} (${googleIndexingResult.submitted}/${googleApiUrls.length} URLs) | ` +
    `IndexNow: ${indexNowResult.status} (${urlsToSubmit.length} URLs) | ` +
    `Google Ping: ${googlePingResult.status} | Bing Ping: ${bingPingResult.status}`
  );

  return NextResponse.json(result);
}
