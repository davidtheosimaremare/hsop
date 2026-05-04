"use client";

import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/useCart";
import { getProductSlug } from "@/lib/utils";
import { usePricing } from "@/lib/PricingContext";

interface Product {
    id: number;
    name: string;
    sku: string;
    brand: string | null;
    price: number;
    image: string | null;
    availableToSell: number;
    category?: string | null;
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const { getPriceInfo } = usePricing();
    const [isAdded, setIsAdded] = useState(false);

    const priceInfo = getPriceInfo(product.price, product.category || null, product.availableToSell);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(Math.round(price));
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addItem({
            id: product.id,
            sku: product.sku,
            name: product.name,
            brand: product.brand || '',
            price: priceInfo.discountedPriceWithPPN,
            originalPrice: priceInfo.originalPriceWithPPN,
            image: product.image,
            availableToSell: product.availableToSell,
            discountStr: priceInfo.discountStr,
            isCustomerDiscount: priceInfo.isCustomerDiscount
        }, 1);

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full shadow-sm min-h-0">
            {/* Product Image - Flexible */}
            <Link prefetch={false}  href={`/produk/${getProductSlug(product as any)}`} className="block relative flex-1 min-h-0">
                <div className="h-full w-full bg-white relative p-4 group-hover:bg-gray-50/50 transition-colors">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, 200px"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="w-3/4 h-3/4 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px] uppercase tracking-widest">
                                No Image
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            {/* Product Info - Compact & Non-stretching */}
            <div className="p-2 md:p-3 flex flex-col bg-white shrink-0">
                <Link prefetch={false}  href={`/produk/${getProductSlug(product as any)}`} className="block mb-1">
                    <h3 className="text-[11px] md:text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-red-600 transition-colors leading-tight min-h-[2.5em]" title={product.name}>
                        {product.name}
                    </h3>
                </Link>
                <p className="text-[9px] text-gray-400 mb-2 font-medium tracking-tight">SKU: {product.sku}</p>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                            {priceInfo.hasDiscount ? (
                                <>
                                    {priceInfo.isCustomerDiscount && (
                                        <p className="text-[9px] text-gray-400 line-through">
                                            Rp {formatPrice(priceInfo.originalPriceWithPPN)}
                                        </p>
                                    )}
                                    <p className="text-[13px] font-black text-red-600 tracking-tighter">
                                        Rp {formatPrice(priceInfo.discountedPriceWithPPN)}
                                    </p>
                                </>
                            ) : (
                                <p className="text-[13px] font-black text-red-600 tracking-tighter">
                                    Rp {formatPrice(priceInfo.originalPriceWithPPN)}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isAdded
                                ? 'bg-green-500 text-white'
                                : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                }`}
                            title="Tambah ke Keranjang"
                        >
                            {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </button>
                    </div>

                    {/* Stock Badge - Extra Mini */}
                    <div className="flex flex-wrap gap-1">
                        {product.availableToSell > 0 ? (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter border ${
                                product.availableToSell > 5 
                                ? 'bg-green-50 text-green-600 border-green-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                                Ready: {product.availableToSell}
                            </span>
                        ) : (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter bg-red-50 text-red-600 border border-red-100">
                                Indent
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
