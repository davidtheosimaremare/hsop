"use client";

import { useState } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ChevronRight, ChevronDown, Share2 } from "lucide-react";

// Sample categories - Siemens Electrical Products
const categories = [
    {
        name: "Low Voltage Product",
        subcategories: ["MCB", "MCCB", "ACB", "RCCB", "SPD", "Fuse"]
    },
    {
        name: "Control Product",
        subcategories: ["Contactor", "Motor Starter", "Thermal Relay", "Timer", "Push Button"]
    },
    {
        name: "Portable Lighting",
        subcategories: ["LED Floodlight", "LED High Bay", "LED Panel", "Emergency Light"]
    },
    {
        name: "Cable & Accessories",
        subcategories: ["Power Cable", "Control Cable", "Cable Gland", "Cable Lug"]
    },
    {
        name: "Panel & Enclosure",
        subcategories: ["Distribution Board", "Enclosure", "Din Rail", "Terminal Block"]
    },
];

// Sample products - Siemens Electrical
const products = [
    { id: 1, brand: "Siemens", name: "Siemens 5SL6 MCB 1P 16A 6kA", price: 125000, stock: true, ppn: true },
    { id: 2, brand: "Siemens", name: "Siemens 3VA MCCB 3P 100A 25kA", price: 2850000, stock: true, ppn: true },
    { id: 3, brand: "Siemens", name: "Siemens SIRIUS 3RT2 Contactor 3P 9A", price: 485000, stock: false, ppn: true },
    { id: 4, brand: "Siemens", name: "Siemens 3RV2 Motor Starter 1.1-1.6A", price: 720000, stock: true, ppn: false },
    { id: 5, brand: "Siemens", name: "Siemens 3SU1 Push Button Green 22mm", price: 185000, stock: true, ppn: true },
    { id: 6, brand: "Siemens", name: "Siemens LED Floodlight 50W IP65", price: 450000, stock: true, ppn: true },
    { id: 7, brand: "Siemens", name: "Siemens 5SP3 SPD Type 2 40kA", price: 980000, stock: false, ppn: true },
    { id: 8, brand: "Siemens", name: "Siemens 5SQ3 Fuse Holder 3P 32A", price: 245000, stock: true, ppn: true },
];

export default function SearchPage() {
    const [expandedCategory, setExpandedCategory] = useState<string | null>("Low Voltage Product");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("newest");
    const totalPages = 4;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Page Title */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Besi Beton</h1>
                        <button className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
                            Bagikan Halaman
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex gap-6">
                        {/* Sidebar Filter */}
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <span className="text-lg">—</span> Kategori Produk
                                    </h2>
                                    <button className="text-sm text-teal-600 hover:underline">
                                        Reset
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    {categories.map((category) => (
                                        <div key={category.name}>
                                            <button
                                                onClick={() => setExpandedCategory(
                                                    expandedCategory === category.name ? null : category.name
                                                )}
                                                className={`w-full flex items-center justify-between py-2.5 px-2 rounded-lg text-left text-sm transition-colors ${expandedCategory === category.name
                                                    ? "text-teal-600 bg-teal-50"
                                                    : "text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <span className="font-medium">{category.name}</span>
                                                {category.subcategories.length > 0 ? (
                                                    expandedCategory === category.name ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>

                                            {/* Subcategories */}
                                            {expandedCategory === category.name && category.subcategories.length > 0 && (
                                                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                                                    {category.subcategories.map((sub) => (
                                                        <a
                                                            key={sub}
                                                            href="#"
                                                            className="block py-1.5 text-sm text-gray-600 hover:text-teal-600 transition-colors"
                                                        >
                                                            {sub}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Products Grid */}
                        <div className="flex-1">
                            {/* Results Info & Sort */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <p className="text-sm text-gray-600">
                                    Menampilkan <span className="font-medium">40</span> dari <span className="font-medium">139</span> Dari "<span className="font-semibold text-gray-900">Besi Beton</span>"
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Urutkan</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    >
                                        <option value="newest">Terbaru</option>
                                        <option value="price-low">Harga Terendah</option>
                                        <option value="price-high">Harga Tertinggi</option>
                                        <option value="popular">Terpopuler</option>
                                    </select>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                {products.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Product Image */}
                                        <a href={`/produk/${product.name.toLowerCase().replace(/\s+/g, '-')}`} className="block">
                                            <div className="aspect-square bg-gray-100 relative">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-3/4 h-3/4 bg-gray-200 rounded-lg" />
                                                </div>
                                            </div>
                                        </a>

                                        {/* Product Info */}
                                        <div className="p-3">
                                            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                                            <a href={`/produk/${product.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                                                    {product.name}
                                                </h3>
                                            </a>
                                            <p className="text-sm font-bold text-red-600 mb-2">
                                                Rp {formatPrice(product.price)}
                                            </p>

                                            {/* Badges */}
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${product.stock
                                                    ? "bg-green-50 text-green-600 border border-green-200"
                                                    : "bg-orange-50 text-orange-600 border border-orange-200"
                                                    }`}>
                                                    {product.stock ? "Stok Tersedia" : "Stok Terbatas"}
                                                </span>
                                                {product.ppn && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200">
                                                        Termasuk PPN
                                                    </span>
                                                )}
                                            </div>

                                            {/* Add Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // Add to cart logic here
                                                }}
                                                className="w-full py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                Tambahkan
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ‹
                                </button>

                                {[1, 2, 3, 4].map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                            ? "bg-red-600 text-white"
                                            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
