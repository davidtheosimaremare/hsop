"use client";

import React from "react";
import ProductCard from "@/components/public/ProductCard";
import { ChevronRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getProductSlug } from "@/lib/utils";

interface ProductGridSectionProps {
    title: string;
    subtitle?: string;
    viewAllLink: string;
    products: any[];
    bannerImage?: string | null;
    bannerLink?: string | null;
}

export default function ProductGridSection({ 
    title, 
    subtitle, 
    viewAllLink, 
    products,
    bannerImage,
    bannerLink 
}: ProductGridSectionProps) {
    if (!products || products.length === 0) return null;

    const featuredProduct = products[0];
    const otherProducts = products.slice(1);

    return (
        <section className="py-12 bg-white border-b border-gray-100 last:border-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <span className="w-1.5 h-8 bg-red-600 rounded-full"></span>
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-gray-500 font-medium text-sm md:text-base ml-4">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <Link 
                        href={viewAllLink}
                        className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-all group bg-red-50 px-4 py-2 rounded-full md:bg-transparent md:px-0"
                    >
                        Explore More 
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Featured Column (Banner or Larger Product) */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        {bannerImage ? (
                            /* Custom Banner Layout */
                            <Link 
                                href={bannerLink || viewAllLink}
                                className="group block relative aspect-[4/5] lg:h-full rounded-3xl overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl hover:border-red-100 transition-all duration-500"
                            >
                                <Image
                                    src={bannerImage}
                                    alt={title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    sizes="(max-width: 768px) 100vw, 400px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                    <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <p className="text-xs font-black uppercase tracking-widest mb-2 text-red-400">Limited Collection</p>
                                        <h3 className="text-2xl font-black leading-tight uppercase tracking-tighter">View {title} Catalog</h3>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            /* Default Featured Product Card */
                            <div className="group h-full bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-red-100 transition-all duration-500 flex flex-col relative">
                                {/* Featured Badge */}
                                <div className="absolute top-6 left-6 z-10">
                                    <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-red-200 animate-pulse">
                                        Hot Item
                                    </span>
                                </div>

                                <Link 
                                    href={`/produk/${getProductSlug(featuredProduct)}`} 
                                    className="block relative aspect-square bg-white overflow-hidden"
                                >
                                    {featuredProduct.image ? (
                                        <Image
                                            src={featuredProduct.image}
                                            alt={featuredProduct.name}
                                            fill
                                            className="object-contain p-10 group-hover:scale-110 transition-transform duration-700"
                                            sizes="(max-width: 768px) 100vw, 400px"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest">
                                            No Image Available
                                        </div>
                                    )}
                                </Link>

                                <div className="p-8 flex-1 flex flex-col">
                                    <Link href={`/produk/${getProductSlug(featuredProduct)}`} className="block mb-3">
                                        <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
                                            {featuredProduct.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-tighter">SKU: {featuredProduct.sku}</span>
                                        {featuredProduct.brand && (
                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase tracking-tighter">{featuredProduct.brand}</span>
                                        )}
                                    </div>
                                    
                                    <div className="mt-auto pt-6 border-t border-gray-100">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Starting From</span>
                                                <span className="text-2xl font-black text-red-600 tracking-tighter">
                                                    Rp {new Intl.NumberFormat("id-ID").format(Math.round(featuredProduct.price))}
                                                </span>
                                            </div>
                                            <Link 
                                                href={`/produk/${getProductSlug(featuredProduct)}`}
                                                className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-red-600 transition-all shadow-xl hover:shadow-red-200"
                                            >
                                                <ShoppingCart className="w-6 h-6" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Secondary Grid Column */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 h-full">
                            {(bannerImage ? products : otherProducts).slice(0, 6).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
