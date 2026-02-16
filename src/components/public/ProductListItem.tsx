"use client";

import React, { useState } from "react";
import { Plus, Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/useCart";
import { getProductSlug } from "@/lib/utils";

interface Product {
    id: number;
    name: string;
    sku: string;
    brand: string | null;
    price: number;
    image: string | null;
    availableToSell: number;
}

interface ProductListItemProps {
    product: Product;
}

export default function ProductListItem({ product }: ProductListItemProps) {
    const { addItem } = useCart();
    const [isAdded, setIsAdded] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addItem({
            id: product.id,
            sku: product.sku,
            name: product.name,
            brand: product.brand || '',
            price: product.price,
            image: product.image,
            availableToSell: product.availableToSell
        }, 1);

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 p-3">
                {/* Product Image */}
                <Link href={`/produk/${getProductSlug(product as any)}`} className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg relative overflow-hidden">
                        {product.image ? (
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <Link href={`/produk/${getProductSlug(product as any)}`} className="block">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-red-600 transition-colors" title={product.name}>
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>

                    {/* Stock Badge */}
                    <div className="mt-1">
                        {product.availableToSell > 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                                Stok: {product.availableToSell} Unit
                            </span>
                        ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Indent
                            </span>
                        )}
                    </div>
                </div>

                {/* Price & Action */}
                <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-red-600 mb-2">
                        Rp {formatPrice(product.price)}
                    </p>
                    <button
                        onClick={handleAddToCart}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isAdded
                                ? 'bg-green-500 text-white'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                    >
                        {isAdded ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                Ditambahkan
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Tambah
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
