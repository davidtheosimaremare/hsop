"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, FileText, ImageIcon } from "lucide-react";
import { getSiteSetting, updateSiteSetting } from "@/app/actions/settings";
import { uploadFile } from "@/app/actions/upload";

export default function FormatFilePage() {
    const [headerImage, setHeaderImage] = useState("");
    const [footerImage, setFooterImage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingHeader, setIsUploadingHeader] = useState(false);
    const [isUploadingFooter, setIsUploadingFooter] = useState(false);
    const headerRef = useRef<HTMLInputElement>(null);
    const footerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const result = await getSiteSetting("export_template") as Record<string, string> | null;
            if (result?.headerImage) setHeaderImage(result.headerImage);
            if (result?.footerImage) setFooterImage(result.footerImage);
        } catch (e) { /* defaults */ }
        setIsLoading(false);
    };

    const handleUpload = async (file: File, type: "header" | "footer") => {
        const setUploading = type === "header" ? setIsUploadingHeader : setIsUploadingFooter;
        const setImage = type === "header" ? setHeaderImage : setFooterImage;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await uploadFile(formData);
            if (result.success && result.url) {
                setImage(result.url);
                const current = await getSiteSetting("export_template") as Record<string, string> | null;
                await updateSiteSetting("export_template", {
                    ...current,
                    [type === "header" ? "headerImage" : "footerImage"]: result.url,
                });
            }
        } catch (e) {
            console.error("Upload failed:", e);
        }
        setUploading(false);
    };

    const handleRemoveImage = async (type: "header" | "footer") => {
        const setImage = type === "header" ? setHeaderImage : setFooterImage;
        setImage("");
        const current = await getSiteSetting("export_template") as Record<string, string> | null;
        await updateSiteSetting("export_template", {
            ...current,
            [type === "header" ? "headerImage" : "footerImage"]: "",
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Format File</h1>
            <p className="text-sm text-gray-500">Upload gambar header dan footer untuk dokumen PDF & Excel yang didownload customer.</p>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-600" />
                        Template Dokumen
                    </CardTitle>
                    <CardDescription>
                        Gambar ini akan muncul di setiap file PDF yang didownload dari halaman Penawaran Harga
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <>
                            {/* Header Image */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                                    <ImageIcon className="w-4 h-4 text-red-500" />
                                    Header Dokumen
                                </Label>
                                {headerImage ? (
                                    <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                        <img
                                            src={headerImage}
                                            alt="Header"
                                            className="w-full h-auto max-h-40 object-contain"
                                        />
                                        <button
                                            onClick={() => handleRemoveImage("header")}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-sm"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => headerRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-colors"
                                    >
                                        {isUploadingHeader ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500 font-medium">Klik untuk upload header</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG — Rekomendasi: 800 x 120 px</p>
                                            </>
                                        )}
                                    </div>
                                )}
                                <input
                                    ref={headerRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload(file, "header");
                                        e.target.value = "";
                                    }}
                                />
                            </div>

                            {/* Footer Image */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                                    <ImageIcon className="w-4 h-4 text-red-500" />
                                    Footer Dokumen
                                </Label>
                                {footerImage ? (
                                    <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                        <img
                                            src={footerImage}
                                            alt="Footer"
                                            className="w-full h-auto max-h-40 object-contain"
                                        />
                                        <button
                                            onClick={() => handleRemoveImage("footer")}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-sm"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => footerRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-colors"
                                    >
                                        {isUploadingFooter ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500 font-medium">Klik untuk upload footer</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG — Rekomendasi: 800 x 80 px</p>
                                            </>
                                        )}
                                    </div>
                                )}
                                <input
                                    ref={footerRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload(file, "footer");
                                        e.target.value = "";
                                    }}
                                />
                            </div>

                            <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-lg space-y-1">
                                <p>💡 <strong>Header</strong> akan muncul di bagian atas dokumen PDF (menggantikan default header merah Hokiindo).</p>
                                <p>💡 <strong>Footer</strong> akan muncul di bagian bawah dokumen PDF (menggantikan default footer alamat).</p>
                                <p>💡 Jika tidak ada gambar yang di-upload, template default akan digunakan.</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
