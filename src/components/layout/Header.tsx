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
        <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-3xs select-none">
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
                        whileHover={!isSearchFocused ? { scale: 1.015 } : {}}
                    >
                        <Link prefetch={false} href="/" className="flex items-center">
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
                        <div className="flex items-center gap-1.5 md:gap-3 mr-1 md:mr-3">
                            {/* Notifications - Only if logged in */}
                            {user && (
                                <NotificationDropdown userId={userId} />
                            )}

                            {/* Cart/Bag Trigger - Beautiful premium capsule backdrop */}
                            <Link prefetch={false} href="/keranjang">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="group relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 text-slate-600 hover:text-slate-900 border border-slate-100 hover:border-slate-200 transition-all duration-250 shadow-3xs"
                                >
                                    <ShoppingCart className="h-5 w-5 transition-colors duration-200" />
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 border border-white rounded-full text-[9px] text-white flex items-center justify-center font-black shadow-xs">
                                            {totalItems > 99 ? '99+' : totalItems}
                                        </span>
                                    )}
                                </motion.button>
                            </Link>
                        </div>

                        {/* Separator */}
                        <div className="hidden sm:block h-7 w-px bg-slate-200 mx-3.5" />

                        {/* Auth Buttons or User Menu - Desktop */}
                        <div className="hidden sm:flex items-center gap-2">
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-slate-50 transition-all border border-slate-100 hover:border-slate-200 shadow-3xs"
                                    >
                                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-red-100 flex items-center justify-center text-red-600 font-extrabold flex-shrink-0">
                                            {customerImage ? (
                                                <img src={customerImage} alt={user.name || "User"} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}</span>
                                            )}
                                        </div>
                                        <div className="text-left hidden lg:block">
                                            <p className="text-xs font-black text-slate-900 leading-none mb-1">
                                                {user.name || "Member Hokiindo"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold leading-none truncate max-w-[140px]">
                                                {user.email}
                                            </p>
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-hidden z-50"
                                            >
                                                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Akun Saya</p>
                                                </div>

                                                <Link prefetch={false} 
                                                    href="/dashboard"
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    Dashboard
                                                </Link>

                                                {user.role && ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(user.role) && (
                                                    <Link prefetch={false} 
                                                        href="/admin"
                                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors font-semibold"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <Settings className="w-4 h-4 text-red-600" />
                                                        Dashboard Admin
                                                    </Link>
                                                )}

                                                <Link prefetch={false} 
                                                    href="/dashboard/settings"
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <User className="w-4 h-4" />
                                                    Pengaturan
                                                </Link>

                                                <div className="border-t border-slate-50 my-1" />

                                                <button
                                                    onClick={handleLogoutClick}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold"
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
                                    {/* Sleek iOS/MacOS inspired Action buttons */}
                                    <Link href="/daftar" prefetch={false}>
                                        <motion.button
                                            whileHover={{ y: -1 }}
                                            whileTap={{ y: 0, scale: 0.98 }}
                                            className="h-10 px-5 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-3xs"
                                        >
                                            Daftar
                                        </motion.button>
                                    </Link>
                                    <Link href="/masuk" prefetch={false}>
                                        <motion.button
                                            whileHover={{ y: -1 }}
                                            whileTap={{ y: 0, scale: 0.98 }}
                                            className="h-10 px-5 rounded-xl text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-sm shadow-red-100/40 hover:shadow-md hover:shadow-red-200/30"
                                        >
                                            Masuk
                                        </motion.button>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5 text-slate-600" />
                            ) : (
                                <Menu className="h-5 w-5 text-slate-600" />
                            )}
                        </button>
                    </div>
                </div>


            </div>

            {/* Navigation Bar */}
            <nav className="hidden md:block border-t border-slate-100 bg-white/60 relative" ref={megaMenuRef}>
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
                                    flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all duration-200
                                    text-xs uppercase tracking-wider text-slate-700 hover:text-red-600 hover:bg-red-50/50
                                    ${isMegaMenuOpen ? "text-red-600 bg-red-50" : ""}
                                `}
                            >
                                <LayoutGrid className="h-4 w-4 text-red-500" />
                                <span>Kategori Produk</span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isMegaMenuOpen ? "rotate-180" : ""}`} />
                            </motion.button>

                            {/* Search Suggestions */}
                            {searchSuggestions.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 ml-2 mr-1">
                                        {!isHomePage && <div className="h-4 w-px bg-slate-200" />}
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider whitespace-nowrap">Saran Cepat :</span>
                                    </div>
                                    {searchSuggestions.map((term) => (
                                        <Link key={term} href={`/pencarian?q=${encodeURIComponent(term)}&page=1`} prefetch={false}>
                                            <motion.button
                                                whileHover={{ y: -1 }}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all duration-200 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50/40"
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
                                prefetch={false}
                                className="text-xs uppercase tracking-wider font-bold text-slate-600 hover:text-red-600 transition-colors"
                            >
                                Berita
                            </Link>
                            <a
                                href="/pesanan-besar"
                                className="text-xs uppercase tracking-wider font-bold text-slate-600 hover:text-red-600 transition-colors"
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
                                className="absolute left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 top-0 bg-white shadow-2xl border border-slate-100 z-50 rounded-b-2xl overflow-hidden"
                                style={{ maxWidth: "700px" }}
                            >
                                <div className="flex">
                                    {/* Left Sidebar - Categories */}
                                    <div className="w-52 bg-gradient-to-b from-slate-50 to-slate-100/50 py-3 border-r border-slate-100">
                                        <div className="px-4 mb-3">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori Produk</h3>
                                        </div>
                                        {categoriesToDisplay.map((cat, catIndex) => (
                                            <Link prefetch={false} 
                                                key={cat.id || cat.name}
                                                href={`/pencarian?q=&category=${encodeURIComponent(cat.name)}&page=1`}
                                                onMouseEnter={() => setActiveCategory(catIndex)}
                                                onClick={() => setIsMegaMenuOpen(false)}
                                                className={`
                                                w-full flex items-center gap-3 px-4 py-3 text-left text-xs uppercase tracking-wide font-extrabold transition-all duration-200
                                                ${activeCategory === catIndex
                                                        ? "bg-red-500 text-white shadow-md"
                                                        : "text-slate-700 hover:bg-white hover:shadow-sm"
                                                    }
                                            `}
                                            >
                                                <span className="flex-1">{cat.alias || cat.name}</span>
                                                <ChevronRight className={`h-4 w-4 transition-transform ${activeCategory === catIndex ? "text-white translate-x-1" : "text-slate-400"}`} />
                                            </Link>
                                        ))}

                                        {/* View All Link */}
                                        <div className="px-4 pt-4 mt-2 border-t border-slate-200">
                                            <Link
                                                href="/kategori"
                                                prefetch={false}
                                                className="flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold text-red-600 hover:text-red-700 transition-colors"
                                                onClick={() => setIsMegaMenuOpen(false)}
                                            >
                                                <LayoutGrid className="h-4 w-4" />
                                                <span>Lihat Semua Kategori</span>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Right Content - Subcategories */}
                                    <div className="flex-1 p-6 bg-white">
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                            <h3 className="text-sm font-black uppercase text-slate-800">{categoriesToDisplay[activeCategory]?.alias || categoriesToDisplay[activeCategory]?.name}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categoriesToDisplay[activeCategory]?.subcategories.map((subcat: any) => (
                                                <Link prefetch={false} 
                                                    key={subcat.id || subcat.name}
                                                    href={`/pencarian?q=&category=${encodeURIComponent(subcat.alias || subcat.name)}&page=1`}
                                                    onClick={() => setIsMegaMenuOpen(false)}
                                                    className="group flex items-center p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                >
                                                    <span className="text-xs text-slate-700 group-hover:text-red-600 font-bold uppercase tracking-wide">{subcat.alias || subcat.name}</span>
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
                        className="md:hidden border-t border-slate-100 bg-white overflow-y-auto overflow-x-hidden max-h-[calc(100vh-4rem)] overscroll-contain"
                    >
                        <div className="px-4 py-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Kategori Produk</h3>
                            <div className="grid grid-cols-1 gap-1">
                                {categoriesToDisplay.map((category, catIndex) => {
                                    const hasSubcats = category.subcategories && category.subcategories.length > 0;
                                    const isExpanded = mobileExpandedCat === catIndex;
                                    return (
                                    <div key={category.name} className="flex flex-col">
                                        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl group hover:bg-red-50 transition-colors">
                                            <Link prefetch={false} 
                                                href={`/pencarian?q=&category=${encodeURIComponent(category.name)}&page=1`}
                                                className="flex-1 px-2 py-1.5 text-slate-700 group-hover:text-red-600 transition-colors font-bold text-sm uppercase tracking-wide"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                {category.alias || category.name}
                                            </Link>
                                            {hasSubcats ? (
                                                <button 
                                                    onClick={() => setMobileExpandedCat(isExpanded ? null : catIndex)}
                                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-100"
                                                >
                                                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            ) : (
                                                <div className="p-2">
                                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            )}
                                        </div>
                                        <AnimatePresence>
                                            {isExpanded && hasSubcats && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-slate-50/50 mx-2 rounded-lg"
                                                >
                                                    <div className="py-2 px-3 flex flex-col gap-1">
                                                        {category.subcategories.map((subcat: any) => (
                                                            <Link prefetch={false} 
                                                                key={subcat.name}
                                                                href={`/pencarian?q=&category=${encodeURIComponent(subcat.alias || subcat.name)}&page=1`}
                                                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg flex items-center gap-2 uppercase tracking-wide"
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                            >
                                                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                                                {subcat.alias || subcat.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )})}
                                <div className="border-t border-slate-100 my-4" />
                                <Link prefetch={false} 
                                    href="/kategori"
                                    className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-slate-50 text-slate-900 hover:bg-red-600 hover:text-white transition-all duration-200 font-black text-xs uppercase tracking-wider"
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
                            <AlertDialogTitle className="text-lg font-black uppercase tracking-tight">Konfirmasi Logout</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-xs pt-2 font-semibold text-slate-500">
                            Apakah Anda yakin ingin keluar dari akun? Anda akan diarahkan ke halaman login.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="font-bold text-xs uppercase tracking-wider rounded-xl">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl"
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
