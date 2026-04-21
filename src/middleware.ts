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

    // === BOT PROTECTION (public product pages only) ===
    if (pathname.startsWith("/produk/") || pathname.startsWith("/pencarian")) {
        // Allow legitimate bots (Google, Bing, social media)
        const isAllowedBot = ALLOWED_BOTS.some(pattern => pattern.test(userAgent));
        
        if (!isAllowedBot) {
            // Block known scraper bots
            const isBlockedBot = BLOCKED_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
            if (isBlockedBot) {
                return new NextResponse("Access Denied", { status: 403 });
            }

            // Cookie challenge: real browsers get a cookie on first visit
            // Bots without JavaScript won't have this cookie
            const hasAccessCookie = request.cookies.get("_hki_acc")?.value;
            
            if (!hasAccessCookie) {
                // First visit: set the cookie via a tiny HTML page that JS redirects
                // Use relative URL to work correctly in both dev and production
                const redirectUrl = request.nextUrl.pathname + request.nextUrl.search;
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
                    <title>Memuat...</title>
                    <script>
                        document.cookie="_hki_acc=1;path=/;max-age=86400;SameSite=Lax";
                        window.location.replace("${redirectUrl}");
                    </script>
                    <noscript><meta http-equiv="refresh" content="0;url=${redirectUrl}"></noscript>
                </head><body><p>Memuat halaman...</p></body></html>`;
                
                return new NextResponse(html, {
                    status: 200,
                    headers: { 
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": "no-store, no-cache",
                    },
                });
            }
        }
    }

    // === SESSION UPDATE ===
    // 1. Update session and get the response object
    let res = await updateSession(request) || NextResponse.next();

    // === ADMIN/VENDOR ROUTE PROTECTION ===
    if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) {
        const isAdminRoute = pathname.startsWith("/admin");
        const isVendorRoute = pathname.startsWith("/vendor");
        
        const adminLoginPath = "/admin/login";
        const vendorLoginPath = "/vendor/login";
        const publicLoginPath = "/masuk";
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
