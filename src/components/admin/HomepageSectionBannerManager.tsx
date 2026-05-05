"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { updateSiteSetting } from "@/app/actions/settings";
import { compressImage } from "@/lib/image";
import {
    Loader2,
    ImageIcon,
    Upload,
    X,
    ShieldCheck,
    Cpu,
    Lightbulb,
    Save,
    Link as LinkIcon,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HomepageSectionBannerManagerProps {
    initialSettings: {
        protection?: string;
        control?: string;
        lighting?: string;
    };
}

export function HomepageSectionBannerManager({ initialSettings }: HomepageSectionBannerManagerProps) {
    const [banners, setBanners] = useState(initialSettings);
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [isSaving, startSave] = useTransition();
    const [showManual, setShowManual] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeKeyRef = useRef<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit size to 10MB just in case
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Ukuran file terlalu besar (Maks 10MB)");
            return;
        }

        setUploadingKey(key);
        
        startSave(async () => {
            try {
                // 1. Compress the image before upload
                console.log(`[BannerManager] Compressing ${file.name}...`);
                const compressedBlob = await compressImage(file, 1200, 0.8);

                const formData = new FormData();
                formData.append("file", compressedBlob, file.name);
                
                console.log(`[BannerManager] Uploading to /api/upload...`);
                
                // Use API route instead of Server Action to avoid 403 Forbidden
                const response = await fetch("/api/upload?folder=assets", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed with status ${response.status}`);
                }

                const res = await response.json();

                if (res.success && res.url) {
                    const newBanners = { ...banners, [key]: res.url };
                    setBanners(newBanners);
                    
                    await updateSiteSetting(`homepage_banner_${key}`, res.url);
                    toast.success(`Banner ${key} berhasil diperbarui`);
                    router.refresh();
                } else {
                    console.error(`[BannerManager] Upload failed:`, res.error);
                    toast.error(res.error || "Gagal upload gambar ke server assets");
                }
            } catch (error: any) {
                console.error(`[BannerManager] System error:`, error);
                toast.error("Terjadi kesalahan sistem (403/WAF?): " + error.message);
            } finally {
                setUploadingKey(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        });
    };

    const handleManualUrl = async (key: string, url: string) => {
        const newBanners = { ...banners, [key]: url };
        setBanners(newBanners);
        
        startSave(async () => {
            await updateSiteSetting(`homepage_banner_${key}`, url);
            toast.success(`URL Banner ${key} berhasil disimpan`);
            router.refresh();
        });
    };

    const removeBanner = async (key: string) => {
        if (!confirm("Hapus banner ini?")) return;
        
        const newBanners = { ...banners };
        delete (newBanners as any)[key];
        setBanners(newBanners);
        
        startSave(async () => {
            await updateSiteSetting(`homepage_banner_${key}`, null);
            toast.success(`Banner ${key} berhasil dihapus`);
            router.refresh();
        });
    };

    const sections = [
        { key: "protection", title: "Protection", icon: ShieldCheck, color: "bg-red-50 text-red-600" },
        { key: "control", title: "Control Product", icon: Cpu, color: "bg-blue-50 text-blue-600" },
        { key: "lighting", title: "Lampu / Lighting", icon: Lightbulb, color: "bg-amber-50 text-amber-600" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sections.map((section) => {
                const imageUrl = (banners as any)[section.key];
                const isUploading = uploadingKey === section.key;
                const isManual = showManual[section.key];

                return (
                    <Card key={section.key} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white flex flex-col group/card">
                        <CardHeader className={cn("border-b p-5 transition-colors", section.color.split(' ')[0])}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", section.color.split(' ')[1].replace('text', 'bg').replace('600', '100'))}>
                                        <section.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-tight">{section.title}</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Featured Banner</CardDescription>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity"
                                    onClick={() => setShowManual(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
                                >
                                    <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="space-y-4 flex-1">
                                {isManual ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Input Manual URL</Label>
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="https://assets.hokiindo.co.id/..." 
                                                className="h-10 rounded-xl text-xs font-medium"
                                                defaultValue={imageUrl || ""}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleManualUrl(section.key, e.currentTarget.value);
                                                        setShowManual(prev => ({ ...prev, [section.key]: false }));
                                                    }
                                                }}
                                            />
                                            <Button 
                                                size="sm" 
                                                className="rounded-xl bg-slate-900"
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    handleManualUrl(section.key, input.value);
                                                    setShowManual(prev => ({ ...prev, [section.key]: false }));
                                                }}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-medium italic">Gunakan jika fitur upload sedang bermasalah.</p>
                                    </div>
                                ) : (
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group">
                                        {imageUrl ? (
                                            <>
                                                {/* Use regular img for preview to bypass Next.js Image optimization for immediate feedback */}
                                                <img
                                                    src={imageUrl}
                                                    alt={section.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="rounded-full font-bold text-[10px] uppercase h-8"
                                                        onClick={() => {
                                                            activeKeyRef.current = section.key;
                                                            fileInputRef.current?.click();
                                                        }}
                                                        disabled={isUploading}
                                                    >
                                                        {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                                        Ganti
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="rounded-full font-bold text-[10px] uppercase h-8"
                                                        onClick={() => removeBanner(section.key)}
                                                        disabled={isUploading}
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
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest animate-pulse">Uploading...</p>
                                                    </div>
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
                                )}
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                        Slot "Hot Item" di halaman depan {section.title} akan diganti gambar ini.
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
