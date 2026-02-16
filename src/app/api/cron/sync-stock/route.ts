import { syncStockOnlyAction } from "@/app/actions/product";
import { NextRequest, NextResponse } from "next/server";

// Secret key to protect cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || "default-cron-secret-change-me";

/**
 * API Route for cron job to sync stock
 * Call this endpoint every 30 minutes from external cron service
 * 
 * Example cron setup (Vercel, cron-job.org, etc):
 * GET /api/cron/sync-stock?secret=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
    try {
        // Verify secret to prevent unauthorized access
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");

        if (secret !== CRON_SECRET) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.log("[CRON] Starting stock sync...");
        const result = await syncStockOnlyAction();
        console.log("[CRON] Stock sync complete:", result.message);

        return NextResponse.json({
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("[CRON] Stock sync failed:", error);
        return NextResponse.json(
            { error: "Stock sync failed" },
            { status: 500 }
        );
    }
}
