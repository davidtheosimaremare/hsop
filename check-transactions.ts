import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- Checking Recent Quotations (Last 5) ---");
    const recentQuotes = await prisma.salesQuotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    recentQuotes.forEach(q => {
        console.log(`Quote: ${q.quotationNo}, Email: ${q.email}, customerId: ${q.customerId}, Status: ${q.status}`);
    });

    console.log("\n--- Checking Recent Orders (Last 5) ---");
    const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } }
    });

    recentOrders.forEach(o => {
        console.log(`Order ID: ${o.id}, customerId: ${o.customerId}, Customer Name: ${o.customer?.name}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
