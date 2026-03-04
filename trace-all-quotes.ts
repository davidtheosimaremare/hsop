import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const emails = await prisma.salesQuotation.groupBy({
        by: ['email'],
        _count: { _all: true }
    });
    console.log("Emails in Quotations:", JSON.stringify(emails, null, 2));

    const customerIds = await prisma.salesQuotation.groupBy({
        by: ['customerId'],
        _count: { _all: true }
    });
    console.log("CustomerIDs in Quotations:", JSON.stringify(customerIds, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
