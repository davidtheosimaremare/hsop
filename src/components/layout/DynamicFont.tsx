import { getSiteSetting } from "@/app/actions/settings";

/**
 * Server component that reads the selected font from SiteSetting
 * and injects the Google Fonts <link> + a <style> tag to apply it globally.
 * Only affects public pages (admin uses hardcoded Inter).
 */
export default async function DynamicFont() {
    const fontConfig = await getSiteSetting("font_config") as Record<string, string> | null;

    const fontFamily = fontConfig?.fontFamily || "Inter";
    const weights = fontConfig?.weights || "400;500;600;700;800;900";

    // Build Google Fonts URL
    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@${weights}&display=swap`;

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link
                rel="stylesheet"
                href={googleFontsUrl}
            />
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        :root {
                            --font-dynamic: "${fontFamily}", "Inter", ui-sans-serif, system-ui, sans-serif;
                        }
                        body:not(.admin-body) {
                            font-family: var(--font-dynamic) !important;
                        }
                    `,
                }}
            />
        </>
    );
}
