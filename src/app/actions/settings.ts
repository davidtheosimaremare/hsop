"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- Search Suggestions ---

export async function getSearchSuggestions() {
    return await db.searchSuggestion.findMany({
        orderBy: { count: 'desc' },
    });
}

export async function addSearchSuggestion(term: string) {
    try {
        await db.searchSuggestion.create({
            data: { term, count: 0 },
        });
        revalidatePath("/admin/settings/search");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menambah kata kunci." };
    }
}

export async function deleteSearchSuggestion(id: string) {
    try {
        await db.searchSuggestion.delete({
            where: { id },
        });
        revalidatePath("/admin/settings/search");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menghapus kata kunci." };
    }
}

// --- Banners ---

export async function getBanners() {
    return await db.banner.findMany({
        orderBy: { order: 'asc' },
    });
}

export async function createBanner(data: { title?: string; image: string; link?: string; isActive: boolean }) {
    try {
        // Get max order
        const last = await db.banner.findFirst({ orderBy: { order: 'desc' } });
        const newOrder = (last?.order ?? 0) + 1;

        await db.banner.create({
            data: { ...data, order: newOrder },
        });
        revalidatePath("/admin/settings/banners");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal membuat banner." };
    }
}

export async function deleteBanner(id: string) {
    try {
        await db.banner.delete({ where: { id } });
        revalidatePath("/admin/settings/banners");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menghapus banner." };
    }
}

export async function toggleBannerStatus(id: string, isActive: boolean) {
    try {
        await db.banner.update({
            where: { id },
            data: { isActive },
        });
        revalidatePath("/admin/settings/banners");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal update status banner." };
    }
}

// --- Clients / Portfolio ---

export async function getClients() {
    return await db.clientProject.findMany({
        orderBy: { order: 'asc' },
    });
}

export async function createClientProject(data: { projectName: string; clientName: string; location?: string; image: string }) {
    try {
        const last = await db.clientProject.findFirst({ orderBy: { order: 'desc' } });
        const newOrder = (last?.order ?? 0) + 1;

        await db.clientProject.create({
            data: { ...data, order: newOrder },
        });
        revalidatePath("/admin/settings/portfolio");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal membuat portfolio." };
    }
}

export async function deleteClientProject(id: string) {
    try {
        await db.clientProject.delete({ where: { id } });
        revalidatePath("/admin/settings/portfolio");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menghapus portfolio." };
    }
}

// --- Categories ---

export async function getCategories() {
    return await db.category.findMany({
        orderBy: { order: 'asc' },
        include: { children: true },
    });
}

export async function syncCategoriesFromProducts() {
    try {
        // 1. Get distinct categories from Product
        const products = await db.product.findMany({
            select: { category: true },
            distinct: ['category'],
        });

        let count = 0;
        for (const p of products) {
            if (p.category) {
                // Check if exists
                const exists = await db.category.findFirst({
                    where: { name: p.category },
                });

                if (!exists) {
                    await db.category.create({
                        data: { name: p.category },
                    });
                    count++;
                }
            }
        }
        revalidatePath("/admin/settings/categories");
        return { success: true, count };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Gagal menyinkronkan kategori." };
    }
}

export async function updateCategory(id: string, data: { name?: string; parentId?: string | null; isVisible?: boolean, order?: number }) {
    try {
        await db.category.update({
            where: { id },
            data,
        });
        revalidatePath("/admin/settings/categories");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal update kategori." };
    }
}

// --- Category Sections ---

export async function getCategorySections() {
    return await db.categorySection.findMany({
        orderBy: { order: 'asc' },
    });
}

export async function createCategorySection(title: string) {
    try {
        const last = await db.categorySection.findFirst({ orderBy: { order: 'desc' } });
        const newOrder = (last?.order ?? 0) + 1;
        await db.categorySection.create({
            data: { title, order: newOrder, categoryIds: [] },
        });
        revalidatePath("/admin/settings/sections");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal membuat section." };
    }
}

export async function updateCategorySection(id: string, data: { title?: string; order?: number; categoryIds?: string[], isVisible?: boolean }) {
    try {
        await db.categorySection.update({
            where: { id },
            data,
        });
        revalidatePath("/admin/settings/sections");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal update section." };
    }
}

export async function deleteCategorySection(id: string) {
    try {
        await db.categorySection.delete({ where: { id } });
        revalidatePath("/admin/settings/sections");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menghapus section." };
    }
}

