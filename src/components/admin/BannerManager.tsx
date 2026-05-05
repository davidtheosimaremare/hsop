"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createBanner, deleteBanner, toggleBannerStatus } from "@/app/actions/settings";
import { compressImage } from "@/lib/image";
import {
    Loader2,
    Plus,
    Trash2,
    Link as LinkIcon,
    Image as ImageIcon,
    LayoutTemplate,
    Eye,
    EyeOff,
    ExternalLink,
    AlertCircle,
    Info,
    Upload,
    X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Banner {
    id: string;
    title: string | null;
    image: string;
    link: string | null;
    order: number;
    isActive: boolean;
}

interface BannerManagerProps {
    initialBanners: Banner[];
}

export function BannerManager({ initialBanners }: BannerManagerProps) {
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isCreating, startCreate] = useTransition();
    const router = useRouter();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCreate = () => {
        if (!selectedFile) {
            toast.error("Silakan pilih gambar banner.");
            return;
        }
        startCreate(async () => {
            try {
                // 1. Compress the image before upload to speed up and save bandwidth
                console.log(`[BannerManager] Compressing ${selectedFile.name}...`);
                const compressedBlob = await compressImage(selectedFile, 1920, 0.85);
                
                // 2. Upload using API route (faster and avoids some WAF issues with server actions)
                const formData = new FormData();
                formData.append("file", compressedBlob, selectedFile.name);
                
                console.log(`[BannerManager] Uploading to /api/upload...`);
                const response = await fetch("/api/upload?folder=assets", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed with status ${response.status}`);
                }

                const uploadRes = await response.json();

                if (!uploadRes.success || !uploadRes.url) {
                    toast.error(uploadRes.error || "Gagal mengupload gambar.");
                    return;
                }

                // 3. Create banner record
                const res = await createBanner({
                    title,
                    image: uploadRes.url,
                    link,
                    isActive
                });

                if (res.success) {
                    setTitle("");
                    setLink("");
                    clearFile();
                    setIsActive(true);
                    toast.success("Banner berhasil ditambahkan");
                    router.refresh();
                } else {
                    toast.error("Gagal membuat banner.");
                }
            } catch (error) {
                console.error(error);
                toast.error("Terjadi kesalahan sistem");
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Add New Banner Form */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 border-b border-gray-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-black text-gray-900 uppercase tracking-tight">Tambah Banner Baru</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Unggah konten visual baru</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-6">
                            {/* Image Upload Area */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <ImageIcon className="w-3 h-3" /> Gambar Banner (Wajib)
                                </label>

                                {!previewUrl ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/50 hover:border-red-200 transition-all cursor-pointer group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-600">Klik untuk upload gambar</p>
                                        <p className="text-[11px] text-gray-400 mt-1 font-medium text-center">Rekomendasi ukuran: 960x240px (Aspect Ratio 4:1)</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative aspect-[4/1] rounded-2xl overflow-hidden border border-gray-100 shadow-inner group">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={clearFile}
                                                className="rounded-full h-10 px-4 font-black text-xs uppercase"
                                            >
                                                <X className="w-4 h-4 mr-2" /> Ganti Gambar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <LayoutTemplate className="w-3 h-3" /> Judul Banner
                                    </label>
                                    <Input
                                        placeholder="Promo Spesial..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="bg-gray-50 border-gray-100 rounded-xl focus:ring-red-500/20 h-11 text-sm font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <LinkIcon className="w-3 h-3" /> Link Tujuan
                                    </label>
                                    <Input
                                        placeholder="/kategori/lighting"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        className="bg-gray-50 border-gray-100 rounded-xl focus:ring-red-500/20 h-11 text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-4 flex flex-col justify-between space-y-4">
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 h-full">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Aktif</span>
                                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                                </div>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-medium italic">
                                    <Info className="w-3 h-3 inline mr-1 text-blue-500" />
                                    Jika aktif, banner akan langsung muncul di slider halaman depan sesuai urutan terbaru.
                                </p>
                            </div>
                            <Button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 transition-all"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Simpan Banner</>}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Banner List Section Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Daftar Banner Aktif</h3>
                </div>
                <Badge variant="outline" className="rounded-lg text-[10px] font-black bg-gray-50 text-gray-500 border-gray-200">
                    {initialBanners.length} TOTAL BANNER
                </Badge>
            </div>

            {/* Banner Grid */}
            {initialBanners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                        <ImageIcon className="w-8 h-8 text-gray-200" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Belum ada banner</h4>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Tambahkan banner baru melalui form di atas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {initialBanners.map((banner) => (
                        <BannerItem key={banner.id} banner={banner} />
                    ))}
                </div>
            )}
        </div>
    );
}

function BannerItem({ banner }: { banner: Banner }) {
    const [isDeleting, startDelete] = useTransition();
    const [isToggling, startToggle] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (!confirm("Hapus banner ini permanen?")) return;
        startDelete(async () => {
            try {
                await deleteBanner(banner.id);
                toast.success("Banner berhasil dihapus");
                router.refresh();
            } catch {
                toast.error("Gagal menghapus banner");
            }
        });
    };

    const handleToggle = (checked: boolean) => {
        startToggle(async () => {
            try {
                await toggleBannerStatus(banner.id, checked);
                toast.success(`Banner telah ${checked ? "diaktifkan" : "dinonaktifkan"}`);
                router.refresh();
            } catch {
                toast.error("Gagal memperbarui status");
            }
        });
    };

    return (
        <Card className="overflow-hidden group relative border border-gray-100 shadow-sm hover:shadow-xl hover:border-red-100 rounded-[1.5rem] transition-all duration-300 flex flex-col bg-white">
            {/* Image Preview Container */}
            <div className="aspect-[4/1] relative overflow-hidden bg-gray-50">
                <div className={cn(
                    "absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    !banner.isActive && "opacity-100 bg-gray-900/40"
                )} />

                {/* Status Badge */}
                <div className="absolute top-3 left-3 z-20">
                    <Badge className={cn(
                        "rounded-lg px-2 py-0.5 text-[9px] font-black uppercase border-none shadow-sm",
                        banner.isActive ? "bg-emerald-500 text-white" : "bg-gray-500 text-white"
                    )}>
                        {banner.isActive ? "AKTIF" : "NON-AKTIF"}
                    </Badge>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={banner.image}
                    alt={banner.title || "Banner"}
                    className={cn(
                        "object-cover w-full h-full transition-transform duration-700 group-hover:scale-110",
                        !banner.isActive && "grayscale opacity-60"
                    )}
                    onError={(e) => (e.currentTarget.src = "https://placehold.co/800x400?text=No+Image")}
                />

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <a
                        href={banner.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg hover:bg-red-600 hover:text-white transition-colors"
                        title="Lihat Gambar Full"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            <CardContent className="p-5 flex-1 flex flex-col gap-4">
                <div className="space-y-1 min-w-0">
                    <h4 className="font-black text-gray-900 truncate tracking-tight text-sm uppercase">
                        {banner.title || "TANPA JUDUL"}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 truncate">
                        <LinkIcon className="w-3 h-3 shrink-0" />
                        {banner.link ? (
                            <span className="text-red-600/70 hover:underline cursor-pointer">{banner.link}</span>
                        ) : (
                            <span className="italic">Tidak ada link</span>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Status</span>
                            <Switch
                                checked={banner.isActive}
                                onCheckedChange={handleToggle}
                                disabled={isToggling}
                                className="scale-75 data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-9 h-9 rounded-xl text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
