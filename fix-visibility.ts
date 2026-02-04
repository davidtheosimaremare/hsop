
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start updating visibility...')

    const result = await prisma.product.updateMany({
        data: {
            isVisible: true,
        },
    })

    console.log(`Updated ${result.count} products to Visible.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
