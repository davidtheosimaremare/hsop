import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
    const query = "ACB 3P";
    
    // Normalisasi
    let normalizedQuery = query.toLowerCase()
        .replace(/(\d+)\s*-\s*poles?/g, "$1p")
        .replace(/(\d+)\s+poles?/g, "$1p");
        
    const rawWords = normalizedQuery.split(" ").filter((w: string) => w.trim().length > 0);
    
    const wordsWithVariations = rawWords.map((word: string) => {
        const poleMatch = word.match(/^(\d+)p$/);
        if (poleMatch) {
            const n = poleMatch[1];
            return [word, `${n} pole`, `${n}-pole`, `${n} poles`, `${n}-poles`];
        }
        return [word];
    });

    const products = await db.product.findMany({
        where: {
            isVisible: true,
            status: "APPROVED",
            AND: wordsWithVariations.map((variations) => ({
                OR: variations.flatMap((v) => [
                    { name: { contains: v, mode: "insensitive" } },
                    { brand: { contains: v, mode: "insensitive" } },
                    { sku: { contains: v, mode: "insensitive" } },
                    { category: { contains: v, mode: "insensitive" } },
                    { description: { contains: v, mode: "insensitive" } },
                ])
            }))
        },
        select: { name: true, sku: true }
    });
    console.log(`Found ${products.length} products for query "${query}"`);
    if(products.length > 0) {
        console.log(products.slice(0, 3));
    }
}
main();
