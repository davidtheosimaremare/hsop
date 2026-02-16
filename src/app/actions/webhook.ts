"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dispatchWebhook } from "@/services/accurate/dispatcher";

/**
 * Step 1: Receives webhook and logs it as PENDING.
 * This ensures quick response to Accurate and avoids timeouts.
 */
export async function processWebhook(event: string, payload: any) {
    try {
        const eventName = event || (Array.isArray(payload) ? payload[0]?.type : "UNKNOWN");

        // Log the incoming webhook
        const log = await db.webhookLog.create({
            data: {
                event: eventName,
                payload: payload,
                status: "PENDING",
                source: "ACCURATE",
            },
        });

        console.log(`[Webhook] Queued event: ${eventName} (ID: ${log.id})`);

        // Fire and forget: trigger processing in background.
        // We don't await here to give immediate response to caller/Accurate.
        processQueueAction().catch(err => console.error("Background Queue Error:", err));

        revalidatePath("/admin/developer/webhooks");
        return { success: true, message: "Webhook queued successfully.", logId: log.id };

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Step 2: Processes PENDING webhooks from the database.
 * Can be called manually or scheduled.
 */
export async function processQueueAction() {
    try {
        // Get all pending logs, oldest first
        const pendingLogs = await db.webhookLog.findMany({
            where: { status: "PENDING" },
            orderBy: { processedAt: "asc" },
            take: 10, // Process in small batches
        });

        if (pendingLogs.length === 0) return { success: true, message: "No pending webhooks." };

        console.log(`[Queue] Processing ${pendingLogs.length} pending webhooks...`);

        for (const log of pendingLogs) {
            try {
                // Mark as processing
                await db.webhookLog.update({
                    where: { id: log.id },
                    data: { status: "PROCESSING" }
                });

                let message = "";
                const payload = log.payload;

                if (Array.isArray(payload)) {
                    const results = await dispatchWebhook(payload as any);
                    message = `Processed batch: ${results.map(r => r.message).join(", ")}`;
                } else {
                    // Legacy / Simulator/ Fallback logic
                    message = `Processed single event: ${log.event}`;
                }

                // Update to success
                await db.webhookLog.update({
                    where: { id: log.id },
                    data: {
                        status: "SUCCESS",
                        message: message
                    }
                });

            } catch (procError: any) {
                console.error(`[Queue] Error processing log ${log.id}:`, procError);

                await db.webhookLog.update({
                    where: { id: log.id },
                    data: {
                        status: "ERROR",
                        message: procError.message,
                        retryCount: { increment: 1 },
                        lastRetryAt: new Date()
                    }
                });
            }
        }

        return { success: true, message: `Processed ${pendingLogs.length} logs.` };

    } catch (error: any) {
        console.error("Queue Processing Failed:", error);
        return { success: false, error: error.message };
    }
}

export async function getQueueStatsAction() {
    try {
        const _count = await db.webhookLog.count({
            where: { status: "PENDING" }
        });
        return { pendingCount: _count };
    } catch (error) {
        return { pendingCount: 0 };
    }
}

export async function getWebhookLogs(page: number = 1, limit: number = 20) {
    try {
        const offset = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            db.webhookLog.findMany({
                orderBy: { processedAt: "desc" },
                take: limit,
                skip: offset,
            }),
            db.webhookLog.count()
        ]);

        return {
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return { logs: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };
    }
}
