"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Pencil, Save, XCircle, Package, Download, RefreshCw } from "lucide-react";
import { uploadFile, uploadCroppedImage } from "@/app/actions/upload";
import { updateProductDetails } from "@/app/actions/product";
import { scrapeSieportalImage, scrapeSiemensProduct } from "@/app/actions/scraper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductImageCropper } from "./ProductImageCropper";

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

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { image });
            if (result.success) {
                setIsEditing(false);
                router.refresh();
                toast.success("Gambar berhasil disimpan!");
            } else {
                toast.error("Gagal menyimpan gambar");
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
                toast.success("Gambar berhasil ditarik!");
                router.refresh();
            } else {
                toast.error(result.error || "Gagal mengambil gambar.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat scraping.");
        } finally {
            setIsScraping(false);
        }
    };

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
        <div className="space-y-4 rounded-3xl border border-slate-100 p-6 bg-slate-50/50 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-black uppercase tracking-widest text-slate-700">Edit Gambar</Label>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white" onClick={handleCancel} disabled={isPending || isScraping || isSyncing}>
                    <XCircle className="h-5 w-5 text-slate-400 hover:text-red-600 transition-colors" />
                </Button>
            </div>

            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-inner">
                <button
                    type="button"
                    onClick={() => setImageInputType("upload")}
                    className={`flex-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${imageInputType === "upload" ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-400"}`}
                >
                    Upload & Crop
                </button>
                <button
                    type="button"
                    onClick={() => setImageInputType("url")}
                    className={`flex-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${imageInputType === "url" ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-400"}`}
                >
                    Pakai URL
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 shadow-md">
                    {image ? (
                        <Image src={image} alt="Preview" fill className="object-contain p-2" />
                    ) : (
                        <div className="flex flex-col items-center text-slate-300">
                            <Upload className="h-10 w-10 mb-2 opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Belum ada gambar</span>
                        </div>
                    )}
                    {image && (
                        <button
                            type="button"
                            onClick={() => setImage("")}
                            className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-red-600 shadow-xl transition-all"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {imageInputType === "upload" ? (
                        <div key="upload-input" className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload & Sesuaikan</Label>
                            <ProductImageCropper 
                                onImageUploaded={(url) => {
                                    setImage(url);
                                }}
                            />
                            <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic text-center">Potong gambar agar produk berada tepat di tengah kotak (1:1).</p>
                        </div>
                    ) : (
                        <div key="url-input" className="space-y-2 animate-in slide-in-from-right-2 duration-300">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Image URL Link</Label>
                            <Input
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={image || ""}
                                onChange={(e) => setImage(e.target.value)}
                                disabled={isPending || isScraping || isSyncing}
                                className="h-11 rounded-xl border-slate-200 bg-white font-mono text-[10px] focus:ring-teal-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isPending || !image} className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Perubahan
                </Button>
                <Button variant="outline" className="h-11 px-6 rounded-xl font-bold text-slate-500" onClick={handleCancel} disabled={isPending}>
                    Batal
                </Button>
            </div>
        </div>
    );
}
