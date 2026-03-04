const puppeteer = require('./node_modules/puppeteer');
const crypto = require('crypto');

(async () => {
    try {
        console.log("Launching Puppeteer...");
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        const testSku = '6ES7214-1AG40-0XB0'; // Sample Siemens SKU
        const url = `https://mall.industry.siemens.com/mall/en/id/Catalog/Product/${testSku}`;
        console.log(`Navigating to ${url}...`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log("Page loaded. Waiting 5 seconds for Angular components...");

        // Wait 5 seconds just in case
        await new Promise(resolve => setTimeout(resolve, 5000));

        const path = '/Users/davidtheo/.gemini/antigravity/brain/cdaf3531-eaa5-4820-8231-544d22188971/sieportal_screenshot.png';
        await page.screenshot({ path: path, fullPage: true });
        console.log(`Screenshot saved to ${path}`);

        await browser.close();
    } catch (err) {
        console.error("Error:", err);
    }
})();
