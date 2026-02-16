import { db } from "@/lib/db";
import { GridCategoryManager } from "@/components/admin/GridCategoryManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSiteSetting } from "@/app/actions/settings";

export default async function GridCategoriesSettingsPage() {
    // 1. Fetch ALL categories for selection
    const categories = await db.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, image: true }, // Need image for icon display
    });

    // 2. Fetch saved grid categories from SiteSetting
    // Stored as JSON array of IDs: ["cat_1", "cat_2"] OR objects [{id: "...", customName: "..."}]
    const savedGridSettings = await getSiteSetting("homepage_grid_categories");

    // Ensure it's an array of items
    const initialItems = Array.isArray(savedGridSettings)
        ? savedGridSettings.map((item: any) => {
            if (typeof item === 'string') return { id: item, customName: "" };
            return { id: item.id, customName: item.customName || "" };
        })
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Grid Kategori</h1>
                <p className="text-sm text-gray-500">Pilih kategori yang akan ditampilkan dalam bentuk grid icon di halaman depan.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kategori Grid</CardTitle>
                    <CardDescription>
                        Urutkan kategori sesuai prioritas tampilan. Anda juga dapat mengubah nama tampilan (custom name).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <GridCategoryManager
                        allCategories={categories}
                        initialGridItems={initialItems}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
