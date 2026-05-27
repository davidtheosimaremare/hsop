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
    variant?: 'default' | 'compact';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
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
            isCustomerDiscount: priceInfo.isCustomerDiscount,
            basePrice: product.price,
            category: product.category || null
        }, 1);

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    if (variant === 'compact') {
        return (
            <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-red-500/10 transition-all duration-300 flex flex-col h-full shadow-sm min-h-0">
                {/* Product Image - Flexible & Larger */}
                <Link prefetch={false} href={`/produk/${getProductSlug(product as any)}`} className="block relative flex-1 min-h-0 overflow-hidden bg-slate-50/40">
                    <div className="h-full w-full relative p-2 transition-transform duration-500 group-hover:scale-105">
                        {product.image ? (
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-contain p-1.5"
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
                <div className="p-2.5 md:p-3 flex flex-col bg-white shrink-0">
                    <Link prefetch={false} href={`/produk/${getProductSlug(product as any)}`} className="block mb-1">
                        <h3 className="text-[11px] md:text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-red-600 transition-colors leading-tight min-h-[2.5em]" title={product.name}>
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-[9px] text-slate-400 mb-2 font-medium tracking-tight">SKU: {product.sku}</p>

                    <div className="mt-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                {priceInfo.isHidden ? (
                                    <p className="text-[10px] md:text-xs font-bold text-red-600 tracking-tighter italic">
                                        Harga Tersembunyi
                                    </p>
                                ) : priceInfo.hasDiscount ? (
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
                            {priceInfo.isHidden ? (
                                <a
                                    href={`https://wa.me/${priceInfo.contactPhone?.replace(/[^0-9]/g, '')}?text=Halo,%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}%20(SKU:%20${product.sku})`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                    title="Hubungi Sales"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                </a>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${isAdded
                                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-100'
                                        : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                        }`}
                                    title="Tambah ke Keranjang"
                                >
                                    {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default Variant (Normal Layout)
    return (
        <div className="group bg-white rounded-2xl border border-slate-150 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-red-500/10 transition-all duration-300 flex flex-col h-full shadow-xs">
            {/* Product Image - Larger */}
            <Link prefetch={false} href={`/produk/${getProductSlug(product as any)}`} className="block relative overflow-hidden bg-slate-50/40">
                <div className="aspect-square relative p-3 transition-transform duration-500 group-hover:scale-104">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="w-3/4 h-3/4 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                No Image
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            {/* Product Info */}
            <div className="p-3.5 flex-1 flex flex-col bg-white">
                <Link prefetch={false} href={`/produk/${getProductSlug(product as any)}`} className="block mb-1.5">
                    <h3 className="text-xs md:text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-red-600 transition-colors duration-250 leading-snug" title={product.name}>
                        {product.name}
                    </h3>
                </Link>
                <p className="text-[10px] text-slate-400 font-medium mb-3">SKU: {product.sku}</p>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                            {priceInfo.isHidden ? (
                                <p className="text-sm font-bold text-red-600 tracking-tighter italic">
                                    Harga Tersembunyi
                                </p>
                            ) : priceInfo.hasDiscount ? (
                                <>
                                    {priceInfo.isCustomerDiscount && (
                                        <p className="text-xs text-slate-400 line-through">
                                            Rp {formatPrice(priceInfo.originalPriceWithPPN)}
                                        </p>
                                    )}
                                    <p className="text-sm md:text-base font-black text-red-600 tracking-tight">
                                        Rp {formatPrice(priceInfo.discountedPriceWithPPN)}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm md:text-base font-black text-red-600 tracking-tight">
                                    Rp {formatPrice(priceInfo.originalPriceWithPPN)}
                                </p>
                            )}
                        </div>
                        {priceInfo.isHidden ? (
                            <a
                                href={`https://wa.me/${priceInfo.contactPhone?.replace(/[^0-9]/g, '')}?text=Halo,%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}%20(SKU:%20${product.sku})`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-105 active:scale-95 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white"
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
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-105 active:scale-95 ${isAdded
                                    ? 'bg-emerald-500 text-white shadow-emerald-100/30'
                                    : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                    }`}
                                title="Tambah ke Keranjang"
                            >
                                {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                        )}
                    </div>

                    {/* Restore Stock Badges for Default Variant with premium details */}
                    <div className="flex flex-wrap gap-1 border-t border-slate-50 pt-2.5">
                        {product.availableToSell > 5 ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50 font-semibold tracking-wide flex items-center gap-1.5 select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Stok: {product.availableToSell} Unit
                            </span>
                        ) : product.availableToSell > 0 ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100/50 font-semibold tracking-wide flex items-center gap-1.5 select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Stok: {product.availableToSell} Unit
                            </span>
                        ) : (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-100/50 font-semibold tracking-wide flex items-center gap-1.5 select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                Pre-Order / Indent
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
