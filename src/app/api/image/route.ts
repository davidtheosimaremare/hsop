import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
        return new NextResponse("Missing image URL", { status: 400 });
    }

    try {
        // 1. Resolve URL (Internal vs External)
        let fullUrl = imageUrl;
        if (imageUrl.startsWith("/")) {
            // Prepend origin if relative path
            const origin = req.nextUrl.origin;
            fullUrl = `${origin}${imageUrl}`;
        }

        console.log(`Processing watermark for: ${fullUrl}`);

        // 2. Fetch the source image
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // 2. Load the watermark (logo.png)
        // Note: logo.png is black, but user requested white logo.
        // Sharp can invert or tint the logo.
        const watermarkPath = path.join(process.cwd(), "public", "logo.png");
        const watermarkBuffer = fs.readFileSync(watermarkPath);

        // Get watermark metadata to handle opacity correctly
        const wmMetadata = await sharp(watermarkBuffer).metadata();
        const wmWidth = 250; // Increased size
        const wmHeight = wmMetadata.height ? Math.round((wmMetadata.height / (wmMetadata.width || 1)) * wmWidth) : 100;

        // Process watermark: Invert to white and set 50% opacity
        const processedWatermark = await sharp(watermarkBuffer)
            .resize(wmWidth)
            .negate({ alpha: false }) // Turn black to white, keep transparency
            .composite([
                {
                    input: Buffer.alloc(wmWidth * wmHeight, 128), // 128 = ~50% opacity
                    raw: { width: wmWidth, height: wmHeight, channels: 1 },
                    blend: "dest-in"
                }
            ])
            .toBuffer();

        // 3. Composite watermark on main image
        const outputBuffer = await sharp(inputBuffer)
            .composite([
                {
                    input: processedWatermark,
                    gravity: "southeast", // Bottom right is more standard
                    blend: "over"
                }
            ])
            .toBuffer();

        return new NextResponse(outputBuffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Watermark error:", error);
        // Fallback to original image if watermark fails
        return NextResponse.redirect(imageUrl);
    }
}
