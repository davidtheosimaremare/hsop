
import { db } from "../src/lib/db";
import { fetchAllProducts } from "../src/lib/accurate";

async function main() {
    console.log("🚀 Starting Product Sync via CLI...");

    try {
        const accurateProducts = await fetchAllProducts();
        console.log(`📦 Fetched ${accurateProducts.length} products from Accurate.`);

        let syncedCount = 0;
        let errorCount = 0;

        // Deduplicate based on ID
        const uniqueProducts = new Map();
        for (const p of accurateProducts) {
            if (!uniqueProducts.has(p.id)) {
                uniqueProducts.set(p.id, p);
            }
        }
        const productsToSync = Array.from(uniqueProducts.values());
        console.log(`✨ Processing ${productsToSync.length} unique products...`);

        for (const [index, ap] of productsToSync.entries()) {
            try {
                // Determine stock (default to 0 if missing)
                const stock = ap.availableToSell || 0;
                // Determine category/brand
                const category = ap.itemCategory?.name || "Uncategorized";
                const brand = ap.itemBrand?.name || null;

                await db.product.upsert({
                    where: { accurateId: ap.id },
                    update: {
                        name: ap.name,
                        sku: ap.no,
                        price: ap.unitPrice || 0,
                        availableToSell: stock,
                        brand: brand,
                        category: category,
                        itemType: ap.itemType,
                        // Preserve isVisible from DB if exists
                    },
                    create: {
                        accurateId: ap.id,
                        sku: ap.no,
                        name: ap.name,
                        price: ap.unitPrice || 0,
                        availableToSell: stock,
                        brand: brand,
                        category: category,
                        itemType: ap.itemType,
                        description: `Imported from Accurate (${ap.itemType})`,
                        isVisible: true,
                    }
                });

                syncedCount++;

                // Progress logging every 100 items
                if (syncedCount % 100 === 0) {
                    console.log(`⏳ Progress: ${syncedCount}/${productsToSync.length} synced...`);
                }

            } catch (err: any) {
                console.error(`❌ Failed to sync product ${ap.no}:`, err.message);
                errorCount++;
            }
        }

        console.log("------------------------------------------------");
        console.log("✅ Sync Complete!");
        console.log(`📊 Total Processed: ${productsToSync.length}`);
        console.log(`✅ Success: ${syncedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("🔥 Fatal Error during sync:", error);
        process.exit(1);
    }
}

main()
    .then(async () => {
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await db.$disconnect();
        process.exit(1);
    });
