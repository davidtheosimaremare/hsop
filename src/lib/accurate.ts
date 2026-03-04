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

    // 1. Generate timestamp in format DD/MM/YYYY HH:mm:ss (Asia/Jakarta timezone)
    // Accurate Private API requires this specific format
    const now = new Date();

    // Use Intl.DateTimeFormat to be extremely precise about the parts
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";

    const timestamp = `${getPart('day')}/${getPart('month')}/${getPart('year')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;

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

// --- Specific Document Fetchers for RFQ Flow ---

export interface AccurateDocument {
    id: number;
    no: string; // Document Number
    date: string; // DD/MM/YYYY
    customer?: {
        id: number;
        name: string;
    }
    totalAmount?: number;
    status?: string;
}

async function fetchDocumentList(endpoint: string, page: number = 1, pageSize: number = 20, search?: string): Promise<AccurateDocument[]> {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const url = new URL(`${host}/accurate/api/${endpoint}`);

    const fields = ['id', 'number', 'no', 'transDate', 'customer', 'totalAmount', 'status'].join(',');

    url.searchParams.append('fields', fields);
    url.searchParams.append('sp.page', page.toString());
    url.searchParams.append('sp.pageSize', pageSize.toString());
    url.searchParams.append('sp.sort', 'id|desc'); // Use ID|DESC to ensure newest created is at top (Safe for Accurate)

    if (search) {
        // Simple search by number or customer name
        // Accurate API filtering might be different, but let's try 'keywords' or similar if supported.
        // Official API uses 'filter.keywords'.
        url.searchParams.append('filter.keywords', search);
    }

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) {
            console.warn(`[Accurate] Skipping fetch for ${endpoint} due to missing credentials.`);
            return [];
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
        });

        if (!response.ok) return [];

        const result = await response.json();
        if (!result.s) return [];

        return (result.d || []).map((item: any) => ({
            id: item.id,
            no: item.number || item.no || `#${item.id}`,
            date: item.transDate, // Accurate format DD/MM/YYYY
            customer: item.customer,
            totalAmount: item.totalAmount,
            status: item.status
        }));
    } catch (err) {
        console.error(`API call failed for ${endpoint}`, err);
        return [];
    }
}


export async function fetchAccurateHSQ(page: number = 1, search?: string) {
    return fetchDocumentList('sales-quotation/list.do', page, 20, search);
}

export async function fetchAllAccurateHSQ(): Promise<AccurateDocument[]> {
    const allDocs: AccurateDocument[] = [];
    let page = 1;
    const pageSize = 100; // Fetch larger pages for efficiency
    const maxPages = 50;

    while (page <= maxPages) {
        const batch = await fetchDocumentList('sales-quotation/list.do', page, pageSize);
        if (batch.length === 0) break;
        allDocs.push(...batch);
        if (batch.length < pageSize) break; // Last page
        page++;
    }

    console.log(`[Accurate] Fetched all ${allDocs.length} SQ documents`);
    return allDocs;
}

export async function fetchAccurateHSO(page: number = 1, search?: string) {
    return fetchDocumentList('sales-order/list.do', page, 20, search);
}

export async function fetchAllAccurateHSO(): Promise<AccurateDocument[]> {
    const allDocs: AccurateDocument[] = [];
    let page = 1;
    const pageSize = 100;
    const maxPages = 50;

    while (page <= maxPages) {
        const batch = await fetchDocumentList('sales-order/list.do', page, pageSize);
        if (batch.length === 0) break;
        allDocs.push(...batch);
        if (batch.length < pageSize) break;
        page++;
    }

    console.log(`[Accurate] Fetched all ${allDocs.length} SO documents`);
    return allDocs;
}

export async function fetchAllAccurateDO(): Promise<AccurateDocument[]> {
    const allDocs: AccurateDocument[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore && page <= 50) { // Max 50 pages = 5000 docs
        const docs = await fetchDocumentList('delivery-order/list.do', page, pageSize);
        allDocs.push(...docs);

        if (docs.length < pageSize) {
            hasMore = false;
        } else {
            page++;
        }
    }
    return allDocs;
}

export async function fetchAccurateSODetail(soId: number): Promise<{
    description?: string;
    toAddress?: string;
    termName?: string;
    number?: string;
} | null> {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const url = new URL(`${host}/accurate/api/sales-order/detail.do`);
    url.searchParams.append('id', soId.toString());

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) return null;

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
        });

        if (!response.ok) return null;
        const result = await response.json();
        if (!result.s) return null;

        const d = result.d;
        return {
            description: d.description || d.memo || "",
            toAddress: d.toAddress || "",
            termName: d.term?.name || d.termName || "",
            number: d.number || d.no || "",
        };
    } catch (err) {
        console.error("Failed to fetch SO detail:", err);
        return null;
    }
}

