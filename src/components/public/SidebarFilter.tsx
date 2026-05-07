"use client";

import { useState, useTransition } from "react";
import { ChevronRight, ChevronDown, Zap, CircleDot, Activity, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
    const [isPending, startTransition] = useTransition();

    const hasActiveFilters = currentCategory || currentBrand || currentPole || currentAmpere || currentKA;

    const updateParams = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null) {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        params.set("page", "1"); // Reset to page 1

        startTransition(() => {
            router.push(`/pencarian?${params.toString()}`);
        });
    };

    const handleCategoryClick = (categoryName: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (currentCategory === categoryName) {
            params.delete("category");
        } else {
            params.set("category", categoryName);
        }
        
        // Reset spec filters when category changes to prevent "no data found"
        params.delete("pole");
        params.delete("ampere");
        params.delete("breakingCapacity");
        
        params.set("page", "1"); // Reset to page 1
        startTransition(() => {
            router.push(`/pencarian?${params.toString()}`);
        });
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
        <aside className={`hidden lg:block w-52 flex-shrink-0 sticky top-36 self-start max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar transition-all duration-300 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-5 relative shadow-xs">
                {isPending && (
                    <div className="absolute top-4 right-4 z-10 bg-white/80 rounded-full p-1 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    </div>
                )}

                {/* Categories Section */}
                <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between mb-3 select-none">
                        <span>Kategori</span>
                        {hasActiveFilters && (
                            <button
                                onClick={() => router.push("/pencarian")}
                                className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer select-none"
                            >
                                Reset
                            </button>
                        )}
                    </h2>

                    <div className="space-y-1">
                        {categories.map((category) => (
                            <div key={category.id}>
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => handleCategoryClick(category.name)}
                                        className={`flex-1 text-left py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${currentCategory === category.name
                                            ? "text-red-700 bg-red-50/70 border border-red-100/30"
                                            : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
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
                                            className={`p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 transition-colors ${
                                                expandedCategory === category.id ? "text-red-500" : ""
                                            }`}
                                        >
                                            {expandedCategory === category.id ? (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            ) : (
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Subcategories */}
                                {expandedCategory === category.id && category.children && category.children.length > 0 && (
                                    <div className="ml-3 mt-1.5 space-y-1 border-l border-slate-100 pl-3">
                                        {category.children.map((sub) => (
                                            <button
                                                key={sub.id}
                                                onClick={() => handleCategoryClick(sub.name)}
                                                className={`block py-1 px-1.5 text-xs w-full text-left rounded-lg transition-all duration-200 ${currentCategory === sub.name
                                                    ? "text-red-600 font-bold bg-red-50/40"
                                                    : "text-slate-500 hover:text-red-600 font-medium"
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
                            <p className="text-xs text-slate-400 p-2">Tidak ada kategori</p>
                        )}
                    </div>
                </div>

                <hr className="border-slate-50" />

                {/* Brands Section */}
                <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 select-none">Brand</h2>
                    <div className="space-y-2">
                        {brands.map((brand) => (
                            <label key={brand.name} className="flex items-center justify-between group cursor-pointer py-0.5 select-none">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-all duration-200 ${currentBrand === brand.name
                                        ? "bg-red-600 border-red-600 shadow-sm"
                                        : "border-slate-300 group-hover:border-red-400 bg-white"
                                        }`}>
                                        {currentBrand === brand.name && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={currentBrand === brand.name}
                                        onChange={() => handleBrandClick(brand.name)}
                                    />
                                    <span className={`text-xs transition-colors duration-200 ${currentBrand === brand.name 
                                        ? "text-red-600 font-bold" 
                                        : "text-slate-600 group-hover:text-slate-900 font-semibold"
                                        }`}>
                                        {brand.displayName}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all duration-200 ${
                                    currentBrand === brand.name
                                        ? "bg-red-50 text-red-600 border-red-100/40"
                                        : "bg-slate-50 text-slate-400 border-slate-100"
                                }`}>
                                    {brand.count}
                                </span>
                            </label>
                        ))}

                        {brands.length === 0 && (
                            <p className="text-xs text-slate-400">Tidak ada brand</p>
                        )}
                    </div>
                </div>

                {/* === ELECTRICAL SPEC FILTERS === */}
                {hasSpecs && (
                    <>
                        <hr className="border-slate-50" />
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5 select-none">
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                                Spesifikasi
                            </h2>

                            {/* Pole Filter */}
                            {specFilters!.poles.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
                                        <CircleDot className="w-3 h-3 text-slate-400" />
                                        Kutub (Pole)
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {specFilters!.poles.map((pole) => (
                                            <button
                                                key={pole}
                                                onClick={() => handleSpecClick("pole", pole)}
                                                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all duration-200 ${
                                                    currentPole === pole
                                                        ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/10"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800"
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
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
                                        <Activity className="w-3 h-3 text-slate-400" />
                                        Arus (Ampere)
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {visibleAmperes.map((amp) => (
                                            <button
                                                key={amp}
                                                onClick={() => handleSpecClick("ampere", amp)}
                                                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all duration-200 ${
                                                    currentAmpere === amp
                                                        ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/10"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                                                }`}
                                            >
                                                {amp}
                                            </button>
                                        ))}
                                    </div>
                                    {specFilters!.amperes.length > INITIAL_SHOW && (
                                        <button
                                            onClick={() => setShowAllAmperes(!showAllAmperes)}
                                            className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors mt-2 flex items-center gap-0.5 cursor-pointer"
                                        >
                                            {showAllAmperes ? "Tampilkan lebih sedikit" : `+${specFilters!.amperes.length - INITIAL_SHOW} lainnya`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Breaking Capacity (kA) Filter */}
                            {specFilters!.breakingCapacities.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
                                        <Zap className="w-3 h-3 text-slate-400" />
                                        Breaking Capacity
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {visibleKA.map((ka) => (
                                            <button
                                                key={ka}
                                                onClick={() => handleSpecClick("breakingCapacity", ka)}
                                                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all duration-200 ${
                                                    currentKA === ka
                                                        ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/10"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                                                }`}
                                            >
                                                {ka}
                                            </button>
                                        ))}
                                    </div>
                                    {specFilters!.breakingCapacities.length > INITIAL_SHOW && (
                                        <button
                                            onClick={() => setShowAllKA(!showAllKA)}
                                            className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors mt-2 flex items-center gap-0.5 cursor-pointer"
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
