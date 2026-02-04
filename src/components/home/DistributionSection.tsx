"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";

const projects = [
    { name: "Proyek PIK", location: "Jakarta Utara" },
    { name: "Proyek Duta Land Babelan", location: "Kabupaten Bekasi" },
    { name: "Proyek Suvarna Sutera", location: "Tangerang" },
    { name: "Proyek FOT Halim", location: "Jakarta Timur" },
    { name: "Proyek Aurora", location: "Bogor" },
    { name: "Proyek BSD City", location: "Tangerang Selatan" },
    { name: "Proyek Summarecon", location: "Bekasi" },
];

export default function DistributionSection() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener("scroll", checkScroll);
            // Initial check
            checkScroll();
            // Check again after a short delay for layout
            setTimeout(checkScroll, 100);
        }
        window.addEventListener("resize", checkScroll);
        return () => {
            if (container) {
                container.removeEventListener("scroll", checkScroll);
            }
            window.removeEventListener("resize", checkScroll);
        };
    }, []);

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
        }
    };

    return (
        <section className="w-full bg-white py-8 md:py-12 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8 md:mb-10">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                        Lebih Dari Sekedar Pengiriman.
                        <br />
                        Kami Kirimkan Kepuasan.
                    </h2>
                </div>

                {/* Projects Slider Container */}
                <div className="relative group">
                    {/* Navigation Buttons */}
                    <AnimatePresence>
                        {canScrollLeft && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onClick={() => scroll("left")}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-gray-800 hover:bg-red-600 hover:text-white transition-all duration-300 border border-gray-100 hidden md:flex -ml-6"
                                aria-label="Slide Left"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {canScrollRight && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onClick={() => scroll("right")}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-gray-800 hover:bg-red-600 hover:text-white transition-all duration-300 border border-gray-100 hidden md:flex -mr-6"
                                aria-label="Slide Right"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Scrollable Area */}
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide snap-x touch-pan-x"
                    >
                        <div className="flex gap-4 md:gap-5">
                            {projects.map((project, index) => (
                                <motion.div
                                    key={project.name}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -5 }}
                                    className="flex-shrink-0 relative w-40 md:w-56 lg:w-64 aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group shadow-sm snap-start"
                                >
                                    {/* Placeholder Image Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-gray-300 group-hover:to-gray-400 transition-colors duration-500" />

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                                        <h3 className="text-white font-bold text-sm md:text-lg mb-2 leading-tight">
                                            {project.name}
                                        </h3>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg">
                                            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                            <span className="text-white text-[10px] md:text-xs font-medium">
                                                {project.location}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Indicators */}
                    <div className="flex justify-center gap-1.5 mt-2 md:hidden">
                        {projects.map((_, i) => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-gray-300"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
