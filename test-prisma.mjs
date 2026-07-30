import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: "Pura", mode: "insensitive" } },
                { company: { contains: "Pura", mode: "insensitive" } },
                { address: { contains: "Pura", mode: "insensitive" } }
            ]
        }
    });
    console.log(customers.map(c => ({id: c.id, name: c.name, company: c.company, code: c.accurateCustomerCode})));
}
main().catch(console.error).finally(() => prisma.$disconnect());
