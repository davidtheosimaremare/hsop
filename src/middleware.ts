import { NextRequest, NextResponse } from "next/server";
import { updateSession, decrypt } from "@/lib/auth";

export default async function proxy(request: NextRequest) {
    // 1. Update session and get the response object
    // CRITICAL: We must use the response returned by updateSession, 
    // otherwise the cookie update never reaches the browser.
    let res = await updateSession(request) || NextResponse.next();

    // 2. Protect /admin and /vendor routes
    if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/vendor")) {
        const sessionValue = request.cookies.get("session")?.value;
        const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
        const isVendorRoute = request.nextUrl.pathname.startsWith("/vendor");
        const loginPath = isAdminRoute ? "/admin/login" : "/masuk";

        if (!sessionValue) {
            if (request.nextUrl.pathname !== loginPath) {
                return NextResponse.redirect(new URL(loginPath, request.url));
            }
            return res;
        }

        // Session exists, check role
        try {
            const session = await decrypt(sessionValue);
            const user = session.user;

            if (isAdminRoute) {
                const adminRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "VIEWER"];
                if (!adminRoles.includes(user?.role)) {
                    return NextResponse.redirect(new URL("/", request.url));
                }

                if (request.nextUrl.pathname === "/admin/login") {
                    return NextResponse.redirect(new URL("/admin", request.url));
                }
            }

            if (isVendorRoute) {
                if (user?.role !== "VENDOR" && user?.role !== "SUPER_ADMIN") {
                    return NextResponse.redirect(new URL("/", request.url));
                }
            }

        } catch (error) {
            // Invalid session
            if (request.nextUrl.pathname !== loginPath) {
                const redirectRes = NextResponse.redirect(new URL(loginPath, request.url));
                // Clear the corrupted session cookie
                redirectRes.cookies.set("session", "", { expires: new Date(0), path: "/" });
                return redirectRes;
            }
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
