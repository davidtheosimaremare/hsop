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

    // Technical keywords for Siemens items
    const techKeywords = [
        "frame size",
        "\\d+-poles?",
        "In\\s*=\\s*\\d+",
        "breaking capacity",
        "Trip unit",
        "Protection",
        "incl\\.",
        "rear connection",
        "without Com",
        "Manual operating",
        "without Spring",
        "Ready-to-close",
        "Auxiliary switches",
        "without Closing",
        "without Remote",
        "without 2nd",
        "without 1st",
        "Option [A-Z0-9]+",
        "rated current",
        "operating mechanism"
    ];

    // Apply smart line splitting for dense technical texts
    for (const keyword of techKeywords) {
        const regex = new RegExp(`,\\s*(${keyword})`, "gi");
        cleanText = cleanText.replace(regex, (match, p1) => {
            const capitalized = p1.charAt(0).toUpperCase() + p1.slice(1);
            return `<br /><span class="text-red-600 font-black select-none mr-1.5">▪</span> ${capitalized}`;
        });
    }

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
