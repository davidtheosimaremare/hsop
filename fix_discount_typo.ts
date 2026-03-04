import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const incorrectName = "MOTOR STARTER OVERLOAD EDIT EDIT"
    const correctName = "MOTOR STARTER OVERLOAD EDIT"

    console.log(`Fixing mapping: "${incorrectName}" -> "${correctName}"`)

    const mapping = await prisma.categoryMapping.findUnique({
        where: { categoryName: incorrectName }
    })

    if (mapping) {
        // Delete the incorrect record
        await prisma.categoryMapping.delete({
            where: { categoryName: incorrectName }
        })

        // Create/Upsert the correct record
        await prisma.categoryMapping.upsert({
            where: { categoryName: correctName },
            update: { discountType: mapping.discountType },
            create: {
                categoryName: correctName,
                discountType: mapping.discountType
            }
        })

        console.log("Successfully updated category mapping.")
    } else {
        console.log("Incorrect mapping not found. Checking if correct mapping already exists...")
        const exists = await prisma.categoryMapping.findUnique({
            where: { categoryName: correctName }
        })
        if (exists) {
            console.log("Correct mapping already exists.")
        } else {
            console.log("Neither mapping found. Creating new mapping for", correctName)
            await prisma.categoryMapping.create({
                data: {
                    categoryName: correctName,
                    discountType: 'CP'
                }
            })
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
