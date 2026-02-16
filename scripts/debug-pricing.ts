// Debug script for pricing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("=== CATEGORY MAPPINGS ===");
    const mappings = await prisma.categoryMapping.findMany();
    console.log(mappings);

    console.log("\n=== CUSTOMERS WITH DISCOUNTS ===");
    const customers = await prisma.customer.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            discountLP: true,
            discountCP: true,
            discountLighting: true,
        }
    });
    console.log(customers);

    console.log("\n=== SAMPLE PRODUCTS (ACB Category) ===");
    const products = await prisma.product.findMany({
        where: { category: "ACB" },
        take: 5,
        select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            price: true,
        }
    });
    console.log(products);

    console.log("\n=== ALL UNIQUE CATEGORIES ===");
    const categories = await prisma.product.findMany({
        distinct: ['category'],
        select: { category: true },
        where: { category: { not: null } }
    });
    console.log(categories.map(c => c.category));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
