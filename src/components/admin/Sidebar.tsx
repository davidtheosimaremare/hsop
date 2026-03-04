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
    ChevronLeft,
    ChevronRight,
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
    UserPlus,
    ChevronDown,
    ArrowUpCircle,
    Search,
    LayoutTemplate,
    Briefcase,
    ImageIcon,
    Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPendingQuotationCount } from "@/app/actions/quotation";
import { sidebarMenuItems, type Permission } from "@/lib/rbac";
import { useAuth, CanAccess } from "@/components/auth/CanAccess";

// Map icon names to actual components
const iconMap: Record<string, any> = {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    FileCheck,
    ClipboardList,
    Truck,
    Receipt,
    Newspaper,
    FileText,
    Settings,
    ShieldCheck,
    Webhook,
    Activity,
    UserPlus,
    ArrowUpCircle,
    BadgePercent,
    ListTree,
    Search,
    LayoutTemplate,
    Briefcase,
    ImageIcon,
    Bell,
    ShoppingBag,
};

interface MenuItem {
    title: string;
    href: string;
    icon: string;
    badgeKey?: string;
    children?: MenuItem[];
    requiredPermission?: string;
}

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const { hasPermission, user, isLoading, refreshUser } = useAuth();
    const [openSubmenus, setOpenSubmenus] = useState<string[]>(["/admin/settings"]);
    const [mounted, setMounted] = useState(false);
    const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

    const toggleSubmenu = (href: string) => {
        setOpenSubmenus(prev =>
            prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
        );
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchBadges = useCallback(async () => {
        try {
            const pendingCount = await getPendingQuotationCount();
            setBadgeCounts({ pendingQuotations: pendingCount });
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (mounted) {
            // If we have no user but we are supposed to be in admin, try to refresh
            if (!user && !isLoading) {
                console.log("Sidebar: User missing, refreshing...");
                refreshUser();
            }

            console.log("Sidebar - User state:", { user, isLoading });
            fetchBadges();
            const interval = setInterval(fetchBadges, 30000);
            return () => clearInterval(interval);
        }
    }, [mounted, fetchBadges, user, isLoading, refreshUser]);

    // Helper to check if menu item should be shown
    const shouldShowMenuItem = (requiredPermission?: string) => {
        // If still loading, show all items (or we can hide them)
        if (isLoading) return true;
        // If no user (not logged in), hide all
        if (!user) return false;
        // If SUPER_ADMIN, show all
        if (user.role === "SUPER_ADMIN") return true;
        // Otherwise check permission
        if (!requiredPermission) return true;
        return hasPermission(requiredPermission as Permission);
    };

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
                {sidebarMenuItems.map((item) => {
                    // Check if user has permission to view this menu item
                    if (!shouldShowMenuItem(item.requiredPermission)) {
                        return null;
                    }

                    const IconComponent = iconMap[item.icon] || LayoutDashboard;
                    const isParentActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);
                    const isSubmenuOpen = openSubmenus.includes(item.href);

                    if (item.children && isOpen) {
                        // Filter children based on permissions
                        const visibleChildren = item.children.filter(child => {
                            return shouldShowMenuItem(child.requiredPermission);
                        });

                        // Don't render if no visible children
                        if (visibleChildren.length === 0) {
                            return null;
                        }

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
                                            <IconComponent className={cn(
                                                "h-5 w-5 flex-shrink-0 transition-colors",
                                                isParentActive ? "text-red-600" : "text-gray-500 group-hover:text-gray-700"
                                            )} />
                                            <span className="font-medium text-sm whitespace-nowrap">{item.title}</span>
                                            {(() => {
                                                const totalBadge = (visibleChildren as any).reduce((sum: number, child: any) => sum + (child.badgeKey && badgeCounts[child.badgeKey] ? badgeCounts[child.badgeKey] : 0), 0);
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
                                    {visibleChildren.map((child) => {
                                        const ChildIcon = iconMap[child.icon] || FileText;
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
                                                <ChildIcon className="h-4 w-4" />
                                                <span>{child.title}</span>
                                                {(child as any).badgeKey && badgeCounts[(child as any).badgeKey] ? (
                                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                                                        {badgeCounts[(child as any).badgeKey]}
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
                            <IconComponent className={cn(
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

