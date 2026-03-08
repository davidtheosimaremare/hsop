import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'david@hokiindo.co.id' },
        include: {
            customer: true,
        },
    });
    console.log('--- USER DATA ---');
    console.log(JSON.stringify(user, null, 2));

    if (user?.customerId) {
        const customer = await prisma.customer.findUnique({
            where: { id: user.customerId }
        });
        console.log('--- CUSTOMER DATA ---');
        console.log(JSON.stringify(customer, null, 2));
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
