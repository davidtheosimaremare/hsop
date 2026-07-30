import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
    const query = "ACB 3 pole";
    const words = query.split(" ").filter(w => w.trim().length > 0);
    const products = await db.product.findMany({
        where: {
            isVisible: true,
            status: "APPROVED",
            AND: words.map(word => ({
                OR: [
                    { name: { contains: word, mode: "insensitive" } },
                    { brand: { contains: word, mode: "insensitive" } },
                    { sku: { contains: word, mode: "insensitive" } },
                    { category: { contains: word, mode: "insensitive" } },
                    { description: { contains: word, mode: "insensitive" } },
                ]
            }))
        },
        select: { name: true, sku: true, isVisible: true, status: true }
    });
    console.log("Visible and approved:", products.length);

    const allProducts = await db.product.findMany({
        where: {
            AND: words.map(word => ({
                OR: [
                    { name: { contains: word, mode: "insensitive" } },
                    { brand: { contains: word, mode: "insensitive" } },
                    { sku: { contains: word, mode: "insensitive" } },
                    { category: { contains: word, mode: "insensitive" } },
                    { description: { contains: word, mode: "insensitive" } },
                ]
            }))
        },
        select: { name: true, sku: true, isVisible: true, status: true }
    });
    console.log("All matching products:");
    console.log(allProducts.slice(0, 5));
}
main();
