"use server";

import * as cheerio from "cheerio";

interface ScrapedData {
    success: boolean;
    data?: {
        description: string;
        specifications: Record<string, string>;
        image?: string;
    };
    error?: string;
}

export async function scrapeSiemensProduct(sku: string): Promise<ScrapedData> {
    const url = `https://sieportal.siemens.com/en-id/products-services/detail/${sku}`;
    console.log(`Scraping Siemens Product: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page. Status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. Scrape Description
        // Siemens usually puts short desc in h1 or a distinct subtitle, but let's try to find the "Product Description" section
        // Strategy: Look for specific containers or just grab the main text content if structure allows
        let description = "";

        // Attempt 1: Meta description
        const metaDesc = $('meta[name="description"]').attr("content");
        if (metaDesc) description = metaDesc;

        // Attempt 2: Product Description Table/Div (User specific request)
        const productMetadataDesc = $(".product-metadata-description").first().text().trim();
        if (productMetadataDesc) {
            description = productMetadataDesc;
        } else {
            // Fallback to previous methods if specific class not found
            const productDescBlock = $(".product-description-text").first().text().trim();
            if (productDescBlock) description = productDescBlock;
        }

        // 2. Scrape Technical Data
        const specs: Record<string, string> = {};

        // Siemens tech data is usually in a table with class 'technical-data-table' or similar
        // Let's look for specific table rows
        $("table tr").each((i, el) => {
            const key = $(el).find("td").first().text().trim();
            const value = $(el).find("td").last().text().trim();
            // Clean up keys
            if (key && value && key !== value) {
                // Filter out obviously junk rows
                if (key.length < 50 && value.length < 100) {
                    specs[key] = value;
                }
            }
        });

        // 3. Scrape Image
        // Look for main product image
        let image = "";
        const ogImage = $('meta[property="og:image"]').attr("content");
        if (ogImage) image = ogImage;
        else {
            // Fallback to finding img tag with class 'product-image'
            const imgTag = $("img.product-image").first().attr("src");
            if (imgTag) image = imgTag.startsWith("http") ? imgTag : `https://sieportal.siemens.com${imgTag}`;
        }

        return {
            success: true,
            data: {
                description,
                specifications: specs,
                image
            }
        };

    } catch (error) {
        console.error("Scraping failed:", error);
        return {
            success: false,
            error: "Failed to scrape data from Siemens. Please check the SKU or try again later."
        };
    }
}
