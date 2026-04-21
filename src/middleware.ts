import { NextRequest, NextResponse } from "next/server";
import { updateSession, decrypt } from "@/lib/auth";

export default async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 1. Update session and get the response object
    // CRITICAL: We must use the response returned by updateSession, 
    // otherwise the cookie update never reaches the browser.
    let res = await updateSession(request) || NextResponse.next();

    // 2. Protect /admin and /vendor routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) {
        const isAdminRoute = pathname.startsWith("/admin");
        const isVendorRoute = pathname.startsWith("/vendor");
        
        // Define login paths
        const adminLoginPath = "/admin/login";
        const vendorLoginPath = "/vendor/login";
        const publicLoginPath = "/masuk";

        // Current applicable login path
        const currentLoginPath = isAdminRoute ? adminLoginPath : vendorLoginPath;

        // Skip middleware logic for login pages themselves to avoid loops
        if (pathname === adminLoginPath || pathname === vendorLoginPath || pathname === publicLoginPath) {
            return res;
        }

        // Get session from request cookies
        const sessionValue = request.cookies.get("session")?.value;

        if (!sessionValue) {
            const loginUrl = new URL(currentLoginPath, request.url);
            loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
            return NextResponse.redirect(loginUrl);
        }

        // Session exists, check role
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
                // Only Vendors can access /vendor
                if (user.role !== "VENDOR") {
                    return NextResponse.redirect(new URL("/", request.url));
                }
            }

        } catch (error) {
            // Invalid session - clear it and redirect to appropriate login
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
        "/admin/:path*",
        "/vendor/:path*",
    ],
};
