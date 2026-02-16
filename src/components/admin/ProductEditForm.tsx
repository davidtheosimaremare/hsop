"use client";

import { useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Upload, FileText, X } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";
import { updateProductDetails } from "@/app/actions/product";
import { scrapeSiemensProduct } from "@/app/actions/scraper";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface ProductEditFormProps {
    product: {
        id: string;
        sku: string;
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
    const [isScraping, setIsScraping] = useState(false);

    // Form State
    const [description, setDescription] = useState(product.description || "");
    const [datasheet, setDatasheet] = useState(product.datasheet || "");
    const [image, setImage] = useState(product.image || "");
    const [imageInputType, setImageInputType] = useState<"upload" | "url">("upload");

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

    const handleScrape = async () => {
        if (!confirm("Ini akan menimpa Deskripsi dan Spesifikasi yang ada. Lanjutkan?")) return;

        setIsScraping(true);
        try {
            console.log("Starting scrape for SKU:", product.sku);
            const result = await scrapeSiemensProduct(product.sku);
            console.log("Scrape result:", result);

            if (result.success && result.data) {
                // Update Description
                if (result.data.description) {
                    console.log("Updating description to:", result.data.description);
                    setDescription(result.data.description);
                } else {
                    console.log("No description found in scrape result");
                }

                // Update Image if empty
                if (result.data.image && !image) {
                    setImage(result.data.image);
                    setImageInputType("url"); // Switch to URL mode if scraped
                }

                // Update Specs
                if (result.data.specifications) {
                    const newSpecs = Object.entries(result.data.specifications).map(([key, value]) => ({
                        key,
                        value: String(value)
                    }));
                    if (newSpecs.length > 0) {
                        setSpecs(newSpecs);
                    }
                }
                alert("Data berhasil diambil dari Siemens!");
            } else {
                alert(result.error || "Gagal mengambil data.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat scraping.");
        } finally {
            setIsScraping(false);
        }
    };

    // Ensure we switch input type if image looks like a URL
    useEffect(() => {
        if (image && image.startsWith("http") && !image.includes("blob:")) {
            if (imageInputType !== "url") setImageInputType("url");
        }
    }, [image]);

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleScrape}
                    disabled={isScraping || isPending}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                    {isScraping ? (
                        <>
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            Sedang Mengambil Data...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Auto-Fill dari Siemens
                        </>
                    )}
                </Button>
            </div>

            {/* Image Upload / URL Input */}
            <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                    <Label className="text-base">Gambar Produk</Label>
                    <div className="flex bg-white rounded-md border p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setImageInputType("upload")}
                            className={`px-3 py-1 text-sm rounded-sm transition-colors ${imageInputType === "upload" ? "bg-red-600 text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"}`}
                        >
                            Upload File
                        </button>
                        <button
                            type="button"
                            onClick={() => setImageInputType("url")}
                            className={`px-3 py-1 text-sm rounded-sm transition-colors ${imageInputType === "url" ? "bg-red-600 text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"}`}
                        >
                            Log Image URL
                        </button>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="relative w-32 h-32 bg-white rounded-lg overflow-hidden border border-dashed border-gray-300 flex items-center justify-center shrink-0 shadow-sm">
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

                    <div className="flex-1 space-y-3">
                        {imageInputType === "upload" ? (
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Upload Local File</Label>
                                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} disabled={isPending} className="bg-white" />
                                <p className="text-xs text-gray-500">Supported formats: JPG, PNG, WEBP. Max size: 5MB.</p>
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
                                <p className="text-xs text-gray-500">Paste a direct link to an image. Ensure the URL is publicly accessible.</p>
                            </div>
                        )}
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
