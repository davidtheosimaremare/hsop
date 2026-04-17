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
 * Global cache object for stock and product metadata to reduce API pressure
 */
const stockCache = new Map<string, { value: number; expiresAt: number }>();
const productCache = {
    data: [] as AccurateProduct[],
    expiresAt: 0
};

const CACHE_TTL_STOCK = 1000 * 60 * 5; // 5 minutes for stock
const CACHE_TTL_PRODUCTS = 1000 * 60 * 30; // 30 minutes for product metadata

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

    const now = new Date();
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
    const signatureBase64 = await generateHmacSignature(secretKey, timestamp);

    return {
        'Authorization': `Bearer ${bearerToken}`,
        'X-Api-Signature': signatureBase64,
        'X-Api-Timestamp': timestamp,
        'Content-Type': 'application/json',
    };
}

// Internal function to fetch a single page
async function fetchProductPage(page: number, pageSize: number): Promise<AccurateProduct[]> {
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
            next: { revalidate: 1800 } // Cache at fetch level for 30 mins
        });

        if (!response.ok) throw new Error(`Accurate API error: ${response.status}`);
        const result = await response.json();
        if (!result.s) throw new Error(`Accurate API returned unsuccessful response: ${result.d || result.message}`);

        return result.d || [];
    } catch (err) {
        console.error('API call failed', err);
        return [];
    }
}

const MAX_PAGES = 100; // Safety limit

export async function fetchAllProducts(): Promise<AccurateProduct[]> {
    // Check local memory cache first
    const now = Date.now();
    if (productCache.data.length > 0 && productCache.expiresAt > now) {
        return productCache.data;
    }

    const allProducts: AccurateProduct[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES) {
        const products = await fetchProductPage(page, pageSize);
        const validProducts = products.filter(p =>
            !p.name.toUpperCase().includes('UNKNOWN') &&
            p.itemType === 'INVENTORY'
        );

        allProducts.push(...validProducts);
        if (products.length < pageSize) hasMore = false; else page++;
    }

    // Update cache
    productCache.data = allProducts;
    productCache.expiresAt = now + CACHE_TTL_PRODUCTS;

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
        address?: string; 
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
            next: { revalidate: 3600 } // Cache 1 hour
        });

        if (!response.ok) throw new Error(`Accurate API error: ${response.status}`);
        const result = await response.json();
        if (!result.s) throw new Error(`Accurate API returned unsuccessful response: ${result.d || result.message}`);

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
        if (customers.length < pageSize) hasMore = false; else page++;
    }
    return allCustomers;
}

/**
 * Fetch real-time stock for a list of SKUs using the working list.do endpoint.
 * Strategy: Check cache first, then fetch only missing ones.
 */
export async function fetchStockForProducts(skus: string[]): Promise<Map<string, number>> {
    if (skus.length === 0) return new Map();

    const now = Date.now();
    const resultStockMap = new Map<string, number>();
    const missingSkus: string[] = [];

    // 1. Check cache first
    for (const sku of skus) {
        const cached = stockCache.get(sku);
        if (cached && cached.expiresAt > now) {
            resultStockMap.set(sku, cached.value);
        } else {
            missingSkus.push(sku);
        }
    }

    if (missingSkus.length === 0) return resultStockMap;

    // 2. Fetch missing SKUs in batches if needed, or scan again (max 50 pages)
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const skuSet = new Set(missingSkus);
    const pageSize = 100;
    let page = 1;
    let hasMore = true;
    let foundInThisFetchCount = 0;

    while (hasMore && page <= 50) { 
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
                // Do not cache stock fetch at HTTP level to ensure we get fresh data when cache-miss occurs
                cache: 'no-store'
            });

            if (!response.ok) break;
            const result = await response.json();
            if (!result.s || !result.d) break;

            const items = result.d as Array<{ no: string; availableToSell?: number }>;

            for (const item of items) {
                // Store EVERY item in cache while we're at it (opportunistic caching)
                const stockVal = item.availableToSell || 0;
                stockCache.set(item.no, { value: stockVal, expiresAt: now + CACHE_TTL_STOCK });
                
                if (skuSet.has(item.no)) {
                    resultStockMap.set(item.no, stockVal);
                    foundInThisFetchCount++;
                }
            }

            if (foundInThisFetchCount >= missingSkus.length || items.length < pageSize) {
                break;
            }
            page++;
        } catch (error) {
            console.error('Failed to fetch stock batch:', error);
            break;
        }
    }

    return resultStockMap;
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
            next: { revalidate: 86400 } // Category cache 24h
        });

        if (!response.ok) throw new Error(`Accurate API error: ${response.status}`);
        const result = await response.json();
        if (!result.s) throw new Error(`Accurate API returned unsuccessful response: ${result.d || result.message}`);

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
        if (categories.length < pageSize) hasMore = false; else page++;
    }
    return allCategories;
}

