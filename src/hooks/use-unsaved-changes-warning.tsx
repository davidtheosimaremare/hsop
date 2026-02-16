"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";

export function useUnsavedChangesWarning(shouldWarn: boolean) {
    const [showWarning, setShowWarning] = useState(false);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Warn before unloading (refresh/close tab)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (shouldWarn) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [shouldWarn]);

    // Intercept navigation
    useEffect(() => {
        // This is a workaround since Next.js 13+ app router doesn't have a built-in
        // route change interception hook yet. We monkey-patch pushState/replaceState
        // and listen to popstate events.

        // Save original methods
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;

        // Override pushState
        window.history.pushState = function (...args) {
            if (shouldWarn) {
                const url = args[2]?.toString();
                if (url && url !== pathname) {
                    setNextUrl(url);
                    setShowWarning(true);
                    return;
                }
            }
            return originalPushState.apply(this, args);
        };

        // Override replaceState
        window.history.replaceState = function (...args) {
            if (shouldWarn) {
                const url = args[2]?.toString();
                if (url && url !== pathname) {
                    setNextUrl(url);
                    setShowWarning(true);
                    return;
                }
            }
            return originalReplaceState.apply(this, args);
        };

        // Handle popstate (back/forward button)
        const handlePopState = (e: PopStateEvent) => {
            if (shouldWarn) {
                // Prevent navigation temporarily
                window.history.pushState(null, "", pathname);
                setShowWarning(true);
                // We don't know the target URL easily here, so we might just go back/forward
                // based on what was clicked, but simple "stay or leave" is safer
            }
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.history.pushState = originalPushState;
            window.history.replaceState = originalReplaceState;
            window.removeEventListener("popstate", handlePopState);
        };
    }, [shouldWarn, pathname]);

    // Also need to wrap Next.js Link clicks - but standard links use pushState inside,
    // so the override above should catch client-side transitions.
    // However, we need a component to catch clicks on anchors to prevent full page reload if necessary

    const confirmNavigation = () => {
        setShowWarning(false);
        if (nextUrl) {
            // Restore original pushState to allow navigation
            // We can't easily restore just for one call without risking race conditions
            // So we force navigation via window.location for full reload safety
            // or try to use router if it works
            window.location.href = nextUrl;
        } else {
            router.back(); // Fallback for popstate
        }
    };

    const cancelNavigation = () => {
        setShowWarning(false);
        setNextUrl(null);
    };

    const WarningDialog = () => (
        <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Ada perubahan yang belum disimpan</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin meninggalkan halaman ini? Perubahan yang Anda buat akan hilang.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={cancelNavigation}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmNavigation} className="bg-red-600 hover:bg-red-700">
                        Tinggalkan Halaman
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return { WarningDialog };
}
