/**
 * Browser Service - Capture screenshots and HTML from URLs
 *
 * Strategy (tries in order):
 * 1. Playwright with full browser rendering (handles JS-rendered pages)
 * 2. Playwright with relaxed response checks (some SPAs return non-200 initially)
 * 3. Simple HTTP fetch for HTML-only fallback
 */

import { chromium, Browser, Page } from "playwright";

let browserInstance: Browser | null = null;

// ---------------------------------------------------------------------------
// Browser lifecycle
// ---------------------------------------------------------------------------

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
        "--disable-blink-features=AutomationControlled",
      ],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log("[Browser] Browser closed");
  }
}

// ---------------------------------------------------------------------------
// Main capture function with retry strategies
// ---------------------------------------------------------------------------

export async function captureUrl(url: string): Promise<{
  screenshot: Buffer | null;
  html: string | null;
  error?: string;
}> {
  console.log(`[Browser] Starting capture for: ${url}`);

  // Strategy 1: Full Playwright render
  const result = await captureWithPlaywright(url, { strictStatus: true });
  if (result.screenshot || result.html) {
    console.log("[Browser] Strategy 1 (Playwright strict) succeeded");
    return result;
  }

  console.log(`[Browser] Strategy 1 failed (${result.error}), trying strategy 2...`);

  // Strategy 2: Playwright but accept any response (some SPAs return 404 initially then render)
  const result2 = await captureWithPlaywright(url, { strictStatus: false });
  if (result2.screenshot || result2.html) {
    console.log("[Browser] Strategy 2 (Playwright relaxed) succeeded");
    return result2;
  }

  console.log(`[Browser] Strategy 2 failed (${result2.error}), trying strategy 3...`);

  // Strategy 3: Simple HTTP fetch for HTML only
  const result3 = await fetchWithHttp(url);
  if (result3.html) {
    console.log("[Browser] Strategy 3 (HTTP fetch) succeeded");
    return { screenshot: null, html: result3.html };
  }

  console.log(`[Browser] All strategies failed`);

  // Return the most informative error
  return {
    screenshot: null,
    html: null,
    error: `All capture methods failed. Playwright: ${result.error}. HTTP: ${result3.error}`,
  };
}

// ---------------------------------------------------------------------------
// Strategy 1 & 2: Playwright capture
// ---------------------------------------------------------------------------

