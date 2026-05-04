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
                        Lihat Semua 
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-stretch">
                    {/* Featured Column (Banner or Larger Product) */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        {bannerImage ? (
                            /* Custom Banner Layout - Locked 3:4 Ratio */
                            <div className="relative group h-full">
                                <Link 
                                    href={bannerLink || viewAllLink}
                                    className="block relative aspect-[3/4] w-full lg:h-full rounded-2xl overflow-hidden border border-gray-200 shadow-xl hover:shadow-red-500/10 hover:border-red-100 transition-all duration-700 bg-white"
                                >
                                    <Image
                                        src={bannerImage}
                                        alt={title}
                                        fill
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-1000 ease-out"
                                        sizes="(max-width: 1024px) 100vw, 500px"
                                        priority
                                        unoptimized={true}
                                    />
                                    {/* Subtle Top Border for separation */}
                                    <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />
                                    
                                    {/* Minimalist Bottom Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                                        <div className="flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            <span className="px-6 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl">
                                                Lihat Produk
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            /* Default Featured Product Card */
                            <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-red-100 transition-all duration-700 flex flex-col relative shadow-sm h-full">
                                <div className="absolute top-6 left-6 z-10">
                                    <span className="bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] shadow-xl shadow-red-200">
                                        Hot Item
                                    </span>
                                </div>

                                <Link 
                                    href={`/produk/${getProductSlug(featuredProduct)}`} 
                                    className="block relative aspect-square bg-white overflow-hidden p-6"
                                >
                                    {featuredProduct.image ? (
                                        <Image
                                            src={featuredProduct.image}
                                            alt={featuredProduct.name}
                                            fill
                                            className="object-contain p-8 group-hover:scale-110 transition-transform duration-700 ease-out"
                                            sizes="(max-width: 1024px) 100vw, 400px"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest">
                                            No Image
                                        </div>
                                    )}
                                </Link>

                                <div className="p-6 md:p-8 flex-1 flex flex-col bg-gray-50/30">
                                    <Link href={`/produk/${getProductSlug(featuredProduct)}`} className="block mb-4">
                                        <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight group-hover:text-red-600 transition-colors line-clamp-2 uppercase tracking-tight">
                                            {featuredProduct.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="text-[9px] font-black text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-lg uppercase tracking-widest">SKU: {featuredProduct.sku}</span>
                                    </div>
                                    
                                    <div className="mt-auto">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Starting From</span>
                                                <span className="text-2xl font-black text-red-600 tracking-tighter">
                                                    Rp {new Intl.NumberFormat("id-ID").format(Math.round(featuredProduct.price))}
                                                </span>
                                            </div>
                                            <Link 
                                                href={`/produk/${getProductSlug(featuredProduct)}`}
                                                className="bg-gray-900 text-white p-4 rounded-xl hover:bg-red-600 transition-all shadow-xl hover:shadow-red-200 group-hover:rotate-6 duration-300"
                                            >
                                                <ShoppingCart className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Secondary Grid Column - Matching Banner Height with 3x2 Grid */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 h-full lg:grid-rows-2">
                            {(bannerImage ? products : otherProducts).slice(0, 6).map((product) => (
                                <div key={product.id} className="min-h-0 h-full">
                                    <ProductCard product={product} variant="compact" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
