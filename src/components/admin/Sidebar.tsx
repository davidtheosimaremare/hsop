"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    FileText,
    Settings,
    LogOut,
    ListTree,
    FolderTree,
    ChevronLeft,
    ChevronRight,
    Search,
    LayoutTemplate,
    Briefcase,
    ChevronDown,
    Image as ImageIcon,
    Package,
    ShoppingCart,
    FileCheck,
    ClipboardList,
    Truck,
    Receipt,
    ShieldCheck,
    Newspaper,
    BadgePercent,
    Webhook,
    Activity,
    Bell,
    UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPendingQuotationCount } from "@/app/actions/quotation";

interface MenuItem {
    title: string;
    href: string;
    icon: any;
    badgeKey?: string; // key to look up dynamic badge count
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Data Customer",
        href: "/admin/customers",
        icon: Users,
    },
    {
        title: "Permintaan Upgrade",
        href: "/admin/upgrades",
        icon: UserPlus,
    },
    {
        title: "Produk",
        href: "/admin/products",
        icon: Package,
        children: [
            { title: "Daftar Produk", href: "/admin/products", icon: ShoppingBag },
            { title: "Grup Kategori", href: "/admin/products/categories", icon: ListTree },
            { title: "Diskon Default", href: "/admin/settings/discounts", icon: BadgePercent },
        ]
    },
    {
        title: "Pesanan",
        href: "/admin/sales",
        icon: ShoppingCart,
        children: [
            { title: "Penawaran Penjualan", href: "/admin/sales/quotations", icon: FileCheck, badgeKey: "pendingQuotations" },
            { title: "Pesanan Penjualan", href: "/admin/sales/orders", icon: ClipboardList },
            { title: "Pengiriman Penjualan", href: "/admin/sales/deliveries", icon: Truck },
            { title: "Faktur Penjualan", href: "/admin/sales/invoices", icon: Receipt },
        ]
    },
    {
        title: "Setting Halaman",
        href: "/admin/settings",
        icon: Settings,
        children: [
            { title: "Saran Pencarian", href: "/admin/settings/search", icon: Search },
            { title: "Section Homepage", href: "/admin/settings/sections", icon: LayoutTemplate },
            { title: "Portfolio Client", href: "/admin/settings/portfolio", icon: Briefcase },
            { title: "Home CTA", href: "/admin/settings/cta", icon: LayoutTemplate },
            { title: "Banner Slider", href: "/admin/settings/banners", icon: ImageIcon },
            { title: "Menu Kategori", href: "/admin/settings/categories-menu", icon: ListTree },
            { title: "Grid Kategori", href: "/admin/settings/grid-categories", icon: LayoutDashboard },
            { title: "Footer", href: "/admin/settings/footer", icon: LayoutTemplate },
            { title: "Notifikasi Pesanan", href: "/admin/settings", icon: Bell },
            { title: "Format File", href: "/admin/settings/format-file", icon: FileText },
        ]
    },
    {
        title: "Berita",
        href: "/admin/news",
        icon: Newspaper,
    },
    {
        title: "Halaman",
        href: "/admin/pages",
        icon: FileText,
    },
    {
        title: "Akun Admin",
        href: "/admin/users",
        icon: ShieldCheck,
    },
    {
        title: "Developer",
        href: "/admin/developer",
        icon: Webhook,
        children: [
            { title: "Webhook Simulator", href: "/admin/developer/webhooks", icon: Activity },
        ]
    },
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const [openSubmenus, setOpenSubmenus] = useState<string[]>(["/admin/settings"]); // Default open for visibility

    const toggleSubmenu = (href: string) => {
        setOpenSubmenus(prev =>
            prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
        );
    };

    // Hydration fix: Only render interactive parts on client
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Notification badge counts
    const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

    const fetchBadges = useCallback(async () => {
        try {
            const pendingCount = await getPendingQuotationCount();
            setBadgeCounts({ pendingQuotations: pendingCount });
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchBadges();
            const interval = setInterval(fetchBadges, 30000); // refresh every 30s
            return () => clearInterval(interval);
        }
    }, [mounted, fetchBadges]);

    if (!mounted) {
        return (
            <aside className={cn("fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 w-20 flex flex-col")}>
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <Image src="/logo-H.png" alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
                </div>
            </aside>
        );
    }

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
                isOpen ? "w-64" : "w-20"
            )}
        >
            {/* Header / Logo */}
            <div className="h-16 flex items-center justify-center border-b border-gray-100 relative">
                <div className={cn("transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 hidden")}>
                    <Image
                        src="/logo.png"
                        alt="Hokiindo Logo"
                        width={120}
                        height={40}
                        className="h-8 w-auto object-contain"
                    />
                </div>
                {!isOpen && (
                    <Image
                        src="/logo-H.png"
                        alt="Hokiindo Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                    />
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hidden lg:flex"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    // Check if active:
                    // 1. If item has children, check if path starts with item.href (already implemented).
                    // 2. If item is root ('/admin'), exact match.
                    // 3. Otherwise, check if path starts with item.href (to handle /admin/products/new, etc.)
                    const isParentActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);

                    const isSubmenuOpen = openSubmenus.includes(item.href);

                    if (item.children && isOpen) {
                        return (
                            <Collapsible
                                key={item.href}
                                open={isSubmenuOpen}
                                onOpenChange={() => toggleSubmenu(item.href)}
                                className="space-y-1"
                            >
                                <CollapsibleTrigger asChild>
                                    <button
                                        suppressHydrationWarning
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative select-none",
                                            isParentActive
                                                ? "bg-red-50 text-red-600"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn(
                                                "h-5 w-5 flex-shrink-0 transition-colors",
                                                isParentActive ? "text-red-600" : "text-gray-500 group-hover:text-gray-700"
                                            )} />
                                            <span className="font-medium text-sm whitespace-nowrap">{item.title}</span>
                                            {/* Parent badge: show if any child has a badge */}
                                            {(() => {
                                                const totalBadge = item.children?.reduce((sum, child) => sum + (child.badgeKey && badgeCounts[child.badgeKey] ? badgeCounts[child.badgeKey] : 0), 0) || 0;
                                                return totalBadge > 0 ? (
                                                    <span className="ml-auto mr-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                                        {totalBadge}
                                                    </span>
                                                ) : null;
                                            })()}
                                        </div>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", isSubmenuOpen ? "rotate-180" : "")} />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-1 pl-4">
                                    {item.children.map((child) => {
                                        const isChildActive = pathname === child.href;
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                                    isChildActive
                                                        ? "text-red-600 bg-red-50/50 font-medium"
                                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                                )}
                                            >
                                                <child.icon className="h-4 w-4" />
                                                <span>{child.title}</span>
                                                {child.badgeKey && badgeCounts[child.badgeKey] ? (
                                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                                                        {badgeCounts[child.badgeKey]}
                                                    </span>
                                                ) : null}
                                            </Link>
                                        );
                                    })}
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                isParentActive
                                    ? "bg-red-50 text-red-600"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            title={!isOpen ? item.title : undefined}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 flex-shrink-0 transition-colors",
                                isParentActive ? "text-red-600" : "text-gray-500 group-hover:text-gray-700"
                            )} />

                            <span className={cn(
                                "font-medium text-sm whitespace-nowrap transition-all duration-300 origin-left",
                                isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 overflow-hidden w-0"
                            )}>
                                {item.title}
                            </span>

                            {/* Active Indicator Strip */}
                            {isParentActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-600 rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-gray-100">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full flex items-center gap-3 justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
                        !isOpen && "justify-center px-0"
                    )}
                    onClick={async () => {
                        const { logoutAction } = await import("@/app/actions/auth");
                        await logoutAction();
                    }}
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className={cn(
                        "font-medium text-sm whitespace-nowrap transition-all duration-300",
                        isOpen ? "opacity-100" : "opacity-0 hidden"
                    )}>
                        Keluar
                    </span>
                </Button>
            </div>
        </aside>
    );
}

