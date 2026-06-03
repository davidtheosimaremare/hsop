import { NextRequest, NextResponse } from "next/server";
import { generateAccurateAuthHeaders } from "@/lib/accurate";

/**
 * Cron Job: Auto-renew Accurate webhook subscription
 *
 * Accurate memerlukan header X-Api-Signature (HMAC SHA256) di setiap request.
 * Endpoint ini memanggil renewal otomatis setiap 5 hari sekali via Coolify.
 *
 * GET /api/cron/webhook-renew?secret=YOUR_CRON_SECRET
 */

const CRON_SECRET = process.env.SEO_CRON_SECRET || "";
const ACCURATE_BASE_URL = "https://account.accurate.id";

export async function GET(request: NextRequest) {
    // 1. Verifikasi secret agar tidak bisa dipanggil sembarang orang
    const secret = request.nextUrl.searchParams.get("secret");
    if (CRON_SECRET && secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[CRON] Memulai renewal webhook Accurate...");

        // 2. Generate headers lengkap: Authorization + X-Api-Signature + X-Api-Timestamp
        const headers = await generateAccurateAuthHeaders();
        if (!headers) {
            return NextResponse.json(
                { error: "Kredensial Accurate tidak dikonfigurasi (ACCURATE_SECRET_KEY / ACCURATE_BEARER_TOKEN)" },
                { status: 500 }
            );
        }

        // 3. Panggil endpoint renewal webhook Accurate
        const renewUrl = `${ACCURATE_BASE_URL}/api/webhook-renew.do`;
        const response = await fetch(renewUrl, {
            method: "POST",
            headers: headers as HeadersInit,
        });

        const responseText = await response.text();
        let responseData: any;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = { raw: responseText };
        }

        // Accurate mengembalikan { s: true/false, d: ... }
        if (!response.ok || responseData?.s === false) {
            const errMsg = Array.isArray(responseData?.d)
                ? responseData.d.join(", ")
                : responseData?.d || `HTTP ${response.status}`;

            console.error(`[CRON] Webhook renew gagal: ${errMsg}`);
            return NextResponse.json(
                {
                    success: false,
                    error: errMsg,
                    accurateResponse: responseData,
                    timestamp: new Date().toISOString(),
                },
                { status: 502 }
            );
        }

        console.log("[CRON] Webhook Accurate berhasil diperbaharui:", responseData);

        return NextResponse.json({
            success: true,
            message: "Webhook Accurate berhasil diperbaharui",
            accurateResponse: responseData,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("[CRON] Webhook renew error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Internal Server Error",
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

