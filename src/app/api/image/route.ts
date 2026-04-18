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
        // 1. Fetch the source image
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("Failed to fetch image");
        const arrayBuffer = await response.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // 2. Load the watermark (logo.png)
        // Note: logo.png is black, but user requested white logo.
        // Sharp can invert or tint the logo.
        const watermarkPath = path.join(process.cwd(), "public", "logo.png");
        const watermarkBuffer = fs.readFileSync(watermarkPath);

        // Process watermark: Resize and make it white/semi-transparent
        const processedWatermark = await sharp(watermarkBuffer)
            .resize(200) // Adjust size as needed
            .negate() // Invert black to white (assuming it's black on transparent)
            .ensureAlpha(0.3) // 30% opacity
            .toBuffer();

        // 3. Composite watermark on main image
        const outputBuffer = await sharp(inputBuffer)
            .composite([
                {
                    input: processedWatermark,
                    gravity: "center", // Center watermark or "southeast" for corner
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
