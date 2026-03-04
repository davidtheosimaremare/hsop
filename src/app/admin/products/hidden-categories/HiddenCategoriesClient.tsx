"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, EyeOff, Loader2 } from "lucide-react";
import { toggleCategoryVisibility } from "@/app/actions/category-visibility";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CategoryItem = {
    id: string;
    name: string;
    isVisible: boolean;
    productCount: number;
};

export default function HiddenCategoriesClient({ initialCategories }: { initialCategories: CategoryItem[] }) {
    const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleToggle = (categoryId: string, currentVisibility: boolean) => {
        const newVisibility = !currentVisibility;

        // Optimistic update
        setCategories(prev => prev.map(c =>
            c.id === categoryId ? { ...c, isVisible: newVisibility } : c
        ));

        startTransition(async () => {
            const result = await toggleCategoryVisibility(categoryId, newVisibility);
            if (result.success) {
                toast.success(result.message);
            } else {
                // Revert on failure
                setCategories(prev => prev.map(c =>
                    c.id === categoryId ? { ...c, isVisible: currentVisibility } : c
                ));
                toast.error(result.message);
            }
        });
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Card className="border-none bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="border-b border-slate-50 p-5">
                <div className="relative group max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                    <Input
                        placeholder="Cari kategori..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-transparent focus:bg-white focus:ring-red-600/20 focus:border-red-600 rounded-xl transition-all font-medium"
                    />
                </div>
            </div>

            <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                    {filteredCategories.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            Tidak ada kategori yang ditemukan.
                        </div>
                    ) : (
                        filteredCategories.map((category) => (
                            <div
                                key={category.id}
                                className={cn(
                                    "flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 transition-colors",
                                    !category.isVisible ? "bg-red-50/50" : "hover:bg-slate-50/50"
                                )}
                            >
                                <div>
                                    <h3 className={cn(
                                        "font-bold text-base transition-colors",
                                        !category.isVisible ? "text-slate-500 line-through" : "text-slate-800"
                                    )}>
                                        {category.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">
                                        {category.productCount} Produk terhubung
                                    </p>
                                </div>

                                <Button
                                    onClick={() => handleToggle(category.id, category.isVisible)}
                                    disabled={isPending}
                                    variant={category.isVisible ? "outline" : "default"}
                                    className={cn(
                                        "rounded-xl h-10 px-5 font-bold transition-all min-w-[140px]",
                                        category.isVisible
                                            ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                            : "bg-slate-800 hover:bg-slate-900 text-white"
                                    )}
                                >
                                    {isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin -ml-1 mr-2" />
                                    ) : category.isVisible ? (
                                        <EyeOff className="w-4 h-4 -ml-1 mr-2" />
                                    ) : (
                                        <Eye className="w-4 h-4 -ml-1 mr-2 text-green-400" />
                                    )}
                                    {category.isVisible ? "Sembunyikan" : "Tampilkan"}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
