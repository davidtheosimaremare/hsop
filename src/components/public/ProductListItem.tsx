"use client";

import React, { useState } from "react";
import { ShoppingCart, Check, Plus } from "lucide-react";
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
}

interface ProductListItemProps {
    product: Product;
}

export default function ProductListItem({ product }: ProductListItemProps) {
    const { addItem } = useCart();
    const { getPriceInfo } = usePricing();
    const [isAdded, setIsAdded] = useState(false);

    // Provide product.category and product.brand if they exist, else null
    const priceInfo = getPriceInfo(product.price, (product as any).category || null, product.availableToSell, product.brand);

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
                <Link prefetch={false}  href={`/produk/${getProductSlug(product as any)}`} className="flex-shrink-0">
                    <div className="w-20 h-20 bg-white rounded-lg relative overflow-hidden border border-gray-100 p-1">
                        {product.image ? (
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-contain p-1"
                                sizes="80px"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                <span className="text-gray-400 text-[10px]">No Image</span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <Link prefetch={false}  href={`/produk/${getProductSlug(product as any)}`} className="block">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-red-600 transition-colors" title={product.name}>
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>

                    {/* Stock Badge */}
                    <div className="mt-1">
                        {product.availableToSell > 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                                Stock: {product.availableToSell} Unit
                            </span>
                        ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Indent
                            </span>
                        )}
                    </div>
                </div>

                {/* Price & Action */}
                <div className="flex-shrink-0 flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        {priceInfo.isHidden ? (
                            <p className="text-sm font-bold text-red-600 tracking-tighter italic">
                                Harga Tersembunyi
                            </p>
                        ) : priceInfo.hasDiscount ? (
                            <>
                                {priceInfo.isCustomerDiscount && (
                                    <p className="text-[10px] text-gray-400 line-through">
                                        Rp {formatPrice(priceInfo.originalPriceWithPPN)}
                                    </p>
                                )}
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
                    {priceInfo.isHidden ? (
                        <a
                            href={`https://wa.me/${priceInfo.contactPhone?.replace(/[^0-9]/g, '')}?text=Halo,%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}%20(SKU:%20${product.sku})`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-105 active:scale-95 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                            title="Hubungi Sales"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                        </a>
                    ) : (
                        <button
                            onClick={handleAddToCart}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isAdded
                                ? 'bg-green-500 text-white'
                                : 'bg-red-100 text-red-600 hover:bg-red-600 hover:text-white'
                                }`}
                            title="Tambah ke Keranjang"
                        >
                            {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
