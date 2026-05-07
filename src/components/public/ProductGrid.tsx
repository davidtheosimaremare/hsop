"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import ViewToggle, { ViewMode } from "./ViewToggle";
import ProductCard from "./ProductCard";
import ProductListItem from "./ProductListItem";
import StockFilter from "./StockFilter";
import ProductSort from "./ProductSort";

const VIEW_MODE_COOKIE = "hsop-product-view";

interface ProductGridProps {
    products: any[];
    total?: number;
    activeFiltersNode?: React.ReactNode;
}

export default function ProductGrid({ products, total, activeFiltersNode }: ProductGridProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = Cookies.get(VIEW_MODE_COOKIE) as ViewMode;
        if (saved === "grid" || saved === "list") {
            setViewMode(saved);
        }
        setMounted(true);
    }, []);

    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode);
        Cookies.set(VIEW_MODE_COOKIE, mode, { expires: 365 });
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="space-y-3 mb-5">
                {activeFiltersNode}

                {/* Premium Unified Filter & View Controls Bar */}
                {total !== undefined && (
                    <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full" />
                            <p className="text-xs text-[#475569] font-medium">
                                Menampilkan <span className="text-[#0f172a] font-bold">{products.length}</span> dari <span className="text-[#0f172a] font-bold">{total}</span> produk unggulan pilihan
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <StockFilter />
                            <ProductSort />
                            <div className="hidden sm:block w-[1px] h-6 bg-slate-200 mx-1" />
                            <ViewToggle viewMode={viewMode} onViewChange={handleViewChange} />
                        </div>
                    </div>
                )}
            </div>

            {/* Products */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {products.map((product) => (
                        <ProductListItem key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
