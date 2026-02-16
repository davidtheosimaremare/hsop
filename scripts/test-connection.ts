import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log("Starting connection test...");
    try {
        console.log("Attempting to connect...");
        await prisma.$connect();
        console.log("Successfully connected to the database!");

        const start = Date.now();
        const count = await prisma.product.count();
        console.log(`Query successful! Product count: ${count}`);
        console.log(`Query took ${Date.now() - start}ms`);

    } catch (e: any) {
        console.error("CONNECTION FAILED");
        console.error("Error name:", e.name);
        console.error("Error message:", e.message);
        if (e.code) console.error("Error code:", e.code);
        if (e.clientVersion) console.error("Client version:", e.clientVersion);
    } finally {
        await prisma.$disconnect();
    }
}

main();
