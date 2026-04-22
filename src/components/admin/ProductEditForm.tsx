"use client";

import { useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Upload, FileText, X, Package } from "lucide-react";
import { uploadFile, uploadCroppedImage } from "@/app/actions/upload";
import { updateProductDetails } from "@/app/actions/product";
import { scrapeSiemensProduct } from "@/app/actions/scraper";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProductImageCropper } from "./ProductImageCropper";
import { toast } from "sonner";

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
        indentTime: string;
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
    const [indentTime, setIndentTime] = useState(product.indentTime || "12 - 16 Minggu");
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
            const result = await uploadFile(formData, false, type === "image" ? "products" : "files");
            if (result.success && result.url) {
                if (type === "image") setImage(result.url);
                else setDatasheet(result.url);
            } else {
                toast.error("Upload failed");
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
                indentTime,
            });

            if (result.success) {
                toast.success("Perubahan disimpan");
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                toast.error("Gagal menyimpan perubahan");
            }
        });
    };

    const handleScrape = async () => {
        if (!confirm("Ini akan menimpa Deskripsi dan Spesifikasi yang ada. Lanjutkan?")) return;

        setIsScraping(true);
        try {
            const result = await scrapeSiemensProduct(product.sku);
            if (result.success && result.data) {
                if (result.data.description) setDescription(result.data.description);
                if (result.data.image && !image) {
                    setImage(result.data.image);
                    setImageInputType("url");
                }
                if (result.data.specifications) {
                    const newSpecs = Object.entries(result.data.specifications).map(([key, value]) => ({
                        key,
                        value: String(value)
                    }));
                    if (newSpecs.length > 0) setSpecs(newSpecs);
                }
                toast.success("Data ditarik dari Siemens");
            } else {
                toast.error(result.error || "Gagal menarik data");
            }
        } catch (error) {
            toast.error("Kesalahan teknis scraping");
        } finally {
            setIsScraping(false);
        }
    };

    useEffect(() => {
        if (image && image.startsWith("http") && !image.includes("blob:")) {
            if (imageInputType !== "url") setImageInputType("url");
        }
    }, [image]);

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 custom-scrollbar">
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleScrape}
                    disabled={isScraping || isPending}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-xs"
                >
                    {isScraping ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                    Auto-Fill dari Siemens
                </Button>
            </div>

            {/* Image Upload / URL Input */}
            <div className="space-y-4 rounded-3xl border border-slate-100 p-6 bg-slate-50/50 shadow-sm">
                <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-700">Gambar Utama Produk</Label>
                    <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setImageInputType("upload")}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${imageInputType === "upload" ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-400"}`}
                        >
                            Upload & Crop
                        </button>
                        <button
                            type="button"
                            onClick={() => setImageInputType("url")}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${imageInputType === "url" ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-400"}`}
                        >
                            Link URL
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative w-full md:w-48 aspect-square bg-white rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 shadow-md">
                        {image ? (
                            <Image src={image} alt="Preview" fill className="object-contain p-2" />
                        ) : (
                            <div className="flex flex-col items-center text-slate-300">
                                <Package className="h-10 w-10 mb-2 opacity-20" />
                                <span className="text-[9px] font-black uppercase tracking-widest">No Image</span>
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

                    <div className="flex-1 space-y-4">
                        {imageInputType === "upload" ? (
                            <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                                <ProductImageCropper 
                                    onImageUploaded={(url) => {
                                        setImage(url);
                                    }}
                                />
                                <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic text-center">Gunakan foto persegi (1:1) agar terlihat pas di katalog.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in slide-in-from-right-2 duration-300">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Image URL Link</Label>
                                <Input
                                    type="text"
                                    placeholder="https://example.com/image.jpg"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    disabled={isPending}
                                    className="h-11 rounded-xl border-slate-200 bg-white font-mono text-[10px]"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Description (Rich Text) */}
            <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-700">Deskripsi Ringkas</Label>
                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <ReactQuill
                        theme="snow"
                        value={description}
                        onChange={setDescription}
                        className="bg-white"
                    />
                </div>
            </div>

            {/* Indent Time */}
            <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-700">Waktu Indent</Label>
                <p className="text-[9px] text-slate-400 font-medium leading-relaxed">Kosongkan jika produk ready stock, atau isi dengan estimasi waktu (misal: "2 - 3 Minggu" atau "1 Bulan")</p>
                <Input
                    type="text"
                    placeholder="Contoh: 12 - 16 Minggu"
                    value={indentTime}
                    onChange={(e) => setIndentTime(e.target.value)}
                    disabled={isPending}
                    className="h-11 rounded-xl border-slate-200 bg-white text-xs font-bold"
                />
            </div>

            {/* Specifications */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-700">Spesifikasi Teknis</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSpecRow} className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider">
                        <Plus className="h-3 w-3 mr-1.5 text-teal-600" /> Tambah Detail
                    </Button>
                </div>
                <div className="space-y-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                    {specs.length === 0 && <p className="text-[10px] text-slate-400 text-center font-bold uppercase py-4">Belum ada spesifikasi</p>}
                    {specs.map((spec, index) => (
                        <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <Input
                                placeholder="Parameter"
                                value={spec.key}
                                onChange={(e) => updateSpec(index, "key", e.target.value)}
                                className="flex-1 h-10 rounded-xl border-slate-200 bg-white text-xs font-bold"
                            />
                            <Input
                                placeholder="Nilai"
                                value={spec.value}
                                onChange={(e) => updateSpec(index, "value", e.target.value)}
                                className="flex-1 h-10 rounded-xl border-slate-200 bg-white text-xs font-medium"
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecRow(index)} className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Datasheet Upload */}
            <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-700">Datasheet (PDF)</Label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <Input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, "datasheet")} disabled={isPending} className="h-11 rounded-xl border-slate-200 bg-white file:font-black file:text-[10px] file:uppercase file:tracking-widest file:bg-slate-900 file:text-white file:border-none file:rounded-lg file:mr-4 file:px-4 cursor-pointer" />
                    {datasheet && (
                        <div className="flex items-center gap-3 bg-teal-50 text-teal-700 px-4 py-2.5 rounded-xl border border-teal-100 text-xs font-bold shadow-sm">
                            <FileText className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">File Siap</span>
                            <button onClick={() => setDatasheet("")} className="ml-2 p-1 hover:bg-teal-100 rounded-full transition-colors text-red-500"><X className="h-3.5 w-3.5" /></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-6 border-t border-slate-100">
                <Button onClick={handleSubmit} disabled={isPending} className="w-full sm:w-auto h-12 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Simpan Perubahan Produk
                </Button>
            </div>
        </div>
    );
}
