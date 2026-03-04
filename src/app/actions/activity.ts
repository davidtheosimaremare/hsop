"use server";

import { db } from "@/lib/db";

export async function logActivity(
    quotationId: string,
    type: string,
    title: string,
    description?: string,
    performedBy?: string
) {
    try {
        await db.salesQuotationActivity.create({
            data: {
                quotationId,
                type,
                title,
                description,
                performedBy,
            },
        });
        return { success: true };
    } catch (error) {
        console.error("[logActivity] Error:", error);
        return { success: false, error: "Failed to log activity" };
    }
}
