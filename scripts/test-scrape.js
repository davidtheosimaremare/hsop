
// Standalone test script

// Mocking fetch globally for the script context if needed, 
// but since we are running this with ts-node or similar, we might need to ensure environment is set.
// Actually simpler: let's just make a rigorous test in a new file that doesn't depend on Next.js server actions context if possible,
// OR just use the existing server action but call it from a temporary API route or just run a script that imports it.

// Prerpare a standalone script
const cheerio = require("cheerio");

async function testScrape(sku) {
    const cleanSku = encodeURIComponent(sku.trim());
    const url = `https://sieportal.siemens.com/sieportal-api/products-services/product-details/en-ID/${cleanSku}`;
    console.log(`fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "Upgrade-Insecure-Requests": "1"
            }
        });

        const html = await response.text();
        console.log(`Length: ${html.length}`);

        const $ = cheerio.load(html);

        const metaDesc = $('meta[name="description"]').attr("content");
        console.log(`Meta Desc: ${metaDesc}`);

        const descClass = $(".product-metadata-description").html();
        console.log(`Class .product-metadata-description html: ${descClass}`);

        const descText = $(".product-metadata-description").text().trim();
        console.log(`Class .product-metadata-description text: ${descText}`);

        // Check for technical table
        const techRows = $("table tr").length;
        console.log(`Table rows found: ${techRows}`);

    } catch (e) {
        console.error(e);
    }
}

testScrape("3WA1106-2AB02-0AA0-Z");
