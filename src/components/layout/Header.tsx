"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
    { name: "Besi Beton", hasDropdown: false },
    { name: "Bata Ringan", hasDropdown: false },
    { name: "Keramik", hasDropdown: false },
    { name: "Granite Tile", hasDropdown: false },
    { name: "Pipa PVC", hasDropdown: false },
    { name: "Triplek", hasDropdown: false },
    { name: "Kloset Duduk", hasDropdown: false },
    { name: "Cat Dinding", hasDropdown: false },
];

// Mega menu categories with subcategories
const megaMenuCategories = [
    {
        name: "Low Voltage Product",
        subcategories: [
            "Air Circuit Breaker (ACB)",
            "Miniature Circuit Breaker",
            "Miniature Circuit Breaker (MCCB)",
            "Molded Case Circuit Breaker",
            "Residual Current Device",
            "Surge Protection Device",
        ]
    },
    {
        name: "Control Product",
        subcategories: [
            "Contactor",
            "Motor Starter",
            "Thermal Overload Relay",
            "Timer & Counter",
            "Push Button & Pilot Lamp",
            "Selector Switch",
        ]
    },
    {
        name: "Portable Lighting",
        subcategories: [
            "LED Floodlight",
            "LED High Bay",
            "LED Street Light",
            "LED Panel Light",
            "Emergency Light",
            "Explosion Proof Light",
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
                        <a href="/" className="flex items-center">
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
                        </a>
                    </motion.div>

                    {/* Search Bar - Mobile (inline with logo) */}
                    <div className="md:hidden flex-1 mx-2">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 rounded-full border border-gray-200 focus:border-gray-300 focus:ring-0 bg-white text-sm"
                            />
                        </div>
                    </div>

                    {/* Search Bar - Desktop */}
                    <div className="hidden md:flex flex-1 max-w-3xl mx-8">
                        <div className="relative w-full group">
                            <Input
                                type="text"
                                placeholder="Apa kebutuhan proyek Anda?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-4 pr-14 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-0 transition-all duration-300 bg-white"
                            />
                            <Button
                                variant="red"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-11 rounded-lg transition-all duration-300"
                            >
                                <Search className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center">
                        {/* Cart/Bag */}
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

                        {/* Separator */}
                        <div className="hidden sm:block h-8 w-px bg-gray-200 mx-4" />

                        {/* Auth Buttons - Desktop */}
                        <div className="hidden sm:flex items-center gap-2">
                            <a href="/daftar">
                                <Button
                                    variant="outline"
                                    className="h-10 px-6 rounded-xl font-medium transition-all duration-300"
                                >
                                    Daftar
                                </Button>
                            </a>
                            <a href="/masuk">
                                <Button
                                    variant="red"
                                    className="h-10 px-6 rounded-xl font-medium transition-all duration-300"
                                >
                                    Masuk
                                </Button>
                            </a>
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
                                <>
                                    {index === 1 && (
                                        <div className="flex items-center gap-2 ml-2 mr-1">
                                            <div className="h-4 w-px bg-gray-200" />
                                            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Rekomendasi:</span>
                                        </div>
                                    )}
                                    <motion.button
                                        key={category.name}
                                        whileHover={{ y: -1 }}
                                        onClick={() => {
                                            if (index === 0) {
                                                setIsMegaMenuOpen(!isMegaMenuOpen);
                                                setActiveCategory(0);
                                            }
                                        }}
                                        className={`
                                            flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all duration-200
                                            ${index === 0 ? "text-sm" : "text-xs"}
                                            ${index === 0 && isMegaMenuOpen
                                                ? "text-red-600 bg-red-50"
                                                : index === 0
                                                    ? "text-gray-700 hover:text-red-600 hover:bg-red-50"
                                                    : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                            }
                                        `}
                                    >
                                        {index === 0 && (
                                            <LayoutGrid className="h-4 w-4" />
                                        )}
                                        <span>{category.name}</span>
                                        {category.hasDropdown && (
                                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isMegaMenuOpen ? "rotate-180" : ""}`} />
                                        )}
                                    </motion.button>
                                </>
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

                {/* Mega Menu Dropdown - Positioned below nav border */}
                <AnimatePresence>
                    {isMegaMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full bg-white shadow-xl border border-t-0 border-gray-200 z-50 rounded-b-2xl overflow-hidden"
                            style={{ width: "calc(100% - 2rem)", maxWidth: "1280px" }}
                        >
                            <div className="max-w-7xl mx-auto">
                                <div className="flex">
                                    {/* Left Sidebar - Categories */}
                                    <div className="w-56 bg-gray-50/80 py-4 border-r border-gray-100">
                                        {megaMenuCategories.map((cat, catIndex) => (
                                            <button
                                                key={cat.name}
                                                onMouseEnter={() => setActiveCategory(catIndex)}
                                                onClick={() => setActiveCategory(catIndex)}
                                                className={`
                                                    w-full flex items-center justify-between px-5 py-3 text-left text-sm font-medium transition-all duration-200
                                                    ${activeCategory === catIndex
                                                        ? "bg-red-500 text-white"
                                                        : "text-gray-700 hover:bg-gray-100"
                                                    }
                                                `}
                                            >
                                                <span>{cat.name}</span>
                                                <ChevronRight className={`h-4 w-4 ${activeCategory === catIndex ? "text-white" : "text-gray-400"}`} />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Right Content - Subcategories */}
                                    <div className="flex-1 p-6">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                            {megaMenuCategories[activeCategory]?.subcategories.map((subcat) => (
                                                <a
                                                    key={subcat}
                                                    href="#"
                                                    className="text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 py-1"
                                                >
                                                    {subcat}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                                <a href="/daftar" className="flex-1">
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 rounded-xl border-2 border-gray-200"
                                    >
                                        Daftar
                                    </Button>
                                </a>
                                <a href="/masuk" className="flex-1">
                                    <Button
                                        variant="red"
                                        className="w-full h-10 rounded-xl"
                                    >
                                        Masuk
                                    </Button>
                                </a>
                            </div>

                            {/* Mobile Categories - Only show megaMenuCategories */}
                            <div className="space-y-1">
                                {megaMenuCategories.map((category) => (
                                    <a
                                        key={category.name}
                                        href="#"
                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium">{category.name}</span>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </a>
                                ))}
                                <div className="border-t border-gray-100 my-2" />
                                <a
                                    href="#"
                                    className="flex items-center px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Berita
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
