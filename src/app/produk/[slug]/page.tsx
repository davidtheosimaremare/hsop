"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Share2, Minus, Plus, ShoppingCart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabType = "specs" | "description";

const productSpecs = [
    { label: "Satuan", value: "Unit" },
    { label: "Pembelian minimal", value: "1 Unit" },
    { label: "Kelipatan pembelian", value: "1 Unit" },
    { label: "Dimensi per unit", value: "17.5 cm x 10.5 cm x 11.5 cm" },
    { label: "Berat", value: "2.500 Gram / 2,5 Kg" },
    { label: "Merek", value: "Siemens", isLink: true },
    { label: "Sub kategori", value: "MCCB 3VA", isLink: true },
];

const relatedProducts = [
    { id: 1, brand: "Siemens", name: "Siemens 3VA MCCB 100A 3-Pole 25kA", price: 2150000, stock: true, ppn: true },
    { id: 2, brand: "Siemens", name: "Siemens 3P 16A MCB 6kA 5SL6316-7", price: 185000, stock: true, ppn: true },
    { id: 3, brand: "Siemens", name: "Siemens 3P 20A MCB 10kA 5SY4320-7", price: 245000, stock: true, ppn: true },
    { id: 4, brand: "Siemens", name: "Siemens 3RT2026 Contactor 25A 11kW", price: 850000, stock: true, ppn: true },
    { id: 5, brand: "Siemens", name: "Siemens 3RU2126 Thermal Overload Relay", price: 420000, stock: true, ppn: true },
    { id: 6, brand: "Siemens", name: "Siemens 3RV2021 Motor Starter Protector", price: 950000, stock: true, ppn: true },
];

