"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { cn } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isLoginPage = pathname === "/admin/login";
    const isFullWidth = pathname.startsWith("/admin/customers");

    if (isLoginPage) {
        return (
            <div className="min-h-screen bg-white">
                <NextTopLoader color="#DC2626" initialPosition={0.08} crawlSpeed={200} height={3} crawl showSpinner={false} easing="ease" speed={200} shadow="0 0 10px #DC2626,0 0 5px #DC2626" />
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <NextTopLoader color="#DC2626" initialPosition={0.08} crawlSpeed={200} height={3} crawl showSpinner={false} easing="ease" speed={200} shadow="0 0 10px #DC2626,0 0 5px #DC2626" />

            {/* Fixed Top Navbar — full width above everything */}
            <AdminTopBar />

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area — padded to avoid overlap with fixed navbar */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out px-6 md:px-8 pt-[80px] pb-8",
                    isSidebarOpen ? "ml-64 md:ml-72 sidebar-expanded" : "ml-[80px] sidebar-collapsed"
                )}
            >
                <div className={cn("mx-auto w-full", isFullWidth ? "max-w-full" : "max-w-7xl")}>
                    {children}
                </div>
            </main>
        </div>
    );
}
