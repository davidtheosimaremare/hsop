import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: "Puramayungan", mode: "insensitive" } },
                { company: { contains: "Puramayungan", mode: "insensitive" } },
                { address: { contains: "Puramayungan", mode: "insensitive" } }
            ]
        }
    });
    console.log("Results for Puramayungan (no space):", customers.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
