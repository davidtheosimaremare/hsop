"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Upload, FileText, X } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";
import { updateProductDetails } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface ProductEditFormProps {
    product: {
        id: string;
        description: string | null;
        specifications: any;
        datasheet: string | null;
        image: string | null;
    };
    onSuccess?: () => void;
}

export function ProductEditForm({ product, onSuccess }: ProductEditFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Form State
    const [description, setDescription] = useState(product.description || "");
    const [datasheet, setDatasheet] = useState(product.datasheet || "");
    const [image, setImage] = useState(product.image || "");

    // Specifications State (Convert JSON object to Array for editing)
    const initialSpecs = product.specifications
        ? Object.entries(product.specifications).map(([key, value]) => ({ key, value: String(value) }))
        : [];
    const [specs, setSpecs] = useState<{ key: string; value: string }[]>(initialSpecs);

    // Upload Handlers
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "datasheet") => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        startTransition(async () => {
            const result = await uploadFile(formData);
            if (result.success && result.url) {
                if (type === "image") setImage(result.url);
                else setDatasheet(result.url);
            } else {
                alert("Upload failed");
            }
        });
    };

    // Spec Handlers
    const addSpecRow = () => setSpecs([...specs, { key: "", value: "" }]);
    const removeSpecRow = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
    const updateSpec = (index: number, field: "key" | "value", val: string) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = val;
        setSpecs(newSpecs);
    };

    // Submit Handler
    const handleSubmit = () => {
        startTransition(async () => {
            // Convert specs array back to object
            const specsObject = specs.reduce((acc, curr) => {
                if (curr.key.trim()) acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, string>);

            const result = await updateProductDetails(product.id, {
                description,
                specifications: specsObject,
                datasheet,
                image,
            });

            if (result.success) {
                // Redirect back to detail page
                router.push(`/admin/products/${product.id}`);
                router.refresh(); // Ensure data is fresh
            } else {
                alert("Failed to save changes");
            }
        });
    };

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
            {/* Image Upload */}
            <div className="space-y-2">
                <Label>Gambar Produk</Label>
                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-dashed border-gray-300 flex items-center justify-center">
                        {image ? (
                            <Image src={image} alt="Preview" fill className="object-cover" />
                        ) : (
                            <Upload className="text-gray-400" />
                        )}
                        {image && (
                            <button
                                onClick={() => setImage("")}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                    <div className="flex-1">
                        <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} disabled={isPending} />
                        <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG. Max 5MB.</p>
                    </div>
                </div>
            </div>

            {/* Description (Rich Text) */}
            <div className="space-y-2">
                <Label>Deskripsi Lengkap</Label>
                <div className="prose-sm">
                    <ReactQuill
                        theme="snow"
                        value={description}
                        onChange={setDescription}
                        className="bg-white"
                    />
                </div>
            </div>

            {/* Specifications */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Spesifikasi Teknis</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSpecRow}>
                        <Plus className="h-4 w-4 mr-1" /> Tambah Baris
                    </Button>
                </div>
                <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                    {specs.length === 0 && <p className="text-sm text-gray-400 text-center italic">Belum ada spesifikasi</p>}
                    {specs.map((spec, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                placeholder="Parameter (cth: Voltage)"
                                value={spec.key}
                                onChange={(e) => updateSpec(index, "key", e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Nilai (cth: 220V)"
                                value={spec.value}
                                onChange={(e) => updateSpec(index, "value", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecRow(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Datasheet Upload */}
            <div className="space-y-2">
                <Label>Datasheet (PDF)</Label>
                <div className="flex gap-2 items-center">
                    <Input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, "datasheet")} disabled={isPending} className="flex-1" />
                    {datasheet && (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-md border border-blue-200 text-sm">
                            <FileText className="h-4 w-4" />
                            <span className="truncate max-w-[150px]">File Terupload</span>
                            <button onClick={() => setDatasheet("")} className="ml-2 hover:text-red-600"><X className="h-3 w-3" /></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSubmit} disabled={isPending} className="bg-red-600 hover:bg-red-700">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Simpan Perubahan
                </Button>
            </div>
        </div>
    );
}
