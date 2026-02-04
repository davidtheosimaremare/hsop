"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { cn } from "@/lib/utils";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const isLoginPage = pathname === "/admin/login";

    const isFullWidth = pathname.startsWith("/admin/customers");

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out p-6 md:p-8",
                    isSidebarOpen ? "ml-64" : "ml-20"
                )}
            >
                <div className={cn("mx-auto", isFullWidth ? "max-w-full" : "max-w-6xl")}>
                    {children}
                </div>
            </main>
        </div>
    );
}
