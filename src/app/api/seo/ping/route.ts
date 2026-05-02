import { NextResponse } from "next/server";

/**
 * API route to ping Google & Bing about sitemap updates.
 * 
 * Usage: POST /api/seo/ping (from admin panel or after product updates)
 * 
 * This notifies search engines that the sitemap has been updated,
 * prompting them to re-crawl. This is the fastest way to get
 * new content indexed without waiting for natural crawl cycles.
 */
export async function POST() {
    const sitemapUrl = "https://shop.hokiindo.co.id/sitemap.xml";
    
    const results: { engine: string; status: string; error?: string }[] = [];

    // 1. Ping Google
    try {
        const googleRes = await fetch(
            `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
            { method: "GET", signal: AbortSignal.timeout(10000) }
        );
        results.push({
            engine: "Google",
            status: googleRes.ok ? "success" : `failed (${googleRes.status})`,
        });
    } catch (error: any) {
        results.push({
            engine: "Google",
            status: "error",
            error: error.message,
        });
    }

    // 2. Ping Bing
    try {
        const bingRes = await fetch(
            `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
            { method: "GET", signal: AbortSignal.timeout(10000) }
        );
        results.push({
            engine: "Bing",
            status: bingRes.ok ? "success" : `failed (${bingRes.status})`,
        });
    } catch (error: any) {
        results.push({
            engine: "Bing",
            status: "error",
            error: error.message,
        });
    }

    // 3. Ping IndexNow (Bing/Yandex instant indexing)
    try {
        const indexNowRes = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                host: "shop.hokiindo.co.id",
                key: "hokiindo2026seo",
                urlList: [
                    "https://shop.hokiindo.co.id",
                    "https://shop.hokiindo.co.id/pencarian",
                    "https://shop.hokiindo.co.id/kategori",
                    "https://shop.hokiindo.co.id/berita",
                ],
            }),
            signal: AbortSignal.timeout(10000),
        });
        results.push({
            engine: "IndexNow",
            status: indexNowRes.ok || indexNowRes.status === 202 ? "success" : `failed (${indexNowRes.status})`,
        });
    } catch (error: any) {
        results.push({
            engine: "IndexNow",
            status: "error",
            error: error.message,
        });
    }

    return NextResponse.json({
        message: "Sitemap ping completed",
        results,
        sitemapUrl,
        timestamp: new Date().toISOString(),
    });
}

export async function GET() {
    return NextResponse.json({ 
        message: "Use POST to ping search engines about sitemap updates",
        usage: "POST /api/seo/ping" 
    });
}
