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
        update: {},
        create: {
            email: 'admin@hokiindo.co.id',
            name: 'Admin Hokiindo',
            password,
            role: 'ADMIN',
        },
    })

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

    // Create Dummy Product
    const product = await prisma.product.upsert({
        where: { sku: "PROD-001" },
        update: {},
        create: {
            sku: "PROD-001",
            name: "Siemens Contactor 3RT2015-1AP01",
            description: "Contactor, AC-3, 3KW/400V, 1NO, 230V AC",
            price: 500000,
            availableToSell: 100,
            brand: "Siemens",
            category: "Control Products",
        },
    })
    console.log({ product })

    // Create Dummy Order
    const order = await prisma.order.create({
        data: {
            customerId: customer.id,
            status: "PENDING",
            total: 900000,
            discount: 0,
            items: {
                create: [
                    {
                        productId: product.id,
                        quantity: 2,
                        price: 450000, // Price after potential discount (logic later)
                    }
                ]
            }
        }
    })
    console.log({ order })
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
