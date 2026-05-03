import { db } from "@/lib/db";
import { ArrowLeft, Plug2, CircuitBoard, Zap, Layers, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CategoryMappingKanban } from "@/components/admin/CategoryMappingKanban";
import { SyncCategoryButton } from "@/components/admin/SyncCategoryButton";

export const dynamic = "force-dynamic";

export default async function CategoryMappingPage() {
    const categoriesResult = await db.category.findMany({ orderBy: { name: "asc" } });
    const categories = categoriesResult.map((c) => c.name);

    const mappings = await db.categoryMapping.findMany();
    const mappingMap = new Map(mappings.map((m) => [m.categoryName, m.discountType]));

    const categoryData = categories.map((cat) => ({
        categoryName: cat,
        discountType: mappingMap.get(cat) || null,
    }));

    const lpCategories = categoryData.filter((c) => c.discountType === "LP");
    const cpCategories = categoryData.filter((c) => c.discountType === "CP");
    const lightingCategories = categoryData.filter((c) => c.discountType === "LIGHTING");
    const unmappedCategories = categoryData.filter((c) => !c.discountType);
    const totalMapped = lpCategories.length + cpCategories.length + lightingCategories.length;
    const mappingPct = categories.length > 0 ? Math.round((totalMapped / categories.length) * 100) : 0;

    const stats = [
        {
            label: "Belum Dipetakan",
            value: unmappedCategories.length,
            icon: Layers,
            iconBg: "bg-gray-100",
            iconColor: "text-gray-500",
            valueCls: unmappedCategories.length > 0 ? "text-red-600" : "text-gray-800",
            bar: "bg-gray-300",
            barPct: categories.length > 0 ? (unmappedCategories.length / categories.length) * 100 : 0,
        },
        {
            label: "Siemens LP",
            value: lpCategories.length,
            icon: Plug2,
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
            valueCls: "text-yellow-700",
            bar: "bg-yellow-400",
            barPct: categories.length > 0 ? (lpCategories.length / categories.length) * 100 : 0,
        },
        {
            label: "Siemens CP",
            value: cpCategories.length,
            icon: CircuitBoard,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            valueCls: "text-blue-700",
            bar: "bg-blue-400",
            barPct: categories.length > 0 ? (cpCategories.length / categories.length) * 100 : 0,
        },
        {
            label: "Portable Lighting",
            value: lightingCategories.length,
            icon: Zap,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            valueCls: "text-orange-700",
            bar: "bg-orange-400",
            barPct: categories.length > 0 ? (lightingCategories.length / categories.length) * 100 : 0,
        },
    ];

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-xl border-gray-200 shadow-sm shrink-0">
                        <Link prefetch={false}  href="/admin/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">Pemetaan Kategori</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Tentukan tipe diskon tiap kategori produk dengan drag &amp; drop
                        </p>
                    </div>
                </div>
                <SyncCategoryButton />
            </div>

            {/* ── Progress overview ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Progress Pemetaan</p>
                        <p className="text-xs text-gray-400">
                            {totalMapped} dari {categories.length} kategori sudah dipetakan
                        </p>
                    </div>
                    <span className={`text-2xl font-bold ${mappingPct === 100 ? "text-green-600" : "text-gray-800"}`}>
                        {mappingPct}%
                    </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${mappingPct === 100 ? "bg-green-500" : "bg-red-600"}`}
                        style={{ width: `${mappingPct}%` }}
                    />
                </div>
                {unmappedCategories.length > 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-3">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {unmappedCategories.length} kategori belum dipetakan — kategori tersebut tidak akan mendapat diskon B2B.
                    </p>
                )}
            </div>

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${s.iconBg}`}>
                                    <Icon className={`h-4 w-4 ${s.iconColor}`} />
                                </div>
                                <p className="text-xs text-gray-500 font-medium leading-tight">{s.label}</p>
                            </div>
                            <p className={`text-3xl font-black ${s.valueCls}`}>{s.value}</p>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${s.bar}`}
                                    style={{ width: `${s.barPct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Kanban board ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="mb-4">
                    <p className="text-sm font-bold text-gray-800">Papan Pemetaan Kategori</p>
                    <p className="text-xs text-gray-400 mt-0.5">Gunakan search atau seret kartu kategori ke kolom yang sesuai</p>
                </div>
                <CategoryMappingKanban categories={categoryData} />
            </div>
        </div>
    );
}
