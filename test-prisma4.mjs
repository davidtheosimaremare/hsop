import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const customers = await prisma.customer.findMany({ take: 5 });
    console.log(customers.map(c => ({ id: c.id, code: c.accurateCustomerCode })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
