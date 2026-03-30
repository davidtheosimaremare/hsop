"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Banner {
    id: string;
    image: string;
    title?: string | null;
    link?: string | null;
}

interface HeroSliderProps {
    banners: Banner[];
}

const DEFAULT_SLIDES = [
    {
        id: "default-1",
        title: "Welcome to Hokiindo",
        image: "https://placehold.co/1920x820/ef4444/ffffff?text=Quality+Electrical+Products",
        link: "/produk"
    },
    {
        id: "default-2",
        title: "Siemens Authorized Distributor",
        image: "https://placehold.co/1920x820/dc2626/ffffff?text=Siemens+Authorized+Distributor",
        link: "/produk/siemens"
    }
];

export default function HeroSlider({ banners }: HeroSliderProps) {
    const slides = banners.length > 0 ? banners : DEFAULT_SLIDES;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [direction, setDirection] = useState(0);

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    const goToSlide = (index: number) => {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(nextSlide, 6000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide]);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '50%' : '-50%',
            opacity: 0
        })
    };

    return (
        <div className="w-full bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
                <div className="relative overflow-hidden shadow-2xl shadow-gray-200/50 rounded-2xl md:rounded-3xl bg-gray-100 group">
                    {/* Slides Container */}
                    <div className="relative aspect-[4/1]">
                        <AnimatePresence initial={false} custom={direction} mode="popLayout">
                            <motion.div
                                key={currentSlide}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.4 }
                                }}
                                className="absolute inset-0"
                            >
                                {slides[currentSlide].link ? (
                                    <Link href={slides[currentSlide].link || "#"}>
                                        <div className="relative w-full h-full cursor-pointer overflow-hidden">
                                            <img
                                                src={slides[currentSlide].image}
                                                alt={slides[currentSlide].title || "Banner"}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="relative w-full h-full overflow-hidden">
                                        <img
                                            src={slides[currentSlide].image}
                                            alt={slides[currentSlide].title || "Banner"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Overlay */}
                        <div className="absolute inset-0 flex items-center justify-between px-1 md:px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    prevSlide();
                                    setIsAutoPlaying(false);
                                    setTimeout(() => setIsAutoPlaying(true), 10000);
                                }}
                                className="w-8 h-8 md:w-10 md:h-10 bg-black/20 backdrop-blur-sm hover:bg-black/40 rounded-full flex items-center justify-center transition-all pointer-events-auto border border-white/10"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 text-white" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    nextSlide();
                                    setIsAutoPlaying(false);
                                    setTimeout(() => setIsAutoPlaying(true), 10000);
                                }}
                                className="w-8 h-8 md:w-10 md:h-10 bg-black/20 backdrop-blur-sm hover:bg-black/40 rounded-full flex items-center justify-center transition-all pointer-events-auto border border-white/10"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

