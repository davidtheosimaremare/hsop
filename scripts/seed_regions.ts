import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Fetching provinces...")
    const provRes = await fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
    const provinces = await provRes.json()

    console.log(`Found ${provinces.length} provinces. Seeding...`)

    for (const p of provinces) {
        await prisma.province.upsert({
            where: { id: p.id },
            update: { name: p.name },
            create: { id: p.id, name: p.name }
        })
    }

    // Process regencies
    console.log("Fetching regencies for each province...")
    for (const p of provinces) {
        const regRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${p.id}.json`)
        const regencies = await regRes.json()

        for (const r of regencies) {
            await prisma.regency.upsert({
                where: { id: r.id },
                update: { name: r.name, provinceId: p.id },
                create: { id: r.id, name: r.name, provinceId: p.id }
            })
        }
        process.stdout.write(".")
    }
    console.log("\nRegencies seeded. Fetching districts...")

    // Process districts (this might take a while, ~7k+)
    const allRegencies = await prisma.regency.findMany()
    console.log(`Found ${allRegencies.length} regencies. Fetching districts...`)

    // Use a small concurrency limit to avoid hitting rate limits or overwhelming the DB
    const concurrency = 10
    for (let i = 0; i < allRegencies.length; i += concurrency) {
        const chunk = allRegencies.slice(i, i + concurrency)
        await Promise.all(chunk.map(async (r) => {
            try {
                const distRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${r.id}.json`)
                const districts = await distRes.json()

                // Batch create for efficiency
                // Upserting might be slow for 7k+ items, so we'll just skip existing or handle batch
                // Actually, let's just do it sequentially or with upsert to be safe
                for (const d of districts) {
                    await prisma.district.upsert({
                        where: { id: d.id },
                        update: { name: d.name, regencyId: r.id },
                        create: { id: d.id, name: d.name, regencyId: r.id }
                    })
                }
            } catch (e) {
                console.error(`\nError fetching districts for Regency ${r.id}:`, e)
            }
        }))
        if (i % 50 === 0) process.stdout.write("|")
    }

    console.log("\nSeed completed successfully.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
