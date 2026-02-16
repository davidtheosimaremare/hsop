"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Download, Upload, X, Save, Pencil, XCircle } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";
import { updateProductDetails } from "@/app/actions/product";
import { useRouter } from "next/navigation";

interface EditableDatasheetSectionProps {
    productId: string;
    sku: string;
    initialDatasheet: string | null;
}

export function EditableDatasheetSection({ productId, sku, initialDatasheet }: EditableDatasheetSectionProps) {
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
            // Reusing the general uploadFile action which handles PDF/Images
            const result = await uploadFile(formData);
            if (result.success && result.url) {
                setDatasheet(result.url);
            } else {
                alert("Upload failed");
            }
        });
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { datasheet });
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
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-t-lg border-b">
                    <span className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Datasheet Resmi
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                </div>

                <div className="p-4 pt-0">
                    <Button className="w-full mb-2" variant="outline" asChild>
                        <a
                            href={initialDatasheet || `https://mall.industry.siemens.com/teddatasheet/?format=PDF&mlfbs=${sku}&language=en&caller=SiePortal`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {initialDatasheet ? "Download Uploaded Datasheet" : "Download from Siemens"}
                        </a>
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                        {initialDatasheet
                            ? "File datasheet manual telah diupload."
                            : <>Dokumen diambil langsung dari Siemens Industry Mall berdasarkan kode barang: <strong>{sku}</strong></>
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Edit Datasheet</Label>
                <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isPending}>
                    <XCircle className="h-4 w-4 text-gray-500" />
                </Button>
            </div>

            <div className="space-y-2">
                <Label>Upload PDF Baru</Label>
                <div className="flex gap-2 items-center">
                    <Input type="file" accept=".pdf" onChange={handleFileUpload} disabled={isPending} className="flex-1 bg-white" />
                    {datasheet && (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-md border border-blue-200 text-sm">
                            <FileText className="h-4 w-4" />
                            <span className="truncate max-w-[100px]">File Ready</span>
                            <button type="button" onClick={() => setDatasheet("")} className="ml-2 hover:text-red-600"><X className="h-3 w-3" /></button>
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500">
                    Warning: Mengupload file baru akan menggantikan link default Siemens.
                </p>
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
