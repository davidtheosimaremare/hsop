const puppeteer = require('./node_modules/puppeteer');
const fs = require('fs');

(async () => {
    try {
        console.log("Launching Puppeteer...");
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const url = 'https://mall.industry.siemens.com/mall/en/id/Catalog/Product/6ES7214-1AG40-0XB0';
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        const html = await page.evaluate(() => document.body.innerHTML);
        fs.writeFileSync('/tmp/sieportal_html.html', html);
        console.log("Saved HTML to /tmp/sieportal_html.html");

        await browser.close();
    } catch (err) {
        console.error("Error:", err);
    }
})();
