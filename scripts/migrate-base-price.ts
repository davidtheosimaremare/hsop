import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting basePrice migration...");
    
    // We update all products where basePrice is 0 or null to have basePrice = price
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { basePrice: null },
                { basePrice: 0 }
            ]
        },
        select: {
            id: true,
            price: true
        }
    });

    console.log(`Found ${products.length} products to migrate.`);

    let count = 0;
    for (const product of products) {
        if (product.price > 0) {
            await prisma.product.update({
                where: { id: product.id },
                data: { basePrice: product.price }
            });
            count++;
        }
    }

    console.log(`Successfully updated basePrice for ${count} products.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
