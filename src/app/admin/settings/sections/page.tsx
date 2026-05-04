import { db } from "@/lib/db";
import { SectionManager } from "@/components/admin/SectionManager";
import { HomepageSectionBannerManager } from "@/components/admin/HomepageSectionBannerManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSiteSetting } from "@/app/actions/settings";
import { LayoutDashboard, Image as ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SectionsSettingsPage() {
    const sections = await db.categorySection.findMany({
        orderBy: { order: 'asc' },
    });

    const categories = await db.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }, // Simplified for selection
    });

    // Fetch existing banners
    const [protectionBanner, controlBanner, lightingBanner] = await Promise.all([
        getSiteSetting("homepage_banner_protection"),
        getSiteSetting("homepage_banner_control"),
        getSiteSetting("homepage_banner_lighting")
    ]) as string[];

    const bannerSettings = {
        protection: protectionBanner,
        control: controlBanner,
        lighting: lightingBanner
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="w-7 h-7 text-red-600" />
                        Manajemen Section Homepage
                    </h1>
                    <p className="text-sm text-slate-500 font-medium ml-10">Atur konten visual dan grup kategori yang tampil di halaman utama.</p>
                </div>
            </div>

            {/* Custom Category Banners */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                    <ImageIcon className="w-5 h-5 text-red-600" />
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Banner Produk Unggulan</h2>
                </div>
                <HomepageSectionBannerManager initialSettings={bannerSettings} />
            </div>

            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Custom Product Sections</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Atur section tambahan sesuai keinginan</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <SectionManager initialSections={sections} categories={categories} />
                </CardContent>
            </Card>
        </div>
    );
}
