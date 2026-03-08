"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getUnreadNotificationCount } from "@/app/actions/notification";
import {
    FileText,
    ShoppingCart,
    User,
    Key,
    MapPin,
    LogOut,
    CheckCircle2,
    LayoutDashboard,
    Users,
    Bell
} from "lucide-react";

const menuItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/estimasi", label: "Estimasi", icon: FileText },
    { href: "/dashboard/transaksi", label: "Transaksi", icon: ShoppingCart },
    { href: "/dashboard/profil", label: "Profil Pengguna", icon: User },
    { href: "/dashboard/tim", label: "Kelola Tim", icon: Users },
    { href: "/dashboard/password", label: "Ubah Kata Sandi", icon: Key },
    { href: "/dashboard/alamat", label: "Alamat Pengiriman", icon: MapPin },
    { href: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
];

export default function DashboardSidebar({ user }: { user: any }) {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchUnread = async () => {
            const res = await getUnreadNotificationCount();
            if (res.success && res.count !== undefined) {
                setUnreadCount(res.count);
            }
        };
        fetchUnread();
    }, [pathname]);

    const isActive = (href: string) => {
        if (href === "/dashboard" && pathname === "/dashboard") return true;
        if (href !== "/dashboard" && pathname.startsWith(href)) return true;
        return false;
    };

    const userImage = user.customerImage || user.image;

    return (
        <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-6 shadow-sm">
                {/* User Profile - Modern Design */}
                <div className="relative p-6 bg-gradient-to-br from-red-50 via-white to-red-50 border-b border-gray-100">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full blur-2xl opacity-50 -translate-y-1/2 translate-x-1/2" />

                    <div className="relative flex items-center gap-3">
                        <div className="relative">
                            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center shadow-md overflow-hidden text-red-600 font-bold text-xl">
                                {mounted && userImage ? (
                                    <img src={userImage} alt={user.name || "User"} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                                )}
                            </div>
                            {user.isVerified && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                    {user.name || "Member"}
                                </h3>
                            </div>
                            {/* Company name displayed below user name */}
                            {user.companyName && (
                                <p className="text-xs text-gray-500 truncate mb-1">
                                    {user.companyName}
                                </p>
                            )}
                            <div className="flex items-center gap-1.5">

                                {user.isVerified && (
                                    <span className="text-[10px] text-green-600 font-bold">Verified</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu - Modern Design */}
                <div className="p-3">
                    <div className="space-y-0.5">
                        {menuItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${active
                                            ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${active
                                                ? "bg-red-500 text-white shadow-md"
                                                : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                            }`}>
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    {item.href === "/dashboard/notifikasi" && unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                    {active && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Logout - Modern Design */}
                <div className="p-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={async () => {
                            const { logoutAction } = await import("@/app/actions/auth");
                            await logoutAction();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Keluar Akun</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
