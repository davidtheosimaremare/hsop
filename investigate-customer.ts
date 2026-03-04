import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const customerId = "CO-0003";

    console.log(`--- Checking Customer: ${customerId} ---`);
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
            _count: {
                select: {
                    orders: true,
                    users: true
                }
            }
        }
    });
    console.log("Customer Found:", JSON.stringify(customer, null, 2));

    console.log(`--- Checking Quotations for customerId: ${customerId} ---`);
    const quotations = await prisma.salesQuotation.findMany({
        where: { customerId: customerId }
    });
    console.log(`Found ${quotations.length} quotations`);
    if (quotations.length > 0) {
        console.log("First Quote:", JSON.stringify(quotations[0], null, 2));
    }

    console.log(`--- Checking Orders for customerId: ${customerId} ---`);
    const orders = await prisma.order.findMany({
        where: { customerId: customerId }
    });
    console.log(`Found ${orders.length} orders`);

    // Check if there are quotations or orders with DIFFERENT customerId but same email
    if (customer?.email) {
        console.log(`--- Searching by Email: ${customer.email} ---`);
        const quotesByEmail = await prisma.salesQuotation.findMany({
            where: { email: customer.email }
        });
        console.log(`Found ${quotesByEmail.length} quotations with email ${customer.email}`);
        quotesByEmail.forEach(q => {
            if (q.customerId !== customerId) {
                console.log(`Mismatch! Quote ${q.id} has customerId ${q.customerId}`);
            }
        });

        const usersByEmail = await prisma.user.findMany({
            where: { email: customer.email }
        });
        console.log(`Found ${usersByEmail.length} users with email ${customer.email}`);
        usersByEmail.forEach(u => {
            console.log(`User ID: ${u.id}, customerId: ${u.customerId}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
