"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PromoBanners() {
    return (
        <section className="w-full bg-gray-50 py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Banner 1 - Business */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-teal-600 to-teal-700 p-6 md:p-8 min-h-[280px] md:min-h-[320px] flex flex-col justify-between"
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-white/20 to-transparent rounded-tl-full" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                                Potensi <span className="text-yellow-300">Turun Harga</span> dan Pembayaran Tempo Mencapai <span className="text-yellow-300">90 Hari</span> Dengan Bisnis
                            </h3>
                            <p className="text-white/80 text-sm md:text-base">
                                1500+ Customer Bisnis Sudah Menikmati Layanan Kami
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="bg-white text-teal-700 border-white hover:bg-white/90 hover:text-teal-800 rounded-full px-6 h-10 font-medium"
                            >
                                Daftar Sebagai Bisnis
                            </Button>
                            <a href="#" className="flex items-center gap-1 text-white text-sm font-medium hover:underline">
                                Belanja Sekarang
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Banner 2 - Vendor */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 p-6 md:p-8 min-h-[280px] md:min-h-[320px] flex flex-col justify-between"
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-gradient-to-tl from-white/20 to-transparent rounded-tl-full" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-3">
                                Jual Produk ke <span className="text-teal-700">Seluruh Indonesia</span> dalam Satu Platform
                            </h3>
                            <p className="text-gray-800/80 text-sm md:text-base">
                                Dipercaya 750+ Vendor di Seluruh Indonesia
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="bg-white text-gray-900 border-white hover:bg-white/90 rounded-full px-6 h-10 font-medium"
                            >
                                Daftar Sebagai Vendor
                            </Button>
                            <a href="#" className="flex items-center gap-1 text-gray-900 text-sm font-medium hover:underline">
                                Pelajari Selengkapnya
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
