import { createAccurateHSQ } from './src/lib/accurate';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const quotation = {
    quotationNo: "TEST-HSQ-002",
    clientName: "PT Test",
    shippingAddress: "",
    notes: "",
    items: []
  };
  console.log("Calling createAccurateHSQ...");
  const res = await createAccurateHSQ(quotation);
  console.log("Result:", res);
  prisma.$disconnect();
}
test().catch(e => { console.error("Error running test:", e); prisma.$disconnect(); });
