import { generateAccurateAuthHeaders } from "./src/lib/accurate";
import fetch from "node-fetch";

async function main() {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/item/detail.do`;
    const url = new URL(endpoint);
    url.searchParams.append('id', '2737'); // 3WA1232-5CE02-0AA0

    const headers = await generateAccurateAuthHeaders();
    const response = await fetch(url.toString(), { method: 'GET', headers: headers as any });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
}
main();
