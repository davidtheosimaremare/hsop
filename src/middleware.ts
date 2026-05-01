import { NextRequest, NextResponse } from "next/server";
import { updateSession, decrypt } from "@/lib/auth";

export default async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // === SESSION UPDATE (only for admin/vendor routes) ===
    let res = await updateSession(request) || NextResponse.next();

    // === CACHE-CONTROL HEADERS ===
    // Prevent browser from serving stale cached HTML pages.
    // This fixes the "spinning forever" issue when users return after idle time.
    // Static assets (_next/static) are NOT affected - they use immutable caching.
    res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");

    // === ADMIN/VENDOR ROUTE PROTECTION ===
    if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) {
        const isAdminRoute = pathname.startsWith("/admin");
        const isVendorRoute = pathname.startsWith("/vendor");
        
        const adminLoginPath = "/admin/login";
        const vendorLoginPath = "/vendor/login";
        const publicLoginPath = "/masuk";
        const currentLoginPath = isAdminRoute ? adminLoginPath : vendorLoginPath;

        if (pathname === adminLoginPath || pathname === vendorLoginPath || pathname === publicLoginPath) {
            return res;
        }

        const sessionValue = request.cookies.get("session")?.value;

        if (!sessionValue) {
            const loginUrl = new URL(currentLoginPath, request.url);
            loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
            return NextResponse.redirect(loginUrl);
        }

        try {
            const session = await decrypt(sessionValue);
            const user = session?.user;

            if (!user) {
                throw new Error("Invalid session data");
            }

            if (isAdminRoute) {
                const adminRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "VIEWER"];
                if (!adminRoles.includes(user.role)) {
                    return NextResponse.redirect(new URL("/", request.url));
                }
            }

            if (isVendorRoute) {
                if (user.role !== "VENDOR") {
                    return NextResponse.redirect(new URL("/", request.url));
                }
            }

        } catch (error) {
            const loginUrl = new URL(currentLoginPath, request.url);
            loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
            const redirectRes = NextResponse.redirect(loginUrl);
            redirectRes.cookies.set("session", "", { expires: new Date(0), path: "/" });
            return redirectRes;
        }
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, logo files, etc.
         * This ensures cache headers are set for ALL page navigations
         * while static assets retain their long-lived cache.
         */
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif)).*)",
    ],
};

