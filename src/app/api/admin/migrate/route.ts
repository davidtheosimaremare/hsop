import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Fallback explicit migration for missing vendor columns
        await db.$executeRawUnsafe(`
            ALTER TABLE "Product" 
            ADD COLUMN IF NOT EXISTS "vendorPrice" DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS "marginType" TEXT,
            ADD COLUMN IF NOT EXISTS "marginValue" DOUBLE PRECISION;
        `);
        
        return NextResponse.json({ 
            success: true, 
            message: "Database schema successfully migrated. You can now refresh your web pages." 
        });
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
