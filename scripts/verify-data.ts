import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to database...");
        const productCount = await prisma.product.count();
        console.log(`Product Count: ${productCount}`);

        const rules = await prisma.discountRule.findMany();
        console.log(`Discount Rules Found: ${rules.length}`);
        console.log(JSON.stringify(rules, null, 2));

        const categories = await prisma.product.findMany({
            select: { category: true },
            distinct: ['category'],
            take: 5
        });
        console.log("Sample Categories:", categories);

    } catch (error) {
        console.error("Error connecting or querying:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
