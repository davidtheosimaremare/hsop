import { AccurateWebhookEvent, AccurateWebhookItemData, AccurateWebhookCustomerData, AccurateWebhookItemQuantityData } from "../types";
import { db } from "@/lib/db";
import { syncSingleProductAction } from "@/app/actions/product";
import { syncSingleCustomerAction } from "@/app/actions/customer";

export async function handleItemWebhook(event: AccurateWebhookEvent<AccurateWebhookItemData>) {
    console.log(`[Accurate Webhook] Menangani event ITEM dengan ${event.data.length} item`);

    const results = [];
    for (const item of event.data) {
        if (item.action === 'WRITE') {
            console.log(`[Accurate Webhook] ITEM WRITE: ${item.itemNo} (ID: ${item.itemId})`);
            const res = await syncSingleProductAction(item.itemNo);
            results.push(res);
        } else if (item.action === 'DELETE') {
            console.log(`[Accurate Webhook] ITEM DELETE: ${item.itemNo} (ID: ${item.itemId})`);
            // Hapus produk dari database lokal
            await db.product.deleteMany({
                where: {
                    OR: [
                        { sku: item.itemNo },
                        { accurateId: item.itemId }
                    ]
                }
            });
            results.push({ success: true, message: `Dihapus: ${item.itemNo}` });
        }
    }

    return {
        success: true,
        message: `Processed ${event.data.length} items: ${results.map(r => r.message).join(", ")}`
    };
}

export async function handleCustomerWebhook(event: AccurateWebhookEvent<AccurateWebhookCustomerData>) {
    console.log(`[Accurate Webhook] Menangani event CUSTOMER dengan ${event.data.length} pelanggan`);

    const results = [];
    for (const customer of event.data) {
        if (customer.action === 'WRITE') {
            console.log(`[Accurate Webhook] CUSTOMER WRITE: ${customer.customerNo} (ID: ${customer.customerId})`);
            const res = await syncSingleCustomerAction(customer.customerNo);
            results.push(res);
        } else if (customer.action === 'DELETE') {
            console.log(`[Accurate Webhook] CUSTOMER DELETE: ${customer.customerNo} (ID: ${customer.customerId})`);
            // Hapus pelanggan dari database lokal
            await db.customer.deleteMany({
                where: {
                    OR: [
                        { id: customer.customerNo },
                        { accurateId: customer.customerId }
                    ]
                }
            });
            results.push({ success: true, message: `Dihapus: ${customer.customerNo}` });
        }
    }

    return {
        success: true,
        message: `Processed ${event.data.length} customers: ${results.map(r => r.message).join(", ")}`
    };
}
export async function handleItemQuantityWebhook(event: AccurateWebhookEvent<AccurateWebhookItemQuantityData>) {
    console.log(`[Accurate Webhook] Menangani event ITEM_QUANTITY dengan ${event.data.length} item`);

    const results = [];
    for (const item of event.data) {
        console.log(`[Accurate Webhook] ITEM_QUANTITY UPDATE: ${item.itemNo}`);
        // Kuantitas berbeda biasanya hanya membutuhkan resync data produk tunggal
        const res = await syncSingleProductAction(item.itemNo);
        results.push(res);
    }

    return {
        success: true,
        message: `Processed ${event.data.length} stock updates: ${results.map(r => r.message).join(", ")}`
    };
}
