/**
 * SEO Indexing Utilities
 *
 * Strategy:
 * - Google Indexing API (OAuth2) → Priority queue, crawl dalam hitungan jam
 * - IndexNow → Bing & Yandex (instant, free, no auth needed)
 * - Google & Bing Sitemap Ping → Memberitahu ada update sitemap baru
 *
 * Google Indexing API pakai OAuth2 user token (bukan service account)
 * karena GSC bug yang memblokir penambahan service account via UI.
 */

const BASE_URL = "https://shop.hokiindo.co.id";
const INDEXNOW_KEY = "hokiindo2026seo";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// ─────────────────────────────────────────────────────────────
// Google Indexing API via OAuth2 Refresh Token
// Memasukkan URL ke priority queue Googlebot (crawl dalam jam)
// Jatah: 200 URL/hari
// ─────────────────────────────────────────────────────────────

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getGoogleAccessToken(): Promise<string> {
  // Gunakan cache jika token masih valid (sisa > 5 menit)
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 300000) {
    return cachedAccessToken.token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, atau GOOGLE_REFRESH_TOKEN tidak ditemukan di .env"
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(
      `Gagal mendapatkan access token: ${data.error_description || data.error || res.status}`
    );
  }

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return cachedAccessToken.token;
}

export async function submitToGoogleIndexingAPI(
  urls: string[],
  maxUrls = 200 // Batas harian Google Indexing API
): Promise<{
  status: string;
  submitted: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  if (urls.length === 0) {
    return { status: "skipped", submitted: 0, failed: 0, skipped: 0, errors: [] };
  }

  const urlsToSubmit = urls.slice(0, maxUrls);
  const skipped = urls.length - urlsToSubmit.length;

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken();
  } catch (err: any) {
    return {
      status: "auth_error",
      submitted: 0,
      failed: 0,
      skipped: urls.length,
      errors: [err.message],
    };
  }

  let submitted = 0;
  let failed = 0;
  const errors: string[] = [];

  // Submit satu per satu (Google Indexing API tidak mendukung batch)
  // Jalankan paralel dengan batas 10 concurrent request
  const CONCURRENCY = 10;
  for (let i = 0; i < urlsToSubmit.length; i += CONCURRENCY) {
    const batch = urlsToSubmit.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const res = await fetch(
          "https://indexing.googleapis.com/v3/urlNotifications:publish",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ url, type: "URL_UPDATED" }),
            signal: AbortSignal.timeout(15000),
          }
        );

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`${url} → ${res.status}: ${body.slice(0, 100)}`);
        }

        return url;
      })
    );

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        submitted++;
      } else {
        failed++;
        errors.push(result.reason?.message || "Unknown error");
      }
    });
  }

  const status =
    failed === 0 ? "success" : submitted > 0 ? "partial" : "failed";

  return { status, submitted, failed, skipped, errors: errors.slice(0, 5) };
}

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