// --- Specific Document Fetchers for RFQ Flow ---

export interface AccurateDocument {
    id: number;
    no: string; 
    date: string; 
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
    url.searchParams.append('sp.sort', 'id|desc');

    if (search) url.searchParams.append('filter.keywords', search);

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) return [];

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
            next: { revalidate: 300 } // Document list cache 5 mins
        });

        if (!response.ok) return [];
        const result = await response.json();
        if (!result.s) return [];

        return (result.d || []).map((item: any) => ({
            id: item.id,
            no: item.number || item.no || `#${item.id}`,
            date: item.transDate, 
            customer: item.customer,
            totalAmount: item.totalAmount,
            status: item.status
        }));
    } catch (err) {
        console.error(`API call failed for ${endpoint}`, err);
        return [];
    }
}


export async function fetchAccurateHSQ(page: number = 1, search?: string, pageSize: number = 20) {
    return fetchDocumentList('sales-quotation/list.do', page, pageSize, search);
}

export async function fetchAllAccurateHSQ(): Promise<AccurateDocument[]> {
    const allDocs: AccurateDocument[] = [];
    let page = 1;
    const pageSize = 100;
    const maxPages = 50;

    while (page <= maxPages) {
        const batch = await fetchDocumentList('sales-quotation/list.do', page, pageSize);
        if (batch.length === 0) break;
        allDocs.push(...batch);
        if (batch.length < pageSize) break; 
        page++;
    }
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
    return allDocs;
}

export async function fetchAllAccurateDO(): Promise<AccurateDocument[]> {
    const allDocs: AccurateDocument[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore && page <= 50) { 
        const docs = await fetchDocumentList('delivery-order/list.do', page, pageSize);
        allDocs.push(...docs);
        if (docs.length < pageSize) hasMore = false; else page++;
    }
    return allDocs;
}

