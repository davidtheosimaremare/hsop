"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, ExternalLink, Package } from "lucide-react";
import { useCart } from "@/lib/useCart";

export interface ChatProduct {
    id: string;
    name: string;
    sku: string;
    brand: string | null;
    image: string | null;
    availableToSell: number;
    stockStatus: "Ready" | "Indent";
    indentTime?: string | null;
    unitPrice?: number;
    finalPrice?: number;
    totalPrice?: number;
    hasDiscount?: boolean;
    discountStr?: string;
    priceDisplay?: string;
    unitPriceDisplay?: string;
    originalPriceDisplay?: string | null;
    totalPriceDisplay?: string;
    productUrl: string;
    // For BOM items
    qty?: number;
    requestedSku?: string;
}

interface ChatProductCardProps {
    product: ChatProduct;
    showQty?: boolean;
    className?: string;
}

export default function ChatProductCard({ product, showQty = false, className = "" }: ChatProductCardProps) {
    const { addItem } = useCart();
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const qty = product.qty || 1;
        addItem(
            {
                id: product.id,
                sku: product.sku,
                name: product.name,
                brand: product.brand || "",
                price: product.unitPrice || product.finalPrice || 0,
                image: product.image,
                availableToSell: product.availableToSell,
            },
            qty
        );

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    const displayPrice = product.priceDisplay || product.unitPriceDisplay;

    return (
        <div
            className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
        >
            <div className="flex items-start gap-3 p-3">
                {/* Product Image */}
                <Link href={product.productUrl} className="flex-shrink-0" target="_blank" prefetch={false}>
                    <div className="w-16 h-16 bg-gray-50 rounded-lg relative overflow-hidden border border-gray-100">
                        {product.image ? (
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-contain p-1"
                                sizes="64px"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-300" />
                            </div>
                        )}
                    </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    {/* Name */}
                    <Link href={product.productUrl} target="_blank" prefetch={false}>
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 hover:text-red-600 transition-colors leading-tight">
                            {product.name}
                        </p>
                    </Link>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{product.sku}</p>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {product.stockStatus === "Ready" ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-medium">
                                ● Ready
                            </span>
                        ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                                ⏱ Indent {product.indentTime ? `(${product.indentTime})` : ""}
                            </span>
                        )}
                        {product.hasDiscount && product.discountStr && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">
                                Diskon {product.discountStr}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Price + Action Row */}
            <div className="flex items-center justify-between px-3 pb-3 gap-2">
                <div className="min-w-0">
                    {/* Qty (for BOM mode) */}
                    {showQty && product.qty && (
                        <p className="text-[10px] text-gray-500">
                            {product.qty} unit × {product.unitPriceDisplay || displayPrice}
                        </p>
                    )}
                    {/* Original price (strikethrough if discounted) */}
                    {product.hasDiscount && product.originalPriceDisplay && (
                        <p className="text-[10px] text-gray-400 line-through">
                            {product.originalPriceDisplay}
                        </p>
                    )}
                    {/* Final price */}
                    {displayPrice ? (
                        <p className="text-sm font-bold text-red-600">
                            {showQty && product.totalPriceDisplay ? product.totalPriceDisplay : displayPrice}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 italic">Hubungi kami</p>
                    )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Detail link */}
                    <Link
                        href={product.productUrl}
                        target="_blank"
                        prefetch={false}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                        title="Lihat Detail"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {/* Add to cart */}
                    <button
                        onClick={handleAddToCart}
                        className={`h-7 px-2.5 rounded-full flex items-center gap-1 text-[11px] font-semibold transition-all duration-200 ${
                            isAdded
                                ? "bg-green-500 text-white"
                                : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                        title="Tambah ke Keranjang"
                    >
                        {isAdded ? (
                            <>
                                <Check className="w-3 h-3" />
                                <span>Added</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-3 h-3" />
                                <span>Cart</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
