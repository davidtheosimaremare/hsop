import { AccurateWebhookEvent } from "../types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { fetchAccurateSODetail } from "@/lib/accurate";

export interface SalesOrderData {
    salesOrderId: number;
    salesOrderNo: string;
    salesOrderTotalAmount?: string;
    action: string;
    // Optional: for simulator testing — include the source HSQ reference directly
    // In real Accurate webhooks this won't be present, but our simulator can include it
    _hsqRef?: string;  // e.g. "HRSQ/26/03/01"
    _hsqId?: number;
}

export interface DeliveryOrderData {
    deliveryOrderId: number;
    deliveryOrderNo: string;
    action: string;
}

/**
 * When Accurate triggers a SALES_ORDER webhook:
 *
 * STRATEGY (Prioritized):
 * 1. Call Accurate API to get SO detail → check if it has a salesQuotation reference (100% accurate)
 * 2. Fallback: Find SQ in PROCESSING status with matching HSQ link and no SO yet (best-effort)
 */
export async function handleSalesOrderWebhook(event: AccurateWebhookEvent<SalesOrderData>) {
    console.log(`[Webhook SO] Processing ${event.data.length} sales orders`);

    const results = [];
    for (const so of event.data) {
        if (so.action !== "WRITE") {
            results.push({ success: true, message: `Skipped non-WRITE action for ${so.salesOrderNo}` });
            continue;
        }

        try {
            let targetSq = null;

            // ── STRATEGY 1: Tanya Balik ke Accurate (100% Akurat) ──────────────────
            // Fetch SO detail from Accurate API to get source HSQ reference (number/id)
            const soDetail = await fetchAccurateSODetail(so.salesOrderId);

            if (soDetail?.salesQuotationNumber) {
                console.log(`[Webhook SO] SO ${so.salesOrderNo} linked to HSQ No: ${soDetail.salesQuotationNumber}`);
                targetSq = await db.salesQuotation.findFirst({
                    where: {
                        OR: [
                            { accurateHsqNo: soDetail.salesQuotationNumber },
                            { quotationNo: soDetail.salesQuotationNumber },
                        ],
                    },
                });
            }

            if (!targetSq && soDetail?.salesQuotationId) {
                console.log(`[Webhook SO] SO ${so.salesOrderNo} linked to HSQ ID: ${soDetail.salesQuotationId}`);
                targetSq = await db.salesQuotation.findFirst({
                    where: { accurateHsqId: soDetail.salesQuotationId },
                });
            }

            // ── STRATEGY 2: Pattern Matching (Berdasarkan nomor /26/03/051) ──────
            if (!targetSq) {
                // Ekstrak bagian nomor setelah prefix (misal HSO/26/03/051 -> /26/03/051)
                const numberPart = so.salesOrderNo.includes('/')
                    ? so.salesOrderNo.substring(so.salesOrderNo.indexOf('/'))
                    : null;

                if (numberPart) {
                    console.log(`[Webhook SO] Searching for SQ with pattern ending in: ${numberPart}`);
                    targetSq = await db.salesQuotation.findFirst({
                        where: {
                            OR: [
                                { quotationNo: { endsWith: numberPart } },
                                { accurateHsqNo: { endsWith: numberPart } }
                            ]
                        },
                        orderBy: { createdAt: 'desc' }
                    });
                }
            }

            // ── STRATEGY 3: Fallback via Status Queue (Jika semua gagal) ──────────
            if (!targetSq) {
                console.warn(`[Webhook SO] No pattern match found. Falling back to status-search for ${so.salesOrderNo}`);
                targetSq = await db.salesQuotation.findFirst({
                    where: {
                        status: "PROCESSING",
                        accurateHsqNo: { not: null },
                        accurateHsoNo: null,
                    },
                    orderBy: { processedAt: "desc" },
                });
            }

            if (!targetSq) {
                console.warn(`[Webhook SO] No matching SalesQuotation found for SO ${so.salesOrderNo}`);
                results.push({ success: true, message: `No matching SQ for SO ${so.salesOrderNo}` });
                continue;
            }

            // At this point targetSq is guaranteed not null due to the check above
            // ── Update SalesQuotation ──────────────────────────────────────────────
            await db.salesQuotation.update({
                where: { id: targetSq.id },
                data: {
                    status: "OFFERED",
                    accurateHsoId: so.salesOrderId,
                    accurateHsoNo: so.salesOrderNo,
                    confirmedAt: new Date(),
                },
            });

            await db.salesQuotationActivity.create({
                data: {
                    quotationId: targetSq.id,
                    type: "OFFERED",
                    title: "Pesanan Diproses",
                    description: `Pesanan sudah diproses dengan HSO: ${so.salesOrderNo}`,
                    performedBy: "SYSTEM",
                },
            });

            revalidatePath(`/admin/sales/quotations/${targetSq.quotationNo}`);
            revalidatePath("/admin/sales/quotations");
            revalidatePath("/admin/orders");

            console.log(`[Webhook SO] ✓ Linked SQ ${targetSq.quotationNo} → SO ${so.salesOrderNo}`);
            results.push({ success: true, message: `SQ ${targetSq.quotationNo} → SO ${so.salesOrderNo}` });

        } catch (err: any) {
            console.error(`[Webhook SO] Error for ${so.salesOrderNo}:`, err);
            results.push({ success: false, message: `Error: ${err.message}` });
        }
    }

    return {
        success: true,
        message: `Processed ${results.length} SO(s): ${results.map(r => r.message).join("; ")}`,
    };
}