export async function fetchAccurateSODetail(soId: number): Promise<{
    description?: string;
    toAddress?: string;
    termName?: string;
    number?: string;
    salesQuotationNumber?: string;
    salesQuotationId?: number;
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
            next: { revalidate: 300 }
        });

        if (!response.ok) return null;
        const result = await response.json();
        if (!result.s) return null;

        const d = result.d;
        const sqRef = d.salesQuotation || d.sourceSQ || d.sourceDocument || null;
        const sqNumber = sqRef?.number || sqRef?.no || d.salesQuotationNo || d.sqNumber || null;
        const sqId = sqRef?.id || d.salesQuotationId || null;

        return {
            description: d.description || d.memo || "",
            toAddress: d.toAddress || "",
            termName: d.term?.name || d.termName || "",
            number: d.number || d.no || "",
            salesQuotationNumber: sqNumber || undefined,
            salesQuotationId: sqId || undefined,
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
        if (!headers) return { r: { id: Date.now(), number: `MOCK-HRSQ-${Date.now()}` } };

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
            paymentTermNo: "", 
            paymentTerm: null,
            detailItem: quotation.items?.map((item: any) => {
                const basePrice = item.basePrice || item.price;
                const netPrice = item.price;
                let itemDiscPercent = undefined;

                if (basePrice > netPrice) {
                    const discPercent = ((basePrice - netPrice) / basePrice) * 100;
                    if (discPercent > 0) itemDiscPercent = parseFloat(discPercent.toFixed(2)).toString();
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

        const result = await response.json();
        if (!result.s) return null;
        return result.r;
    } catch (err: any) {
        console.error('Failed to create HRSQ in Accurate:', err.message);
        return null;
    }
}

export async function updateAccurateHSQ(accurateHsqId: number, quotation: any) {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/sales-quotation/save.do`;

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) return null;

        const detailItem: any[] = [];
        for (const item of (quotation.items || [])) {
            const basePrice = item.basePrice || item.price;
            const netPrice = item.price;
            let itemDiscPercent = undefined;
            if (basePrice > netPrice) {
                const disc = ((basePrice - netPrice) / basePrice) * 100;
                if (disc > 0) itemDiscPercent = parseFloat(disc.toFixed(2)).toString();
            }

            if (item.isAvailable !== false) {
                detailItem.push({
                    itemNo: item.productSku,
                    unitPrice: basePrice,
                    quantity: item.quantity,
                    itemDiscPercent: item.discountStr || itemDiscPercent,
                    detailName: item.productName
                });
            }
        }

        const payload: any = {
            id: accurateHsqId,
            useReplacement: true,
            detailItem,
        };

        if (quotation.specialDiscount && quotation.specialDiscount > 0) {
            payload.discountPercent = parseFloat(quotation.specialDiscount.toFixed(2)).toString();
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!result.s) return null;
        return result.r;
    } catch (err: any) {
        console.error('[updateAccurateHSQ] Error:', err.message);
        return null;
    }
}

export async function createAccurateCustomer(data: {
    name: string;
    email?: string; 
    phone?: string; 
    address?: string;
    cpName?: string; 
    cpEmail?: string;
    cpPhone?: string;
}) {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/customer/save.do`;

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) {
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

        if (data.cpName) {
            payload.detailContact = [
                {
                    name: data.cpName,
                    email: data.cpEmail,
                    mobilePhone: data.cpPhone,
                    bbmPin: data.cpPhone, 
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
        if (!result.s) return { s: false, message: result.d?.[0] || result.message };
        return { s: true, r: result.r || result.d }; 
    } catch (err: any) {
        console.error('Failed to create Customer in Accurate:', err.message);
        return { s: false, message: err.message };
    }
}

export async function updateAccurateCustomerAddresses(accurateId: number, data: any) {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/customer/save.do`;

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) return { s: false, message: "Mock mode" };

        const payload: any = { id: accurateId };
        if (data.name) payload.name = data.name;
        if (typeof data.shipSameAsBill !== 'undefined') payload.shipSameAsBill = data.shipSameAsBill;

        if (data.billAddress) {
            payload.billStreet = data.billAddress.street + (data.billAddress.district ? `, ${data.billAddress.district}` : "");
            payload.billCity = data.billAddress.city;
            payload.billProvince = data.billAddress.province;
            payload.billZipCode = data.billAddress.zipCode;
        }

        if (data.shipAddress) {
            payload.shipStreet = data.shipAddress.street + (data.shipAddress.district ? `, ${data.shipAddress.district}` : "");
            payload.shipCity = data.shipAddress.city;
            payload.shipProvince = data.shipAddress.province;
            payload.shipZipCode = data.shipAddress.zipCode;
        }

        if (data.contactList) payload.detailContact = data.contactList;
        if (data.shipAddressList) payload.detailShipAddress = data.shipAddressList;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(payload)
        });

        return await response.json();
    } catch (err: any) {
        console.error('Failed to update Accurate Customer:', err.message);
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
            next: { revalidate: 3600 }
        });

        const result = await response.json();
        if (!result.s) return null;
        return result.d;
    } catch (err) {
        console.error("Failed to fetch Accurate Customer Detail:", err);
        return null;
    }
}
