import { Metadata } from "next";
import { getSiteSetting } from "@/app/actions/settings";
import HidePriceClient from "@/components/admin/products/HidePriceClient";
import { HidePriceRules } from "@/lib/pricing";
import { db } from "@/lib/db";

export const metadata: Metadata = {
    title: "Sembunyikan Harga | Admin Panel",
    description: "Pengaturan aturan sembunyikan harga produk",
};

export default async function HidePricePage() {
    const [rules, dbBrands, dbCategories] = await Promise.all([
        getSiteSetting("hide_price_rules"),
        db.brand.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
        db.category.findMany({ select: { name: true }, orderBy: { name: 'asc' } })
    ]);

    const availableBrands = dbBrands.map((b) => b.name);
    const availableCategories = dbCategories.map((c) => c.name);

    const parsedRules = rules as unknown as HidePriceRules;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sembunyikan Harga</h1>
                    <p className="text-muted-foreground">
                        Kelola aturan untuk menyembunyikan harga pada brand dan kategori tertentu.
                    </p>
                </div>
            </div>

            <HidePriceClient 
                initialRules={parsedRules || { brands: [], categories: [], contactPhone: "" }} 
                availableBrands={availableBrands}
                availableCategories={availableCategories}
            />
        </div>
    );
}
