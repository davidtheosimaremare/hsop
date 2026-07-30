import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const product = await prisma.product.findFirst({
        where: { sku: "3WA1340-6AB12-0AA0" }
    });
    console.log(product);
}
main().catch(console.error).finally(() => prisma.$disconnect());
