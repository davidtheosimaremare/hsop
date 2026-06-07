import { db } from "@/lib/db";
import { AppBannerManager } from "@/components/admin/AppBannerManager";
import { Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppBannerSettingsPage() {
    const banners = await db.appBanner.findMany({
        orderBy: { order: 'asc' },
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Smartphone className="w-6 h-6 text-emerald-600" />
                        Manajemen Banner Aplikasi Mobile
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Kelola konten visual yang tampil di halaman utama aplikasi mobile Android & iOS.</p>
                </div>
            </div>

            <AppBannerManager initialBanners={banners} />
        </div>
    );
}
