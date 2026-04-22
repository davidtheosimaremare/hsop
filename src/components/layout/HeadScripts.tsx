import { getSiteSetting } from "@/app/actions/settings";
import Script from "next/script";

/**
 * Server component that reads SEO & Analytics settings from DB
 * and injects the appropriate meta tags and scripts into <head>.
 */
export default async function HeadScripts() {
    const [seoVerification, analyticsConfig] = await Promise.all([
        getSiteSetting("seo_verification") as Promise<Record<string, string> | null>,
        getSiteSetting("analytics_config") as Promise<Record<string, string> | null>,
    ]);

    const gaId = analyticsConfig?.gaId || "";
    const gtmId = analyticsConfig?.gtmId || "";
    const customHeadScript = analyticsConfig?.customHeadScript || "";

    return (
        <>
            {/* Google Analytics 4 */}
            {gaId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${gaId}');
                        `}
                    </Script>
                </>
            )}

            {/* Google Tag Manager */}
            {gtmId && (
                <Script id="google-tag-manager" strategy="afterInteractive">
                    {`
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${gtmId}');
                    `}
                </Script>
            )}

            {/* Custom Head Script (Facebook Pixel, Hotjar, etc.) */}
            {customHeadScript && (
                <div dangerouslySetInnerHTML={{ __html: customHeadScript }} />
            )}
        </>
    );
}
