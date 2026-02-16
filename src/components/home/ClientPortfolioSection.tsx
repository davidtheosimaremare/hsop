"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { MapPin, ChevronLeft, ChevronRight, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ClientProject {
    id: string;
    projectName: string;
    clientName: string;
    location: string | null;
    image: string;
}

interface ClientPortfolioSectionProps {
    projects: ClientProject[];
}

export default function ClientPortfolioSection({ projects }: ClientPortfolioSectionProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
        Autoplay({ delay: 4000, stopOnInteraction: false })
    ]);

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (!projects || projects.length === 0) {
        return null;
    }

    return (
        <section className="w-full bg-white py-8 md:py-12 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8 md:mb-10">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                        Lebih Dari Sekedar Pengiriman.<br />
                        Kami Kirimkan Kepuasan.
                    </h2>
                </div>

                <div className="relative group">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex -ml-4">
                            {projects.map((project) => (
                                <div key={project.id} className="flex-[0_0_50%] sm:flex-[0_0_40%] md:flex-[0_0_30%] lg:flex-[0_0_20%] min-w-0 pl-4">
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden group/card shadow-sm cursor-pointer">
                                        <Image
                                            src={project.image}
                                            alt={project.projectName}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                                        />
                                        {/* Gradient Overlay matching DistributionSection */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {/* Content matching DistributionSection */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                                            <h3 className="text-white font-bold text-sm md:text-lg mb-2 leading-tight">
                                                {project.projectName}
                                            </h3>

                                            <div className="space-y-1.5">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg">
                                                    <Building className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                                    <span className="text-white text-[10px] md:text-xs font-medium truncate max-w-[150px]">{project.clientName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons matching DistributionSection */}
                    <button
                        onClick={scrollPrev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-gray-800 hover:bg-red-600 hover:text-white transition-all duration-300 border border-gray-100 hidden md:flex -ml-5 opacity-0 group-hover:opacity-100"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center text-gray-800 hover:bg-red-600 hover:text-white transition-all duration-300 border border-gray-100 hidden md:flex -mr-5 opacity-0 group-hover:opacity-100"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </section>
    );
}
