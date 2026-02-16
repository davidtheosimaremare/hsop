
import puppeteer from 'puppeteer';

const SKU = process.argv[2] || '3RT2015-1BB41'; // Default to a common contactor if not provided

async function scrape(sku) {
    const cleanSku = encodeURIComponent(sku.trim());
    const url = `https://sieportal.siemens.com/en-id/products-services/detail/${cleanSku}`;
    console.log(`[Debug] Launching for: ${url}`);

    const browser = await puppeteer.launch({
        headless: true, // Set to false to see what's happening if needed
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log("[Debug] Navigating...");
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log("[Debug] Page loaded. Title: " + await page.title());

        // Wait a bit for Shadow DOM to hydrate
        await new Promise(r => setTimeout(r, 5000));

        // Inject the logic from scraper.ts
        const result = await page.evaluate(async () => {
            function querySelectorAllDeep(selector, root = document) {
                const results = [];
                results.push(...Array.from(root.querySelectorAll(selector)));
                const allElements = root.querySelectorAll('*');
                for (const el of Array.from(allElements)) {
                    if (el.shadowRoot) {
                        results.push(...querySelectorAllDeep(selector, el.shadowRoot));
                    }
                }
                return results;
            }

            const logs = [];
            function log(msg) { logs.push(msg); }

            // 1. Find Buttons
            const buttons = querySelectorAllDeep('button, a, div.tabs-controls__tab-text, span.tabs-controls__tab-text');
            const buttonTexts = buttons.map(b => b.textContent?.trim() || '').filter(t => t.length > 0 && t.length < 50);

            log(`Found ${buttons.length} candidate buttons/tabs.`);
            // log(`Button texts sample: ${JSON.stringify(buttonTexts.slice(0, 20))}`);

            const technicalDataTab = buttons.find(b => {
                const text = b.textContent?.trim().toLowerCase();
                return text === 'technical data' || text === 'product details';
            });

            if (technicalDataTab) {
                log(`Found tab: "${technicalDataTab.textContent}". Clicking...`);
                // Check if active
                const parent = technicalDataTab.closest('li') || technicalDataTab.closest('button');
                const isActive = parent?.classList.contains('active') || technicalDataTab.classList.contains('active');

                if (!isActive) {
                    technicalDataTab.click();
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    log("Tab already active.");
                }
            } else {
                log("Technical Data tab NOT found.");
            }

            // 2. Find Table Rows
            const rows = querySelectorAllDeep('tr.ptr'); // Siemens usually uses this class
            log(`Found ${rows.length} rows with class 'ptr'.`);

            let extracted = {};
            if (rows.length > 0) {
                rows.forEach(row => {
                    const keyEl = row.querySelector('.attribute-name');
                    const valEl = row.querySelector('.TEValueCell');
                    if (keyEl && valEl) {
                        const key = keyEl.textContent?.trim().replace(/●/g, '').trim();
                        const value = valEl.textContent?.trim();
                        if (key && value) extracted[key] = value;
                    }
                });
            } else {
                // Fallback
                const allRows = querySelectorAllDeep('table tr');
                log(`Fallback: Found ${allRows.length} total table rows.`);
                allRows.forEach(row => {
                    const tds = row.querySelectorAll('td');
                    if (tds.length >= 2) {
                        const key = tds[0].textContent?.trim();
                        const value = tds[tds.length - 1].textContent?.trim();
                        if (key && value && key.length < 50) extracted[key] = value;
                    }
                });
            }

            return { logs, specsCount: Object.keys(extracted).length, specs: extracted };
        });

        console.log("--- Browser Logs ---");
        result.logs.forEach(l => console.log(l));
        console.log("--------------------");
        console.log(`Extracted Specs: ${result.specsCount}`);
        // console.log(result.specs);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

scrape(SKU);
