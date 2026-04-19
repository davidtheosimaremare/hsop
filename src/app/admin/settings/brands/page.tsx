import { db } from "@/lib/db";
import { BrandManager } from "@/components/admin/BrandManager";
import { getBrandsAdmin } from "@/app/actions/brand";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BrandsSettingsPage() {
    const brands = await getBrandsAdmin();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Tag className="w-6 h-6 text-blue-600" />
                    Pengaturan Brand
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                    Kelola daftar brand yang disinkronkan dari Accurate.
                </p>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100 p-6">
                    <CardTitle className="text-lg font-bold text-gray-800 uppercase tracking-wider">
                        Manajemen Brand
                    </CardTitle>
                    <CardDescription>
                        Aktifkan/nonaktifkan brand atau berikan nama alias untuk tampilan di halaman pencarian.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-gray-50/30">
                    <BrandManager initialBrands={brands as any} />
                </CardContent>
            </Card>
        </div>
    );
}
