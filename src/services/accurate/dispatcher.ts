import { AccurateWebhookEvent, AccurateWebhookPayload } from "./types";
import { handleItemWebhook, handleCustomerWebhook, handleItemQuantityWebhook } from "./handlers/master-data";
import { handleSalesOrderWebhook, handleDeliveryOrderWebhook } from "./handlers/sales";
import { revalidatePath } from "next/cache";
import { notifyProductUpdated, notifyStockUpdated } from "@/lib/fcm-notifications";

export async function dispatchWebhook(payload: AccurateWebhookPayload) {
    const results = [];

    // Track apakah ada update produk/stok untuk FCM
    let hasProductUpdate = false;
    let hasStockUpdate = false;
    let updatedProductName: string | undefined;

    for (const event of payload) {
        console.log(`[Accurate Webhook] Dispatching event: ${event.type} (${event.uuid})`);

        let result;
        switch (event.type) {
            case 'ITEM':
                result = await handleItemWebhook(event);
                hasProductUpdate = true;
                // Coba ambil nama produk dari payload untuk notifikasi
                updatedProductName = (event as any)?.data?.name || (event as any)?.name;
                break;
            case 'ITEM_QUANTITY':
                result = await handleItemQuantityWebhook(event);
                hasStockUpdate = true;
                updatedProductName = (event as any)?.data?.name || (event as any)?.name;
                break;
            case 'CUSTOMER':
                result = await handleCustomerWebhook(event);
                break;
            case 'SALES_ORDER':
                result = await handleSalesOrderWebhook(event);
                break;
            case 'DELIVERY_ORDER':
                result = await handleDeliveryOrderWebhook(event);
                break;
            default:
                console.warn(`[Accurate Webhook] No handler for event type: ${event.type}`);
                result = { success: true, message: `No handler for ${event.type}` };
        }
        results.push(result);
    }

    // SAPU BERSIH SEMUA CACHE WEBSITE APAPUN TIPE WEBHOOKNYA!
    try {
        revalidatePath("/", "layout");
    } catch (e) {
        console.error("Gagal clear cache di dispatcher:", e);
    }

    // Kirim FCM push notification ke aplikasi mobile (fire and forget)
    // Dilakukan setelah semua handler selesai agar tidak mempengaruhi response time
    if (hasStockUpdate) {
        notifyStockUpdated(updatedProductName).catch(err =>
            console.error("[FCM] Gagal kirim stock update notification:", err)
        );
    } else if (hasProductUpdate) {
        notifyProductUpdated(updatedProductName).catch(err =>
            console.error("[FCM] Gagal kirim product update notification:", err)
        );
    }

    return results;
}

