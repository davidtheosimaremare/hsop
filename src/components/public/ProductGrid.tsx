"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import ViewToggle, { ViewMode } from "./ViewToggle";
import ProductCard from "./ProductCard";
import ProductListItem from "./ProductListItem";

const VIEW_MODE_COOKIE = "hsop-product-view";

interface ProductGridProps {
    products: any[];
}

export default function ProductGrid({ products }: ProductGridProps) {
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
            {/* View Toggle */}
            <div className="flex justify-end mb-3">
                <ViewToggle viewMode={viewMode} onViewChange={handleViewChange} />
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
