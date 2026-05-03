import { NextRequest, NextResponse } from "next/server";
import { syncProductsAction } from "@/app/actions/product";

/**
 * Webhook API for FULL SYNC from Accurate to Database
 * 
 * Usage: POST /api/accurate/sync-all?secret=YOUR_SECRET
 * 
 * This is designed to be run once a day (e.g., at midnight) via a cron job.
 * It updates everything (Names, Categories, SKUs, Prices, Stock) for all products.
 * This process takes longer and is heavier than the stock-only sync.
 */
export async function POST(request: NextRequest) {
    // Basic security using the same secret
    const secret = request.nextUrl.searchParams.get("secret");
    const envSecret = process.env.SEO_CRON_SECRET;
    
    if (envSecret && secret !== envSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[CRON] Starting FULL product sync from Accurate...");
        const result = await syncProductsAction();

        if (result.success) {
            console.log("[CRON] Full product sync success:", result.message);
            return NextResponse.json({
                success: true,
                message: result.message,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error("[CRON] Full product sync failed:", result.message);
            return NextResponse.json({
                success: false,
                error: result.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("[CRON] Full product sync crashed:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: "Use POST to trigger the full product sync webhook",
        usage: "POST /api/accurate/sync-all?secret=YOUR_SECRET" 
    });
}
