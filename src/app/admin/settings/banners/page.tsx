import { db } from "@/lib/db";
import { BannerManager } from "@/components/admin/BannerManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function BannerSettingsPage() {
    const banners = await db.banner.findMany({
        orderBy: { order: 'asc' },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Banner Slider</h1>
                <p className="text-sm text-gray-500">Kelola gambar banner yang tampil di halaman depan (Slider).</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Banner</CardTitle>
                    <CardDescription>
                        Banner ini akan ditampilkan secara berurutan di homepage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BannerManager initialBanners={banners} />
                </CardContent>
            </Card>
        </div>
    );
}