export async function createAccurateHSQ(quotation: any) {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/sales-quotation/save.do`;

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) {
            console.warn("[Accurate API] Mocking HRSQ creation.");
            return { r: { id: Date.now(), number: `MOCK-HRSQ-${Date.now()}` } };
        }

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();

        const payload = {
            number: quotation.quotationNo,
            transDate: `${dd}/${mm}/${yyyy}`,
            customerNo: quotation.customer?.accurateNo || quotation.customer?.accurateCustomerCode || quotation.clientName || "C.0001",
            currencyNo: "IDR",
            taxable: false,
            inclusiveTax: false,
            description: "",
            toAddress: quotation.customer?.address || quotation.shippingAddress || "",
            paymentTermNo: "", // "status pembayaran" dikosongkan agar diisi admin
            paymentTerm: null,
            detailItem: quotation.items?.map((item: any) => {
                const basePrice = item.basePrice || item.price;
                const netPrice = item.price;
                let itemDiscPercent = undefined;

                if (basePrice > netPrice) {
                    const discPercent = ((basePrice - netPrice) / basePrice) * 100;
                    if (discPercent > 0) {
                        itemDiscPercent = parseFloat(discPercent.toFixed(2)).toString();
                    }
                }

                return {
                    itemNo: item.productSku,
                    unitPrice: basePrice,
                    quantity: item.quantity,
                    itemDiscPercent: item.discountStr || itemDiscPercent,
                    detailName: item.productName
                };
            }) || []
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error(`Accurate API returned non-JSON response: ${responseText}`);
            throw new Error(`Non-JSON response from Accurate API: ${responseText.substring(0, 50)}...`);
        }

        if (!result.s) {
            console.error(`Accurate API returned unsuccessful response: ${result.d?.[0] || result.message}`);
            return null;
        }

        return result.r;
    } catch (err: any) {
        console.error('Failed to create HRSQ in Accurate:', err.message);
        return null;
    }
}

/**
 * Update an existing Accurate HSQ by its numeric ID.
 * Rebuilds detailItem list from the updated quotation items + alternatives.
 */
export async function updateAccurateHSQ(accurateHsqId: number, quotation: any) {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/sales-quotation/save.do`;

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) {
            console.warn("[Accurate API] Skipping HSQ update - no credentials.");
            return null;
        }

        // Build item list: include available items + any alternatives offered
        const detailItem: any[] = [];
        for (const item of (quotation.items || [])) {
            const basePrice = item.basePrice || item.price;
            const netPrice = item.price;
            let itemDiscPercent = undefined;
            if (basePrice > netPrice) {
                const disc = ((basePrice - netPrice) / basePrice) * 100;
                if (disc > 0) itemDiscPercent = parseFloat(disc.toFixed(2)).toString();
            }

            // Main item (only if available or null)
            if (item.isAvailable !== false) {
                detailItem.push({
                    itemNo: item.productSku,
                    unitPrice: basePrice,
                    quantity: item.quantity,
                    itemDiscPercent: item.discountStr || itemDiscPercent,
                    detailName: item.productName
                });
            }

            // Alternative items offered to customer
            const alts = item.SalesQuotationItemAlternative || item.alternatives || [];
            if (alts.length > 0) {
                for (const alt of alts) {
                    detailItem.push({
                        itemNo: alt.productSku,
                        unitPrice: alt.price,
                        quantity: alt.quantity || item.quantity,
                        detailName: `[ALT] ${alt.productName}`
                    });
                }
            }
        }

        const payload: any = {
            id: accurateHsqId,
            detailItem,
        };

        // Apply overall special discount if any
        if (quotation.specialDiscount && quotation.specialDiscount > 0) {
            payload.discountPercent = parseFloat(quotation.specialDiscount.toFixed(2)).toString();
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error(`[updateAccurateHSQ] Non-JSON response: ${responseText.substring(0, 100)}`);
            return null;
        }

        if (!result.s) {
            console.error(`[updateAccurateHSQ] Failed: ${result.d?.[0] || result.message}`);
            return null;
        }

        console.log(`[updateAccurateHSQ] Successfully updated HSQ ID ${accurateHsqId}`);
        return result.r;
    } catch (err: any) {
        console.error('[updateAccurateHSQ] Error:', err.message);
        return null;
    }
}

