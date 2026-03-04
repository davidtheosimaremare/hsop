import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- Starting userId -> customerId Backfill ---");

    // 1. Get all users who are linked to a customer
    const users = await prisma.user.findMany({
        where: { customerId: { not: null } },
        select: { id: true, customerId: true }
    });

    let updatedQuotes = 0;

    for (const user of users) {
        if (!user.customerId) continue;

        // Update quotations with this userId and null customerId
        const resQ = await prisma.salesQuotation.updateMany({
            where: {
                userId: user.id,
                customerId: null
            },
            data: {
                customerId: user.customerId
            }
        });
        updatedQuotes += resQ.count;
    }

    console.log(`Updated ${updatedQuotes} quotations based on userId.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
