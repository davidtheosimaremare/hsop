"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type PageData = {
    title: string;
    slug: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    isPublished?: boolean;
};

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
        .replace(/\s+/g, "-")          // Replace spaces with -
        .replace(/-+/g, "-")           // Replace multiple - with single -
        .trim();
}

export async function previewSlug(title: string): Promise<string> {
    return generateSlug(title);
}

export async function getPages() {
    try {
        const pages = await db.page.findMany({
            orderBy: { updatedAt: "desc" },
        });
        return { success: true, data: pages };
    } catch (error) {
        console.error("Failed to fetch pages:", error);
        return { success: false, error: "Failed to fetch pages" };
    }
}

export async function getPageBySlug(slug: string) {
    try {
        const page = await db.page.findUnique({
            where: { slug },
        });
        return { success: true, data: page };
    } catch (error) {
        console.error("Failed to fetch page:", error);
        return { success: false, error: "Failed to fetch page" };
    }
}

export async function createPage(data: PageData) {
    try {
        const page = await db.page.create({
            data: {
                title: data.title,
                slug: data.slug,
                content: data.content,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                isPublished: data.isPublished || false,
            },
        });
        revalidatePath("/admin/pages");
        return { success: true, data: page };
    } catch (error) {
        console.error("Failed to create page:", error);
        return { success: false, error: "Failed to create page" };
    }
}

export async function updatePage(id: string, data: PageData) {
    try {
        const page = await db.page.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                content: data.content,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                isPublished: data.isPublished,
            },
        });
        revalidatePath("/admin/pages");
        revalidatePath(`/${data.slug}`);
        return { success: true, data: page };
    } catch (error) {
        console.error("Failed to update page:", error);
        return { success: false, error: "Failed to update page" };
    }
}

export async function deletePage(id: string) {
    try {
        const page = await db.page.delete({
            where: { id },
        });
        revalidatePath("/admin/pages");
        return { success: true, data: page };
    } catch (error) {
        console.error("Failed to delete page:", error);
        return { success: false, error: "Failed to delete page" };
    }
}

export async function checkSlugAvailability(slug: string, excludeId?: string) {
    try {
        const page = await db.page.findUnique({
            where: { slug },
        });

        if (!page) return { available: true };

        if (excludeId && page.id === excludeId) return { available: true };

        return { available: false };
    } catch (error) {
        console.error("Failed to check slug:", error);
        return { available: false };
    }
}

export async function togglePageStatus(id: string) {
    try {
        const page = await db.page.findUnique({ where: { id } });
        if (!page) throw new Error("Page not found");

        await db.page.update({
            where: { id },
            data: { isPublished: !page.isPublished },
        });

        revalidatePath("/admin/pages");
        revalidatePath(`/${page.slug}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle page status:", error);
        return { success: false, error: "Failed to toggle status" };
    }
}
