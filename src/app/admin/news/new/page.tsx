import { db } from "@/lib/db";
import { NewNewsForm } from "./NewNewsForm";

export const dynamic = "force-dynamic";

export default async function NewNewsPage() {
    // Fetch products for the product selector
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

    return <NewNewsForm products={products} />;
}
