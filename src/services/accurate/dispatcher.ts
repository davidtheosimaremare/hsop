import { AccurateWebhookEvent, AccurateWebhookPayload } from "./types";
import { handleItemWebhook, handleCustomerWebhook, handleItemQuantityWebhook } from "./handlers/master-data";

export async function dispatchWebhook(payload: AccurateWebhookPayload) {
    const results = [];

    for (const event of payload) {
        console.log(`[Accurate Webhook] Dispatching event: ${event.type} (${event.uuid})`);

        let result;
        switch (event.type) {
            case 'ITEM':
                result = await handleItemWebhook(event);
                break;
            case 'ITEM_QUANTITY':
                result = await handleItemQuantityWebhook(event);
                break;
            case 'CUSTOMER':
                result = await handleCustomerWebhook(event);
                break;
            // More cases will be added here
            default:
                console.warn(`[Accurate Webhook] No handler for event type: ${event.type}`);
                result = { success: true, message: `No handler for ${event.type}` };
        }
        results.push(result);
    }

    return results;
}
