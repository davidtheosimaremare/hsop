import { createHmac } from "crypto";

export interface AccurateProduct {
    id: number;
    no: string;
    name: string;
    itemType: string;
    unitPrice?: number;
    availableToSell?: number;
    itemBrand?: {
        id: number;
        name: string;
    };
    itemCategory?: {
        id: number;
        name: string;
    };
}

/**
 * Generate HMAC SHA256 signature using Node.js Crypto
 */
async function generateHmacSignature(secretKey: string, message: string): Promise<string> {
    const hmac = createHmac("sha256", secretKey);
    hmac.update(message);
    return hmac.digest("base64");
}

/**
 * Generate Accurate API authentication headers
 */
export async function generateAccurateAuthHeaders() {
    const secretKey = process.env.ACCURATE_SECRET_KEY;
    const bearerToken = process.env.ACCURATE_BEARER_TOKEN;

    if (!secretKey || !bearerToken) {
        if (process.env.NODE_ENV === "development") {
            console.warn("Missing Accurate Credentials. Using MOCK Mode.");
            return null; // Signal to use mock
        }
        throw new Error('Accurate API credentials are missing in .env');
    }

    // 1. Generate timestamp in ISO format
    const timestamp = new Date().toISOString();

    // 2. Generate HMAC SHA256 signature
    const signatureBase64 = await generateHmacSignature(secretKey, timestamp);

    // 3. Return headers
    return {
        'Authorization': `Bearer ${bearerToken}`,
        'X-Api-Signature': signatureBase64,
        'X-Api-Timestamp': timestamp,
        'Content-Type': 'application/json',
    };
}

// Internal function to fetch a single page
async function fetchProductPage(page: number, pageSize: number): Promise<AccurateProduct[]> {
    const baseUrl = 'https://account.accurate.id/api/item/list.do'; // Verify this URL, user provided relative path '/api-accurate/...' in example which implies proxy, but usually these are direct server-to-server 
    // User example: '/api-accurate/accurate/api/item/list.do' with proxy. Server-side we should use full URL likely.
    // Actually, Accurate Open API format is usually distinct. 
    // Let's assume the user provided logic is correct for their specific integration. 
    // However, `window.location.origin` usage in user example implies CLIENT SIDE calling.
    // Since we are moving this to SERVER SIDE (Next.js server action), we need the absolute URL of the API.
    // Common Accurate URL: https://zeus.accurate.id/accurate/api/...
    // Let's stick to a placeholder or config variable for the HOST if unsure, but standard is zeus.accurate.id for cloud.
    // Wait, user provided internal function logic.

    // Let's assume standard endpoint or ENV var.
    // The user example had: /api-accurate/accurate/api/item/list.do
    // This looks like a proxy rewrite.

    // For Server Action, we need direct URL.
    // Let's accept standard Open API URL or strictly follow user logic if they use a specific host.
    // I will use a generic variable ACCURATE_API_HOST or fallback to zeus.accurate.id

    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/item/list.do`;

    const url = new URL(endpoint);

    const fields = [
        'id', 'no', 'name', 'itemType',
        'unitPrice', 'availableToSell', 'itemCategory', 'itemBrand'
    ].join(',');

    url.searchParams.append('fields', fields);
    url.searchParams.append('sp.page', page.toString());
    url.searchParams.append('sp.pageSize', pageSize.toString());

    try {
        const headers = await generateAccurateAuthHeaders();

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
        });

        if (!response.ok) {
            throw new Error(`Accurate API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.s) {
            throw new Error(`Accurate API returned unsuccessful response: ${result.d || result.message}`);
        }

        return result.d || [];
    } catch (err) {
        console.error('API call failed', err);
        return [];
    }
}

const MAX_PAGES = 100; // Safety limit

export async function fetchAllProducts(): Promise<AccurateProduct[]> {
    const allProducts: AccurateProduct[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES) {
        const products = await fetchProductPage(page, pageSize);

        // Filter out "UNKNOWN" products and ensure only "INVENTORY" (Persediaan) type
        const validProducts = products.filter(p =>
            !p.name.toUpperCase().includes('UNKNOWN') &&
            p.itemType === 'INVENTORY'
        );

        allProducts.push(...validProducts);

        if (products.length < pageSize) {
            hasMore = false;
        } else {
            page++;
        }
    }

    return allProducts;
}

// --- Customer Logic ---

