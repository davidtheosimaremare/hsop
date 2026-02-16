"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Receipt,
    User,
    Key,
    MapPin,
    LogOut,
    CheckCircle2,
    LayoutDashboard,
    Users
} from "lucide-react";

const menuItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/transaksi", label: "Transaksi", icon: Receipt },
    { href: "/dashboard/profil", label: "Profil Pengguna", icon: User },
    { href: "/dashboard/tim", label: "Kelola Tim", icon: Users },
    { href: "/dashboard/password", label: "Ubah Kata Sandi", icon: Key },
    { href: "/dashboard/alamat", label: "Alamat Pengiriman", icon: MapPin },
];

export default function DashboardSidebar({ user }: { user: any }) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard" && pathname === "/dashboard") return true;
        if (href !== "/dashboard" && pathname.startsWith(href)) return true;
        return false;
    };

    return (
        <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-24">
                {/* User Profile */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-600 font-bold text-lg">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                    {user.name || "Member"}
                                </h3>
                                {user.isVerified && <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-teal-600 font-medium">{user.role || "Retail"}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="p-3">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive(item.href)
                                    ? "bg-red-50 text-red-600 font-medium"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Logout */}
                <div className="p-3 border-t border-gray-100">
                    <form action="/auth/logout" method="POST">
                        {/* Ideally use the logout action via a button handler or server action prop, 
                             for now just a visual button or link to logout route if it exists, 
                             or keep the simple Client Action calling auth.ts */}
                        <button
                            type="button" // Change to submit if wrapping in form, or click handler
                            onClick={async () => {
                                const { logoutAction } = await import("@/app/actions/auth");
                                await logoutAction();
                            }}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Keluar Akun
                        </button>
                    </form>
                </div>
            </div>
        </aside>
    );
}
