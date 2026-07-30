import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';
import { createAccurateHSQ } from './src/lib/accurate';
const prisma = new PrismaClient();

async function test() {
  const prod = await prisma.product.findFirst();
  console.log("Testing with product sku:", prod?.sku);

  const quotation = {
    quotationNo: "TEST-HSQ-TAX-004",
    clientName: "PT Test",
    shippingAddress: "",
    notes: "",
    customer: { accurateCustomerCode: "K-001" },
    items: [
      { productSku: prod?.sku, quantity: 1, price: 10000, productName: prod?.name }
    ]
  };
  
  // We'll mock the payload manually here just to test accurate response
  const payload = {
    number: quotation.quotationNo,
    transDate: "01/07/2026",
    customerNo: "K-001",
    currencyNo: "IDR",
    taxable: true,
    inclusiveTax: false,
    detailItem: [{
      itemNo: prod?.sku,
      unitPrice: 10000,
      quantity: 1,
      tax1Name: "PPN"
    }]
  };
  
  const headers = await require('./src/lib/accurate').generateAccurateAuthHeaders();
  const endpoint = `${process.env.ACCURATE_API_HOST || "https://zeus.accurate.id"}/accurate/api/sales-quotation/save.do`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });
  const res = await response.json();
  console.log("Result PPN:", res);

  payload.detailItem[0].tax1Name = "PPN 11%";
  payload.number = "TEST-HSQ-TAX-005";
  const response2 = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });
  console.log("Result PPN 11%:", await response2.json());
  
  prisma.$disconnect();
}
test().catch(e => { console.error("Error running test:", e); prisma.$disconnect(); });
