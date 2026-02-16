export type AccurateWebhookAction = 'WRITE' | 'DELETE';

export interface AccurateWebhookItemData {
    itemId: number;
    itemNo: string;
    action: AccurateWebhookAction;
}

export interface AccurateWebhookCustomerData {
    customerId: number;
    customerNo: string;
    action: AccurateWebhookAction;
}

export interface AccurateWebhookItemQuantityData {
    itemId?: number;
    itemNo: string;
    warehouseName?: string;
    action: string;
}

export interface AccurateWebhookEvent<T = any> {
    databaseId: number;
    type: string;
    timestamp: string;
    uuid: string;
    data: T[];
}

export type AccurateWebhookPayload = AccurateWebhookEvent[];
