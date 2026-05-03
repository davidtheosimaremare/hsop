"use client";

import React from "react";
import ProductCard from "@/components/public/ProductCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface ProductGridSectionProps {
    title: string;
    viewAllLink: string;
    products: any[];
}

export default function ProductGridSection({ title, viewAllLink, products }: ProductGridSectionProps) {
    if (!products || products.length === 0) return null;

    return (
        <section className="py-8 bg-white border-b border-gray-100 last:border-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
                    <Link 
                        href={viewAllLink}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center transition-colors"
                    >
                        Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
