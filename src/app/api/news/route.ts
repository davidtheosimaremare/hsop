import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get("category") || "all";
        const search = searchParams.get("q") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "9");

        // Build where clause
        const where: any = { isPublished: true };

        // Search filter
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { excerpt: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }

        // Category filter (using slug or custom categorization)
        // For now, we'll use a simple approach - in production, you might want a proper NewsCategory model
        if (category !== "all") {
            // You can implement category logic here based on your needs
            // For example, by checking tags, or content keywords, etc.
        }

        // Get total count
        const total = await db.news.count({ where });

        // Get news with pagination
        const news = await db.news.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                image: true,
                author: true,
                publishedAt: true,
                createdAt: true,
            },
        });

        const totalPages = Math.ceil(total / limit);

        return Response.json({
            news,
            total,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.error("Error fetching news:", error);
        return Response.json({ error: "Failed to fetch news" }, { status: 500 });
    }
}
