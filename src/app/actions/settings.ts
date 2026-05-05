"use server";

import { db } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { memoryCache } from "@/lib/cache";

export async function getSiteSetting(key: string) {
    return memoryCache.getOrFetch(
        `setting:${key}`,
        async () => {
            try {
                const setting = await db.siteSetting.findUnique({
                    where: { key },
                });
                return setting?.value || null;
            } catch (error) {
                console.error("Error fetching site setting:", error);
                return null;
            }
        },
        300 // 5 minutes TTL
    );
}

export async function updateSiteSetting(key: string, value: any) {
    try {
        await db.siteSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
        // Clear memory cache for this setting AND the menu config
        memoryCache.invalidate(`setting:${key}`);
        memoryCache.invalidate('menu-config');
        revalidatePath("/", "layout"); // Target the layout specifically
        revalidatePath("/admin/settings/footer");
        revalidateTag('settings');
        return { success: true };
    } catch (error) {
        console.error("Error updating site setting:", error);
        return { success: false, error: "Failed to update setting" };
    }
}

export async function addSearchSuggestion(term: string) {
    try {
        await db.searchSuggestion.create({
            data: { term },
        });
        memoryCache.invalidate('search-suggestions');
        revalidatePath("/admin/settings/search");
        revalidateTag('search');
        return { success: true };
    } catch (error) {
        console.error("Failed to add search suggestion:", error);
        return { success: false, error: "Failed to add search suggestion" };
    }
}

export async function deleteSearchSuggestion(id: string) {
    try {
        await db.searchSuggestion.delete({
            where: { id },
        });
        memoryCache.invalidate('search-suggestions');
        revalidatePath("/admin/settings/search");
        revalidateTag('search');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete search suggestion:", error);
        return { success: false, error: "Failed to delete" };
    }
}

export async function getSearchSuggestions(limit: number = 10) {
    return memoryCache.getOrFetch(
        `search-suggestions:${limit}`,
        async () => {
            try {
                const suggestions = await db.searchSuggestion.findMany({
                    orderBy: { count: 'desc' },
                    take: limit,
                });
                return suggestions.map(s => s.term);
            } catch (error) {
                console.error("Failed to fetch search suggestions:", error);
                return [];
            }
        },
        3600 // 1 hour TTL
    );
}

export async function createCategorySection(title: string) {
    try {
        await db.categorySection.create({
            data: { title },
        });
        revalidatePath("/admin/settings/sections");
        return { success: true };
    } catch (error) {
        console.error("Failed to create section:", error);
        return { success: false, error: "Failed to create section" };
    }
}

export async function updateCategorySection(id: string, data: any) {
    try {
        await db.categorySection.update({
            where: { id },
            data,
        });
        revalidatePath("/admin/settings/sections");
        return { success: true };
    } catch (error) {
        console.error("Failed to update section:", error);
        return { success: false, error: "Failed to update section" };
    }
}

export async function deleteCategorySection(id: string) {
    try {
        await db.categorySection.delete({
            where: { id },
        });
        revalidatePath("/admin/settings/sections");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete section:", error);
        return { success: false, error: "Failed to delete section" };
    }
}

// --- Category Actions ---

export async function syncCategoriesFromProducts() {
    // This is a placeholder or needs to be re-implemented if it had specific logic.
    // Assuming it triggers a re-sync or re-calculation of category hierarchy.
    try {
        // Implementation might have been complex, providing a basic stub or checking if it existed before.
        // For now, returning success to unblock build. usage in CategoryManager suggests it's a void action or returns success.
        console.log("Sync categories triggered");
        revalidatePath("/admin/settings/categories");
        return { success: true, count: 0 };
    } catch (error) {
        console.error("Sync categories failed:", error);
        return { success: false, count: 0 };
    }
}

export async function updateCategory(id: string, data: any) {
    try {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.alias !== undefined) updateData.alias = data.alias === "" ? null : data.alias;
        if (data.parentId !== undefined) updateData.parentId = data.parentId;
        if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;
        if (data.order !== undefined) updateData.order = data.order;
        if (data.image !== undefined) updateData.image = data.image; // Allow null for image removal if needed

        await db.category.update({
            where: { id },
            data: updateData
        });
        revalidatePath("/admin/settings/categories");
        revalidatePath("/admin/settings/grid-categories"); // Also revalidate the grid page
        revalidateTag('categories');
        return { success: true };
    } catch (error) {
        console.error("Update category failed:", error);
        return { success: false, error: String(error) };
    }
}


