"use client";

import { useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Percent } from "lucide-react";
import { updateProductDiscountCategory } from "@/app/actions/product";
import { useRouter } from "next/navigation";

interface EditableDiscountCategoryProps {
    productId: string;
    initialCategory: string | null;
}

const DISCOUNT_CATEGORIES = [
    { value: "LP", label: "Siemens LP (Low Voltage)", color: "bg-yellow-100 text-yellow-700" },
    { value: "CP", label: "Siemens CP (Control Product)", color: "bg-blue-100 text-blue-700" },
    { value: "LIGHTING", label: "Portable Lighting", color: "bg-orange-100 text-orange-700" },
];

export function EditableDiscountCategorySection({ productId, initialCategory }: EditableDiscountCategoryProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const currentCategory = DISCOUNT_CATEGORIES.find(c => c.value === initialCategory);

    const handleChange = (value: string) => {
        const newValue = value === "none" ? null : value;
        startTransition(async () => {
            await updateProductDiscountCategory(productId, newValue);
            router.refresh();
        });
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Percent className="h-4 w-4" /> Kategori Diskon
                </div>
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            <Select
                value={initialCategory || "none"}
                onValueChange={handleChange}
                disabled={isPending}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori diskon..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">
                        <span className="text-gray-500">Tidak ada kategori</span>
                    </SelectItem>
                    {DISCOUNT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${cat.color}`}>
                                {cat.label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {currentCategory && (
                <p className="text-xs text-gray-500">
                    Diskon untuk kategori ini akan diterapkan sesuai pengaturan di profil customer.
                </p>
            )}
        </div>
    );
}
