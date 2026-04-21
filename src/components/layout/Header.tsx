"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    LayoutGrid,
    User,
    LogOut,
    Settings,
    LayoutDashboard,
    Zap,
    Bell,
    ExternalLink,
    ShoppingCart,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/useCart";
import SearchBox from "./SearchBox";
import NotificationDropdown from "./NotificationDropdown";

const AlertDialog = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialog));
const AlertDialogAction = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogAction));
const AlertDialogCancel = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogCancel));
const AlertDialogContent = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogContent));
const AlertDialogDescription = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogDescription));
const AlertDialogFooter = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogFooter));
const AlertDialogHeader = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogHeader));
const AlertDialogTitle = dynamic(() => import("@/components/ui/alert-dialog").then(mod => mod.AlertDialogTitle));

import { getUserNotifications, markNotificationAsRead } from "@/app/actions/notification";
import dynamic from "next/dynamic";
// ... imports

interface HeaderProps {
    user?: {
        name?: string;
        email?: string;
        role?: string;
        customerId?: string;
        id?: string;
    } | null;
    menuConfig?: any[];
    searchSuggestions?: string[];
    customerImage?: string | null;
    userId?: string;
    companyDetails?: {
        name: string;
        logo: string | null;
        favicon: string | null;
    } | null;
}

const navCategories = [
    { name: "Kategori Produk" },
];

// Helper to map icon string to component
const getIconComponent = (iconName: string) => {
    switch (iconName) {
        case "zap": return <Zap className="w-5 h-5" />;
        case "layout-grid": return <LayoutGrid className="w-5 h-5" />;
        case "chevron-right": return <ChevronRight className="w-5 h-5" />;
        default: return <ChevronRight className="w-5 h-5" />;
    }
};

const defaultMegaMenuCategories = [
    {
        name: "Low Voltage Product",
        alias: "Low Voltage Product",
        icon: <Zap className="w-5 h-5" />,
        subcategories: [
            { name: "Circuit Breaker", count: 120 },
            { name: "Surge Protection", count: 45 },
            { name: "Fuse & Holder", count: 68 },
            { name: "Busbar System", count: 32 },
        ]
    },
    {
        name: "Control Product",
        alias: "Control Product",
        icon: <Zap className="w-5 h-5" />,
        subcategories: [
            { name: "Relays", count: 85 },
            { name: "Contactors", count: 64 },
            { name: "Motor Starters", count: 42 }
        ]
    },
    {
        name: "Industrial Lighting",
        alias: "Industrial Lighting",
        icon: <Zap className="w-5 h-5" />,
        subcategories: [
            { name: "High Bay Lights", count: 15 },
            { name: "Floodlights", count: 28 },
            { name: "Emergency Lighting", count: 12 }
        ]
    },
    {
        name: "Others",
        alias: "Others",
        icon: <Zap className="w-5 h-5" />,
        subcategories: [
            { name: "Cables & Wires", count: 250 },
            { name: "Tools & Accessories", count: 140 }
        ]
    }
];

