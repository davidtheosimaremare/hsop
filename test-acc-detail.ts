import { fetchSingleProduct } from "./src/lib/accurate";

async function main() {
    // Let's find an item that might have an adjustment. We'll search for Siemens items.
    // Or we can just fetch some items and print their detailSellingPrice
    const itemNos = ["3WA1232-5CE02-0AA0"]; 
    for (const no of itemNos) {
        console.log("Fetching", no);
        const p = await fetchSingleProduct(no);
        console.log(JSON.stringify(p, null, 2));
    }
}
main();
