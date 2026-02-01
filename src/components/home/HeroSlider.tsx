"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Placeholder slides - replace with actual data later
const slides = [
    {
        id: 1,
        title: "Slide 1",
        bgColor: "bg-gradient-to-r from-blue-100 to-blue-200",
    },
    {
        id: 2,
        title: "Slide 2",
        bgColor: "bg-gradient-to-r from-red-100 to-orange-100",
    },
    {
        id: 3,
        title: "Slide 3",
        bgColor: "bg-gradient-to-r from-green-100 to-teal-100",
    },
];

export default function HeroSlider() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        // Resume autoplay after 5 seconds
        setTimeout(() => setIsAutoPlaying(true), 5000);
    };

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 4000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide]);

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
                    {/* Slides Container */}
                    <div className="relative aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className={`absolute inset-0 ${slides[currentSlide].bgColor} flex items-center justify-center`}
                            >
                                {/* Placeholder content - replace with actual images */}
                                <div className="text-center">
                                    <span className="text-gray-400 text-lg md:text-xl">
                                        Banner {currentSlide + 1}
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={() => {
                            prevSlide();
                            setIsAutoPlaying(false);
                            setTimeout(() => setIsAutoPlaying(true), 5000);
                        }}
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                    </button>
                    <button
                        onClick={() => {
                            nextSlide();
                            setIsAutoPlaying(false);
                            setTimeout(() => setIsAutoPlaying(true), 5000);
                        }}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`transition-all duration-300 rounded-full ${currentSlide === index
                                        ? "w-6 md:w-8 h-2 md:h-2.5 bg-red-500"
                                        : "w-2 md:w-2.5 h-2 md:h-2.5 bg-white/60 hover:bg-white/80"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
