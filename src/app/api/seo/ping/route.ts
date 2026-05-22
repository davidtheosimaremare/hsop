import { NextResponse } from "next/server";
import { submitToIndexNow, pingGoogleSitemap, pingBingSitemap } from "@/lib/google-indexing";

/**
 * API route to submit main pages to Google & Bing via IndexNow and Sitemap Ping.
 * 
 * Usage: POST /api/seo/ping (from admin panel or after product updates)
 */
export async function POST() {
    const BASE_URL = "https://shop.hokiindo.co.id";
    const coreUrls = [
        BASE_URL,
        `${BASE_URL}/pencarian`,
        `${BASE_URL}/kategori`,
        `${BASE_URL}/berita`,
    ];
    
    const results: { engine: string; status: string; count?: number; error?: string }[] = [];

    // 1. Submit to IndexNow (Bing/Yandex)
    try {
        const indexNowResult = await submitToIndexNow(coreUrls);
        results.push({
            engine: "IndexNow (Bing/Yandex)",
            status: indexNowResult.status,
            count: indexNowResult.count,
            error: indexNowResult.error,
        });
    } catch (error: any) {
        results.push({
            engine: "IndexNow (Bing/Yandex)",
            status: "error",
            error: error.message,
        });
    }

    // 2. Ping Google Sitemap
    try {
        const googlePing = await pingGoogleSitemap();
        results.push({
            engine: "Google Sitemap Ping",
            status: googlePing.status,
            error: googlePing.error,
        });
    } catch (error: any) {
        results.push({
            engine: "Google Sitemap Ping",
            status: "error",
            error: error.message,
        });
    }

    // 3. Ping Bing Sitemap
    try {
        const bingPing = await pingBingSitemap();
        results.push({
            engine: "Bing Sitemap Ping",
            status: bingPing.status,
            error: bingPing.error,
        });
    } catch (error: any) {
        results.push({
            engine: "Bing Sitemap Ping",
            status: "error",
            error: error.message,
        });
    }

    return NextResponse.json({
        message: "SEO API submission completed",
        results,
        coreUrls,
        timestamp: new Date().toISOString(),
    });
}

export async function GET() {
    return NextResponse.json({ 
        message: "Use POST to submit main pages to search engines",
        usage: "POST /api/seo/ping" 
    });
}

