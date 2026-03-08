import { db } from "@/lib/db";
import { BannerManager } from "@/components/admin/BannerManager";
import { ImageIcon } from "lucide-react";

export default async function BannerSettingsPage() {
    const banners = await db.banner.findMany({
        orderBy: { order: 'asc' },
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-red-600" />
                        Manajemen Banner Slider
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Kelola konten visual yang tampil di halaman utama website.</p>
                </div>
            </div>

            <BannerManager initialBanners={banners} />
        </div>
    );
}
