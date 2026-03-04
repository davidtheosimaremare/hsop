"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Save, XCircle } from "lucide-react";
import { updateProductDetails } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";

interface EditableLongDescriptionSectionProps {
    productId: string;
    initialDescription: string | null;
}

export function EditableLongDescriptionSection({ productId, initialDescription }: EditableLongDescriptionSectionProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(initialDescription || "");
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        setDescription(initialDescription || "");
        setIsEditing(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { longDescription: description });
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
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isPending} className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md font-bold text-[10px] uppercase tracking-widest px-3">
                        <Pencil className="h-3 w-3 mr-1.5 text-slate-400" /> Edit Deskripsi Panjang
                    </Button>
                </div>

                <div className="prose prose-sm max-w-none p-4 pt-1 rich-text-editor-content border rounded-lg min-h-[100px] bg-white text-slate-700">
                    {initialDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: initialDescription }} />
                    ) : (
                        <p className="text-gray-400 italic">Tidak ada deskripsi panjang. Klik Edit untuk menambahkan teks, gambar, atau video.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold text-slate-800">Edit Deskripsi Panjang</Label>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isPending} size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 text-[10px] uppercase font-bold tracking-widest px-3">
                        {isPending ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : <Save className="mr-2 h-3 w-3" />}
                        Simpan
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending} className="h-8">
                        Batal
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-md shadow-sm border border-slate-200">
                <RichTextEditor
                    content={description}
                    onChange={setDescription}
                    placeholder="Tulis deskripsi produk lengkap di sini..."
                />
            </div>
        </div>
    );
}
