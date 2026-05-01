"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Zap, CircleDot, Activity } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
interface Category {
    id: string;
    name: string;
    alias: string | null;
    children: Category[];
}

interface Category {
    id: string;
    name: string;
    alias: string | null;
    children: Category[];
}

interface Brand {
    name: string;
    displayName: string;
    count: number;
}

interface SpecFilters {
    poles: string[];
    amperes: string[];
    breakingCapacities: string[];
}

interface SidebarFilterProps {
    categories: Category[];
    brands: Brand[];
    specFilters?: SpecFilters;
}

export default function SidebarFilter({ categories, brands, specFilters }: SidebarFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category");
    const currentBrand = searchParams.get("brand");
    const currentPole = searchParams.get("pole");
    const currentAmpere = searchParams.get("ampere");
    const currentKA = searchParams.get("breakingCapacity");

    // Auto-expand if current category matches a child
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [showAllAmperes, setShowAllAmperes] = useState(false);
    const [showAllKA, setShowAllKA] = useState(false);

    const hasActiveFilters = currentCategory || currentBrand || currentPole || currentAmpere || currentKA;

    const updateParams = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null) {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        params.set("page", "1"); // Reset to page 1

        router.push(`/pencarian?${params.toString()}`);
    };

    const handleCategoryClick = (categoryName: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentCategory === categoryName) {
            params.delete("category");
        } else {
            params.set("category", categoryName);
        }
        
        // Reset spec filters when category changes to prevent "no data found"
        // when switching between categories with different specs (e.g., MCB to ACB)
        params.delete("pole");
        params.delete("ampere");
        params.delete("breakingCapacity");
        
        params.set("page", "1"); // Reset to page 1
        router.push(`/pencarian?${params.toString()}`);
    };

    const handleBrandClick = (brandName: string) => {
        if (currentBrand === brandName) {
            updateParams("brand", null);
        } else {
            updateParams("brand", brandName);
        }
    };

    const handleSpecClick = (key: string, value: string) => {
        const current = searchParams.get(key);
        if (current === value) {
            updateParams(key, null);
        } else {
            updateParams(key, value);
        }
    };

    const hasSpecs = specFilters && (
        specFilters.poles.length > 0 || 
        specFilters.amperes.length > 0 || 
        specFilters.breakingCapacities.length > 0
    );

    // Limit visible items with "show more"
    const INITIAL_SHOW = 8;
    const visibleAmperes = specFilters?.amperes 
        ? (showAllAmperes ? specFilters.amperes : specFilters.amperes.slice(0, INITIAL_SHOW))
        : [];
    const visibleKA = specFilters?.breakingCapacities
        ? (showAllKA ? specFilters.breakingCapacities : specFilters.breakingCapacities.slice(0, INITIAL_SHOW))
        : [];

    return (
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-36 self-start max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-6">

                {/* Categories Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            Kategori
                        </h2>
                        {hasActiveFilters && (
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
                                        {category.alias || category.name}
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
                                                {sub.alias || sub.name}
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
                                        {brand.displayName}
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

                {/* === ELECTRICAL SPEC FILTERS === */}
                {hasSpecs && (
                    <>
                        <hr className="border-gray-100" />
                        <div>
                            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Spesifikasi
                            </h2>

                            {/* Pole Filter */}
                            {specFilters!.poles.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <CircleDot className="w-3 h-3" />
                                        Kutub (Pole)
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {specFilters!.poles.map((pole) => (
                                            <button
                                                key={pole}
                                                onClick={() => handleSpecClick("pole", pole)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                                                    currentPole === pole
                                                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                                                        : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600"
                                                }`}
                                            >
                                                {pole}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ampere Filter */}
                            {specFilters!.amperes.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Activity className="w-3 h-3" />
                                        Arus (Ampere)
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {visibleAmperes.map((amp) => (
                                            <button
                                                key={amp}
                                                onClick={() => handleSpecClick("ampere", amp)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                                                    currentAmpere === amp
                                                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                                                        : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600"
                                                }`}
                                            >
                                                {amp}
                                            </button>
                                        ))}
                                    </div>
                                    {specFilters!.amperes.length > INITIAL_SHOW && (
                                        <button
                                            onClick={() => setShowAllAmperes(!showAllAmperes)}
                                            className="text-xs text-teal-600 hover:underline mt-2"
                                        >
                                            {showAllAmperes ? "Tampilkan lebih sedikit" : `+${specFilters!.amperes.length - INITIAL_SHOW} lainnya`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Breaking Capacity (kA) Filter */}
                            {specFilters!.breakingCapacities.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Zap className="w-3 h-3" />
                                        Breaking Capacity
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {visibleKA.map((ka) => (
                                            <button
                                                key={ka}
                                                onClick={() => handleSpecClick("breakingCapacity", ka)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                                                    currentKA === ka
                                                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                                                        : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600"
                                                }`}
                                            >
                                                {ka}
                                            </button>
                                        ))}
                                    </div>
                                    {specFilters!.breakingCapacities.length > INITIAL_SHOW && (
                                        <button
                                            onClick={() => setShowAllKA(!showAllKA)}
                                            className="text-xs text-teal-600 hover:underline mt-2"
                                        >
                                            {showAllKA ? "Tampilkan lebih sedikit" : `+${specFilters!.breakingCapacities.length - INITIAL_SHOW} lainnya`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>
        </aside>
    );
}

