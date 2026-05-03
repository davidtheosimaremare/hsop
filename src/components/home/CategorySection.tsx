"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
    ChevronRight,
    Zap,
    Gauge,
    Lightbulb,
    Plug,
    Box,
    Wrench,
    ShieldCheck,
    Settings,
    Image as ImageIcon,
    Cog,
    Factory,
    Cpu,
    Server,
    Battery
} from "lucide-react";

interface CategoryGridItem {
    id: string;
    name: string;
    image: string | null;
    slug?: string;
    originalName?: string;
}

interface CategorySectionProps {
    categories?: CategoryGridItem[];
    title?: string;
    hideViewAll?: boolean;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
    "Zap": Zap,
    "Gauge": Gauge,
    "Lightbulb": Lightbulb,
    "Plug": Plug,
    "Box": Box,
    "Wrench": Wrench,
    "ShieldCheck": ShieldCheck,
    "Settings": Settings,
    "Cog": Cog,
    "Factory": Factory,
    "Cpu": Cpu,
    "Server": Server,
    "Battery": Battery,
};

export default function CategorySection({ categories = [], title = "Apa yang Anda cari?", hideViewAll = false }: CategorySectionProps) {
    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <section className="w-full bg-white py-6 md:py-8 border-b border-gray-100 last:border-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        {title}
                    </h2>
                    {!hideViewAll && (
                        <a
                            href="/kategori"
                            className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                        >
                            Lihat Semua Kategori
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    )}
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
                    {categories.map((category, index) => {
                        const isImageUrl = category.image && (category.image.startsWith('/') || category.image.startsWith('http'));
                        const IconComponent = (!isImageUrl && category.image && ICON_MAP[category.image])
                            ? ICON_MAP[category.image]
                            : ImageIcon;

                        // Always use search URL with original name as requested
                        // even if a specific link exists in the config.
                        const href = `/pencarian?category=${encodeURIComponent(category.originalName || category.name)}`;

                        return (
                            <motion.a
                                key={category.id}
                                href={href}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.03 }}
                                whileHover={{ y: -4 }}
                                className="group flex flex-col items-center text-center"
                            >
                                {/* Icon/Image Container */}
                                <div className="w-[85%] sm:w-[80%] md:w-[75%] aspect-square bg-white rounded-2xl md:rounded-[1.25rem] flex items-center justify-center mb-2 md:mb-3 transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-red-200 group-hover:shadow-md relative shadow-sm">
                                    {isImageUrl ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <Image
                                                src={category.image!}
                                                alt={category.name}
                                                fill
                                                className="object-contain p-3 md:p-4"
                                                sizes="(max-width: 768px) 64px, 96px"
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <IconComponent className="w-7 h-7 md:w-10 md:h-10 text-gray-400 group-hover:text-red-600 transition-colors duration-200" />
                                        </div>
                                    )}
                                </div>
                                {/* Label */}
                                <span className="text-[11px] md:text-xs text-gray-700 group-hover:text-red-600 font-semibold transition-colors duration-200 leading-tight line-clamp-2 px-1">
                                    {category.name}
                                </span>
                            </motion.a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
