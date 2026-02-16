import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkRules() {
    const rules = await db.discountRule.findMany();
    console.log("Current Discount Rules:");
    rules.forEach(r => {
        console.log(`- ${r.categoryGroup}: Stock="${r.stockDiscount}", Indent="${r.indentDiscount}"`);
    });
}

checkRules()
    .catch(e => console.error(e))
    .finally(() => db.$disconnect());
