"use server";

import { updateProductDetails } from "@/app/actions/product";
import { scrapeSiemensProduct } from "@/app/actions/scraper";
import { revalidatePath } from "next/cache";

export async function scrapeAndSaveProduct(productId: string, sku: string) {
    try {
        const scrapeResult = await scrapeSiemensProduct(sku);
        if (!scrapeResult.success || !scrapeResult.data) {
            return { success: false, error: scrapeResult.error || "Gagal mengambil data dari Siemens" };
        }

        // Only update fields that are present in the scrape result
        const updateData: any = {};
        if (scrapeResult.data.description) updateData.description = scrapeResult.data.description;
        if (scrapeResult.data.image) updateData.image = scrapeResult.data.image;
        if (scrapeResult.data.specifications && Object.keys(scrapeResult.data.specifications).length > 0) {
            updateData.specifications = scrapeResult.data.specifications;
        }

        if (Object.keys(updateData).length === 0) {
            return { success: false, error: "Tidak ada data baru yang ditemukan untuk disimpan." };
        }

        // Save to DB
        const saveResult = await updateProductDetails(productId, updateData);
        if (!saveResult.success) {
            return { success: false, error: saveResult.error };
        }

        revalidatePath(`/admin/products/${productId}`);
        return { success: true };

    } catch (error) {
        console.error("Scrape and save failed:", error);
        return { success: false, error: "Terjadi kesalahan internal saat memproses request." };
    }
}
