import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Cleanup Started ---');

    try {
        // 1. Clear Sales Quotation related data
        console.log('Cleaning SalesQuotationActivity...');
        await prisma.salesQuotationActivity.deleteMany({});

        console.log('Cleaning SalesQuotationItemAlternative...');
        await prisma.salesQuotationItemAlternative.deleteMany({});

        console.log('Cleaning SalesQuotationItem...');
        await prisma.salesQuotationItem.deleteMany({});

        console.log('Cleaning SalesInvoice...');
        await prisma.salesInvoice.deleteMany({});

        console.log('Cleaning SalesReturn...');
        await prisma.salesReturn.deleteMany({});

        console.log('Cleaning SalesQuotation (Main Table)...');
        await prisma.salesQuotation.deleteMany({});

        // 2. Clear Order related data
        console.log('Cleaning OrderItem...');
        await prisma.orderItem.deleteMany({});

        console.log('Cleaning Order...');
        await prisma.order.deleteMany({});

        // 3. Clear Webhook Logs
        console.log('Cleaning WebhookLog...');
        await prisma.webhookLog.deleteMany({});

        // 4. Optionally clear Notifications (transactional)
        console.log('Cleaning Notifications...');
        await prisma.notification.deleteMany({});

        // 5. Optionally clear Upgrade Requests (transactional)
        console.log('Cleaning UpgradeRequests...');
        await prisma.upgradeRequest.deleteMany({});

        console.log('--- Database Cleanup Completed Successfully ---');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
