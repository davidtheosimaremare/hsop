import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- Starting Quotation & Order Link Backfill ---");

    // 1. Get all customers
    const customers = await prisma.customer.findMany({
        select: { id: true, email: true }
    });

    let updatedQuotes = 0;
    let updatedOrders = 0;

    for (const customer of customers) {
        if (!customer.email) continue;

        // Update quotations with null customerId but matching email
        const resQ = await prisma.salesQuotation.updateMany({
            where: {
                email: customer.email,
                customerId: null
            },
            data: {
                customerId: customer.id
            }
        });
        updatedQuotes += resQ.count;

        // Update orders with matching email (if any exist without customerId or different)
        const resO = await prisma.order.updateMany({
            where: {
                customer: {
                    email: customer.email
                },
                customerId: { not: customer.id }
            },
            data: {
                customerId: customer.id
            }
        });
        updatedOrders += resO.count;
    }

    console.log(`Updated ${updatedQuotes} quotations and ${updatedOrders} orders.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
