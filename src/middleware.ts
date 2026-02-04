import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    // 1. Update session if it exists (extend expiry)
    await updateSession(request);

    // 2. Protect /admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
        const session = request.cookies.get("session")?.value;
        const isLoginPage = request.nextUrl.pathname === "/admin/login";

        // If no session and trying to access admin pages (except login), redirect to login
        if (!session && !isLoginPage) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        // If session exists and trying to access login, redirect to dashboard
        if (session && isLoginPage) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*",
    ],
};
