"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { memoryCache } from "@/lib/cache";

export async function createAppBanner(data: { title: string; image: string; link?: string; isActive?: boolean }) {
    try {
        const lastBanner = await db.appBanner.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const nextOrder = (lastBanner?.order ?? -1) + 1;

        await db.appBanner.create({
            data: {
                title: data.title,
                image: data.image,
                link: data.link,
                isActive: data.isActive ?? true,
                order: nextOrder
            }
        });
        revalidatePath("/admin/settings/app-banners");
        memoryCache.invalidate('active-app-banners');
        return { success: true };
    } catch (error) {
        console.error("Create app banner failed:", error);
        return { success: false };
    }
}

export async function deleteAppBanner(id: string) {
    try {
        await db.appBanner.delete({ where: { id } });
        revalidatePath("/admin/settings/app-banners");
        memoryCache.invalidate('active-app-banners');
        return { success: true };
    } catch (error) {
        console.error("Delete app banner failed:", error);
        return { success: false };
    }
}

export async function toggleAppBannerStatus(id: string, isActive: boolean) {
    try {
        await db.appBanner.update({
            where: { id },
            data: { isActive },
        });
        revalidatePath("/admin/settings/app-banners");
        memoryCache.invalidate('active-app-banners');
        return { success: true };
    } catch (error) {
        console.error("Toggle app banner failed:", error);
        return { success: false };
    }
}

export async function reorderAppBanners(bannerIds: string[]) {
    try {
        await db.$transaction(
            bannerIds.map((id, index) =>
                db.appBanner.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );
        revalidatePath("/admin/settings/app-banners");
        memoryCache.invalidate('active-app-banners');
        return { success: true };
    } catch (error) {
        console.error("Reorder app banners failed:", error);
        return { success: false };
    }
}
