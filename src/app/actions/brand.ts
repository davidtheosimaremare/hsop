"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateAccurateAuthHeaders, fetchAllProducts } from "@/lib/accurate";
import { unstable_noStore as noStore } from "next/cache";

export async function syncBrandsFromAccurate() {
    try {
        console.log("Starting brand discovery from products...");
        const accurateProducts = await fetchAllProducts();
        
        const brandsMap = new Map<number, string>();
        
        for (const p of accurateProducts) {
            if (p.itemBrand) {
                brandsMap.set(p.itemBrand.id, p.itemBrand.name);
            }
        }
        
        console.log(`Discovered ${brandsMap.size} unique brands from ${accurateProducts.length} products.`);
        
        let totalSynced = 0;
        for (const [id, name] of Array.from(brandsMap.entries())) {
            const upperName = name.toUpperCase();
            await db.brand.upsert({
                where: { accurateId: id },
                update: { name: upperName },
                create: {
                    name: upperName,
                    accurateId: id,
                    isVisible: true
                }
            });
            totalSynced++;
        }

        revalidatePath("/admin/settings/brands");
        return { success: true, count: totalSynced };
    } catch (error) {
        console.error("Sync brands failed:", error);
        return { success: false, error: String(error) };
    }
}

export async function getBrandsAdmin() {
    noStore();
    try {
        return await db.brand.findMany({
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error("Failed to fetch brands:", error);
        return [];
    }
}

export async function updateBrand(id: string, data: { name?: string; alias?: string; isVisible?: boolean }) {
    try {
        await db.brand.update({
            where: { id },
            data: {
                name: data.name,
                alias: data.alias === "" ? null : data.alias,
                isVisible: data.isVisible
            }
        });
        revalidatePath("/admin/settings/brands");
        return { success: true };
    } catch (error) {
        console.error("Update brand failed:", error);
        return { success: false, error: String(error) };
    }
}

export async function deleteBrand(id: string) {
    try {
        await db.brand.delete({ where: { id } });
        revalidatePath("/admin/settings/brands");
        return { success: true };
    } catch (error) {
        console.error("Delete brand failed:", error);
        return { success: false, error: String(error) };
    }
}
