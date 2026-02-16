"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Save, XCircle } from "lucide-react";
import { updateProductDetails } from "@/app/actions/product";

import { useRouter } from "next/navigation";

interface EditableBrandSectionProps {
    productId: string;
    sku: string;
    initialBrand: string | null;
}

export function EditableBrandSection({ productId, sku, initialBrand }: EditableBrandSectionProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [brand, setBrand] = useState(initialBrand || "");
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        setBrand(initialBrand || "");
        setIsEditing(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { brand });
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
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">{initialBrand || "-"}</span>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Masukkan nama brand"
                    disabled={isPending}
                />
            </div>

            <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs">
                    {isPending ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : <Save className="mr-2 h-3 w-3" />}
                    Simpan
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending} className="h-7 text-xs">
                    Batal
                </Button>
            </div>
        </div>
    );
}
