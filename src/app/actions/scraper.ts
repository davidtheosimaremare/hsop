"use server";

import * as cheerio from "cheerio";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from 'next/cache';
import puppeteer from 'puppeteer';
import { uploadBufferToMinio } from "@/lib/s3";

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
    const cleanSku = encodeURIComponent(sku.trim());
    const url = `https://sieportal.siemens.com/en-id/products-services/detail/${cleanSku}`;
    console.log(`[Scraper] Puppeteer Launching for: ${url}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true, // "new" is deprecated, true is current standard
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });
        const page = await browser.newPage();

        // Optimize: Block images/fonts to speed up
        // Disable request interception to ensure all assets (including scripts/styles needed for Web Components) load
        // await page.setRequestInterception(true);
        // page.on('request', (req) => {
        //     if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        //         req.abort();
        //     } else {
        //         req.continue();
        //     }
        // });

        // Match debug script: Do not set explicit User Agent as it might trigger mismatch checks
        // await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        // Set Viewport to Desktop to ensure Tabs are visible (not accordion)
        await page.setViewport({ width: 1920, height: 1080 });

        // Go to page
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const title = await page.title();
        console.log(`[Scraper] Page Title: ${title}`);

        // Try to wait for the specific element
        try {
            console.log("[Scraper] Waiting for .product-metadata-description...");
            await page.waitForSelector('.product-metadata-description', { timeout: 10000 });
            console.log("[Scraper] Selector found!");
        } catch (e) {
            console.log("[Scraper] Selector NOT found within timeout.");
        }

        // Get content
        const html = await page.content();
        console.log(`[Scraper] Retrieved HTML via Puppeteer. Length: ${html.length}`);

        const $ = cheerio.load(html);

        // 1. Scrape Description
        let description = "";
        const productMetadataDesc = $(".product-metadata-description").first().text().trim();
        if (productMetadataDesc) {
            description = productMetadataDesc;
            console.log(`[Scraper] Found description: "${description.substring(0, 50)}..."`);
        } else {
            const metaDesc = $('meta[name="description"]').attr("content");
            if (metaDesc) description = metaDesc;
        }

        // 2. Scrape Technical Data (Advanced with Shadow DOM support)
        console.log("[Scraper] Starting deep DOM evaluation for Technical Data...");
        // Give time for Shadow DOM / Web Components to fully hydrate
        await new Promise(r => setTimeout(r, 5000));


        const specs = await page.evaluate(async () => {
            // Helper to find elements even inside Shadow DOM
            function querySelectorAllDeep(selector: string, root: Document | ShadowRoot | Element = document): Element[] {
                const results: Element[] = [];
                // 1. Search in current root
                results.push(...Array.from(root.querySelectorAll(selector)));

                // 2. Search in shadow roots of all elements in current root
                const allElements = root.querySelectorAll('*');
                for (const el of Array.from(allElements)) {
                    if (el.shadowRoot) {
                        results.push(...querySelectorAllDeep(selector, el.shadowRoot));
                    }
                }
                return results;
            }

            // A. Try to Click Tab
            // DEBUG: Log all candidate buttons to understand what's visible
            const buttons = querySelectorAllDeep('button, a, div.tabs-controls__tab-text, span.tabs-controls__tab-text');
            const buttonTexts = buttons.map(b => b.textContent?.trim() || '').filter(t => t.length > 0 && t.length < 30).slice(0, 10);
            console.log("[Scraper-Browser] Visible buttons/tabs (first 10):", JSON.stringify(buttonTexts));

            const technicalDataTab = buttons.find(b => {
                const text = b.textContent?.trim().toLowerCase() || "";
                return text.includes('technical data') || text.includes('product details');
            });

            if (technicalDataTab) {
                const parent = technicalDataTab.closest('li') || technicalDataTab.closest('button');
                const isActive = parent?.classList.contains('active') || technicalDataTab.classList.contains('active');

                if (!isActive) {
                    console.log(`[Scraper-Browser] Clicking tab: ${technicalDataTab.textContent}`);
                    (technicalDataTab as HTMLElement).click();
                    // Wait for tab content to render (increased from 1500 to 3000)
                    await new Promise(r => setTimeout(r, 5000));
                } else {
                    console.log("[Scraper-Browser] Target tab already active.");
                }
            } else {
                console.log("[Scraper-Browser] 'Technical data' tab not found. Searching for any table...");
            }

            // B. Extract Data
            const result: Record<string, string> = {};

            // Look for the specific table using deep selector
            const rows = querySelectorAllDeep('tr.ptr');
            console.log(`[Scraper-Browser] Found ${rows.length} rows with class 'ptr'.`);

            if (rows.length > 0) {
                rows.forEach(row => {
                    const keyEl = row.querySelector('.attribute-name');
                    const valEl = row.querySelector('.TEValueCell');
                    if (keyEl && valEl) {
                        const key = keyEl.textContent?.trim().replace(/●/g, '').trim();
                        const value = valEl.textContent?.trim();
                        if (key && value) result[key] = value;
                    }
                });
            } else {
                // Fallback generic table
                const allRows = querySelectorAllDeep('table tr');
                console.log(`[Scraper-Browser] Found ${allRows.length} generic table rows.`);

                allRows.forEach(row => {
                    const tds = row.querySelectorAll('td');
                    if (tds.length >= 2) {
                        const key = tds[0].textContent?.trim();
                        const value = tds[tds.length - 1].textContent?.trim();
                        // Basic heuristic to avoid junk rows
                        if (key && value && key !== value && key.length < 100 && value.length < 500) {
                            result[key] = value;
                        }
                    }
                });
            }

            // D. Extract Image (Try Clicking Thumbnail for Modal)
            let mainImage = "";

            try {
                // Try specific Siemens thumbnail icon/image
                // We look for the main product image to click
                const thumbnails = querySelectorAllDeep('.icon-SieportalJpg, img.product-image, sie-icon.icon-SieportalJpg, .product-image-container img');
                const trigger = thumbnails.pop(); // Usually the last one is the main interactive one or specific icon

                if (trigger) {
                    console.log("[Scraper-Browser] Found thumbnail trigger. Clicking to open modal...");
                    (trigger as HTMLElement).click();
                    await new Promise(r => setTimeout(r, 2500)); // Wait for modal

                    // Look for high-res link in modal (User specified text/link structure)
                    const modalLinks = querySelectorAllDeep('div.cdk-overlay-container a, div.modal-content a');
                    const mimeLink = modalLinks.find(a => (a as HTMLAnchorElement).href.includes('mimes') && (a as HTMLAnchorElement).href.includes('.jpg'));

                    if (mimeLink) {
                        mainImage = (mimeLink as HTMLAnchorElement).href;
                        console.log(`[Scraper-Browser] Found high-res image in modal: ${mainImage}`);
                    } else {
                        console.log("[Scraper-Browser] Modal opened but no 'mimes' link found.");
                    }
                } else {
                    console.log("[Scraper-Browser] No clickable thumbnail found.");
                }
            } catch (e) {
                console.log("[Scraper-Browser] Error extracting image:", e);
            }

            // Fallback: Direct Link Search in page if modal failed
            if (!mainImage) {
                const mimeLinks = querySelectorAllDeep('a[href*="mimes"][href*=".jpg"]');
                if (mimeLinks.length > 0) mainImage = (mimeLinks[0] as HTMLAnchorElement).href;
            }

            return { specs: result, image: mainImage, debugButtons: buttonTexts };
        });



        console.log(`[Scraper] Extracted ${Object.keys(specs.specs).length} specs.`);

        // Take screenshot for debugging if 0 specs found
        if (Object.keys(specs.specs).length === 0) {
            console.log("[Scraper] 0 specs found. Taking debug screenshot: public/scraper-fail.png");
            await page.screenshot({ path: 'public/scraper-fail.png', fullPage: true });
        }

        let image = specs.image;
        if (!image) {
            // Fallback to cheerio if browser eval failed specific image logic
            const ogImage = $('meta[property="og:image"]').attr("content");
            if (ogImage) image = ogImage;
            else {
                const imgTag = $("img.product-image").first().attr("src");
                if (imgTag) image = imgTag.startsWith("http") ? imgTag : `https://sieportal.siemens.com${imgTag}`;
            }
        }

        console.log(`[Scraper] Found Image: ${image ? image : "No"}`);

        // Method B: Definition Lists (dl/dt/dd) - Merge into found specs
        $("dl").each((i, dl) => {
            const dts = $(dl).find("dt");
            const dds = $(dl).find("dd");
            if (dts.length === dds.length) {
                dts.each((j, dt) => {
                    const key = $(dt).text().trim();
                    const value = $(dds[j]).text().trim();
                    if (key && value) specs.specs[key] = value;
                });
            }
        });

        console.log(`[Scraper] Final Specs count: ${Object.keys(specs.specs).length}`);

        return {
            success: true,
            data: {
                description,
                specifications: specs.specs,
                image: image || ""
            }
        };

    } catch (error) {
        console.error("Puppeteer Scraper failed:", error);
        return {
            success: false,
            error: "Gagal mengambil data. Server mungkin memblokir akses atau timeout."
        };
    } finally {
        if (browser) await browser.close();
    }
}


