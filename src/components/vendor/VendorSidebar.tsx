"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOut,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { vendorSidebarMenuItems, type Permission } from "@/lib/rbac";
import { useAuth } from "@/components/auth/CanAccess";

const iconMap: Record<string, any> = {
    LayoutDashboard,
    Package,
    ShoppingBag,
    FileText
};

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function VendorSidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const { hasPermission, user, isLoading } = useAuth();
    const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleSubmenu = (href: string) => {
        setOpenSubmenus(prev =>
            prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
        );
    };

    if (!mounted) return null;

    return (
        <aside
            className={cn(
                "fixed left-0 top-14 z-40 h-[calc(100vh-56px)] bg-white border-r border-teal-100 transition-all duration-300 ease-in-out flex flex-col shadow-sm",
                isOpen ? "w-64" : "w-20"
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-teal-100 bg-white shadow-sm hover:bg-teal-50 hidden lg:flex z-10"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronLeft className="h-3 w-3 text-teal-600" /> : <ChevronRight className="h-3 w-3 text-teal-600" />}
            </Button>

            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                <div className="px-3 mb-6">
                   {isOpen ? (
                     <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">Vendor Portal</p>
                        <p className="text-xs font-bold text-teal-800 truncate">
                            {user?.name?.replace(/Simulation/gi, "").trim() || "Vendor"}
                        </p>
                     </div>
                   ) : (
                     <div className="flex justify-center">
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100">
                            <Package className="h-5 w-5 text-teal-600" />
                        </div>
                     </div>
                   )}
                </div>

                {vendorSidebarMenuItems.map((item) => {
                    const IconComponent = iconMap[item.icon] || LayoutDashboard;
                    const isParentActive = item.href === "/vendor"
                        ? pathname === "/vendor"
                        : pathname.startsWith(item.href);
                    const isSubmenuOpen = openSubmenus.includes(item.href);

                    if (item.children && isOpen) {
                        return (
                            <Collapsible
                                key={item.href}
                                open={isSubmenuOpen}
                                onOpenChange={() => toggleSubmenu(item.href)}
                                className="space-y-0.5"
                            >
                                <CollapsibleTrigger asChild>
                                    <button
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group relative select-none",
                                            isParentActive
                                                ? "bg-teal-50 text-teal-700"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <IconComponent className={cn(
                                                "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                                isParentActive ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600"
                                            )} />
                                            <span className="font-semibold text-[13px] whitespace-nowrap">{item.title}</span>
                                        </div>
                                        <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", isSubmenuOpen ? "rotate-180" : "")} />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-0.5 pl-4">
                                    {item.children.map((child) => {
                                        const ChildIcon = iconMap[child.icon] || FileText;
                                        const isChildActive = pathname === child.href;
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={cn(
                                                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-[13px]",
                                                    isChildActive
                                                        ? "text-teal-700 bg-teal-50/50 font-semibold"
                                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                                )}
                                            >
                                                <ChildIcon className="h-3.5 w-3.5" />
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
                                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative",
                                isParentActive
                                    ? "bg-teal-50 text-teal-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            title={!isOpen ? item.title : undefined}
                        >
                            <IconComponent className={cn(
                                "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                isParentActive ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600"
                            )} />

                            <span className={cn(
                                "font-semibold text-[13px] whitespace-nowrap transition-all duration-300 origin-left",
                                isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 overflow-hidden w-0"
                            )}>
                                {item.title}
                            </span>

                            {isParentActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-600 rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

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
