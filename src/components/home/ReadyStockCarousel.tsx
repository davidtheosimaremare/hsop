"use client";

import React, { useRef } from "react";
import ProductCard from "@/components/public/ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReadyStockCarouselProps {
    title: string;
    subtitle?: string;
    products: any[];
}

export default function ReadyStockCarousel({ title, subtitle, products }: ReadyStockCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <section className="py-12 bg-white border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                        {subtitle && <p className="text-gray-600">{subtitle}</p>}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                            aria-label="Previous"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                            aria-label="Next"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div 
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product) => (
                        <div key={product.id} className="min-w-[280px] max-w-[280px] snap-start shrink-0">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
                {/* CSS to hide scrollbar but keep functionality */}
                <style jsx>{`
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
            </div>
        </section>
    );
}
