/**
 * Browser Service - Use Playwright to render URLs and capture screenshots
 * This works around CORS, authentication, and JavaScript rendering issues
 */

import { chromium, Browser, Page } from "playwright";

let browserInstance: Browser | null = null;

/**
 * Get or create a browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log("[Browser] Launching Chromium browser...");
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log("[Browser] Browser closed");
  }
}

/**
 * Capture a screenshot and HTML of a URL
 */
export async function captureUrl(url: string): Promise<{
  screenshot: Buffer | null;
  html: string | null;
  error?: string;
}> {
  let page: Page | null = null;
  
  try {
    console.log(`[Browser] Navigating to: ${url}`);
    
    const browser = await getBrowser();
    page = await browser.newPage({
      viewport: { width: 1280, height: 1024 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    // Set a reasonable timeout
    page.setDefaultTimeout(30000); // 30 seconds

    // Navigate to the URL
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    if (!response || !response.ok()) {
      const status = response?.status() || "unknown";
      console.warn(`[Browser] Response not OK: ${status}`);
      return {
        screenshot: null,
        html: null,
        error: `HTTP ${status}`,
      };
    }

    console.log("[Browser] Page loaded, waiting for content...");

    // Wait for dynamic content and images to load
    try {
      // Wait for images to load
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 });
      await page.waitForTimeout(3000); // Give extra time for fonts, images, etc.
      
      // Scroll to load lazy-loaded content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);
      
      // Scroll back to top for screenshot
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(500);
      
      console.log("[Browser] Content fully loaded and rendered");
    } catch (waitError) {
      console.warn("[Browser] Timeout waiting for content, proceeding anyway:", waitError);
    }

    // Capture screenshot (full page)
    console.log("[Browser] Capturing screenshot...");
    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    // Get HTML content
    console.log("[Browser] Extracting HTML...");
    const html = await page.content();

    console.log(`[Browser] Success - captured ${(screenshot.length / 1024).toFixed(2)}KB screenshot and ${(html.length / 1024).toFixed(2)}KB HTML`);

    return {
      screenshot,
      html,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Browser] Error capturing URL: ${errorMsg}`);
    return {
      screenshot: null,
      html: null,
      error: errorMsg,
    };
  } finally {
    if (page) {
      await page.close().catch(console.error);
    }
  }
}

/**
 * Capture just the HTML of a URL (faster, no screenshot)
 */
export async function fetchHtml(url: string): Promise<{
  html: string | null;
  error?: string;
}> {
  let page: Page | null = null;
  
  try {
    console.log(`[Browser] Fetching HTML from: ${url}`);
    
    const browser = await getBrowser();
    page = await browser.newPage({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    page.setDefaultTimeout(20000);

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    if (!response || !response.ok()) {
      const status = response?.status() || "unknown";
      return {
        html: null,
        error: `HTTP ${status}`,
      };
    }

    const html = await page.content();
    console.log(`[Browser] Fetched ${(html.length / 1024).toFixed(2)}KB HTML`);

    return { html };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Browser] Error fetching HTML: ${errorMsg}`);
    return {
      html: null,
      error: errorMsg,
    };
  } finally {
    if (page) {
      await page.close().catch(console.error);
    }
  }
}

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("exit", () => {
    closeBrowser().catch(console.error);
  });
  
  process.on("SIGINT", async () => {
    await closeBrowser();
    process.exit(0);
  });
  
  process.on("SIGTERM", async () => {
    await closeBrowser();
    process.exit(0);
  });
}
