import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Plug2, CircuitBoard, Flashlight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CategoryMappingKanban } from "@/components/admin/CategoryMappingKanban";
import { SyncCategoryButton } from "@/components/admin/SyncCategoryButton";

export const dynamic = "force-dynamic";

export default async function CategoryMappingPage() {
    // Get all categories from Category table (Master Data)
    const categoriesResult = await db.category.findMany({
        orderBy: { name: "asc" },
    });
    const categories = categoriesResult.map((c) => c.name);

    // Also get any categories from Products that might not be in the Master Data (Optional, but good for safety)
    // const productCategoriesResult = await db.product.findMany({
    //     where: { category: { not: null } },
    //     distinct: ["category"],
    //     select: { category: true },
    // });
    // const productCategories = productCategoriesResult.map(c => c.category!).filter(Boolean);
    // const uniqueCategories = Array.from(new Set([...categories, ...productCategories])).sort();

    // For now, let's stick to Master Data as the source of truth if Sync is used.
    // If the user wants to see Product categories, they should Sync to create them in Category table? 
    // Actually, syncCategoriesFromProducts (existing) does that.
    // syncCategoriesFromAccurate does that too.
    // So db.category should cover it.


    // Get existing mappings
    const mappings = await db.categoryMapping.findMany();
    const mappingMap = new Map(mappings.map(m => [m.categoryName, m.discountType]));

    // Combine: all categories with their current discount type (if any)
    const categoryData = categories.map(cat => ({
        categoryName: cat,
        discountType: mappingMap.get(cat) || null,
    }));

    // Group by discount type for display
    const lpCategories = categoryData.filter(c => c.discountType === "LP");
    const cpCategories = categoryData.filter(c => c.discountType === "CP");
    const lightingCategories = categoryData.filter(c => c.discountType === "LIGHTING");
    const unmappedCategories = categoryData.filter(c => !c.discountType);

    return (
        <div className="space-y-6">


            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Kategori Diskon</h1>
                        <p className="text-sm text-gray-500">Tentukan kategori produk mana yang termasuk LP, CP, atau Portable Lighting</p>
                    </div>
                </div>
                <SyncCategoryButton />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-gray-400">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Layers className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{unmappedCategories.length}</p>
                                <p className="text-sm text-gray-500">Belum Dikategorikan</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Plug2 className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{lpCategories.length}</p>
                                <p className="text-sm text-gray-500">Siemens LP</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CircuitBoard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{cpCategories.length}</p>
                                <p className="text-sm text-gray-500">Siemens CP</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Flashlight className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{lightingCategories.length}</p>
                                <p className="text-sm text-gray-500">Portable Lighting</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Mapping Kanban */}
            <CategoryMappingKanban categories={categoryData} />


        </div>
    );
}