export default function ProductDetailPage() {
    const [activeTab, setActiveTab] = useState<TabType>("specs");
    const [quantity, setQuantity] = useState(1);
    const sliderRef = useRef<HTMLDivElement>(null);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID").format(price);
    };

    const scrollRelated = (direction: "left" | "right") => {
        if (sliderRef.current) {
            const scrollAmount = 280;
            sliderRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {/* Breadcrumb */}
                    <nav className="text-sm mb-4">
                        <ol className="flex items-center gap-2 flex-wrap">
                            <li><a href="/" className="text-gray-500 hover:text-red-600">Beranda</a></li>
                            <li className="text-gray-400">›</li>
                            <li><a href="#" className="text-gray-500 hover:text-red-600">Kategori</a></li>
                            <li className="text-gray-400">›</li>
                            <li><a href="#" className="text-gray-500 hover:text-red-600">Low Voltage Siemens</a></li>
                            <li className="text-gray-400">›</li>
                            <li><a href="#" className="text-gray-500 hover:text-red-600">MCCB</a></li>
                            <li className="text-gray-400">›</li>
                            <li className="text-gray-900 font-medium">Siemens 3VA MCCB 100A 3-Pole 25kA</li>
                        </ol>
                    </nav>

                    {/* Product Detail Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left - Product Image */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                {/* Main Image */}
                                <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                                    <div className="w-3/4 h-3/4 bg-gray-200 rounded-lg" />
                                </div>

                                {/* Share Button */}
                                <button className="flex items-center justify-center gap-2 w-full text-sm text-teal-600 hover:text-teal-700">
                                    <Share2 className="w-4 h-4" />
                                    Bagikan Halaman
                                </button>
                            </div>
                        </div>

                        {/* Middle - Product Info */}
                        <div className="lg:col-span-5">
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                                Siemens 3VA MCCB 100A 3-Pole 25kA
                            </h1>
                            <p className="text-2xl md:text-3xl font-bold text-red-600 mb-2">
                                Rp {formatPrice(2150000)}
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                                Harga Termasuk PPN. Estimasi pengiriman dihitung saat checkout.
                            </p>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                                    Stok Terbatas
                                </span>
                                <span className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-200">
                                    Termasuk PPN
                                </span>
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-gray-200 mb-4">
                                <div className="flex gap-6">
                                    <button
                                        onClick={() => setActiveTab("specs")}
                                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "specs"
                                            ? "border-teal-600 text-teal-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        Spesifikasi Produk
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("description")}
                                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "description"
                                            ? "border-teal-600 text-teal-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        Deskripsi Produk
                                    </button>
                                </div>
                            </div>

                            {/* Tab Content */}
                            {activeTab === "specs" ? (
                                <div className="space-y-3">
                                    {productSpecs.map((spec) => (
                                        <div key={spec.label} className="flex">
                                            <span className="w-40 flex-shrink-0 text-sm text-gray-500">{spec.label}</span>
                                            {spec.isLink ? (
                                                <a href="#" className="text-sm text-teal-600 hover:underline">{spec.value}</a>
                                            ) : (
                                                <span className="text-sm text-gray-900">{spec.value}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-600 space-y-4">
                                    <p>Siemens 3VA MCCB (Molded Case Circuit Breaker) adalah solusi perlindungan sirkuit tingkat lanjut yang dirancang untuk keandalan dan keamanan maksimal pada sistem distribusi tenaga listrik tegangan rendah.</p>
                                    <p>Dilengkapi dengan teknologi pemutusan arus yang canggih, produk ini memastikan perlindungan optimal terhadap beban berlebih dan hubungan arus pendek (short circuit) pada instalasi industri maupun komersial.</p>
                                </div>
                            )}
                        </div>

                        {/* Right - Purchase Card */}
                        <div className="lg:col-span-3">
                            {/* Promo Banner */}
                            <div className="bg-teal-600 text-white rounded-xl p-4 mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Potensi Harga Terjun Bebas</p>
                                    <p className="text-sm">dengan Akun Bisnis!</p>
                                </div>
                                <span className="text-2xl">🎉</span>
                            </div>

                            {/* Purchase Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                                <p className="text-xl font-bold text-red-600 mb-4">
                                    Rp {formatPrice(2150000 * quantity)}
                                </p>

                                {/* Quantity */}
                                <p className="text-sm text-gray-600 mb-2">Atur Jumlah Pembelian</p>
                                <div className="flex items-center gap-3 mb-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-16 h-8 text-center border border-gray-300 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-gray-600">x Unit</span>
                                </div>

                                {/* Buttons */}
                                <Button className="w-full h-10 bg-red-600 hover:bg-red-700 text-white mb-2">
                                    Request for Quotation
                                </Button>
                                <Button variant="outline" className="w-full h-10 border-teal-600 text-teal-600 hover:bg-teal-50">
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Masukan Keranjang
                                </Button>

                                {/* Shipping Info */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-900 mb-2">Estimasi Pengiriman</p>
                                    <p className="text-xs text-gray-600">Jabodetabek: <span className="font-medium">2-4 hari kerja</span></p>
                                    <p className="text-xs text-gray-600">Luar Jabodetabek: <span className="font-medium">2-7 hari kerja</span></p>
                                </div>

                                {/* Contact CS */}
                                <button className="w-full mt-4 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                    <MessageCircle className="w-4 h-4" />
                                    Tanyakan detail produk ke CS
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Related Products */}
                    <section className="mt-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Produk Terkait</h2>
                            <div className="flex items-center gap-2">
                                <a href="#" className="text-sm text-teal-600 hover:underline mr-2">
                                    Lihat Semua
                                </a>
                                <button
                                    onClick={() => scrollRelated("left")}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => scrollRelated("right")}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Slider */}
                        <div
                            ref={sliderRef}
                            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                        >
                            {relatedProducts.map((product, index) => (
                                <motion.a
                                    key={product.id}
                                    href="#"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="group flex-shrink-0 w-52 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Product Image */}
                                    <div className="aspect-square bg-gray-100 relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-3/4 h-3/4 bg-gray-200 rounded-lg" />
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-3">
                                        <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-teal-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm font-bold text-red-600 mb-2">
                                            Rp {formatPrice(product.price)}
                                        </p>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-1">
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
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
