"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    ListTree,
    LayoutTemplate,
    Briefcase,
    ChevronDown,
    Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MenuItem {
    title: string;
    href: string;
    icon: any;
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
        title: "Data Product",
        href: "/admin/products",
        icon: Package,
    },
    {
        title: "Pesanan",
        href: "/admin/orders",
        icon: ShoppingCart,
    },
    {
        title: "Setting Halaman",
        href: "/admin/settings",
        icon: Settings,
        children: [
            { title: "Saran Pencarian", href: "/admin/settings/search", icon: Search },
            { title: "Manajemen Kategori", href: "/admin/settings/categories", icon: ListTree },
            { title: "Section Homepage", href: "/admin/settings/sections", icon: LayoutTemplate },
            { title: "Portfolio Client", href: "/admin/settings/portfolio", icon: Briefcase },
            { title: "Banner Slider", href: "/admin/settings/banners", icon: ImageIcon },
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

