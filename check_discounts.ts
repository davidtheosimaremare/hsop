import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- All Category Mappings ---')
    const allMappings = await prisma.categoryMapping.findMany({
        orderBy: { categoryName: 'asc' }
    })
    console.log(JSON.stringify(allMappings, null, 2))

    console.log('\n--- Product Categories and their Counts ---')
    const categories = await prisma.product.groupBy({
        by: ['category'],
        _count: {
            category: true
        },
        orderBy: {
            category: 'asc'
        }
    })

    const categoriesWithMapping = categories.map(c => {
        const mapping = allMappings.find(m => m.categoryName === c.category)
        return {
            category: c.category,
            count: c._count.category,
            mapping: mapping ? mapping.discountType : 'MISSING'
        }
    })

    console.log(JSON.stringify(categoriesWithMapping.filter(c => c.category && c.category.includes('MOTOR')), null, 2))

    console.log('\n--- Specific check for MOTOR STARTER OVERLOAD EDIT ---')
    const targetCategory = "MOTOR STARTER OVERLOAD EDIT";
    const exactMapping = allMappings.find(m => m.categoryName === targetCategory);
    console.log(`Mapping for "${targetCategory}":`, exactMapping ? exactMapping.discountType : "NOT FOUND");

    const similarMappings = allMappings.filter(m => m.categoryName?.includes(targetCategory));
    console.log(`Similar mappings:`, JSON.stringify(similarMappings, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
