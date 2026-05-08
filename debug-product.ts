import { db } from "./src/lib/db";

function testFormatRichText(text: string): string {
    if (!text) return "";

    // Replace non-breaking spaces (HTML entities and unicode characters) with normal spaces
    let cleanText = text
        .replace(/&nbsp;/gi, " ")
        .replace(/&#160;/g, " ")
        .replace(/\u00a0/g, " ");

    // Strip inline style attributes
    cleanText = cleanText
        .replace(/style="[^"]*"/gi, "")
        .replace(/style='[^']*'/gi, "");

    return cleanText.trim();
}

async function main() {
    const sku = "3WA1220-5AB02-0AA0-ZB10";
    const product = await db.product.findUnique({
        where: { sku }
    });

    if (product) {
        console.log("RAW DESCRIPTION:", product.description);
        console.log("-----------------------------------------");
        console.log("FORMATTED OUTPUT:\n", testFormatRichText(product.description || ""));
    } else {
        console.log("LOCAL_PRODUCT_DATA: NOT_FOUND");
    }
}

main().catch(console.error);
