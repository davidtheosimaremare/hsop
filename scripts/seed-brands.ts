
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Checking for Brand table...");
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Brand" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "alias" TEXT,
          "isVisible" BOOLEAN NOT NULL DEFAULT true,
          "accurateId" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
      )`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Brand_name_key" ON "Brand"("name")`);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Brand_accurateId_key" ON "Brand"("accurateId")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Brand_name_idx" ON "Brand"("name")`);
    console.log("Brand table ready.");
  } catch (err) {
    console.error("Failed to create table:", err);
  }

  console.log("Seeding brands from products...");
  
  const products = await db.product.findMany({
    select: { brand: true }
  });

  const uniqueBrands = new Set<string>();
  products.forEach(p => {
    if (p.brand) uniqueBrands.add(p.brand);
  });

  console.log(`Found ${uniqueBrands.size} unique brands.`);

  for (const brandName of Array.from(uniqueBrands)) {
    // @ts-ignore
    await db.brand.upsert({
      where: { name: brandName },
      update: {},
      create: {
        name: brandName,
        isVisible: true
      }
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
