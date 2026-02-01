"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

const categories = [
    { name: "Dinding", image: "/placeholder-category.png" },
    { name: "Besi Beton & Wiremesh", image: "/placeholder-category.png" },
    { name: "Beton", image: "/placeholder-category.png" },
    { name: "Semen & Sejenisnya", image: "/placeholder-category.png" },
    { name: "Lantai", image: "/placeholder-category.png" },
    { name: "Material Alam", image: "/placeholder-category.png" },
    { name: "Sistem Pemipaan", image: "/placeholder-category.png" },
    { name: "Produk Teknikal & Kimia", image: "/placeholder-category.png" },
    { name: "Cat dan Pelapis Dinding", image: "/placeholder-category.png" },
    { name: "Produk K3", image: "/placeholder-category.png" },
    { name: "Peralatan & Perkakas", image: "/placeholder-category.png" },
    { name: "Sistem Elektro", image: "/placeholder-category.png" },
    { name: "Sistem Elektrikal", image: "/placeholder-category.png" },
    { name: "Aksesoris Dapur", image: "/placeholder-category.png" },
    { name: "Sanitari & Aksesorisnya", image: "/placeholder-category.png" },
    { name: "Aksesoris Kamar Mandi", image: "/placeholder-category.png" },
];

export default function CategorySection() {
    return (
        <section className="w-full bg-white py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        Apa yang Anda cari?
                    </h2>
                    <a
                        href="#"
                        className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                        Lihat Semua Kategori
                        <ChevronRight className="w-4 h-4" />
                    </a>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                    {categories.map((category, index) => (
                        <motion.a
                            key={category.name}
                            href="#"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            whileHover={{ y: -4 }}
                            className="group flex flex-col items-center text-center"
                        >
                            {/* Image Container */}
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 group-hover:bg-teal-50 transition-colors duration-200 overflow-hidden">
                                <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                                    {/* Placeholder - replace with actual images */}
                                    <div className="w-full h-full bg-gray-200 rounded-lg" />
                                </div>
                            </div>
                            {/* Label */}
                            <span className="text-[10px] md:text-xs text-gray-600 group-hover:text-teal-600 transition-colors duration-200 leading-tight line-clamp-2">
                                {category.name}
                            </span>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
