import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const userId = "cmlyyxmzt0014h0zr22xtooy3"; // Agus
    const quotes = await prisma.salesQuotation.findMany({
        where: { userId: userId }
    });
    console.log(`Found ${quotes.length} quotations for user ID ${userId}`);
    quotes.forEach(q => {
        console.log(`Quote: ${q.quotationNo}, Email: ${q.email}, customerId: ${q.customerId}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
