import { getPublicProducts } from "@/app/actions/product-public";

async function main() {
    console.log("--- Test 1: Empty Query ---");
    const result1 = await getPublicProducts({
        query: undefined,
        sort: "abjad"
    });
    console.log("Result 1 count:", result1.products.length);
    if (result1.products.length > 0) {
        console.log("First product:", result1.products[0].name);
    }

    console.log("\n--- Test 2: Empty Query String ---");
    const result2 = await getPublicProducts({
        query: "",
        sort: "abjad"
    });
    console.log("Result 2 count:", result2.products.length);
    if (result2.products.length > 0) {
        console.log("First product:", result2.products[0].name);
    }

    console.log("\n--- Test 3: Undefined Query explicit ---");
    const result3 = await getPublicProducts({
        sort: "abjad"
    });
    console.log("Result 3 count:", result3.products.length);
    if (result3.products.length > 0) {
        console.log("First product:", result3.products[0].name);
    }
}

main();
