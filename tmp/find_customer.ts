import { generateAccurateAuthHeaders } from "../src/lib/accurate";

async function main() {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/customer/list.do`;
    const url = new URL(endpoint);
    url.searchParams.append('fields', 'id,customerNo,name');

    try {
        const headers = await generateAccurateAuthHeaders();
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
        });
        const result = await response.json();
        console.log(result.d.slice(0, 10));
    } catch (e) {
        console.error(e);
    }
}
main();