export async function createAccurateCustomer(data: {
    name: string; // This should be Company Name if Business, or Person Name if General
    email?: string; // Company Email
    phone?: string; // Company Phone
    address?: string;
    cpName?: string; // Contact Person Name
    cpEmail?: string;
    cpPhone?: string;
}) {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/customer/save.do`;

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) {
            console.warn("[Accurate API] Mocking Customer creation.");
            const mockNo = `C.${Math.floor(10000 + Math.random() * 90000)}`;
            return { s: true, r: { id: Date.now(), number: mockNo } };
        }

        const payload: any = {
            name: data.name,
            workPhone: data.phone,
            mobilePhone: data.phone,
            email: data.email,
        };

        if (data.address) {
            payload.billStreet = data.address;
            payload.shipStreet = data.address;
        }

        // Add Contact Person if provided
        if (data.cpName) {
            payload.detailContact = [
                {
                    name: data.cpName,
                    email: data.cpEmail,
                    mobilePhone: data.cpPhone,
                    bbmPin: data.cpPhone, // WhatsApp
                    position: "Primary Contact",
                    salutation: "MR"
                }
            ];
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.s) {
            console.error(`Accurate API Customer creation failed: ${result.d?.[0] || result.message}`);
            return { s: false, message: result.d?.[0] || result.message };
        }

        const customerData = result.r || result.d;
        return { s: true, r: customerData }; // contains id and number
    } catch (err: any) {
        console.error('Failed to create Customer in Accurate:', err.message);
        return { s: false, message: err.message };
    }
}
export async function updateAccurateCustomerAddresses(accurateId: number, data: {
    name?: string,
    billAddress?: {
        street?: string;
        district?: string;
        city?: string;
        province?: string;
        zipCode?: string;
    },
    shipAddress?: {
        street?: string;
        district?: string;
        city?: string;
        province?: string;
        zipCode?: string;
    },
    shipSameAsBill?: boolean,
    contactList?: Array<{
        name: string;
        mobilePhone?: string;
        bbmPin?: string;
        email?: string;
        position?: string;
        salutation?: string;
    }>,
    shipAddressList?: Array<{
        id?: number;
        street?: string;
        city?: string;
        province?: string;
        zipCode?: string;
        picName?: string;
        picMobileNo?: string;
    }>
}) {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/customer/save.do`;

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) return { s: false, message: "Mock mode - No Accurate credentials" };

        const payload: any = {
            id: accurateId, // ID from Accurate
        };

        if (data.name) {
            payload.name = data.name;
        }

        if (typeof data.shipSameAsBill !== 'undefined') {
            payload.shipSameAsBill = data.shipSameAsBill;
        }

        if (data.billAddress) {
            let billStreet = data.billAddress.street || "";
            if (data.billAddress.district && !billStreet.toLowerCase().includes(data.billAddress.district.toLowerCase())) {
                billStreet = `${billStreet}, ${data.billAddress.district}`;
            }
            payload.billStreet = billStreet;
            payload.billCity = data.billAddress.city;
            payload.billProvince = data.billAddress.province;
            payload.billZipCode = data.billAddress.zipCode;
        }

        if (data.shipAddress) {
            let shipStreet = data.shipAddress.street || "";
            if (data.shipAddress.district && !shipStreet.toLowerCase().includes(data.shipAddress.district.toLowerCase())) {
                shipStreet = `${shipStreet}, ${data.shipAddress.district}`;
            }
            payload.shipStreet = shipStreet;
            payload.shipCity = data.shipAddress.city;
            payload.shipProvince = data.shipAddress.province;
            payload.shipZipCode = data.shipAddress.zipCode;
        }

        if (data.contactList) {
            payload.detailContact = data.contactList; // Zeus uses detailContact for updates
        }

        if (data.shipAddressList) {
            payload.detailShipAddress = data.shipAddressList; // Zeus uses detailShipAddress
        }

        console.log(`[Accurate API] PUT Payload:`, JSON.stringify(payload, null, 2));

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        return result; // contains {s: true/false, r: ...}
    } catch (err: any) {
        console.error('Failed to update Accurate Customer Address:', err.message);
        return { s: false, message: err.message };
    }
}

export async function getAccurateCustomerDetail(accurateId: number) {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const url = new URL(`${host}/accurate/api/customer/detail.do`);
    url.searchParams.append('id', accurateId.toString());

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) return null;

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
        });

        const result = await response.json();
        if (!result.s) return null;

        return result.d;
    } catch (err) {
        console.error("Failed to fetch Accurate Customer Detail:", err);
        return null;
    }
}
