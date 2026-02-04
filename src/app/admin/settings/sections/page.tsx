import { db } from "@/lib/db";
import { SectionManager } from "@/components/admin/SectionManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function SectionsSettingsPage() {
    const sections = await db.categorySection.findMany({
        orderBy: { order: 'asc' },
    });

    const categories = await db.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }, // Simplified for selection
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Section Homepage</h1>
                <p className="text-sm text-gray-500">Atur bagian kategori yang tampil di halaman depan.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Section</CardTitle>
                    <CardDescription>
                        Setiap section akan menampilkan produk dari kategori yang dipilih.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SectionManager initialSections={sections} categories={categories} />
                </CardContent>
            </Card>
        </div>
    );
}
