import { NextRequest, NextResponse } from "next/server";
import { updateSession, decrypt } from "@/lib/auth";

export default async function proxy(request: NextRequest) {
    // 1. Update session if it exists (extend expiry)
    await updateSession(request);

    // 2. Protect /admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
        const sessionValue = request.cookies.get("session")?.value;
        const isLoginPage = request.nextUrl.pathname === "/admin/login";

        if (!sessionValue) {
            if (!isLoginPage) {
                return NextResponse.redirect(new URL("/admin/login", request.url));
            }
            return NextResponse.next();
        }

        // Session exists, check role
        try {
            const session = await decrypt(sessionValue);
            const user = session.user;

            // If user is CUSTOMER, they should not be in /admin
            if (user?.role === "CUSTOMER") {
                return NextResponse.redirect(new URL("/", request.url));
            }

            // If logged in and on login page, redirect to admin dashboard
            if (isLoginPage) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
        } catch (error) {
            // Invalid session
            if (!isLoginPage) {
                return NextResponse.redirect(new URL("/admin/login", request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*",
    ],
};
