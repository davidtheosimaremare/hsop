import { db } from "./src/lib/db";

async function main() {
    const id = "cmlizwa6700f9j0sx6jky5nuv";
    const product = await db.product.findUnique({
        where: { id }
    });

    if (product) {
        console.log("DEBUG_PRODUCT_DATA:", JSON.stringify(product, null, 2));
    } else {
        console.log("DEBUG_PRODUCT_DATA: NOT_FOUND");
    }
}

main().catch(console.error);
