const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const pages = await prisma.page.findMany();
        console.log('Successfully fetched pages:', pages.length);
    } catch (e) {
        console.error('Error fetching pages:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
