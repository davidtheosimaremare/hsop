"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

export async function createNews(formData: FormData) {
    const title = formData.get("title") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const image = formData.get("image") as string;
    const metaTitle = formData.get("metaTitle") as string;
    const metaDescription = formData.get("metaDescription") as string;
    const metaKeywords = formData.get("metaKeywords") as string;
    const ogImage = formData.get("ogImage") as string;
    const author = formData.get("author") as string;
    const isPublished = formData.get("isPublished") === "true";
    const relatedProductIds = formData.get("relatedProductIds") as string;

    if (!title || !content) {
        throw new Error("Judul dan konten wajib diisi");
    }

    // Generate unique slug
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (await db.news.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    await db.news.create({
        data: {
            title,
            slug,
            excerpt: excerpt || null,
            content,
            image: image || null,
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || excerpt || null,
            metaKeywords: metaKeywords || null,
            ogImage: ogImage || image || null,
            author: author || null,
            isPublished,
            publishedAt: isPublished ? new Date() : null,
            relatedProductIds: relatedProductIds ? JSON.parse(relatedProductIds) : [],
        },
    });

    revalidatePath("/admin/news");
    revalidatePath("/berita");
}

export async function updateNews(id: string, formData: FormData) {
    const title = formData.get("title") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const image = formData.get("image") as string;
    const metaTitle = formData.get("metaTitle") as string;
    const metaDescription = formData.get("metaDescription") as string;
    const metaKeywords = formData.get("metaKeywords") as string;
    const ogImage = formData.get("ogImage") as string;
    const author = formData.get("author") as string;
    const isPublished = formData.get("isPublished") === "true";
    const relatedProductIds = formData.get("relatedProductIds") as string;

    if (!title || !content) {
        throw new Error("Judul dan konten wajib diisi");
    }

    const existing = await db.news.findUnique({ where: { id } });
    if (!existing) {
        throw new Error("Berita tidak ditemukan");
    }

    // Check if title changed and regenerate slug
    let slug = existing.slug;
    if (title !== existing.title) {
        let baseSlug = generateSlug(title);
        slug = baseSlug;
        let counter = 1;

        while (await db.news.findFirst({ where: { slug, id: { not: id } } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    await db.news.update({
        where: { id },
        data: {
            title,
            slug,
            excerpt: excerpt || null,
            content,
            image: image || null,
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || excerpt || null,
            metaKeywords: metaKeywords || null,
            ogImage: ogImage || image || null,
            author: author || null,
            isPublished,
            publishedAt: isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
            relatedProductIds: relatedProductIds ? JSON.parse(relatedProductIds) : existing.relatedProductIds,
        },
    });

    revalidatePath("/admin/news");
    revalidatePath("/berita");
    revalidatePath(`/berita/${slug}`);
}

export async function deleteNews(id: string) {
    const news = await db.news.findUnique({ where: { id } });
    if (!news) {
        throw new Error("Berita tidak ditemukan");
    }

    await db.news.delete({ where: { id } });

    revalidatePath("/admin/news");
    revalidatePath("/berita");
}

export async function togglePublish(id: string) {
    const news = await db.news.findUnique({ where: { id } });
    if (!news) {
        throw new Error("Berita tidak ditemukan");
    }

    await db.news.update({
        where: { id },
        data: {
            isPublished: !news.isPublished,
            publishedAt: !news.isPublished ? new Date() : news.publishedAt,
        },
    });

    revalidatePath("/admin/news");
    revalidatePath("/berita");
}

export async function getLatestNews(limit: number = 4) {
    try {
        const news = await db.news.findMany({
            where: { isPublished: true },
            orderBy: { publishedAt: "desc" },
            take: limit,
        });
        return news;
    } catch (error) {
        console.error("Failed to fetch latest news:", error);
        return [];
    }
}
