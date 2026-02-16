"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Upload, ImageIcon } from "lucide-react";
import Image from "next/image";
import { uploadFile } from "@/app/actions/upload";
import { updateHomeCTA, getHomeCTAs } from "@/app/actions/cta";
import { useRouter } from "next/navigation";

interface CTAData {
    id?: string;
    title: string;
    subtitle: string;
    image: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
    position: string;
    isVisible: boolean;
}

const DEFAULT_CTA_LEFT: CTAData = {
    title: "Potensi Turun Harga dan Pembayaran Tempo Mencapai 90 Hari Dengan Bisnis",
    subtitle: "1500+ Customer Bisnis Sudah Menikmati Layanan Kami",
    image: "",
    primaryButtonText: "Daftar Sebagai Bisnis",
    primaryButtonLink: "#",
    secondaryButtonText: "Belanja Sekarang",
    secondaryButtonLink: "#",
    position: "LEFT", // Business
    isVisible: true,
};

const DEFAULT_CTA_RIGHT: CTAData = {
    title: "Jual Produk ke Seluruh Indonesia dalam Satu Platform",
    subtitle: "Dipercaya 750+ Vendor di Seluruh Indonesia",
    image: "",
    primaryButtonText: "Daftar Sebagai Vendor",
    primaryButtonLink: "#",
    secondaryButtonText: "Pelajari Selengkapnya",
    secondaryButtonLink: "#",
    position: "RIGHT", // Vendor
    isVisible: true,
};

export default function HomeCTAManager() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State for LEFT (Business) and RIGHT (Vendor) CTAs
    const [leftCTA, setLeftCTA] = useState<CTAData>(DEFAULT_CTA_LEFT);
    const [rightCTA, setRightCTA] = useState<CTAData>(DEFAULT_CTA_RIGHT);

    // File inputs refs
    const leftFileRef = useRef<HTMLInputElement>(null);
    const rightFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getHomeCTAs();
            if (data && data.length > 0) {
                const left = data.find((item: any) => item.position === "LEFT");
                const right = data.find((item: any) => item.position === "RIGHT");

                if (left) setLeftCTA(prev => ({
                    ...prev,
                    ...left,
                    subtitle: left.subtitle || "",
                    image: left.image || "",
                    primaryButtonText: left.primaryButtonText || "",
                    primaryButtonLink: left.primaryButtonLink || "",
                    secondaryButtonText: left.secondaryButtonText || "",
                    secondaryButtonLink: left.secondaryButtonLink || ""
                }));
                if (right) setRightCTA(prev => ({
                    ...prev,
                    ...right,
                    subtitle: right.subtitle || "",
                    image: right.image || "",
                    primaryButtonText: right.primaryButtonText || "",
                    primaryButtonLink: right.primaryButtonLink || "",
                    secondaryButtonText: right.secondaryButtonText || "",
                    secondaryButtonLink: right.secondaryButtonLink || ""
                }));
            }
        } catch (error) {
            console.error("Failed to fetch CTAs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, position: "LEFT" | "RIGHT") => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("Ukuran file terlalu besar (Max 10MB)");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await uploadFile(formData);
            if (res.success && res.url) {
                if (position === "LEFT") {
                    setLeftCTA(prev => ({ ...prev, image: res.url! }));
                } else {
                    setRightCTA(prev => ({ ...prev, image: res.url! }));
                }
            } else {
                alert("Gagal upload gambar: " + res.error);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Terjadi kesalahan saat upload gambar.");
        }
    };

    const handleSave = async (position: "LEFT" | "RIGHT") => {
        setIsSaving(true);
        try {
            const data = position === "LEFT" ? leftCTA : rightCTA;
            const res = await updateHomeCTA(position, data);

            if (res.success) {
                alert("Berhasil menyimpan perubahan!");
                router.refresh();
            } else {
                alert("Gagal menyimpan: " + res.error);
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Terjadi kesalahan saat menyimpan.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderForm = (cta: CTAData, setCTA: React.Dispatch<React.SetStateAction<CTAData>>, position: "LEFT" | "RIGHT", fileRef: React.RefObject<HTMLInputElement>) => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Preview / Image Upload */}
                <div className="space-y-4">
                    <Label>Background Image</Label>
                    <div
                        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors aspect-video w-full relative overflow-hidden cursor-pointer ${cta.image ? 'border-teal-200' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'}`}
                        onClick={() => fileRef.current?.click()}
                    >
                        {cta.image ? (
                            <>
                                <Image
                                    src={cta.image}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-medium text-sm flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> Ganti Gambar
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="text-sm text-gray-500">
                                    <span className="font-semibold text-teal-600">Upload Image</span>
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, position)}
                        />
                    </div>
                    <p className="text-xs text-gray-500">Recommended: 1200x600px or similar aspect ratio.</p>
                </div>

                {/* Text Fields */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Judul Utama (Title)</Label>
                        <Input
                            value={cta.title}
                            onChange={(e) => setCTA({ ...cta, title: e.target.value })}
                            placeholder="Judul banner..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Sub-Judul (Subtitle)</Label>
                        <Input
                            value={cta.subtitle}
                            onChange={(e) => setCTA({ ...cta, subtitle: e.target.value })}
                            placeholder="Deskripsi singkat..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label>Tombol Utama</Label>
                            <Input
                                value={cta.primaryButtonText}
                                onChange={(e) => setCTA({ ...cta, primaryButtonText: e.target.value })}
                                placeholder="Text Tombol"
                            />
                            <Input
                                value={cta.primaryButtonLink}
                                onChange={(e) => setCTA({ ...cta, primaryButtonLink: e.target.value })}
                                placeholder="Link URL (#)"
                                className="text-xs text-gray-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tombol Sekunder</Label>
                            <Input
                                value={cta.secondaryButtonText}
                                onChange={(e) => setCTA({ ...cta, secondaryButtonText: e.target.value })}
                                placeholder="Text Tombol"
                            />
                            <Input
                                value={cta.secondaryButtonLink}
                                onChange={(e) => setCTA({ ...cta, secondaryButtonLink: e.target.value })}
                                placeholder="Link URL (#)"
                                className="text-xs text-gray-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button
                    onClick={() => handleSave(position)}
                    disabled={isSaving}
                    className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Simpan {position === "LEFT" ? "Bisnis" : "Vendor"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Home CTA Manager</CardTitle>
                <CardDescription>Kelola banner Call-to-Action di halaman depan (Bisnis/Vendor).</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="left" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="left">Banner Kiri (Bisnis)</TabsTrigger>
                        <TabsTrigger value="right">Banner Kanan (Vendor)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="left">
                        {renderForm(leftCTA, setLeftCTA, "LEFT", leftFileRef)}
                    </TabsContent>

                    <TabsContent value="right">
                        {renderForm(rightCTA, setRightCTA, "RIGHT", rightFileRef)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
