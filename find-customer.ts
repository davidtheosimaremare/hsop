import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const email = "davidtheosimaremare@gmail.com";
    const customer = await prisma.customer.findFirst({
        where: { email: email }
    });
    console.log(`Customer for ${email}:`, customer?.id, customer?.name);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
