"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import VendorSidebar from "@/components/vendor/VendorSidebar";
import VendorTopBar from "@/components/vendor/VendorTopBar";
import { cn } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";
import { useAuth } from "@/components/auth/CanAccess";

export default function VendorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (pathname === "/vendor/login") return;

        if (!isLoading && !user) {
            router.push("/vendor/login");
        } else if (!isLoading && user && user.role !== "VENDOR" && user.role !== "SUPER_ADMIN") {
            router.push("/");
        }
    }, [isLoading, user, router, pathname]);

    // If it's the login page, just render the children without the sidebar/topbar
    if (pathname === "/vendor/login") {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <NextTopLoader color="#0D9488" initialPosition={0.08} crawlSpeed={200} height={3} crawl showSpinner={false} easing="ease" speed={200} shadow="0 0 10px #0D9488,0 0 5px #0D9488" />

            <VendorTopBar />

            <VendorSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out px-6 md:px-8 pt-[80px] pb-8",
                    isSidebarOpen ? "ml-64 md:ml-72 sidebar-expanded" : "ml-[80px] sidebar-collapsed"
                )}
            >
                <div className="mx-auto w-full max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
