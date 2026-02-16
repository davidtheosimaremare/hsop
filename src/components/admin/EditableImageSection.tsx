"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Pencil, Save, XCircle, Package } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";
import { updateProductDetails } from "@/app/actions/product";
import { ProductAutoUpdate } from "@/components/admin/ProductAutoUpdate";
import { useRouter } from "next/navigation";

interface EditableImageSectionProps {
    productId: string;
    sku: string;
    initialImage: string | null;
    productName: string;
}

export function EditableImageSection({ productId, sku, initialImage, productName }: EditableImageSectionProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [image, setImage] = useState(initialImage || "");
    const [isPending, startTransition] = useTransition();
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
            const result = await uploadFile(formData);
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

    // Ensure we switch input type if image looks like a URL
    useEffect(() => {
        if (image && image.startsWith("http") && !image.includes("blob:")) {
            // Only switch if we are editing and user hasn't explicitly chosen type, 
            // or just rely on manual switch. 
            // For now, let's keep it simple: if editing, default to upload, user can switch.
        }
    }, [image]);

    if (!isEditing) {
        return (
            <div className="space-y-4">
                <div className="aspect-square relative bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-dashed border-gray-300 group">
                    {initialImage ? (
                        <Image
                            src={initialImage}
                            alt={productName}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="text-center p-4">
                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                            <span className="text-sm text-gray-400">Belum ada gambar</span>
                        </div>
                    )}

                    {/* Overlay Edit Button */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit Gambar
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="w-full">
                        <Pencil className="h-3 w-3 mr-2" /> Manual Update
                    </Button>
                    <div className="text-center">
                        <ProductAutoUpdate productId={productId} sku={sku} targets={['image']} />
                    </div>
                    <p className="text-xs text-center text-gray-500">
                        * Otomatis update gambar dari Siemens
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Edit Gambar</Label>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isPending}>
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
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Upload Local File</Label>
                            <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={isPending} className="bg-white" />
                            <p className="text-xs text-gray-500">JPG, PNG, WEBP. Max 5MB.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Image URL Link</Label>
                            <Input
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                disabled={isPending}
                                className="bg-white font-mono text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isPending} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isPending}>
                    Batal
                </Button>
            </div>
        </div>
    );
}
