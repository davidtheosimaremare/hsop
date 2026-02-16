"use client";

import { useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCategoryMapping } from "@/app/actions/category-mapping";
import { Loader2, Save, Search, Plug2, CircuitBoard, Flashlight, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CategoryData {
    categoryName: string;
    discountType: string | null;
}

interface CategoryMappingFormProps {
    categories: CategoryData[];
}

const DISCOUNT_TYPES = [
    { value: "LP", label: "Siemens LP", icon: Plug2, color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { value: "CP", label: "Siemens CP", icon: CircuitBoard, color: "bg-blue-100 text-blue-700 border-blue-300" },
    { value: "LIGHTING", label: "Portable Lighting", icon: Flashlight, color: "bg-orange-100 text-orange-700 border-orange-300" },
];

export function CategoryMappingForm({ categories }: CategoryMappingFormProps) {
    const [search, setSearch] = useState("");
    const [pendingCategory, setPendingCategory] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const filteredCategories = categories.filter(c =>
        c.categoryName.toLowerCase().includes(search.toLowerCase())
    );

    const handleChange = (categoryName: string, discountType: string) => {
        setPendingCategory(categoryName);
        const newValue = discountType === "none" ? null : discountType;
        startTransition(async () => {
            await updateCategoryMapping(categoryName, newValue);
            setPendingCategory(null);
            router.refresh();
        });
    };

    const getDiscountBadge = (discountType: string | null) => {
        if (!discountType) return null;
        const type = DISCOUNT_TYPES.find(t => t.value === discountType);
        if (!type) return null;
        const Icon = type.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${type.color}`}>
                <Icon className="h-3 w-3" />
                {type.label}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Cari kategori..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Category List */}
            <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
                {filteredCategories.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Tidak ada kategori ditemukan
                    </div>
                ) : (
                    filteredCategories.map((cat) => (
                        <div
                            key={cat.categoryName}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">{cat.categoryName}</span>
                                {cat.discountType && getDiscountBadge(cat.discountType)}
                            </div>
                            <div className="flex items-center gap-2">
                                {pendingCategory === cat.categoryName && (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                )}
                                <Select
                                    value={cat.discountType || "none"}
                                    onValueChange={(value) => handleChange(cat.categoryName, value)}
                                    disabled={isPending && pendingCategory === cat.categoryName}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Pilih tipe..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            <span className="text-gray-500">— Tidak ada —</span>
                                        </SelectItem>
                                        {DISCOUNT_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <span className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        {type.label}
                                                    </span>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <p className="text-sm text-gray-500">
                Total: {filteredCategories.length} kategori {search && `(dari ${categories.length})`}
            </p>
        </div>
    );
}
