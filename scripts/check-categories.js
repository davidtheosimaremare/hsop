const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.product.findMany({
        select: {
            category: true,
        },
        distinct: ['category'],
    });
    console.log("Distinct Categories:", categories.map(c => c.category));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
