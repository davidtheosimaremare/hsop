import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
    const p = await db.product.findUnique({ where: { sku: "3EK7120-ACC4" } });
    console.log(p);
}
main().catch(console.error).finally(() => db.$disconnect());
