import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { EditNewsForm } from "../EditNewsForm";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: PageProps) {
    const { id } = await params;

    const news = await db.news.findUnique({
        where: { id },
    });

    if (!news) {
        notFound();
    }

    // Fetch all products for selector
    const products = await db.product.findMany({
        select: {
            id: true,
            name: true,
            sku: true,
            image: true,
        },
        orderBy: { name: "asc" },
        take: 100,
    });

    // Fetch selected products data
    const selectedProductsData = news.relatedProductIds.length > 0
        ? await db.product.findMany({
            where: { id: { in: news.relatedProductIds } },
            select: {
                id: true,
                name: true,
                sku: true,
                image: true,
            },
        })
        : [];

    return (
        <EditNewsForm
            news={news}
            products={products}
            selectedProductsData={selectedProductsData}
        />
    );
}