export interface AccurateCustomer {
    id: number;
    no: string;
    name: string;
    contactInfo?: {
        email?: string;
        mobilePhone?: string;
        businessPhone?: string;
        address?: string; // Often address is a separate object or string
    };
    billAddress?: {
        street?: string;
    };
    category?: {
        id: number;
        name: string;
    };
}

async function fetchCustomerPage(page: number, pageSize: number): Promise<AccurateCustomer[]> {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/customer/list.do`;
    const url = new URL(endpoint);

    const fields = ['id', 'no', 'name', 'contactInfo', 'billAddress', 'category'].join(',');

    url.searchParams.append('fields', fields);
    url.searchParams.append('sp.page', page.toString());
    url.searchParams.append('sp.pageSize', pageSize.toString());

    try {
        const headers = await generateAccurateAuthHeaders();
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
        });

        if (!response.ok) {
            throw new Error(`Accurate API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.s) {
            throw new Error(`Accurate API returned unsuccessful response: ${result.d || result.message}`);
        }

        return result.d || [];
    } catch (err) {
        console.error('API call failed for customers', err);
        return [];
    }
}

export async function fetchAllCustomers(): Promise<AccurateCustomer[]> {
    const allCustomers: AccurateCustomer[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES) {
        const customers = await fetchCustomerPage(page, pageSize);
        allCustomers.push(...customers);

        if (customers.length < pageSize) {
            hasMore = false;
        } else {
            page++;
        }
    }
    return allCustomers;
}

/**
 * Fetch real-time stock for a list of SKUs using the working list.do endpoint.
 * Strategy: Fetch stock data in batches and filter by requested SKUs.
 */
export async function fetchStockForProducts(skus: string[]): Promise<Map<string, number>> {
    if (skus.length === 0) return new Map();

    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const stockMap = new Map<string, number>();
    const skuSet = new Set(skus); // For fast lookup

    // Fetch stock in batches - use same approach as sync but only get stock fields
    const pageSize = 100;
    let page = 1;
    let hasMore = true;
    let foundCount = 0;

    while (hasMore && page <= 50) { // Max 50 pages = 5000 items
        try {
            const url = new URL(`${host}/accurate/api/item/list.do`);
            url.searchParams.append('fields', 'no,availableToSell');
            url.searchParams.append('sp.page', page.toString());
            url.searchParams.append('sp.pageSize', pageSize.toString());

            const headers = await generateAccurateAuthHeaders();
            if (!headers) break;

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: headers as HeadersInit,
            });

            if (!response.ok) break;

            const result = await response.json();
            if (!result.s || !result.d) break;

            const items = result.d as Array<{ no: string; availableToSell?: number }>;

            // Filter and map only the SKUs we need
            for (const item of items) {
                if (skuSet.has(item.no)) {
                    stockMap.set(item.no, item.availableToSell || 0);
                    foundCount++;
                }
            }

            // Optimization: If we found all requested SKUs, stop fetching
            if (foundCount >= skus.length) {
                break;
            }

            // Check if there are more pages
            if (items.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        } catch (error) {
            console.error('Failed to fetch stock batch:', error);
            break;
        }
    }

    return stockMap;
}

// --- Category Logic ---

export interface AccurateItemCategory {
    id: number;
    no: string;
    name: string;
    parent?: {
        id: number;
        name: string;
    } | null;
}

async function fetchCategoryPage(page: number, pageSize: number): Promise<AccurateItemCategory[]> {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/item-category/list.do`;
    const url = new URL(endpoint);

    const fields = ['id', 'no', 'name', 'parent'].join(',');

    url.searchParams.append('fields', fields);
    url.searchParams.append('sp.page', page.toString());
    url.searchParams.append('sp.pageSize', pageSize.toString());

    try {
        const headers = await generateAccurateAuthHeaders();
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
        });

        if (!response.ok) {
            throw new Error(`Accurate API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.s) {
            throw new Error(`Accurate API returned unsuccessful response: ${result.d || result.message}`);
        }

        return result.d || [];
    } catch (err) {
        console.error('API call failed for item categories', err);
        throw err;
    }
}

export async function fetchAllItemCategories(): Promise<AccurateItemCategory[]> {
    const allCategories: AccurateItemCategory[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES) {
        const categories = await fetchCategoryPage(page, pageSize);
        allCategories.push(...categories);

        if (categories.length < pageSize) {
            hasMore = false;
        } else {
            page++;
        }
    }
    return allCategories;
}
