import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkCoverage() {
    console.log("--- Discount Rules ---");
    const rules = await db.discountRule.findMany();
    rules.forEach(r => {
        console.log(`Group: ${r.categoryGroup} | Stock: ${r.stockDiscount} | Indent: ${r.indentDiscount}`);
    });

    console.log("\n--- Category Mappings (Sample) ---");
    const mappings = await db.categoryMapping.findMany();
    // Group by discountType to see if all are used
    const groups: Record<string, number> = {};
    mappings.forEach(m => {
        groups[m.discountType] = (groups[m.discountType] || 0) + 1;
    });

    Object.entries(groups).forEach(([type, count]) => {
        console.log(`Type '${type}': Mapped to ${count} categories.`);
    });

    // Check if LIGHTING exists
    if (!rules.find(r => r.categoryGroup === "LIGHTING")) {
        console.warn("\nWARNING: No DiscountRule for 'LIGHTING' found!");
    } else {
        console.log("\nOK: 'LIGHTING' rule exists.");
    }
}

checkCoverage()
    .catch(e => console.error(e))
    .finally(() => db.$disconnect());