/**
 * When Accurate triggers a DELIVERY_ORDER webhook:
 *
 * STRATEGY: Match via the SO number stored on our SQ (accurateHsoNo).
 * DO webhook includes deliveryOrderNo (HDO/26/03/078), and our SO webhook previously saved
 * the SO number. We look for SQ with status=OFFERED that has an SO linked but no DO yet.
 *
 * For better accuracy if Accurate API has a DO detail endpoint with SO reference,
 * that can be added here similarly to the SO handler above.
 */
export async function handleDeliveryOrderWebhook(event: AccurateWebhookEvent<DeliveryOrderData>) {
    console.log(`[Webhook DO] Processing ${event.data.length} delivery orders`);

    const results = [];
    for (const doItem of event.data) {
        if (doItem.action !== "WRITE") {
            results.push({ success: true, message: `Skipped non-WRITE action for ${doItem.deliveryOrderNo}` });
            continue;
        }

        try {
            let targetSq = null;

            // ── STRATEGY 1: Pattern Matching (Berdasarkan nomor /26/03/051) ──────
            const numberPart = doItem.deliveryOrderNo.includes('/')
                ? doItem.deliveryOrderNo.substring(doItem.deliveryOrderNo.indexOf('/'))
                : null;

            if (numberPart) {
                console.log(`[Webhook DO] Searching for SQ with SO pattern ending in: ${numberPart}`);
                targetSq = await db.salesQuotation.findFirst({
                    where: {
                        status: "OFFERED",
                        accurateHsoNo: { endsWith: numberPart }
                    },
                    orderBy: { confirmedAt: 'desc' }
                });
            }

            // ── STRATEGY 2: Fallback via Status Queue (Jika ppattern gagal) ──────
            if (!targetSq) {
                console.warn(`[Webhook DO] No pattern match found. Falling back to status-search for ${doItem.deliveryOrderNo}`);
                targetSq = await db.salesQuotation.findFirst({
                    where: {
                        status: "OFFERED",
                        accurateHsoNo: { not: null },
                        accurateDoNo: null,
                    },
                    orderBy: { confirmedAt: "desc" },
                });
            }

            if (!targetSq) {
                console.warn(`[Webhook DO] No matching SalesQuotation found for DO ${doItem.deliveryOrderNo}`);
                results.push({ success: true, message: `No matching SQ for DO ${doItem.deliveryOrderNo}` });
                continue;
            }

            await db.salesQuotation.update({
                where: { id: targetSq.id },
                data: {
                    status: "COMPLETED",
                    accurateDoId: doItem.deliveryOrderId,
                    accurateDoNo: doItem.deliveryOrderNo,
                    completedAt: new Date(),
                    shippedAt: new Date(),
                },
            });

            await db.salesQuotationActivity.create({
                data: {
                    quotationId: targetSq.id,
                    type: "COMPLETED",
                    title: "Dikirim (Delivery Order)",
                    description: `Pesanan ${targetSq.quotationNo} (SO: ${targetSq.accurateHsoNo}) telah dikirim. Nomor DO: ${doItem.deliveryOrderNo}`,
                    performedBy: "SYSTEM",
                },
            });

            revalidatePath(`/admin/sales/quotations/${targetSq.quotationNo}`);
            revalidatePath("/admin/sales/quotations");
            revalidatePath("/admin/orders");

            console.log(`[Webhook DO] ✓ Linked SQ ${targetSq.quotationNo} → DO ${doItem.deliveryOrderNo}`);
            results.push({ success: true, message: `SQ ${targetSq.quotationNo} → DO ${doItem.deliveryOrderNo}` });

        } catch (err: any) {
            console.error(`[Webhook DO] Error for ${doItem.deliveryOrderNo}:`, err);
            results.push({ success: false, message: `Error: ${err.message}` });
        }
    }

    return {
        success: true,
        message: `Processed ${results.length} DO(s): ${results.map(r => r.message).join("; ")}`,
    };
}