async function captureWithPlaywright(
  url: string,
  options: { strictStatus: boolean },
): Promise<{
  screenshot: Buffer | null;
  html: string | null;
  error?: string;
}> {
  let page: Page | null = null;
  let context: any = null;

  try {
    const browser = await getBrowser();
    
    // Create a new context with aggressive anti-detection
    context = await browser.newContext({
      viewport: { width: 1280, height: 1024 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      extraHTTPHeaders: {
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    // Use evaluateOnNewDocument - runs BEFORE any page scripts
    await context.addInitScript(() => {
      // Override userAgent at the earliest possible moment
      Object.defineProperty(navigator, "userAgent", {
        get: () =>
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        configurable: true,
      });

      Object.defineProperty(navigator, "appVersion", {
        get: () => "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        configurable: true,
      });

      Object.defineProperty(navigator, "vendor", {
        get: () => "Google Inc.",
        configurable: true,
      });

      Object.defineProperty(navigator, "platform", {
        get: () => "Win32",
        configurable: true,
      });

      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
        configurable: true,
      });

      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
        configurable: true,
      });

      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
        configurable: true,
      });

      // Add Chrome object
      (window as any).chrome = {
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      };

      // Remove automation indicators
      delete (navigator as any).__proto__.webdriver;
      
      // Prevent checkIE from running by overriding it
      (window as any).checkIE = function() {
        // Do nothing - prevent IE detection
      };
    });

    page = await context.newPage();
    page.setDefaultTimeout(45000);

    console.log(`[Browser] Navigating to URL (strict=${options.strictStatus})...`);

    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    const status = response?.status() || 0;
    console.log(`[Browser] Response status: ${status}`);

    // In strict mode, reject non-2xx responses
    if (options.strictStatus && (!response || !response.ok())) {
      return {
        screenshot: null,
        html: null,
        error: `HTTP ${status}`,
      };
    }

    // In relaxed mode, check if the page actually has content
    // (some SPAs return 404 status but render the page via JS)
    if (!options.strictStatus && status >= 400) {
      console.log(`[Browser] Got ${status} but checking if page has content...`);
      await page.waitForTimeout(3000);

      const bodyText = await page.evaluate(() => document.body?.innerText?.trim() || "");
      if (bodyText.length < 50) {
        return {
          screenshot: null,
          html: null,
          error: `HTTP ${status} with empty body`,
        };
      }
      console.log(
        `[Browser] Page has content despite ${status} status (${bodyText.length} chars)`,
      );
    }

    // Wait for content to fully render
    console.log("[Browser] Waiting for content to render...");
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
      await page.waitForTimeout(3000);

      // Force hide any IE warning elements (in case detection still happens)
      await page.evaluate(() => {
        const ieWarning = document.getElementById("ie-warning");
        if (ieWarning) {
          ieWarning.style.display = "none";
        }
        // Also hide app-root elements that might be hidden
        const appRoot = document.querySelector('[id^="app-root"]');
        if (appRoot && (appRoot as HTMLElement).style.display === "none") {
          (appRoot as HTMLElement).style.display = "block";
        }
      });

      // Scroll to trigger lazy loading
      await page.evaluate(async () => {
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const totalHeight = document.body.scrollHeight;
        const step = window.innerHeight;
        for (let pos = 0; pos < totalHeight; pos += step) {
          window.scrollTo(0, pos);
          await delay(200);
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    } catch {
      console.warn("[Browser] Timeout waiting for full render, proceeding...");
    }

    // Capture screenshot
    console.log("[Browser] Capturing screenshot...");
    const screenshot = await page.screenshot({ fullPage: true, type: "png" });

    // Get HTML
    const html = await page.content();

    console.log(
      `[Browser] Captured ${(screenshot.length / 1024).toFixed(2)}KB screenshot, ${(html.length / 1024).toFixed(2)}KB HTML`,
    );

    // Save debug screenshot
    await saveDebugScreenshot(screenshot);

    return { screenshot, html };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Browser] Playwright capture failed: ${msg}`);
    return { screenshot: null, html: null, error: msg };
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (context) {
      await context.close().catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// Strategy 3: Simple HTTP fetch
// ---------------------------------------------------------------------------

async function fetchWithHttp(url: string): Promise<{
  html: string | null;
  error?: string;
}> {
  try {
    console.log(`[Browser] Trying simple HTTP fetch: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    console.log(`[Browser] HTTP fetch status: ${response.status}`);

    if (!response.ok) {
      return { html: null, error: `HTTP ${response.status} ${response.statusText}` };
    }

    const html = await response.text();
    console.log(`[Browser] HTTP fetch got ${(html.length / 1024).toFixed(2)}KB HTML`);

    // Check if we got meaningful HTML (not just error pages)
    if (html.length < 200) {
      return { html: null, error: "Response too small to be a valid page" };
    }

    return { html };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Browser] HTTP fetch failed: ${msg}`);
    return { html: null, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Public: Fetch just HTML (faster, no screenshot)
// ---------------------------------------------------------------------------

export async function fetchHtml(url: string): Promise<{
  html: string | null;
  error?: string;
}> {
  // Try HTTP first (faster), then Playwright
  const httpResult = await fetchWithHttp(url);
  if (httpResult.html) return httpResult;

  let page: Page | null = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    page.setDefaultTimeout(20000);

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    if (!response || !response.ok()) {
      return { html: null, error: `HTTP ${response?.status() || "unknown"}` };
    }

    const html = await page.content();
    return { html };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { html: null, error: msg };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Debug: Save screenshot to disk
// ---------------------------------------------------------------------------

async function saveDebugScreenshot(screenshot: Buffer): Promise<void> {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.DEBUG_SCREENSHOTS !== "true"
  ) {
    return;
  }

  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const debugDir = path.join(process.cwd(), "public", "debug-screenshots");
    await fs.mkdir(debugDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `screenshot-${timestamp}.png`;
    await fs.writeFile(path.join(debugDir, filename), screenshot);
    console.log(`[Browser] DEBUG: Screenshot saved to /debug-screenshots/${filename}`);
  } catch (err) {
    console.warn("[Browser] Failed to save debug screenshot:", err);
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

if (typeof process !== "undefined") {
  process.on("exit", () => {
    closeBrowser().catch(() => {});
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
