import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

// @ts-ignore
const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
})

async function main() {
    const password = await hash('123456', 12)
    const user = await prisma.user.upsert({
        where: { email: 'admin@hokiindo.co.id' },
        update: {
            isVerified: true,
        },
        create: {
            email: 'admin@hokiindo.co.id',
            name: 'Admin Hokiindo',
            password,
            role: 'ADMIN',
            isVerified: true,
        },
    })

    // Create Dummy Product & Order removed as per user request (Sync only)

    // Create Dummy Customer
    const customer = await prisma.customer.upsert({
        where: { id: "cust-001" },
        update: {},
        create: {
            id: "cust-001",
            name: "PT. Contoh Pelanggan",
            email: "client@example.com",
            phone: "08123456789",
            address: "Jl. Sudirman No. 1, Jakarta",
            company: "PT. Contoh Pelanggan",
            type: "B2B",
            discount1: 10,
            discount2: 5,
        },
    })
    console.log({ customer })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
