"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateAccurateAuthHeaders } from "@/lib/accurate";
import { unstable_noStore as noStore } from "next/cache";

export interface AccurateItemBrand {
    id: number;
    name: string;
}

async function fetchBrandPage(page: number, pageSize: number): Promise<AccurateItemBrand[]> {
    const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
    const endpoint = `${host}/accurate/api/item-brand/list.do`;
    const url = new URL(endpoint);

    const fields = ['id', 'name'].join(',');
    url.searchParams.append('fields', fields);
    url.searchParams.append('sp.page', page.toString());
    url.searchParams.append('sp.pageSize', pageSize.toString());

    try {
        const headers = await generateAccurateAuthHeaders();
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
            next: { revalidate: 3600 } 
        });

        if (!response.ok) throw new Error(`Accurate API error: ${response.status}`);
        const result = await response.json();
        if (!result.s) throw new Error(`Accurate API returned unsuccessful response: ${result.d || result.message}`);

        return result.d || [];
    } catch (err) {
        console.error('API call failed for item brands', err);
        throw err;
    }
}

export async function syncBrandsFromAccurate() {
    try {
        let page = 1;
        const pageSize = 100;
        let hasMore = true;
        let totalSynced = 0;

        while (hasMore && page <= 10) { // Safety limit 1000 brands
            const brands = await fetchBrandPage(page, pageSize);
            
            for (const brand of brands) {
                await db.brand.upsert({
                    where: { accurateId: brand.id },
                    update: { name: brand.name },
                    create: {
                        name: brand.name,
                        accurateId: brand.id,
                        isVisible: true
                    }
                });
                totalSynced++;
            }

            if (brands.length < pageSize) hasMore = false;
            else page++;
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
