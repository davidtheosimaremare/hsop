"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
        <div className="w-full bg-transparent relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                <div className="relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-2xl md:rounded-[2rem] bg-gray-100/50 backdrop-blur-md group border border-white/60">
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
                                    <Link prefetch={false}  href={slides[currentSlide].link || "#"}>
                                        <div className="relative w-full h-full cursor-pointer overflow-hidden">
                                            <Image
                                                src={slides[currentSlide].image}
                                                alt={slides[currentSlide].title || "Banner"}
                                                fill
                                                priority={currentSlide === 0}
                                                unoptimized={true}
                                                className="object-cover"
                                                sizes="(max-width: 1280px) 100vw, 1200px"
                                            />
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="relative w-full h-full overflow-hidden">
                                        <Image
                                            src={slides[currentSlide].image}
                                            alt={slides[currentSlide].title || "Banner"}
                                            fill
                                            priority={currentSlide === 0}
                                            unoptimized={true}
                                            className="object-cover"
                                            sizes="(max-width: 1280px) 100vw, 1200px"
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
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:scale-110 ml-2 md:ml-4"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    nextSlide();
                                    setIsAutoPlaying(false);
                                    setTimeout(() => setIsAutoPlaying(true), 10000);
                                }}
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:scale-110 mr-2 md:mr-4"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

