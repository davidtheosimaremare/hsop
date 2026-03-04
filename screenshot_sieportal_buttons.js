const puppeteer = require('./node_modules/puppeteer');

(async () => {
    try {
        console.log("Launching Puppeteer...");
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const url = 'https://mall.industry.siemens.com/mall/en/id/Catalog/Product/6ES7214-1AG40-0XB0';
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        await new Promise(resolve => setTimeout(resolve, 3000));

        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => b.innerText || b.textContent).filter(t => t && t.trim().length > 0);
        });
        console.log("Buttons:", buttons);

        const testClasses = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('div[class*="cookie"]')).map(d => d.className);
        });
        console.log("Cookie divs:", testClasses);

        await browser.close();
    } catch (err) {
        console.error("Error:", err);
    }
})();
