import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- Searching for any trace of David ---");
    const quotes = await prisma.salesQuotation.findMany({
        where: {
            OR: [
                { email: "cs@hokiindo.co.id" },
                { phone: "08123456789" },
                { customerId: "CO-0003" }
            ]
        }
    });

    console.log(`Found ${quotes.length} total quotations for any field match.`);
    quotes.forEach(q => {
        console.log(`Q: ${q.quotationNo}, ID: ${q.id}, CustomerId: ${q.customerId}, Email: ${q.email}, Phone: ${q.phone}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
