"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const newsItems = [
    {
        title: "Kuasai Perhitungan Berat Besi Beton: Panduan Praktis untuk Proyek Efisien",
        date: "Rabu, 17 Desember 2025",
        image: "/placeholder-news.png",
    },
    {
        title: "Panduan Praktis Berat Besi Beton SNI: Tabel, Rumus, dan Aplikasi Lapangan",
        date: "Senin, 01 Desember 2025",
        image: "/placeholder-news.png",
    },
    {
        title: "Panduan Teknis Ukuran Besi Hollow untuk Proyek Konstruksi Profesional",
        date: "Senin, 10 November 2025",
        image: "/placeholder-news.png",
    },
    {
        title: "Panduan Akurat Menghitung Kubikasi Beton untuk Proyek Konstruksi",
        date: "Senin, 10 November 2025",
        image: "/placeholder-news.png",
    },
];

export default function NewsSection() {
    return (
        <section className="w-full bg-white py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        Berita Juragan
                    </h2>
                    <a
                        href="#"
                        className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                        Lihat Semua Berita
                        <ChevronRight className="w-4 h-4" />
                    </a>
                </div>

                {/* News Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {newsItems.map((news, index) => (
                        <motion.a
                            key={news.title}
                            href="#"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="group block"
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden mb-3 bg-gray-200">
                                {/* Placeholder */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                            </div>

                            {/* Content */}
                            <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-tight mb-2 group-hover:text-teal-600 transition-colors duration-200 line-clamp-2">
                                {news.title}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500">
                                {news.date}
                            </p>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
