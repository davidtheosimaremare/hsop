"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, UploadCloud, ImageIcon } from "lucide-react";
import { updateProductDetails } from "@/app/actions/product";
import { uploadNewsImage } from "@/app/actions/upload";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface EditableSliderImagesSectionProps {
    productId: string;
    initialImages: string[];
}

export function EditableSliderImagesSection({ productId, initialImages }: EditableSliderImagesSectionProps) {
    const router = useRouter();
    const [images, setImages] = useState<string[]>(initialImages || []);
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const result = await uploadNewsImage(formData); // Reusing upload action
                if (result.success && result.url) {
                    newUrls.push(result.url);
                } else {
                    alert(`Gagal upload: ${file.name}`);
                }
            }

            if (newUrls.length > 0) {
                const updatedImages = [...images, ...newUrls];
                setImages(updatedImages);
                await saveImages(updatedImages);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Terjadi kesalahan saat upload gambar");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
        setImages(updatedImages);
        saveImages(updatedImages);
    };

    const saveImages = async (updatedImages: string[]) => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { sliderImages: updatedImages });
            if (result.success) {
                router.refresh();
            } else {
                alert("Failed to save changes");
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <Label className="text-base font-semibold text-slate-800">Gambar Slide Tambahan</Label>
                    <p className="text-xs text-slate-500">Gambar ini akan tampil sebagai galeri yang dapat di-slide di bawah gambar utama produk.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending || isUploading}
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] uppercase font-bold tracking-widest px-3 border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                        {isUploading ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : <Plus className="mr-2 h-3 w-3" />}
                        Tambah Gambar
                    </Button>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                {images.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <Image src={url} alt={`Slide ${idx + 1}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => handleRemoveImage(idx)}
                                disabled={isPending}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transform scale-75 group-hover:scale-100 transition-transform shadow-lg"
                                title="Hapus Gambar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {images.length === 0 && !isUploading && (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-500">Belum ada gambar slide</p>
                        <p className="text-xs text-slate-400">Klik "Tambah Gambar" untuk mengupload</p>
                    </div>
                )}

                {isUploading && (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 text-teal-600 animate-spin mb-2" />
                        <span className="text-xs font-semibold text-teal-700">Mengupload...</span>
                    </div>
                )}
            </div>

            {(isPending) && (
                <div className="flex items-center gap-2 text-sm text-teal-600 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan perubahan...
                </div>
            )}
        </div>
    );
}
