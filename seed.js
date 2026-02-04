require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

// Manually passing URL to bypass config issues
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');
    const password = await hash('123456', 12);
    const user = await prisma.user.upsert({
        where: { email: 'admin@hokiindo.co.id' },
        update: {},
        create: {
            email: 'admin@hokiindo.co.id',
            name: 'Admin Hokiindo',
            password,
            role: 'ADMIN',
        },
    });
    console.log('Created user:', user);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
