import { NextRequest, NextResponse } from "next/server";
import { syncStockOnlyAction } from "@/app/actions/product";

/**
 * Webhook API for syncing ONLY STOCK from Accurate to Database
 * 
 * Usage: POST /api/accurate/sync-stock?secret=YOUR_SECRET
 * 
 * This is designed to be run hourly via a cron job (e.g., Coolify Scheduled Tasks)
 * It only updates the 'availableToSell' field for existing products, 
 * making it much faster than a full product sync.
 */
export async function POST(request: NextRequest) {
    // Basic security using the same secret we used for SEO
    const secret = request.nextUrl.searchParams.get("secret");
    const envSecret = process.env.SEO_CRON_SECRET;
    
    if (envSecret && secret !== envSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[CRON] Starting hourly stock sync from Accurate...");
        const result = await syncStockOnlyAction();

        if (result.success) {
            console.log("[CRON] Hourly stock sync success:", result.message);
            return NextResponse.json({
                success: true,
                message: result.message,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error("[CRON] Hourly stock sync failed:", result.message);
            return NextResponse.json({
                success: false,
                error: result.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("[CRON] Hourly stock sync crashed:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: "Use POST to trigger the stock sync webhook",
        usage: "POST /api/accurate/sync-stock?secret=YOUR_SECRET" 
    });
}
