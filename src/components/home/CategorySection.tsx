"use client";

import { motion } from "framer-motion";
import {
    ChevronRight,
    Zap,
    Gauge,
    Lightbulb,
    Cable,
    Box,
    Wrench,
    ShieldCheck,
    Settings
} from "lucide-react";

const categories = [
    { name: "Low Voltage Siemens", icon: Zap, href: "/pencarian?q=Siemens Low Voltage" },
    { name: "Control Product Siemens", icon: Gauge, href: "/pencarian?q=Siemens Control Product" },
    { name: "Portable Lighting", icon: Lightbulb, href: "/pencarian?q=Portable Lighting" },
    { name: "Cable & Wiring", icon: Cable, href: "/pencarian?q=Cable" },
    { name: "Panel & Enclosure", icon: Box, href: "/pencarian?q=Panel" },
    { name: "Instrument & Tools", icon: Wrench, href: "/pencarian?q=Instrument" },
    { name: "Circuit Breaker", icon: ShieldCheck, href: "/pencarian?q=Circuit Breaker" },
    { name: "Motor Starter", icon: Settings, href: "/pencarian?q=Motor Starter" },
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
                        href="/kategori"
                        className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                    >
                        Lihat Semua Kategori
                        <ChevronRight className="w-4 h-4" />
                    </a>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
                    {categories.map((category, index) => (
                        <motion.a
                            key={category.name}
                            href={category.href}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            whileHover={{ y: -4 }}
                            className="group flex flex-col items-center text-center"
                        >
                            {/* Icon Container */}
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 group-hover:bg-red-50 transition-colors duration-200 overflow-hidden border border-gray-100 group-hover:border-red-100">
                                <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                                    <category.icon className="w-8 h-8 md:w-10 md:h-10 text-gray-400 group-hover:text-red-600 transition-colors duration-200" />
                                </div>
                            </div>
                            {/* Label */}
                            <span className="text-[10px] md:text-xs text-gray-600 group-hover:text-red-600 font-medium transition-colors duration-200 leading-tight line-clamp-2">
                                {category.name}
                            </span>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
