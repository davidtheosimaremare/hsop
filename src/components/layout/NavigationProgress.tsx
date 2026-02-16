"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// Configure NProgress
NProgress.configure({
    showSpinner: false,
    speed: 300,
    minimum: 0.1,
});

export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        NProgress.done();
    }, [pathname, searchParams]);

    return null;
}

// Export functions to control progress bar manually
export const startProgress = () => NProgress.start();
export const doneProgress = () => NProgress.done();
