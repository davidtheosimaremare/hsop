import { generateAccurateAuthHeaders } from "./src/lib/accurate";
import fetch from "node-fetch";

async function fetchAdjustedSellingPrices(): Promise<Map<string, number>> {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/sellingprice-adjustment/list.do`;
    const url = new URL(endpoint);
    // Fetch last 100 documents
    url.searchParams.append('sp.page', '1');
    url.searchParams.append('sp.pageSize', '100');

    const adjustedPrices = new Map<string, number>();

    try {
        const headers = await generateAccurateAuthHeaders();
        if (!headers) return adjustedPrices;

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as any,
        });

        if (!response.ok) return adjustedPrices;
        const result = await response.json();
        if (!result.s || !result.d) return adjustedPrices;

        const docs = result.d as Array<{ id: number; number: string }>;
        for (const doc of docs) {
            try {
                const detailUrl = `${host}/accurate/api/sellingprice-adjustment/detail.do?id=${doc.id}`;
                const detailRes = await fetch(detailUrl, {
                    method: 'GET',
                    headers: headers as any,
                });
                if (!detailRes.ok) continue;
                const detailResult = await detailRes.json();
                if (!detailResult.s || !detailResult.d) continue;

                const detailItems = detailResult.d.detailItem || [];
                for (const item of detailItems) {
                    if (item.priceCategory?.name?.trim().toLowerCase() === "umum" && item.price > 0) {
                        const sku = item.item?.no?.toUpperCase();
                        if (sku) {
                            // Keep the latest / first found? The API sorts by latest usually.
                            if (!adjustedPrices.has(sku)) {
                                adjustedPrices.set(sku, item.price);
                            }
                        }
                    }
                }
            } catch (e) {}
        }
    } catch (err) {
        console.error(err);
    }
    return adjustedPrices;
}

async function main() {
    console.log("Fetching adjusted prices...");
    const map = await fetchAdjustedSellingPrices();
    console.log(`Found ${map.size} items with adjusted prices.`);
    
    // Test known SKU
    const sku1 = "6ES7321-1BL00-0AA0";
    console.log(`Adjusted price for ${sku1}:`, map.get(sku1) || "Not found");
}
main();
