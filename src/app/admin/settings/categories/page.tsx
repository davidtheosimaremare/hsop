import { db } from "@/lib/db";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function CategoriesSettingsPage() {
    const categories = await db.category.findMany({
        orderBy: { order: 'asc' },
        include: { children: true },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Kategori</h1>
                <p className="text-sm text-gray-500">Atur struktur kategori, urutan, dan visibilitas.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Struktur Kategori</CardTitle>
                    <CardDescription>
                        Kategori ini akan menentukan menu navigasi website.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CategoryManager initialCategories={categories} />
                </CardContent>
            </Card>
        </div>
    );
}
