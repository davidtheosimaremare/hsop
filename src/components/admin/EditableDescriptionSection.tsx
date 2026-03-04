"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Save, XCircle, Download } from "lucide-react";
import { updateProductDetails } from "@/app/actions/product";
import { scrapeSiemensProduct } from "@/app/actions/scraper";
import { useRouter } from "next/navigation";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface EditableDescriptionSectionProps {
    productId: string;
    sku?: string;
    initialDescription: string | null;
}

export function EditableDescriptionSection({ productId, sku, initialDescription }: EditableDescriptionSectionProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const [description, setDescription] = useState(initialDescription || "");
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        setDescription(initialDescription || "");
        setIsEditing(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { description });
            if (result.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert("Failed to save changes");
            }
        });
    };

    if (!isEditing) {
        return (
            <div className="space-y-4">
                <div className="flex justify-end items-center gap-2 p-2 rounded-t-lg">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            if (!sku) return alert("SKU tidak tersedia");
                            setIsScraping(true);
                            try {
                                const res = await scrapeSiemensProduct(sku);
                                const newDesc = res.data?.description;
                                if (res.success && newDesc) {
                                    startTransition(async () => {
                                        const updateRes = await updateProductDetails(productId, { description: newDesc });
                                        if (updateRes.success) {
                                            router.refresh();
                                        } else {
                                            alert("Gagal menyimpan deskripsi.");
                                        }
                                    });
                                } else {
                                    alert(res.error || "Deskripsi tidak ditemukan di Sieportal.");
                                }
                            } catch (error) {
                                console.error(error);
                                alert("Terjadi kesalahan.");
                            } finally {
                                setIsScraping(false);
                            }
                        }}
                        disabled={isScraping || isPending}
                        className="h-8 border-red-50 text-red-600 hover:bg-red-50 hover:border-red-100 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all px-3"
                    >
                        {isScraping ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Download className="h-3 w-3 mr-1.5" />}
                        Tarik dari Sieportal
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isScraping || isPending} className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md font-bold text-[10px] uppercase tracking-widest px-3">
                        <Pencil className="h-3 w-3 mr-1.5 text-slate-400" /> Update Manual
                    </Button>
                </div>

                <div className="prose prose-sm max-w-none p-4 pt-1">
                    {initialDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: initialDescription }} />
                    ) : (
                        <p className="text-gray-400 italic">Tidak ada deskripsi.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Edit Deskripsi</Label>
                <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isPending}>
                    <XCircle className="h-4 w-4 text-gray-500" />
                </Button>
            </div>

            <div className="bg-white rounded-md">
                <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    className="bg-white min-h-[200px]"
                />
            </div>

            <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Perubahan
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isPending}>
                    Batal
                </Button>
            </div>
        </div>
    );
}
