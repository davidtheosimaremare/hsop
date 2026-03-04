import { db } from "@/lib/db";
import { PackageX, Eye, EyeOff } from "lucide-react";
import HiddenCategoriesClient from "./HiddenCategoriesClient";

export const dynamic = "force-dynamic";

export default async function HiddenCategoriesPage() {
    const categories = await db.category.findMany({
        orderBy: { name: "asc" }
    });

    // Since Product.category is a String containing the name, we count manually
    const productsCounts = await db.product.groupBy({
        by: ['category'],
        _count: { category: true }
    });

    const categoryData = categories.map(cat => {
        const pCount = productsCounts.find(p => p.category === cat.name);
        return {
            id: cat.id,
            name: cat.name,
            isVisible: cat.isVisible,
            productCount: pCount?._count.category || 0
        };
    });

    const hiddenCount = categoryData.filter(c => !c.isVisible).length;
    const visibleCount = categoryData.length - hiddenCount;

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <PackageX className="w-7 h-7 text-red-600" />
                        Sembunyikan Kategori
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight text-sm">
                        Atur kategori mana saja yang ingin disembunyikan dari halaman depan dan pencarian pelanggan.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-sm transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-green-50 group-hover:border-green-100 transition-all">
                        <Eye className="h-5 w-5 text-slate-400 group-hover:text-green-600 transition-colors" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kategori Tampil</p>
                        <div className="flex items-baseline gap-1.5 list-none">
                            <span className="text-2xl font-black text-slate-800 leading-none">{visibleCount}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-sm transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-all">
                        <EyeOff className="h-5 w-5 text-slate-400 group-hover:text-red-600 transition-colors" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kategori Disembunyikan</p>
                        <div className="flex items-baseline gap-1.5 list-none">
                            <span className="text-2xl font-black text-red-600 leading-none">{hiddenCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <HiddenCategoriesClient initialCategories={categoryData} />
        </div>
    );
}
