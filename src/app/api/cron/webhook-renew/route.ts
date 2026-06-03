import { NextRequest, NextResponse } from "next/server";

/**
 * Cron Job: Auto-renew Accurate webhook subscription
 *
 * Accurate webhook token expires — ini memanggil endpoint renewal otomatis.
 * Jadwalkan via Coolify / cron-job.org setiap 5 hari sekali.
 *
 * GET /api/cron/webhook-renew?secret=YOUR_CRON_SECRET
 */

const CRON_SECRET = process.env.SEO_CRON_SECRET || "";
const ACCURATE_BEARER_TOKEN = process.env.ACCURATE_BEARER_TOKEN || "";
const ACCURATE_BASE_URL = "https://account.accurate.id";

export async function GET(request: NextRequest) {
    // 1. Verifikasi secret agar tidak bisa dipanggil sembarang orang
    const secret = request.nextUrl.searchParams.get("secret");
    if (CRON_SECRET && secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ACCURATE_BEARER_TOKEN) {
        return NextResponse.json(
            { error: "ACCURATE_BEARER_TOKEN tidak dikonfigurasi di environment variables" },
            { status: 500 }
        );
    }

    try {
        console.log("[CRON] Memulai renewal webhook Accurate...");

        // 2. Panggil endpoint renewal webhook Accurate
        const renewUrl = `${ACCURATE_BASE_URL}/api/webhook-renew.do`;
        const response = await fetch(renewUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ACCURATE_BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        const responseText = await response.text();
        let responseData: any;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = { raw: responseText };
        }

        if (!response.ok) {
            console.error(
                `[CRON] Webhook renew gagal: HTTP ${response.status}`,
                responseData
            );
            return NextResponse.json(
                {
                    success: false,
                    error: `Accurate API merespons dengan status ${response.status}`,
                    details: responseData,
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
