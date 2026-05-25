import MarkupRulesClient from "@/components/admin/MarkupRulesClient";
import { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = {
    title: "Aturan Kenaikan Harga | Admin Panel",
};

export default async function AdminMarkupRulesPage() {
    const brands = await db.brand.findMany({ 
        select: { name: true },
        orderBy: { name: 'asc' }
    });
    
    const categories = await db.category.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
    });

    return (
        <MarkupRulesClient 
            brands={brands.map(b => b.name)} 
            categories={categories.map(c => c.name)} 
        />
    );
}