export default function Header({ user, menuConfig, searchSuggestions = [], customerImage, userId, companyDetails }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const [mobileExpandedCat, setMobileExpandedCat] = useState<number | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const megaMenuRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    const { totalItems } = useCart();
    const router = useRouter();
    const pathname = usePathname();
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const isHomePage = pathname === "/";

    const categoriesToDisplay = (menuConfig && menuConfig.length > 0) ? menuConfig : defaultMegaMenuCategories;

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
                setIsMegaMenuOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Setup search focus change
    useEffect(() => {
        if (isSearchFocused) {
            setIsMobileMenuOpen(false);
        }
    }, [isSearchFocused]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        const { logoutAction } = await import("@/app/actions/auth");
        await logoutAction();
        setIsLoggingOut(false);
        setShowLogoutDialog(false);
    };

    const handleLogoutClick = () => {
        setIsUserMenuOpen(false);
        setShowLogoutDialog(true);
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
            {/* Top Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20 gap-4">

                    {/* Logo */}
                    <motion.div
                        className={`flex-shrink-0 transition-all duration-300 ${
                            isSearchFocused
                                ? "w-0 opacity-0 overflow-hidden md:w-auto md:opacity-100 md:overflow-visible"
                                : "w-auto opacity-100"
                        }`}
                        whileHover={!isSearchFocused ? { scale: 1.02 } : {}}
                    >
                        <Link href="/" className="flex items-center">
                            {/* Desktop Logo */}
                            {companyDetails?.logo ? (
                                <img
                                    src={companyDetails.logo}
                                    alt={companyDetails.name || "Hokiindo Logo"}
                                    className="hidden md:block h-10 w-auto object-contain"
                                />
                            ) : (
                                <Image
                                    src="/logo.png"
                                    alt="Hokiindo Logo"
                                    width={160}
                                    height={50}
                                    className="hidden md:block h-10 w-auto object-contain"
                                    priority
                                />
                            )}
                            {/* Mobile Logo */}
                            <Image
                                src="/logo-H.png"
                                alt="Hokiindo Logo"
                                width={32}
                                height={32}
                                className="md:hidden h-8 w-auto object-contain"
                                priority
                            />
                        </Link>
                    </motion.div>

                    {/* Mobile: Search Box - expands on focus */}
                    <div className="md:hidden flex-1 mx-1">
                        <SearchBox isMobile onFocusChange={setIsSearchFocused} />
                    </div>

                    <div className="hidden md:flex flex-1 max-w-3xl mx-8">
                        <SearchBox />
                    </div>

                    {/* Right Actions */}
                    <div className={`flex items-center text-sm transition-all duration-300 ${
                        isSearchFocused
                            ? "w-0 opacity-0 overflow-hidden pointer-events-none md:w-auto md:opacity-100 md:overflow-visible md:pointer-events-auto"
                            : "w-auto opacity-100"
                    }`}>
                        {/* Notifications & Cart Container */}
                        <div className="flex items-center gap-1 md:gap-4 mr-1 md:mr-4">
                            {/* Notifications - Only if logged in */}
                            {user && (
                                <NotificationDropdown userId={userId} />
                            )}

                            {/* Cart/Bag */}
                            <Link href="/keranjang">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="group relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
                                >
                                    <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 transition-colors duration-200" />
                                    {totalItems > 0 && (
                                        <span className="absolute top-1 right-1 h-4 w-4 md:h-4.5 md:w-4.5 bg-red-600 border-2 border-white rounded-full text-[8px] md:text-[9px] text-white flex items-center justify-center font-bold">
                                            {totalItems > 99 ? '99+' : totalItems}
                                        </span>
                                    )}
                                </motion.button>
                            </Link>
                        </div>

                        {/* Separator */}
                        <div className="hidden sm:block h-8 w-px bg-gray-200 mx-4" />

                        {/* Auth Buttons or User Menu - Desktop */}
                        <div className="hidden sm:flex items-center gap-2">
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                                    >
                                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-red-100 flex items-center justify-center text-red-600 font-bold flex-shrink-0">
                                            {customerImage ? (
                                                <img src={customerImage} alt={user.name || "User"} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}</span>
                                            )}
                                        </div>
                                        <div className="text-left hidden lg:block">
                                            <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                                                {user.name || "Member Hokiindo"}
                                            </p>
                                            <p className="text-xs text-gray-500 leading-none truncate max-w-[150px]">
                                                {user.email}
                                            </p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden z-50"
                                            >
                                                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                                    <p className="text-sm font-semibold text-gray-900">Akun Saya</p>
                                                </div>

                                                <Link
                                                    href="/dashboard"
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    Dashboard
                                                </Link>

                                                <Link
                                                    href="/dashboard/settings"
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Pengaturan
                                                </Link>

                                                <div className="border-t border-gray-50 my-1" />

                                                <button
                                                    onClick={handleLogoutClick}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Keluar
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
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
                            {/* Category Dropdown */}
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
                                <span>Kategori Produk</span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isMegaMenuOpen ? "rotate-180" : ""}`} />
                            </motion.button>

                            {/* Search Suggestions */}
                            {searchSuggestions.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 ml-2 mr-1">
                                        {!isHomePage && <div className="h-4 w-px bg-gray-200" />}
                                        <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Saran Cepat :</span>
                                    </div>
                                    {searchSuggestions.map((term) => (
                                        <Link key={term} href={`/pencarian?q=${encodeURIComponent(term)}&page=1`}>
                                            <motion.button
                                                whileHover={{ y: -1 }}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <span>{term}</span>
                                            </motion.button>
                                        </Link>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Right Navigation */}
                        <div className="flex items-center gap-6">
                            <Link
                                href="/berita"
                                className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                            >
                                Berita
                            </Link>
                            <a
                                href="/pesanan-besar"
                                className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                            >
                                Bulk Order
                            </a>
                        </div>
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
                                style={{ maxWidth: "700px" }}
                            >
                                <div className="flex">
                                    {/* Left Sidebar - Categories */}
                                    <div className="w-52 bg-gradient-to-b from-gray-50 to-gray-100/50 py-3 border-r border-gray-100">
                                        <div className="px-4 mb-3">
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kategori Produk</h3>
                                        </div>
                                        {categoriesToDisplay.map((cat, catIndex) => (
                                            <Link
                                                key={cat.id || cat.name}
                                                href={`/pencarian?q=&category=${encodeURIComponent(cat.name)}&page=1`}
                                                onMouseEnter={() => setActiveCategory(catIndex)}
                                                onClick={() => setIsMegaMenuOpen(false)}
                                                className={`
                                                w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all duration-200
                                                ${activeCategory === catIndex
                                                        ? "bg-red-500 text-white shadow-md"
                                                        : "text-gray-700 hover:bg-white hover:shadow-sm"
                                                    }
                                            `}
                                            >
                                                <span className="flex-1">{cat.alias || cat.name}</span>
                                                <ChevronRight className={`h-4 w-4 transition-transform ${activeCategory === catIndex ? "text-white translate-x-1" : "text-gray-400"}`} />
                                            </Link>
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
                                            <h3 className="text-lg font-bold text-gray-900">{categoriesToDisplay[activeCategory]?.alias || categoriesToDisplay[activeCategory]?.name}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categoriesToDisplay[activeCategory]?.subcategories.map((subcat: any) => (
                                                <Link
                                                    key={subcat.id || subcat.name}
                                                    href={`/pencarian?q=&category=${encodeURIComponent(subcat.alias || subcat.name)}&page=1`}
                                                    onClick={() => setIsMegaMenuOpen(false)}
                                                    className="group flex items-center p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                >
                                                    <span className="text-sm text-gray-700 group-hover:text-red-600 font-medium">{subcat.alias || subcat.name}</span>
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
                        className="md:hidden border-t border-gray-100 bg-white overflow-y-auto overflow-x-hidden max-h-[calc(100vh-4rem)] overscroll-contain"
                    >
                        <div className="px-4 py-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Kategori Produk</h3>
                            <div className="grid grid-cols-1 gap-1">
                                {categoriesToDisplay.map((category, catIndex) => {
                                    const hasSubcats = category.subcategories && category.subcategories.length > 0;
                                    const isExpanded = mobileExpandedCat === catIndex;
                                    return (
                                    <div key={category.name} className="flex flex-col">
                                        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl group hover:bg-red-50 transition-colors">
                                            <Link
                                                href={`/pencarian?q=&category=${encodeURIComponent(category.name)}&page=1`}
                                                className="flex-1 px-2 py-1.5 text-gray-700 group-hover:text-red-600 transition-colors font-semibold text-sm"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {category.alias || category.name}
                                            </Link>
                                            {hasSubcats ? (
                                                <button 
                                                    onClick={() => setMobileExpandedCat(isExpanded ? null : catIndex)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-100"
                                                >
                                                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            ) : (
                                                <div className="p-2">
                                                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            )}
                                        </div>
                                        <AnimatePresence>
                                            {isExpanded && hasSubcats && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-gray-50/50 mx-2 rounded-lg"
                                                >
                                                    <div className="py-2 px-3 flex flex-col gap-1">
                                                        {category.subcategories.map((subcat: any) => (
                                                            <Link
                                                                key={subcat.name}
                                                                href={`/pencarian?q=&category=${encodeURIComponent(subcat.alias || subcat.name)}&page=1`}
                                                                className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg flex items-center gap-2"
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                            >
                                                                <span className="w-1 h-1 rounded-full bg-gray-400" />
                                                                {subcat.alias || subcat.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )})}
                                <div className="border-t border-gray-100 my-4" />
                                <Link
                                    href="/kategori"
                                    className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-gray-50 text-gray-900 hover:bg-red-600 hover:text-white transition-all duration-200 font-bold text-sm"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    Lihat Semua Kategori
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent className="max-w-md rounded-2xl">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <AlertDialogTitle className="text-lg">Konfirmasi Logout</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm pt-2">
                            Apakah Anda yakin ingin keluar dari akun? Anda akan diarahkan ke halaman login.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="font-medium">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium"
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <LogOut className="w-4 h-4 mr-2" />
                            )}
                            Ya, Keluar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </header>
    );
}
