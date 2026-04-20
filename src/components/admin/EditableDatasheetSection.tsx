"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Download, Upload, X, Save, Pencil, XCircle, Package } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";
import { updateProductDetails } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EditableDatasheetSectionProps {
    productId: string;
    sku: string;
    brand: string | null;
    initialDatasheet: string | null;
}

export function EditableDatasheetSection({ productId, sku, brand, initialDatasheet }: EditableDatasheetSectionProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [datasheet, setDatasheet] = useState(initialDatasheet || "");
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        setDatasheet(initialDatasheet || "");
        setIsEditing(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        startTransition(async () => {
            const result = await uploadFile(formData, false, "files");
            if (result.success && result.url) {
                setDatasheet(result.url);
                toast.success("Datasheet terupload");
            } else {
                toast.error("Upload gagal");
            }
        });
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { datasheet });
            if (result.success) {
                setIsEditing(false);
                router.refresh();
                toast.success("Datasheet disimpan");
            } else {
                toast.error("Gagal menyimpan");
            }
        });
    };

    if (!isEditing) {
        const isSiemens = brand?.toUpperCase() === "SIEMENS";
        const siemensUrl = `https://mall.industry.siemens.com/teddatasheet/?format=PDF&mlfbs=${sku}&language=en&caller=SiePortal`;

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-t-2xl border-b border-slate-100">
                    <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-700">
                        <FileText className="h-4 w-4 text-teal-600" /> Datasheet Product
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 rounded-lg font-bold text-[10px] uppercase tracking-wider">
                        <Pencil className="h-3 w-3 mr-1.5 text-teal-600" /> Edit
                    </Button>
                </div>

                <div className="p-4 pt-2">
                    {initialDatasheet || isSiemens ? (
                        <Button className="w-full mb-3 h-10 rounded-xl font-bold text-xs shadow-sm" variant="outline" asChild>
                            <a
                                href={initialDatasheet || siemensUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Download className="mr-2 h-4 w-4 text-teal-600" />
                                {initialDatasheet ? "Download Datasheet" : "Download from Siemens"}
                            </a>
                        </Button>
                    ) : (
                        <div className="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-3">
                            <Package className="h-8 w-8 text-slate-200 mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada datasheet</p>
                        </div>
                    )}
                    
                    <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed italic">
                        {initialDatasheet
                            ? "File datasheet manual telah diunggah."
                            : isSiemens 
                                ? <>Dokumen ditarik otomatis dari Siemens Industry Mall berdasarkan kode barang: <strong>{sku}</strong></>
                                : "Silakan unggah file PDF datasheet untuk produk ini melalui tombol Edit."
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-3xl border border-slate-100 p-6 bg-slate-50/50 shadow-sm">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-black uppercase tracking-widest text-slate-700">Edit Datasheet</Label>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleCancel} disabled={isPending}>
                    <XCircle className="h-5 w-5 text-slate-400" />
                </Button>
            </div>

            <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload PDF Baru</Label>
                <div className="flex flex-col gap-3">
                    <Input type="file" accept=".pdf" onChange={handleFileUpload} disabled={isPending} className="h-11 rounded-xl border-slate-200 bg-white" />
                    {datasheet && (
                        <div className="flex items-center gap-3 bg-teal-50 text-teal-700 px-4 py-2 rounded-xl border border-teal-100 text-xs font-bold shadow-sm">
                            <FileText className="h-4 w-4" />
                            <span className="truncate max-w-[150px]">File Siap</span>
                            <button type="button" onClick={() => setDatasheet("")} className="ml-auto p-1 hover:bg-teal-100 rounded-full transition-colors text-red-500">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-slate-400 italic">
                    Note: Mengunggah file baru akan menimpa link otomatis Siemens (jika ada).
                </p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button onClick={handleSave} disabled={isPending || !datasheet} className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Datasheet
                </Button>
                <Button variant="outline" className="h-11 px-6 rounded-xl font-bold text-slate-500" onClick={handleCancel} disabled={isPending}>
                    Batal
                </Button>
            </div>
        </div>
    );
}
