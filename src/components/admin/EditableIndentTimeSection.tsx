"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Save } from "lucide-react";
import { updateProductDetails } from "@/app/actions/product";

import { useRouter } from "next/navigation";

interface EditableIndentTimeSectionProps {
    productId: string;
    initialIndentTime: string | null;
}

export function EditableIndentTimeSection({ productId, initialIndentTime }: EditableIndentTimeSectionProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [indentTime, setIndentTime] = useState(initialIndentTime || "12 - 16 Minggu");
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        setIndentTime(initialIndentTime || "12 - 16 Minggu");
        setIsEditing(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateProductDetails(productId, { indentTime });
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
                    <span className="font-medium text-lg">{initialIndentTime || "12 - 16 Minggu"}</span>
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
                    value={indentTime}
                    onChange={(e) => setIndentTime(e.target.value)}
                    placeholder="Contoh: 1 Bulan, 2-3 Minggu..."
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
