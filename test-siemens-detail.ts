import { generateAccurateAuthHeaders } from "./src/lib/accurate";
import fetch from "node-fetch";

async function main() {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/item/list.do`;
    const url = new URL(endpoint);
    url.searchParams.append('sp.pageSize', '1');
    url.searchParams.append('filter.keywords', 'Siemens');
    // Not appending 'fields' to get all fields

    const headers = await generateAccurateAuthHeaders();
    const response = await fetch(url.toString(), { method: 'GET', headers: headers as any });
    const result = await response.json();
    
    if (result.d && result.d.length > 0) {
        const itemNo = result.d[0].no;
        console.log("Found item:", itemNo);
        const detailUrl = new URL(`${host}/accurate/api/item/detail.do`);
        detailUrl.searchParams.append('no', itemNo);
        const detailRes = await fetch(detailUrl.toString(), { method: 'GET', headers: headers as any });
        const detail = await detailRes.json();
        console.log(JSON.stringify(detail, null, 2));
    }
}
main();
