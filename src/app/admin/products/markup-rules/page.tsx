import MarkupRulesClient from "@/components/admin/MarkupRulesClient";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { getMarkupExemptionRules } from "@/app/actions/markup-rules";

export const metadata: Metadata = {
    title: "Aturan Kenaikan Harga & Pengecualian | Admin Panel",
};

export default async function AdminMarkupRulesPage() {
    const [brands, categories, initialExemptionRules] = await Promise.all([
        db.brand.findMany({ 
            select: { name: true },
            orderBy: { name: 'asc' }
        }),
        db.category.findMany({ 
            select: { name: true },
            orderBy: { name: 'asc' }
        }),
        getMarkupExemptionRules()
    ]);

    return (
        <MarkupRulesClient 
            brands={brands.map(b => b.name)} 
            categories={categories.map(c => c.name)}
            initialExemptionRules={initialExemptionRules}
        />
    );
}
