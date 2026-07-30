import { fetchAllProducts } from "./src/lib/accurate";

async function main() {
    console.log("Fetching products...");
    const prods = await fetchAllProducts();
    const withDetail = prods.filter(p => Object.keys(p).some(k => k.toLowerCase().includes('price') && k !== 'unitPrice'));
    console.log("Total products:", prods.length);
    console.log("Products with detail price:", withDetail.length);
    if (withDetail.length > 0) {
        console.log("Example:", JSON.stringify(withDetail[0], null, 2));
    }
}
main();
