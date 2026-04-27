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
        // 1. Bypass if user is logged in (session exists)
        const hasSession = request.cookies.has("session");
        if (hasSession) return res;

        const isAllowedBot = ALLOWED_BOTS.some(pattern => pattern.test(userAgent));
        
        if (!isAllowedBot) {
            // 2. Check if it's a confirmed BAD bot pattern
            const isBlockedBot = BLOCKED_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
            
            // 3. Check if it looks like a real browser (Mozilla/5.0 pattern)
            const isBrowser = userAgent.includes("Mozilla/5.0");

            if (isBlockedBot) {
                return new NextResponse("Access Denied", { status: 403 });
            }

            // 4. Check for cookie consent only if it's NOT a browser or NOT a page request
            const hasAccessCookie = request.cookies.get("_hki_acc")?.value;
            
            if (!hasAccessCookie) {
                const acceptHeader = request.headers.get("accept") || "";
                const isHtmlRequest = acceptHeader.includes("text/html");
                const isNextInternalRequest = request.headers.has("rsc") || 
                                             request.headers.has("next-router-prefetch") ||
                                             request.headers.has("next-action");

                // Sophisticated check: Only block if it's:
                // - NOT an HTML page request
                // - AND NOT an internal Next.js request
                // - AND (NOT a browser OR looks like a headless scraper)
                if (!isHtmlRequest && !isNextInternalRequest && !isBrowser) {
                    return new NextResponse("Access Denied (Bot detected)", { status: 403 });
                }
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
