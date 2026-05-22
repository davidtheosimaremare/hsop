/**
 * SEO Indexing Utilities
 *
 * Strategy:
 * - IndexNow → Bing & Yandex (instant, free, no auth needed)
 * - Google Sitemap Ping → Memberitahu Google ada update sitemap baru
 * - Google Search Console → Daftarkan sitemap.xml sekali, Google crawl otomatis
 *
 * Google Indexing API (service account) TIDAK dipakai karena:
 * - Resminya hanya untuk Job Posting & Live Streaming schema
 * - Butuh setup service account yang kompleks
 * - Google Search Console + Sitemap sudah cukup untuk e-commerce
 */

const BASE_URL = "https://shop.hokiindo.co.id";
const INDEXNOW_KEY = "hokiindo2026seo";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// ─────────────────────────────────────────────
// IndexNow — Bing, Yandex, Seznam, Naver, etc.
// ─────────────────────────────────────────────
export async function submitToIndexNow(urls: string[]): Promise<{
  status: string;
  count: number;
  error?: string;
}> {
  if (urls.length === 0) {
    return { status: "skipped", count: 0, error: "No URLs provided" };
  }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
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

    const body = await res.text().catch(() => "");
    return { status: `failed (${res.status})`, count: 0, error: body };
  } catch (error: any) {
    return { status: "error", count: 0, error: error.message };
  }
}

// ─────────────────────────────────────────────
// Google Sitemap Ping
// Memberitahu Google bahwa sitemap diupdate.
// Google Search Console harus sudah mendaftarkan:
//   https://shop.hokiindo.co.id/sitemap.xml
// ─────────────────────────────────────────────
export async function pingGoogleSitemap(): Promise<{
  status: string;
  error?: string;
}> {
  const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
  const pingUrl = `https://www.google.com/ping?sitemap=${sitemapUrl}`;

  try {
    const res = await fetch(pingUrl, {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      return { status: "success" };
    }
    return { status: `failed (${res.status})` };
  } catch (error: any) {
    return { status: "error", error: error.message };
  }
}

// ─────────────────────────────────────────────
// Bing Sitemap Ping (bonus, gratis)
// ─────────────────────────────────────────────
export async function pingBingSitemap(): Promise<{
  status: string;
  error?: string;
}> {
  const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
  const pingUrl = `https://www.bing.com/ping?sitemap=${sitemapUrl}`;

  try {
    const res = await fetch(pingUrl, {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      return { status: "success" };
    }
    return { status: `failed (${res.status})` };
  } catch (error: any) {
    return { status: "error", error: error.message };
  }
}
