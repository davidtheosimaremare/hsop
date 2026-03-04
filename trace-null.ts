import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const email = "modibiid@gmail.com";
    const customer = await prisma.customer.findFirst({
        where: { email: email }
    });
    console.log("Customer for modibiid@gmail.com:", customer?.id);

    const allQuotesWithEmail = await prisma.salesQuotation.findMany({
        where: { email: email }
    });
    console.log(`Total quotes with email ${email}: ${allQuotesWithEmail.length}`);
    console.log(`Quotes with null customerId: ${allQuotesWithEmail.filter(q => q.customerId === null).length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
