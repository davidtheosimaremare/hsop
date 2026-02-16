import { fetchAllProducts } from "../src/lib/accurate";

// Log environment variables to ensure they are loaded
// Note: ts-node might need dotenv configuration if not automatically loading .env
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("Fetching products from Accurate...");
    try {
        const products = await fetchAllProducts();
        console.log(`Total products fetched: ${products.length}`);

        // Filter for the problematic SKU
        const targetSku = "5SY7425-7";
        const relatedSkus = products.filter(p => p.no.includes(targetSku));

        console.log(`\nFound ${relatedSkus.length} items containing '${targetSku}':`);
        relatedSkus.forEach(p => {
            console.log(`- ID: ${p.id}, No: '${p.no}', Name: '${p.name}', Type: ${p.itemType}`);
        });

        // Check for exact duplicates of the specific SKU
        const exactMatches = products.filter(p => p.no === targetSku);
        console.log(`\nExact matches for '${targetSku}': ${exactMatches.length}`);
        if (exactMatches.length > 1) {
            console.log("!!! DUPLICATE FOUND !!!");
            exactMatches.forEach((p, index) => {
                console.log(`  Match #${index + 1}: ID=${p.id}, Name=${p.name}`);
            });
        } else {
            console.log("No exact duplicates found for this SKU.");
        }

    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

main();
