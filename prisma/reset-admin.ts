import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

async function resetAdmin() {
    const prisma = new PrismaClient()

    try {
        const email = 'admin@hokiindo.co.id'
        const rawPassword = 'admin123'
        const hashedPassword = await hash(rawPassword, 12)

        console.log(`Resetting admin password for: ${email}...`)

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                isVerified: true,
                isActive: true
            },
            create: {
                email,
                name: 'Admin Hokiindo',
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
                isVerified: true,
                isActive: true
            },
        })

        console.log('Successfully reset admin account!')
        console.log('Email:', email)
        console.log('Password:', rawPassword)
    } catch (error) {
        console.error('Error resetting admin:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetAdmin()