export async function scrapeSieportalImage(productId: string, sku: string) {
    let browser;
    try {
        console.log(`Starting Puppeteer to scrape image for SKU: ${sku}`);
        const searchUrl = `https://mall.industry.siemens.com/mall/en/id/Catalog/Product/${sku}`;

        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Anti-bot detection mitigation settings
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        // Wait until it's loaded
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Auto-accept cookies / Consent overlay
        try {
            console.log("Trying to auto-accept cookies...");
            await page.evaluate(() => {
                // Typical Usercentrics or standard cookie banner implementations
                const acceptTexts = ['accept all', 'terima semua', 'agree', 'allow all'];

                // Function to search button recursively including Shadow DOMs
                const clickAcceptInNode = (node: Document | ShadowRoot | Element) => {
                    const buttons = Array.from(node.querySelectorAll('button, a.button, [role="button"]'));
                    for (const btn of buttons) {
                        const text = (btn.textContent || btn.getAttribute('aria-label') || '').toLowerCase();
                        if (acceptTexts.some(t => text.includes(t))) {
                            (btn as HTMLElement).click();
                            return true;
                        }
                    }

                    // Traverse shadow roots
                    const allElements = node.querySelectorAll('*');
                    for (const el of Array.from(allElements)) {
                        if (el.shadowRoot) {
                            if (clickAcceptInNode(el.shadowRoot)) return true;
                        }
                    }
                    return false;
                };

                // Try well-known IDS first
                const directBtns = document.querySelectorAll('#uc-btn-accept-banner, #onetrust-accept-btn-handler, .js-cookie-accept');
                if (directBtns.length > 0) {
                    (directBtns[0] as HTMLElement).click();
                } else {
                    clickAcceptInNode(document);
                }
            });
            // Wait a moment for overlay to disappear
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
            console.log("Cookie consent handler skipped or error.");
        }

        // Tunggu angular / komponen Sieportal merender gambar utamanya
        await page.waitForSelector('sie-ui-picture', { timeout: 10000 }).catch(() => console.log('sie-ui-picture not found quickly, proceeding anyway'));

        // Look for the specific picture component the user described using deep selector patterns
        const imgUrl = await page.evaluate(() => {

            // Priority 1: High res image from active srcset within the specific sie-ui-picture component
            const sourceElements = document.querySelectorAll('sie-ui-picture source');
            for (const source of Array.from(sourceElements)) {
                const srcset = source.getAttribute('srcset');
                if (srcset) return srcset.split(',')[0].trim().split(' ')[0]; // get the first url from srcset
            }

            // Priority 2: Direct img tag inside the figure within sie-ui-picture
            const imgElement = document.querySelector('sie-ui-picture img, .gallery__image img');
            if (imgElement) return imgElement.getAttribute('src');

            // Priority 3: Fallback meta image
            const metaOg = document.querySelector('meta[property="og:image"]');
            if (metaOg) return metaOg.getAttribute('content');

            return null;
        });

        if (!imgUrl) {
            return { success: false, error: "Gambar produk utama tidak ditemukan di halaman detail produk Sieportal." };
        }

        // Fix protocol relative URLs
        const fullImgUrl = imgUrl.startsWith('//') ? `https:${imgUrl}` : imgUrl.startsWith('http') ? imgUrl : `https://mall.industry.siemens.com${imgUrl}`;
        console.log(`Found image URL: ${fullImgUrl}`);

        // Fetch the image
        const imgResponse = await fetch(fullImgUrl);
        if (!imgResponse.ok) throw new Error(`Failed to fetch image: ${imgResponse.statusText}`);

        const buffer = Buffer.from(await imgResponse.arrayBuffer());

        // Generate random filename
        const ext = path.extname(fullImgUrl.split('?')[0]) || '.jpg';
        const fileName = `sieportal-${sku}-${crypto.randomBytes(4).toString("hex")}${ext}`;
        const contentType = imgResponse.headers.get("content-type") || "image/jpeg";

        // Upload to MinIO
        const fileUrl = await uploadBufferToMinio(buffer, fileName, contentType, "products");

        // Save to Database
        await db.product.update({
            where: { id: productId },
            data: { image: fileUrl },
        });

        revalidatePath(`/admin/products/${productId}`);
        revalidatePath(`/admin/products/${sku}`);
        revalidatePath('/admin/products');

        return { success: true, url: fileUrl };

    } catch (error: any) {
        console.error("Error scraping sieportal image:", error);
        return { success: false, error: error?.message || "Gagal menarik gambar dari Sieportal." };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
