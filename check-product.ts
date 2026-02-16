import { db } from "@/lib/db";

async function main() {
    console.log("Searching for '18P' version...");
    const product = await db.product.findFirst({
        where: {
            name: {
                contains: "APS ENCAPSULATED CHASSIS, 250A, 18P",
                mode: "insensitive"
            }
        }
    });

    if (product) {
        console.log("Found Product:", JSON.stringify(product, null, 2));
    } else {
        console.log("Product not found");
    }
}

main();
