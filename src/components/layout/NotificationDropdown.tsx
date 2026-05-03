"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, ExternalLink, X, ChevronRight } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const typeConfig: Record<string, { bg: string; border: string; text: string; iconBg: string; label: string; defaultLink: string }> = {
    INFO: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", iconBg: "bg-blue-100", label: "Informasi", defaultLink: "/dashboard/notifikasi" },
    SUCCESS: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", iconBg: "bg-green-100", label: "Sukses", defaultLink: "/dashboard/notifikasi" },
    WARNING: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", iconBg: "bg-yellow-100", label: "Peringatan", defaultLink: "/dashboard/notifikasi" },
    ERROR: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", iconBg: "bg-red-100", label: "Error", defaultLink: "/dashboard/notifikasi" },
    UPGRADE: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", iconBg: "bg-purple-100", label: "Upgrade", defaultLink: "/dashboard/upgrade" },
    ORDER: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", iconBg: "bg-indigo-100", label: "Pesanan", defaultLink: "/dashboard/transaksi" },
    QUOTATION: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", iconBg: "bg-orange-100", label: "Penawaran", defaultLink: "/dashboard/transaksi" },
    PROFILE: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", iconBg: "bg-gray-100", label: "Profil", defaultLink: "/dashboard/profil" }
};

const typeIcons: Record<string, string> = {
    INFO: "📢",
    SUCCESS: "✅",
    WARNING: "⚠️",
    ERROR: "❌",
    UPGRADE: "🎯",
    ORDER: "📦",
    QUOTATION: "📄",
    PROFILE: "👤"
};

export default function NotificationDropdown({ userId }: { userId?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const {
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        total,
        markAsRead,
        markAllAsRead
    } = useNotifications(userId);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif: any) => {
        if (!notif.read) {
            await markAsRead(notif.id);
        }
    };

    const formatTimeAgo = (dateString: string | Date) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Baru saja";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}h`;
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    };

    // Show only 5 latest in dropdown
    const displayNotifications = notifications.slice(0, 5);

    return (
        <div className="relative" ref={notificationRef}>
            {/* Bell Icon */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative p-2.5 rounded-xl transition-all duration-200 ${
                    isOpen ? "bg-red-50 text-red-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                }`}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-5 w-5 bg-red-600 border-2 border-white rounded-full text-[9px] text-white flex items-center justify-center font-bold shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Bell className="w-4 h-4 text-gray-400" />
                                <h3 className="text-sm font-bold text-gray-900">Notifikasi</h3>
                                {unreadCount > 0 && (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-2 h-5 text-[10px] font-bold">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Baca semua
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[420px] overflow-y-auto">
                            {isLoading && notifications.length === 0 ? (
                                <div className="py-12 flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
                                    <p className="text-xs text-gray-400">Memuat...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-12 flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                                        <Bell className="w-7 h-7 text-gray-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-700">Belum ada notifikasi</p>
                                        <p className="text-xs text-gray-400 mt-1">Notifikasi baru akan muncul di sini</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="divide-y divide-gray-50">
                                        {displayNotifications.map((notif) => {
                                            const config = typeConfig[notif.type] || typeConfig.INFO;
                                            const icon = typeIcons[notif.type] || "📢";
                                            const link = notif.link || config.defaultLink;

                                            return (
                                                <Link prefetch={false} 
                                                    key={notif.id}
                                                    href={link}
                                                    className={`block transition-all duration-200 cursor-pointer ${
                                                        !notif.read ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-100"
                                                    }`}
                                                    onClick={() => handleNotificationClick(notif)}
                                                >
                                                    <div className="p-3.5">
                                                        <div className="flex gap-3">
                                                            {/* Icon */}
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm ${config.iconBg}`}>
                                                                {icon}
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                        <h4 className={`text-sm font-semibold truncate ${!notif.read ? "text-gray-900" : "text-gray-600"}`}>
                                                                            {notif.title}
                                                                        </h4>
                                                                        <Badge variant="outline" className={`text-[9px] h-4.5 px-1.5 flex-shrink-0 ${config.bg} ${config.text} border-0 font-bold`}>
                                                                            {config.label}
                                                                        </Badge>
                                                                    </div>
                                                                    {!notif.read && (
                                                                        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                                    {notif.message}
                                                                </p>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                                        {formatTimeAgo(notif.createdAt)}
                                                                    </span>
                                                                    <div className="flex items-center gap-1 text-red-600 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span>Lihat detail</span>
                                                                        <ChevronRight className="w-3 h-3" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    {/* Footer */}
                                    {notifications.length > 5 && (
                                        <div className="border-t border-gray-100 p-3 bg-gradient-to-r from-gray-50 to-white">
                                            <Link prefetch={false} 
                                                href="/dashboard/notifikasi"
                                                className="block w-full py-2.5 px-3 text-center text-xs font-bold text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                Lihat semua notifikasi ({total})
                                                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
