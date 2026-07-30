import { generateAccurateAuthHeaders } from "./src/lib/accurate";
import fetch from "node-fetch";

async function main() {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/sellingprice-adjustment/list.do`;
    const url = new URL(endpoint);
    url.searchParams.append('sp.pageSize', '10');
    
    const headers = await generateAccurateAuthHeaders();
    const response = await fetch(url.toString(), { method: 'GET', headers: headers as any });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));

    if (result.d && result.d.length > 0) {
        const docId = result.d[0].id;
        console.log("\nFetching detail for doc:", docId);
        const detailUrl = new URL(`${host}/accurate/api/sellingprice-adjustment/detail.do`);
        detailUrl.searchParams.append('id', docId);
        const detailRes = await fetch(detailUrl.toString(), { method: 'GET', headers: headers as any });
        const detail = await detailRes.json();
        console.log(JSON.stringify(detail.d.detailItem ? detail.d.detailItem.slice(0, 2) : detail, null, 2));
    }
}
main();
