"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startProgress } from "@/components/layout/NavigationProgress";

interface Category {
    id: string;
    name: string;
    children: Category[];
}

interface Brand {
    name: string;
    count: number;
}

interface SidebarFilterProps {
    categories: Category[];
    brands: Brand[];
}

export default function SidebarFilter({ categories, brands }: SidebarFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category");
    const currentBrand = searchParams.get("brand");

    // Auto-expand if current category matches a child
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const updateParams = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null) {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        params.set("page", "1"); // Reset to page 1

        startProgress();
        router.push(`/pencarian?${params.toString()}`);
    };

    const handleCategoryClick = (categoryName: string) => {
        if (currentCategory === categoryName) {
            updateParams("category", null);
        } else {
            updateParams("category", categoryName);
        }
    };

    const handleBrandClick = (brandName: string) => {
        if (currentBrand === brandName) {
            updateParams("brand", null);
        } else {
            updateParams("brand", brandName);
        }
    };

    return (
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-36 self-start max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-6">

                {/* Categories Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            Kategori
                        </h2>
                        {(currentCategory || currentBrand) && (
                            <button
                                onClick={() => router.push("/pencarian")}
                                className="text-xs text-teal-600 hover:underline"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="space-y-1">
                        {categories.map((category) => (
                            <div key={category.id}>
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => handleCategoryClick(category.name)}
                                        className={`flex-1 text-left py-2 px-2 rounded-lg text-sm transition-colors ${currentCategory === category.name
                                            ? "text-red-600 bg-red-50 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                    {category.children && category.children.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedCategory(
                                                    expandedCategory === category.id ? null : category.id
                                                );
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-600"
                                        >
                                            {expandedCategory === category.id ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Subcategories */}
                                {expandedCategory === category.id && category.children && category.children.length > 0 && (
                                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                                        {category.children.map((sub) => (
                                            <button
                                                key={sub.id}
                                                onClick={() => handleCategoryClick(sub.name)}
                                                className={`block py-1.5 text-xs w-full text-left transition-colors ${currentCategory === sub.name
                                                    ? "text-red-600 font-medium"
                                                    : "text-gray-600 hover:text-red-600"
                                                    }`}
                                            >
                                                {sub.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {categories.length === 0 && (
                            <p className="text-sm text-gray-400 p-2">Tidak ada kategori</p>
                        )}
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Brands Section */}
                <div>
                    <h2 className="font-semibold text-gray-900 mb-3">Brand</h2>
                    <div className="space-y-2">
                        {brands.map((brand) => (
                            <label key={brand.name} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${currentBrand === brand.name
                                        ? "bg-red-600 border-red-600"
                                        : "border-gray-300 group-hover:border-red-400"
                                        }`}>
                                        {currentBrand === brand.name && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={currentBrand === brand.name}
                                        onChange={() => handleBrandClick(brand.name)}
                                    />
                                    <span className={`text-sm ${currentBrand === brand.name ? "text-red-600 font-medium" : "text-gray-700"
                                        }`}>
                                        {brand.name}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                    {brand.count}
                                </span>
                            </label>
                        ))}

                        {brands.length === 0 && (
                            <p className="text-xs text-gray-400">Tidak ada brand</p>
                        )}
                    </div>
                </div>

            </div>
        </aside>
    );
}
