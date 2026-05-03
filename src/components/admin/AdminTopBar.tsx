"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Bell,
    X,
    FileText,
    Package,
    Users,
    ShoppingCart,
    Clock,
    CheckCheck,
    Loader2,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Zap,
    Globe,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useAuth } from "@/components/auth/CanAccess";
import { purgeSystemCache } from "@/app/actions/settings";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

interface SearchResult {
    type: string;
    title: string;
    subtitle: string;
    href: string;
    icon: string;
}

export default function AdminTopBar() {
    const router = useRouter();
    const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [isPurging, setIsPurging] = useState(false);
    const [purgeSuccess, setPurgeSuccess] = useState(false);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ⌘K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 80);
            }
            if (e.key === "Escape") { setShowSearch(false); setShowNotif(false); setShowProfile(false); }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Search
    const doSearch = useCallback(async (q: string) => {
        if (!q || q.length < 2) { setSearchResults([]); setIsSearching(false); return; }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
            if (res.ok) { const data = await res.json(); setSearchResults(data.results || []); }
        } catch { setSearchResults([]); }
        setIsSearching(false);
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(value), 300);
    };

    const markAsRead = async (id: string) => {
        await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        fetchNotifications();
    };

    const markAllRead = async () => {
        await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
        fetchNotifications();
    };

    const handleLogout = async () => {
        const { logoutAction } = await import("@/app/actions/auth");
        await logoutAction();
    };

    const handlePurgeCache = async () => {
        if (isPurging) return;
        setIsPurging(true);
        try {
            await purgeSystemCache();
            setPurgeSuccess(true);
            setTimeout(() => setPurgeSuccess(false), 3000);
            router.refresh();
        } catch { /* silent */ }
        setIsPurging(false);
    };

    const iconMap: Record<string, React.ReactNode> = {
        file: <FileText className="w-4 h-4 text-red-500" />,
        package: <Package className="w-4 h-4 text-blue-500" />,
        user: <Users className="w-4 h-4 text-purple-500" />,
        cart: <ShoppingCart className="w-4 h-4 text-green-500" />,
    };

    const notifTypeColors: Record<string, string> = {
        INFO: "bg-blue-500", SUCCESS: "bg-green-500", WARNING: "bg-amber-500", ERROR: "bg-red-500", ORDER: "bg-purple-500",
    };

    const userInitials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : user?.email?.slice(0, 2).toUpperCase() || "AD";

    const roleLabel: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        ADMIN: "Admin",
        MANAGER: "Manager",
        STAFF: "Staff",
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-slate-100 shadow-sm flex items-center px-4 gap-3">
            {/* Logo — matches sidebar collapsed width */}
            <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-H.png" alt="Hokiindo" className="h-8 w-8 object-contain" />
            </div>

            {/* Global Search — stretches */}
            <div ref={searchRef} className="relative flex-1 max-w-2xl">
                <div
                    className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-text hover:border-slate-300 hover:bg-white transition-all"
                    onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                >
                    <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Cari penawaran, produk, customer..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => setShowSearch(true)}
                        className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 min-w-0"
                    />
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {searchQuery ? (
                            <button onClick={(e) => { e.stopPropagation(); setSearchQuery(""); setSearchResults([]); }} className="p-0.5 rounded hover:bg-slate-200 transition-colors">
                                <X className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                        ) : (
                            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-400">⌘K</kbd>
                        )}
                    </div>
                </div>

                {/* Search Dropdown */}
                {showSearch && searchQuery.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
                        {isSearching ? (
                            <div className="flex items-center justify-center py-8 gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                <span className="text-sm text-slate-400">Mencari...</span>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="py-1.5">
                                {searchResults.map((r, i) => (
                                    <button key={i} onClick={() => { router.push(r.href); setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            {iconMap[r.icon] || iconMap.file}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-bold text-slate-900 block truncate">{r.title}</span>
                                            <span className="text-[11px] text-slate-400 truncate block">{r.subtitle}</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex-shrink-0">
                                            {r.type === "quotation" ? "Penawaran" : r.type === "product" ? "Produk" : r.type === "customer" ? "Customer" : "Pesanan"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center">
                                <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Tidak ada hasil untuk &quot;{searchQuery}&quot;</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 ml-auto">
                {/* Ke Website Utama */}
                <a
                    href="https://shop.hokiindo.co.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka Website"
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <Globe className="w-[18px] h-[18px]" />
                </a>

                {/* Clear Cache Button */}
                <button
                    onClick={handlePurgeCache}
                    title="Hapus Cache Sistem"
                    disabled={isPurging}
                    className={cn(
                        "relative w-9 h-9 flex items-center justify-center rounded-lg transition-all",
                        purgeSuccess 
                            ? "bg-green-100 text-green-600" 
                            : "hover:bg-slate-100 text-slate-500"
                    )}
                >
                    {isPurging ? (
                        <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    ) : purgeSuccess ? (
                        <CheckCheck className="w-[18px] h-[18px]" />
                    ) : (
                        <Zap className="w-[18px] h-[18px]" />
                    )}
                </button>

                {/* Notification Bell */}
                <div ref={notifRef} className="relative">
                    <button
                        onClick={() => { setShowNotif(!showNotif); setShowProfile(false); if (!showNotif) fetchNotifications(); }}
                        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <Bell className="w-[18px] h-[18px] text-slate-500" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotif && (
                        <div className="absolute top-full right-0 mt-2 w-[360px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black text-slate-900">Notifikasi</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unreadCount} baru</span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors">
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Tandai semua dibaca
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[380px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Bell className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                                        <p className="text-sm text-slate-400">Belum ada notifikasi</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <button key={n.id}
                                            onClick={() => { if (!n.read) markAsRead(n.id); if (n.link) { router.push(n.link); setShowNotif(false); } }}
                                            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-b-0 ${!n.read ? "bg-blue-50/40" : ""}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? (notifTypeColors[n.type] || "bg-blue-500") : "bg-slate-200"}`} />
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm block truncate leading-snug ${!n.read ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>{n.title}</span>
                                                <span className="text-[12px] text-slate-400 line-clamp-2 block mt-0.5">{n.message}</span>
                                                <span className="text-[10px] text-slate-300 flex items-center gap-1 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: localeId })}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative">
                    <button
                        onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-[11px] font-black shadow-sm flex-shrink-0">
                            {userInitials}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-[12px] font-bold text-slate-900 leading-none">{user?.name || user?.email || "Admin"}</p>
                            <p className="text-[10px] text-slate-400 leading-none mt-0.5">{roleLabel[user?.role || ""] || user?.role || "Admin"}</p>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                    </button>

                    {showProfile && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                            {/* User info header */}
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-black shadow-sm flex-shrink-0">
                                        {userInitials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Admin"}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                                        <span className="inline-flex text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full mt-0.5">
                                            {roleLabel[user?.role || ""] || user?.role || "Admin"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Menu items */}
                            <div className="py-1.5">
                                <button onClick={() => { router.push("/admin/settings"); setShowProfile(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    Pengaturan
                                </button>
                                <button onClick={() => { router.push("/admin/settings/profile"); setShowProfile(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                                    <User className="w-4 h-4 text-slate-400" />
                                    Profil Saya
                                </button>
                            </div>

                            <div className="border-t border-slate-100 py-1.5">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
