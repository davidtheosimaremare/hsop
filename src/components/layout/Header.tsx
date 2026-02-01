"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navCategories = [
    { name: "Kategori", hasDropdown: true },
    { name: "MCB & MCCB", hasDropdown: false },
    { name: "Contactor", hasDropdown: false },
    { name: "Motor Starter", hasDropdown: false },
    { name: "Push Button", hasDropdown: false },
    { name: "LED Lighting", hasDropdown: false },
    { name: "Cable & Gland", hasDropdown: false },
    { name: "Panel Board", hasDropdown: false },
    { name: "Surge Protection", hasDropdown: false },
];

// Mega menu categories with subcategories and icons
const megaMenuCategories = [
    {
        name: "Low Voltage Product",
        icon: "⚡",
        subcategories: [
            { name: "Air Circuit Breaker (ACB)", count: 24 },
            { name: "Miniature Circuit Breaker (MCB)", count: 156 },
            { name: "Moulded Case Circuit Breaker (MCCB)", count: 89 },
            { name: "Residual Current Device (RCCB)", count: 45 },
            { name: "Surge Protection Device (SPD)", count: 67 },
            { name: "Fuse & Fuse Holder", count: 38 },
        ]
    },
    {
        name: "Control Product",
        icon: "🎛️",
        subcategories: [
            { name: "Contactor", count: 120 },
            { name: "Motor Starter", count: 45 },
            { name: "Thermal Overload Relay", count: 78 },
            { name: "Timer & Counter", count: 56 },
            { name: "Push Button & Pilot Lamp", count: 234 },
            { name: "Selector Switch", count: 89 },
        ]
    },
    {
        name: "Portable Lighting",
        icon: "💡",
        subcategories: [
            { name: "LED Floodlight", count: 67 },
            { name: "LED High Bay", count: 45 },
            { name: "LED Street Light", count: 34 },
            { name: "LED Panel Light", count: 89 },
            { name: "Emergency Light", count: 56 },
            { name: "Explosion Proof Light", count: 23 },
        ]
    },
    {
        name: "Cable & Accessories",
        icon: "🔌",
        subcategories: [
            { name: "Power Cable", count: 145 },
            { name: "Control Cable", count: 78 },
            { name: "Cable Gland", count: 234 },
            { name: "Cable Lug", count: 156 },
            { name: "Cable Tray", count: 67 },
            { name: "Conduit & Fitting", count: 189 },
        ]
    },
    {
        name: "Panel & Enclosure",
        icon: "🗄️",
        subcategories: [
            { name: "Distribution Board", count: 56 },
            { name: "Metal Enclosure", count: 89 },
            { name: "Plastic Enclosure", count: 67 },
            { name: "Floor Standing Panel", count: 34 },
            { name: "Din Rail & Terminal Block", count: 234 },
            { name: "Panel Accessories", count: 178 },
        ]
    },
];

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const megaMenuRef = useRef<HTMLDivElement>(null);

    // Close mega menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
                setIsMegaMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100">
            {/* Top Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20 gap-4">

                    {/* Logo */}
                    <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <Link href="/" className="flex items-center">
                            {/* Desktop Logo */}
                            <Image
                                src="/logo.png"
                                alt="Hokiindo Logo"
                                width={160}
                                height={50}
                                className="hidden md:block h-10 w-auto object-contain"
                                priority
                            />
                            {/* Mobile Logo */}
                            <Image
                                src="/logo-H.png"
                                alt="Hokiindo Logo"
                                width={40}
                                height={40}
                                className="md:hidden h-8 w-auto object-contain"
                                priority
                            />
                        </Link>
                    </motion.div>

                    <div className="md:hidden flex-1 mx-2">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            window.location.href = `/pencarian?q=${encodeURIComponent(searchQuery)}`;
                        }} className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 rounded-full border border-gray-200 focus:border-red-500 focus:ring-0 focus:outline-none bg-white text-sm"
                            />
                        </form>
                    </div>

                    <div className="hidden md:flex flex-1 max-w-3xl mx-8">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            window.location.href = `/pencarian?q=${encodeURIComponent(searchQuery)}`;
                        }} className="relative w-full group">
                            <Input
                                type="text"
                                placeholder="Apa kebutuhan proyek Anda?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-4 pr-14 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-0 focus:outline-none bg-white"
                            />
                            <Button
                                type="submit"
                                variant="red"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-11 rounded-lg transition-all duration-300"
                            >
                                <Search className="h-4 w-4 text-white" />
                            </Button>
                        </form>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center">
                        {/* Cart/Bag */}
                        <Link href="/keranjang">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative p-2 mr-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                            >
                                <Image
                                    src="/bag.png"
                                    alt="Keranjang"
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200"
                                />
                                <span className="absolute -top-1 -right-1.5 h-[14px] min-w-[18px] px-1 bg-[#FF0000] border border-white rounded-sm text-[9px] text-white flex items-center justify-center font-semibold">
                                    0
                                </span>
                            </motion.button>
                        </Link>

                        {/* Separator */}
                        <div className="hidden sm:block h-8 w-px bg-gray-200 mx-4" />

                        {/* Auth Buttons - Desktop */}
                        <div className="hidden sm:flex items-center gap-2">
                            <Link href="/daftar">
                                <Button
                                    variant="outline"
                                    className="h-10 px-6 rounded-xl font-medium transition-all duration-300"
                                >
                                    Daftar
                                </Button>
                            </Link>
                            <Link href="/masuk">
                                <Button
                                    variant="red"
                                    className="h-10 px-6 rounded-xl font-medium transition-all duration-300"
                                >
                                    Masuk
                                </Button>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5 text-gray-600" />
                            ) : (
                                <Menu className="h-5 w-5 text-gray-600" />
                            )}
                        </button>
                    </div>
                </div>


            </div>

            {/* Navigation Bar */}
            <nav className="hidden md:block border-t border-gray-100 bg-white/60 relative" ref={megaMenuRef}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12">
                        {/* Categories */}
                        <div className="flex items-center gap-1">
                            {navCategories.map((category, index) => (
                                <React.Fragment key={category.name}>
                                    {index === 1 && (
                                        <div className="flex items-center gap-2 ml-2 mr-1">
                                            <div className="h-4 w-px bg-gray-200" />
                                            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Rekomendasi:</span>
                                        </div>
                                    )}
                                    {index === 0 ? (
                                        <motion.button
                                            whileHover={{ y: -1 }}
                                            onClick={() => {
                                                setIsMegaMenuOpen(!isMegaMenuOpen);
                                                setActiveCategory(0);
                                            }}
                                            className={`
                                                flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all duration-200
                                                text-sm text-gray-700 hover:text-red-600 hover:bg-red-50
                                                ${isMegaMenuOpen ? "text-red-600 bg-red-50" : ""}
                                            `}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                            <span>{category.name}</span>
                                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isMegaMenuOpen ? "rotate-180" : ""}`} />
                                        </motion.button>
                                    ) : (
                                        <Link href={`/pencarian?q=${encodeURIComponent(category.name)}`}>
                                            <motion.button
                                                whileHover={{ y: -1 }}
                                                className={`
                                                    flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all duration-200
                                                    text-xs text-gray-600 hover:text-red-600 hover:bg-red-50
                                                `}
                                            >
                                                <span>{category.name}</span>
                                            </motion.button>
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Right Navigation */}
                        <a
                            href="#"
                            className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                        >
                            Berita
                        </a>
                    </div>
                </div>

                {/* Mega Menu Dropdown - Modern Design */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <AnimatePresence>
                        {isMegaMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 top-0 bg-white shadow-2xl border border-gray-100 z-50 rounded-b-2xl overflow-hidden"
                                style={{ maxWidth: "900px" }}
                            >
                                <div className="flex">
                                    {/* Left Sidebar - Categories */}
                                    <div className="w-64 bg-gradient-to-b from-gray-50 to-gray-100/50 py-3 border-r border-gray-100">
                                        <div className="px-4 mb-3">
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kategori Produk</h3>
                                        </div>
                                        {megaMenuCategories.map((cat, catIndex) => (
                                            <button
                                                key={cat.name}
                                                onMouseEnter={() => setActiveCategory(catIndex)}
                                                onClick={() => setActiveCategory(catIndex)}
                                                className={`
                                                w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all duration-200
                                                ${activeCategory === catIndex
                                                        ? "bg-red-500 text-white shadow-md"
                                                        : "text-gray-700 hover:bg-white hover:shadow-sm"
                                                    }
                                            `}
                                            >
                                                <span className="text-lg">{cat.icon}</span>
                                                <span className="flex-1">{cat.name}</span>
                                                <ChevronRight className={`h-4 w-4 transition-transform ${activeCategory === catIndex ? "text-white translate-x-1" : "text-gray-400"}`} />
                                            </button>
                                        ))}

                                        {/* View All Link */}
                                        <div className="px-4 pt-4 mt-2 border-t border-gray-200">
                                            <Link
                                                href="/kategori"
                                                className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                                                onClick={() => setIsMegaMenuOpen(false)}
                                            >
                                                <LayoutGrid className="h-4 w-4" />
                                                <span>Lihat Semua Kategori</span>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Right Content - Subcategories */}
                                    <div className="flex-1 p-6 bg-white">
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                            <span className="text-2xl">{megaMenuCategories[activeCategory]?.icon}</span>
                                            <h3 className="text-lg font-bold text-gray-900">{megaMenuCategories[activeCategory]?.name}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {megaMenuCategories[activeCategory]?.subcategories.map((subcat) => (
                                                <Link
                                                    key={subcat.name}
                                                    href={`/produk/${subcat.name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                                                    onClick={() => setIsMegaMenuOpen(false)}
                                                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-all duration-200"
                                                >
                                                    <span className="text-sm text-gray-700 group-hover:text-red-600 font-medium">{subcat.name}</span>
                                                    <span className="text-xs text-gray-400 bg-gray-100 group-hover:bg-red-100 group-hover:text-red-600 px-2 py-0.5 rounded-full transition-colors">{subcat.count}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-gray-100 bg-white"
                    >
                        <div className="px-4 py-4 space-y-3">
                            {/* Mobile Auth Buttons */}
                            <div className="flex gap-2 pb-3 border-b border-gray-100">
                                <Link href="/daftar" className="flex-1">
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 rounded-xl border-2 border-gray-200"
                                    >
                                        Daftar
                                    </Button>
                                </Link>
                                <Link href="/masuk" className="flex-1">
                                    <Button
                                        variant="red"
                                        className="w-full h-10 rounded-xl"
                                    >
                                        Masuk
                                    </Button>
                                </Link>
                            </div>

                            {/* Mobile Categories */}
                            <div className="space-y-1">
                                {megaMenuCategories.map((category) => (
                                    <Link
                                        key={category.name}
                                        href={`/pencarian?q=${encodeURIComponent(category.name)}`}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{category.icon}</span>
                                            <span className="font-medium">{category.name}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </Link>
                                ))}
                                <div className="border-t border-gray-100 my-2" />
                                <Link
                                    href="/kategori"
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    Lihat Semua Kategori
                                </Link>
                                <Link
                                    href="#"
                                    className="flex items-center px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Berita
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
