"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface NewsSectionProps {
    news: any[];
}

export default function NewsSection({ news }: NewsSectionProps) {
    if (!news || news.length === 0) {
        return null;
    }

    return (
        <section className="w-full bg-white py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        Berita
                    </h2>
                    <Link
                        href="/berita"
                        className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                        Lihat Semua Berita
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* News Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {news.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="group block h-full flex flex-col"
                        >
                            <Link href={`/berita/${item.slug}`} className="block h-full flex flex-col">
                                {/* Image */}
                                <div className="relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden mb-3 bg-gray-100">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400 text-xs">No Image</span>
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                                </div>

                                {/* Content */}
                                <div className="flex flex-col flex-1">
                                    <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-snug mb-2 group-hover:text-teal-600 transition-colors duration-200 line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-auto">
                                        {item.publishedAt ? format(new Date(item.publishedAt), "EEEE, d MMMM yyyy", { locale: id }) : "-"}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
