"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createBanner, deleteBanner, toggleBannerStatus } from "@/app/actions/settings";
import { Loader2, Plus, Trash2, Eye, EyeOff, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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
    const [image, setImage] = useState("");
    const [link, setLink] = useState("");
    const [isActive, setIsActive] = useState(true);

    const [isCreating, startCreate] = useTransition();
    const router = useRouter();

    const handleCreate = () => {
        if (!image) {
            alert("URL Gambar wajib diisi.");
            return;
        }
        startCreate(async () => {
            const res = await createBanner({ title, image, link, isActive });
            if (res.success) {
                setTitle("");
                setImage("");
                setLink("");
                setIsActive(true);
                router.refresh();
            } else {
                alert("Gagal membuat banner.");
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Form */}
            <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Tambah Banner Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <Input
                            placeholder="URL Gambar Banner (Wajib)"
                            value={image} onChange={(e) => setImage(e.target.value)}
                        />
                    </div>
                    <Input
                        placeholder="Judul Banner (Opsional)"
                        value={title} onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                        placeholder="Link Tujuan (Opsional, misal: /produk/siemens)"
                        value={link} onChange={(e) => setLink(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <Switch checked={isActive} onCheckedChange={setIsActive} id="status-new" />
                        <label htmlFor="status-new" className="text-sm text-gray-600">Aktifkan Langsung</label>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleCreate} disabled={isCreating}>
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Simpan Banner
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {initialBanners.map((banner) => (
                    <BannerItem key={banner.id} banner={banner} />
                ))}
            </div>
        </div>
    );
}

function BannerItem({ banner }: { banner: Banner }) {
    const [isDeleting, startDelete] = useTransition();
    const [isToggling, startToggle] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (!confirm("Hapus banner ini?")) return;
        startDelete(async () => {
            await deleteBanner(banner.id);
            router.refresh();
        });
    };

    const handleToggle = (checked: boolean) => {
        startToggle(async () => {
            await toggleBannerStatus(banner.id, checked);
            router.refresh();
        });
    };

    return (
        <Card className="overflow-hidden group relative flex flex-col">
            <div className="aspect-[21/9] bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={banner.image}
                    alt={banner.title || "Banner"}
                    className={`object-cover w-full h-full transition-opacity ${!banner.isActive ? "opacity-50 grayscale" : ""}`}
                    onError={(e) => (e.currentTarget.src = "https://placehold.co/800x400?text=No+Image")}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                    <Badge variant={banner.isActive ? "default" : "secondary"}>
                        {banner.isActive ? "Aktif" : "Non-Aktif"}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-4 flex-1 flex flex-col gap-2">
                <div>
                    <h4 className="font-bold text-gray-900 truncate">{banner.title || "Tanpa Judul"}</h4>
                    {banner.link && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 truncate">
                            <LinkIcon className="h-3 w-3" />
                            {banner.link}
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-2 flex items-center justify-between border-t">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={banner.isActive}
                            onCheckedChange={handleToggle}
                            disabled={isToggling}
                        />
                        <span className="text-xs text-gray-500">Status</span>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
