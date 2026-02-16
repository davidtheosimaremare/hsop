import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function createLightingRule() {
    try {
        const rule = await db.discountRule.upsert({
            where: { categoryGroup: "LIGHTING" },
            update: {},
            create: {
                categoryGroup: "LIGHTING",
                description: "Portable Lighting",
                stockDiscount: "0",
                indentDiscount: "0"
            }
        });
        console.log("Created/Updated LIGHTING rule:", rule);
    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}

createLightingRule();
