import { fetchAllItemCategories } from "../src/lib/accurate";

async function main() {
    console.log("Starting debug fetch...");
    try {
        const cats = await fetchAllItemCategories();
        console.log(`Fetched ${cats.length} categories.`);
        if (cats.length > 0) {
            console.log("Sample:", cats[0]);
        }
    } catch (e) {
        console.error("Error fetching:", e);
    }
}

main();
