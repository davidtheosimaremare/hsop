import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkProduct() {
    // Find product with price 197000
    // Note: Price might be stored as integer or float.
    const products = await db.product.findMany({
        where: {
            price: 197000
        }
    });

    console.log(`Found ${products.length} products with price 197,000:`);
    products.forEach(p => {
        console.log(`- ${p.name} (SKU: ${p.sku}): Stock=${p.availableToSell}`);
    });
}

checkProduct()
    .catch(e => console.error(e))
    .finally(() => db.$disconnect());
