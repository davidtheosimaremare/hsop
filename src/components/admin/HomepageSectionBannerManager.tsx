"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { updateSiteSetting } from "@/app/actions/settings";
import { uploadFile } from "@/app/actions/upload";
import {
    Loader2,
    ImageIcon,
    Upload,
    X,
    ShieldCheck,
    Cpu,
    Lightbulb,
    Save
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface HomepageSectionBannerManagerProps {
    initialSettings: {
        protection?: string;
        control?: string;
        lighting?: string;
    };
}

export function HomepageSectionBannerManager({ initialSettings }: HomepageSectionBannerManagerProps) {
    const [banners, setBanners] = useState(initialSettings);
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [isSaving, startSave] = useTransition();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeKeyRef = useRef<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingKey(key);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await uploadFile(formData, false, "assets");

            if (res.success && res.url) {
                const newBanners = { ...banners, [key]: res.url };
                setBanners(newBanners);
                
                // Save immediately or wait for Save button? 
                // Let's save immediately for better UX like other parts of the system
                await updateSiteSetting(`homepage_banner_${key}`, res.url);
                toast.success(`Banner ${key} berhasil diperbarui`);
                router.refresh();
            } else {
                toast.error(res.error || "Gagal upload gambar");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setUploadingKey(null);
        }
    };

    const removeBanner = async (key: string) => {
        if (!confirm("Hapus banner ini?")) return;
        
        const newBanners = { ...banners };
        delete (newBanners as any)[key];
        setBanners(newBanners);
        
        await updateSiteSetting(`homepage_banner_${key}`, null);
        toast.success(`Banner ${key} berhasil dihapus`);
        router.refresh();
    };

    const sections = [
        { key: "protection", title: "Protection", icon: ShieldCheck, color: "bg-red-50 text-red-600" },
        { key: "control", title: "Control Product", icon: Cpu, color: "bg-blue-50 text-blue-600" },
        { key: "lighting", title: "Lampu / Lighting", icon: Lightbulb, color: "bg-amber-50 text-amber-600" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sections.map((section) => {
                const imageUrl = banners[section.key as keyof typeof banners];
                const isUploading = uploadingKey === section.key;

                return (
                    <Card key={section.key} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white flex flex-col">
                        <CardHeader className={cn("border-b p-5", section.color.split(' ')[0])}>
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", section.color.split(' ')[1].replace('text', 'bg').replace('600', '100'))}>
                                    <section.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-tight">{section.title}</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Featured Banner</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="space-y-4 flex-1">
                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group">
                                    {imageUrl ? (
                                        <>
                                            <Image
                                                src={imageUrl}
                                                alt={section.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="rounded-full font-bold text-[10px] uppercase"
                                                    onClick={() => {
                                                        activeKeyRef.current = section.key;
                                                        fileInputRef.current?.click();
                                                    }}
                                                >
                                                    Ganti
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="rounded-full font-bold text-[10px] uppercase"
                                                    onClick={() => removeBanner(section.key)}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div 
                                            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => {
                                                activeKeyRef.current = section.key;
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
                                                        <Upload className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Banner</p>
                                                    <p className="text-[9px] text-slate-300 mt-1 font-bold">Rekomendasi: 400x600px</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                        Gambar ini akan menggantikan slot "Hot Item" di halaman depan pada bagian {section.title}.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (activeKeyRef.current) {
                        handleFileSelect(e, activeKeyRef.current);
                    }
                }}
            />
        </div>
    );
}
