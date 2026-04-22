import { NextRequest, NextResponse } from "next/server";
import { updateSession, decrypt } from "@/lib/auth";

// Known bot user-agent patterns to block (aggressive scrapers, not search engines)
const BLOCKED_BOT_PATTERNS = [
    /python-requests/i,
    /python-urllib/i,
    /scrapy/i,
    /curl\//i,
    /wget\//i,
    /httpclient/i,
    /java\//i,
    /libwww/i,
    /lwp-/i,
    /go-http-client/i,
    /node-fetch/i,
    /axios/i,
    /php\//i,
    /okhttp/i,
    /httpie/i,
];

// Allow legitimate bots (search engines, social media previews)
const ALLOWED_BOTS = [
    /googlebot/i,
    /bingbot/i,
    /yandexbot/i,
    /duckduckbot/i,
    /baiduspider/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /slackbot/i,
    /discordbot/i,
    /applebot/i,
];

export default async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const userAgent = request.headers.get("user-agent") || "";

    // === BOT PROTECTION (public product & search pages) ===
    if (pathname.startsWith("/produk/") || pathname.startsWith("/pencarian")) {
        const isAllowedBot = ALLOWED_BOTS.some(pattern => pattern.test(userAgent));
        
        if (!isAllowedBot) {
            // Block known scraper bots immediately
            const isBlockedBot = BLOCKED_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
            if (isBlockedBot) {
                return new NextResponse("Access Denied", { status: 403 });
            }

            // Check cookie consent - bots without JS can't set this cookie
            // The CookieConsent modal handles setting this for real users
            const hasAccessCookie = request.cookies.get("_hki_acc")?.value;
            if (!hasAccessCookie) {
                // No cookie = likely a bot or first-time visitor
                // First-time visitors will see the cookie consent modal
                // Bots making API-style requests without cookies get blocked
                const acceptHeader = request.headers.get("accept") || "";
                const isHtmlRequest = acceptHeader.includes("text/html");
                
                if (!isHtmlRequest) {
                    // Non-HTML requests without cookie = programmatic access = block
                    return new NextResponse("Cookie consent required", { status: 403 });
                }
                // HTML requests pass through - the CookieConsent modal will appear
            }
        }
    }

    // === SESSION UPDATE ===
    let res = await updateSession(request) || NextResponse.next();

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
        "/admin/:path*",
        "/vendor/:path*",
        "/produk/:path*",
        "/pencarian",
    ],
};
