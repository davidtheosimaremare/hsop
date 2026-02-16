"use client";

import React, { useState } from "react";
import { Plus, Check, Percent } from "lucide-react";
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

    // Calculate price info from context
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
            price: priceInfo.originalPriceWithPPN,
            originalPrice: undefined,
            image: product.image,
            availableToSell: product.availableToSell
        }, 1);

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            {/* Product Image */}
            <Link href={`/produk/${getProductSlug(product as any)}`} className="block relative">
                <div className="aspect-square bg-gray-100 relative">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3/4 h-3/4 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                No Image
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            {/* Product Info */}
            <div className="p-3 flex-1 flex flex-col">
                <Link href={`/produk/${getProductSlug(product as any)}`} className="block mb-1">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors" title={product.name}>
                        {product.name}
                    </h3>
                </Link>
                <p className="text-[10px] text-gray-400 mb-2">SKU: {product.sku}</p>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                            {priceInfo.hasDiscount ? (
                                <>
                                    {/* Original price crossed out - Only for Customer Discounts */}
                                    {priceInfo.isCustomerDiscount && (
                                        <p className="text-xs text-gray-400 line-through">
                                            Rp {formatPrice(priceInfo.originalPriceWithPPN)}
                                        </p>
                                    )}
                                    {/* Discounted price */}
                                    <p className="text-sm font-bold text-red-600">
                                        Rp {formatPrice(priceInfo.discountedPriceWithPPN)}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm font-bold text-red-600">
                                    Rp {formatPrice(priceInfo.originalPriceWithPPN)}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isAdded
                                ? 'bg-green-500 text-white'
                                : 'bg-red-100 text-red-600 hover:bg-red-600 hover:text-white'
                                }`}
                            title="Tambah ke Keranjang"
                        >
                            {isAdded ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                        {product.availableToSell > 5 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                                Stok: {product.availableToSell} Unit
                            </span>
                        ) : product.availableToSell > 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Stok Menipis: {product.availableToSell} Unit
                            </span>
                        ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                Indent
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
