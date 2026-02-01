"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

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
    return (
        <section className="w-full bg-white py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8 md:mb-10">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                        Lebih Dari Sekedar Pengiriman.
                        <br />
                        Kami Kirimkan Kepuasan.
                    </h2>
                </div>

                {/* Projects Scroll Container */}
                <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    <div className="flex gap-4 md:gap-5">
                        {projects.map((project, index) => (
                            <motion.div
                                key={project.name}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="flex-shrink-0 relative w-36 md:w-44 lg:w-48 aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
                            >
                                {/* Placeholder Image Background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                                    <h3 className="text-white font-semibold text-sm md:text-base mb-1.5 leading-tight">
                                        {project.name}
                                    </h3>
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
                                        <MapPin className="w-3 h-3 text-white" />
                                        <span className="text-white text-[10px] md:text-xs">
                                            {project.location}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