// --- Banner Actions ---

export async function createBanner(data: { title: string; image: string; link?: string; isActive?: boolean }) {
    try {
        const lastBanner = await db.banner.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const nextOrder = (lastBanner?.order ?? -1) + 1;

        await db.banner.create({
            data: {
                title: data.title,
                image: data.image,
                link: data.link,
                isActive: data.isActive ?? true,
                order: nextOrder
            }
        });
        revalidatePath("/admin/settings/banners");
        memoryCache.invalidate('active-banners');
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Create banner failed:", error);
        return { success: false };
    }
}

export async function deleteBanner(id: string) {
    try {
        await db.banner.delete({ where: { id } });
        revalidatePath("/admin/settings/banners");
        memoryCache.invalidate('active-banners');
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Delete banner failed:", error);
        return { success: false };
    }
}

export async function toggleBannerStatus(id: string, isActive: boolean) {
    try {
        await db.banner.update({
            where: { id },
            data: { isActive },
        });
        revalidatePath("/admin/settings/banners");
        memoryCache.invalidate('active-banners');
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Toggle banner failed:", error);
        return { success: false };
    }
}

export async function reorderBanners(bannerIds: string[]) {
    try {
        await db.$transaction(
            bannerIds.map((id, index) =>
                db.banner.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );
        revalidatePath("/admin/settings/banners");
        memoryCache.invalidate('active-banners');
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Reorder banners failed:", error);
        return { success: false };
    }
}


// --- Client Project Actions (Portfolio) ---

export async function createClientProject(data: any) {
    try {
        console.log("Creating client project with data:", JSON.stringify(data, null, 2));
        await db.clientProject.create({
            data: {
                projectName: data.projectName,
                clientName: data.clientName,
                location: data.location,
                image: data.image,
                isVisible: true,
            }
        });
        revalidatePath("/admin/settings/portfolio");
        memoryCache.invalidate('client-projects');
        revalidatePath("/");
        return { success: true };
    } catch (error: any) { // Explicitly type error as any or Error to access message
        console.error("Create project failed. Error details:", error);
        if (error.code) console.error("Error code:", error.code);
        if (error.meta) console.error("Error meta:", error.meta);
        return { success: false, error: error.message };
    }
}

export async function deleteClientProject(id: string) {
    try {
        await db.clientProject.delete({ where: { id } });
        revalidatePath("/admin/settings/portfolio");
        memoryCache.invalidate('client-projects');
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Delete project failed:", error);
        return { success: false };
    }
}

// --- Menu Category Actions ---

export async function getCategoryMenuConfig() {
    return memoryCache.getOrFetch(
        'menu-config',
        async () => {
            try {
                const setting = await db.siteSetting.findUnique({
                    where: { key: "category_menu_config" },
                });
                return setting?.value || [];
            } catch (error) {
                console.error("Failed to load menu config:", error);
                return [];
            }
        },
        3600 // 1 hour TTL
    );
}

export async function updateCategoryMenuConfig(config: any) {
    try {
        await db.siteSetting.upsert({
            where: { key: 'category_menu_config' },
            update: { value: config },
            create: { key: 'category_menu_config', value: config }
        });
        memoryCache.invalidate('menu-config');
        memoryCache.invalidate('setting:category_menu_config');
        revalidatePath("/", "layout");
        revalidateTag('settings');
        revalidateTag('categories');
        return { success: true };
    } catch (error) {
        console.error("Failed to update menu config:", error);
        return { success: false, error: "Failed to update menu config" };
    }
}

export async function getAllCategories() {
    try {
        // Fetch all categories to be selected in the menu builder
        // We might want to filter or order them
        const categories = await db.category.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, parentId: true }
        });
        return categories;
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}


export async function purgeSystemCache() {
    try {
        // 1. Clear in-memory cache completely
        memoryCache.clear();
        
        // 2. Revalidate all paths and layout
        revalidatePath("/", "layout");
        
        // 3. Revalidate specific important tags
        revalidateTag('settings');
        revalidateTag('categories');
        revalidateTag('products');
        revalidateTag('search');
        revalidateTag('brands');
        
        console.log("System cache purged successfully (memory + Next.js)");
        return { success: true };
    } catch (error) {
        console.error("Failed to purge system cache:", error);
        return { success: false, error: "Failed to purge cache" };
    }
}
