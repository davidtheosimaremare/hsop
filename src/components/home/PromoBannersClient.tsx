"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface PromoBannersClientProps {
    leftCTA: any;
    rightCTA: any;
}

export default function PromoBannersClient({ leftCTA, rightCTA }: PromoBannersClientProps) {
    const renderBanner = (cta: any, index: number, gradient: string, textColor: string, subTextColor: string, highlightColor: string) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-2xl md:rounded-3xl ${cta.image ? '' : gradient} p-6 md:p-8 min-h-[280px] md:min-h-[320px] flex flex-col justify-between group`}
        >
            {/* Background Image or Pattern */}
            {cta.image ? (
                <>
                    <Image
                        src={cta.image}
                        alt={cta.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </>
            ) : (
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-white/20 to-transparent rounded-tl-full" />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <h3 className={`text-xl md:text-2xl lg:text-3xl font-bold ${cta.image ? 'text-white' : textColor} leading-tight mb-3`}>
                        {cta.title}
                    </h3>
                    <p className={`${cta.image ? 'text-white/90' : subTextColor} text-sm md:text-base`}>
                        {cta.subtitle}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6">
                    {cta.primaryButtonText && (
                        <Button
                            variant="outline"
                            asChild
                            className={`bg-white ${cta.image ? 'text-gray-900' : 'text-teal-700'} border-white hover:bg-white/90 hover:text-teal-800 rounded-full px-6 h-10 font-medium`}
                        >
                            <Link href={cta.primaryButtonLink || "#"}>
                                {cta.primaryButtonText}
                            </Link>
                        </Button>
                    )}
                    {cta.secondaryButtonText && (
                        <Link
                            href={cta.secondaryButtonLink || "#"}
                            className={`flex items-center gap-1 ${cta.image ? 'text-white' : (index === 0 ? 'text-white' : 'text-gray-900')} text-sm font-medium hover:underline`}
                        >
                            {cta.secondaryButtonText}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );

    return (
        <section className="w-full bg-gray-50 py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Banner 1 - Business (Left) */}
                    {renderBanner(leftCTA, 0, "bg-gradient-to-br from-teal-600 to-teal-700", "text-white", "text-white/80", "text-yellow-300")}

                    {/* Banner 2 - Vendor (Right) */}
                    {renderBanner(rightCTA, 1, "bg-gradient-to-br from-amber-400 to-amber-500", "text-gray-900", "text-gray-800/80", "text-teal-700")}
                </div>
            </div>
        </section>
    );
}
