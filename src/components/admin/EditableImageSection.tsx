"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Pencil, Save, XCircle, Package, Download, RefreshCw } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";
import { updateProductDetails } from "@/app/actions/product";
import { scrapeSieportalImage, scrapeSiemensProduct } from "@/app/actions/scraper";
import { useRouter } from "next/navigation";

interface EditableImageSectionProps {
    productId: string;
    sku: string;
    brand: string | null;
    initialImage: string | null;
    productName: string;
}

export function EditableImageSection({ productId, sku, brand, initialImage, productName }: EditableImageSectionProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [image, setImage] = useState(initialImage || "");
    const [isPending, startTransition] = useTransition();
    const [isScraping, setIsScraping] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [imageInputType, setImageInputType] = useState<"upload" | "url">("upload");

    // Reset state when editing is cancelled
    const handleCancel = () => {
        setImage(initialImage || "");
        setIsEditing(false);
        setImageInputType("upload");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        startTransition(async () => {
            const result = await uploadFile(formData, false, "products");
            if (result.success && result.url) {
                setImage(result.url);
            } else {
                alert("Upload failed");
            }
        });
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { image });
            if (result.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert("Failed to save changes");
            }
        });
    };

    // OPTION 1: Download & Save Locally (Puppeteer)
    const handleScrapeImageLocal = async () => {
        if (!confirm("Ambil gambar dari Sieportal dan SIMPAN SECARA LOKAL di server kami? Gambar saat ini akan diganti.")) return;

        setIsScraping(true);
        try {
            const result = await scrapeSieportalImage(productId, sku);
            if (result.success && result.url) {
                setImage(result.url);
                setImageInputType("url");
                alert("Gambar berhasil ditarik dan disimpan di server lokal!");
                router.refresh();
            } else {
                alert(result.error || "Gagal mengambil gambar dari Sieportal.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat scraping Puppeteer.");
        } finally {
            setIsScraping(false);
        }
    };

    // OPTION 2: Sync URL ONLY (Lightweight)
    const handleSyncImageUrl = async () => {
        if (!confirm("Sinkronkan URL gambar saja dari Siemens Mall (tanpa download)? Gambar saat ini akan diganti.")) return;

        setIsSyncing(true);
        try {
            const result = await scrapeSiemensProduct(sku);
            if (result.success && result.data?.image) {
                const saveResult = await updateProductDetails(productId, { image: result.data.image });
                if (saveResult.success) {
                    setImage(result.data.image);
                    setImageInputType("url");
                    alert("URL Gambar berhasil disinkronkan dari Siemens!");
                    router.refresh();
                }
            } else {
                alert(result.error || "Gagal sinkronisasi URL dari Siemens.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat sinkronisasi.");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        if (image && image.startsWith("http") && !image.includes("blob:")) {
            // Logic placeholder
        }
    }, [image]);

    if (!isEditing) {
        return (
            <div className="space-y-4">
                <div className="relative bg-white rounded-2xl p-2 border border-slate-100 shadow-sm group transition-all hover:shadow-md">
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer" onClick={() => setIsEditing(true)}>
                        {initialImage ? (
                            <Image
                                src={initialImage}
                                alt={productName}
                                fill
                                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="text-center p-4">
                                <Package className="h-12 w-12 text-slate-200 mx-auto mb-2" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Image Available</span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-slate-900 font-bold text-xs ring-1 ring-slate-200">
                                <Pencil className="h-3.5 w-3.5 text-red-600" /> Ganti Gambar
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5">
                    {/* Always visible: Manual Upload */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="w-full h-10 border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all gap-2"
                    >
                        <Pencil className="h-4 w-4 text-slate-400" />
                        Update Manual / Upload
                    </Button>

                    <div className="pt-2 border-t border-slate-50">
                        {/* SINGLE SYNC OPTION */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleScrapeImageLocal}
                            disabled={isScraping || isSyncing}
                            className="w-full h-11 border-red-50/50 bg-red-50/20 hover:bg-red-50 text-red-700 hover:border-red-100 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all gap-2"
                        >
                            {isScraping ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                            ) : (
                                <Download className="h-4 w-4 text-red-600" />
                            )}
                            Tarik dari Sieportal
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Edit Gambar</Label>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isPending || isScraping || isSyncing}>
                        <XCircle className="h-4 w-4 text-gray-500" />
                    </Button>
                </div>
            </div>

            <div className="flex bg-white rounded-md border p-1 shadow-sm">
                <button
                    type="button"
                    onClick={() => setImageInputType("upload")}
                    className={`flex-1 px-3 py-1 text-sm rounded-sm transition-colors ${imageInputType === "upload" ? "bg-red-600 text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"}`}
                >
                    Upload File
                </button>
                <button
                    type="button"
                    onClick={() => setImageInputType("url")}
                    className={`flex-1 px-3 py-1 text-sm rounded-sm transition-colors ${imageInputType === "url" ? "bg-red-600 text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"}`}
                >
                    Pakai URL
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-dashed border-gray-300 flex items-center justify-center shrink-0 shadow-sm">
                    {image ? (
                        <Image src={image} alt="Preview" fill className="object-cover" />
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                            <Upload className="h-8 w-8 mb-1" />
                            <span className="text-xs">No Image</span>
                        </div>
                    )}
                    {image && (
                        <button
                            type="button"
                            onClick={() => setImage("")}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md transition-all"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {imageInputType === "upload" ? (
                        <div key="upload-input" className="space-y-2">
                            <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Upload Local File</Label>
                            <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={isPending || isScraping || isSyncing} className="bg-white" />
                            <p className="text-xs text-gray-500">JPG, PNG, WEBP. Max 5MB.</p>
                        </div>
                    ) : (
                        <div key="url-input" className="space-y-2">
                            <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Image URL Link</Label>
                            <Input
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={image || ""}
                                onChange={(e) => setImage(e.target.value)}
                                disabled={isPending || isScraping || isSyncing}
                                className="bg-white font-mono text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isPending || isScraping || isSyncing} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isPending || isScraping || isSyncing}>
                    Batal
                </Button>
            </div>
        </div>
    );
}
