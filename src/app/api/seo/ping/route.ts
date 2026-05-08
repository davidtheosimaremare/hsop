import { NextResponse } from "next/server";
import { submitToGoogleIndexing } from "@/lib/google-indexing";

/**
 * API route to submit main pages to Google & Bing via Indexing APIs.
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

    // 1. Submit to Google Indexing API
    try {
        const googleResult = await submitToGoogleIndexing(coreUrls);
        results.push({
            engine: "Google Indexing API",
            status: googleResult.status,
            count: googleResult.successCount,
            error: googleResult.errors.length > 0 ? googleResult.errors.join("; ") : undefined,
        });
    } catch (error: any) {
        results.push({
            engine: "Google Indexing API",
            status: "error",
            error: error.message,
        });
    }

    // 2. Submit to IndexNow (Bing/Yandex instant indexing)
    try {
        const indexNowRes = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                host: "shop.hokiindo.co.id",
                key: "hokiindo2026seo",
                urlList: coreUrls,
            }),
            signal: AbortSignal.timeout(10000),
        });
        results.push({
            engine: "IndexNow (Bing)",
            status: indexNowRes.ok || indexNowRes.status === 202 ? "success" : `failed (${indexNowRes.status})`,
            count: coreUrls.length,
        });
    } catch (error: any) {
        results.push({
            engine: "IndexNow (Bing)",
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
