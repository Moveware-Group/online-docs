# Browser Automation Setup for AI Layout Builder

## Overview

The AI Layout Builder now uses **Playwright** browser automation to capture screenshots and HTML from reference URLs. This solves common issues with:

- 🔐 **Authentication** - Can use session cookies
- 🚫 **CORS restrictions** - Bypasses cross-origin issues
- ⚡ **JavaScript rendering** - Waits for dynamic content to load
- 📸 **Visual accuracy** - Captures actual rendered appearance

## Installation

### 1. Install Dependencies

```bash
cd /srv/ai/repos/online-docs
sudo -u moveware-ai npm install
```

This will install Playwright and its dependencies.

### 2. Install Browser Binaries

Playwright needs to download browser binaries (Chromium):

```bash
# Install Playwright browsers
sudo -u moveware-ai npx playwright install chromium

# Install system dependencies for browsers
sudo npx playwright install-deps chromium
```

### 3. Verify Installation

Test that Playwright can launch:

```bash
sudo -u moveware-ai npx playwright --version
```

## Server Requirements

### System Dependencies

Playwright requires certain system libraries. On Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2
```

### Memory Requirements

Browser automation requires additional RAM:
- **Minimum**: 512MB free RAM
- **Recommended**: 1GB+ free RAM

Check available memory:
```bash
free -h
```

### Disk Space

Browser binaries require approximately:
- **Chromium**: ~300MB

Check available space:
```bash
df -h /srv/ai/repos/online-docs
```

## How It Works

When a user provides a reference URL:

1. **Browser Launch** - Playwright launches headless Chromium
2. **Navigate** - Goes to the URL with full browser context
3. **Wait** - Waits for network idle and dynamic content
4. **Capture** - Takes full-page screenshot (PNG)
5. **Extract** - Saves HTML source
6. **Send to AI** - Screenshot + HTML sent to Claude
7. **AI Analysis** - Claude visually analyzes the screenshot and matches layout

## Configuration

### Timeout Settings

Default timeouts in `lib/services/browser-service.ts`:

```typescript
page.setDefaultTimeout(30000); // 30 seconds
```

Adjust if needed for slow-loading pages.

### Screenshot Quality

Screenshots are captured as full-page PNG images:

```typescript
const screenshot = await page.screenshot({
  fullPage: true,  // Capture entire page
  type: "png",     // PNG format
});
```

### Browser Arguments

The browser launches with these arguments for server compatibility:

```typescript
args: [
  "--no-sandbox",           // Required for root/Docker
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage", // Use /tmp instead of /dev/shm
  "--disable-gpu",          // Disable GPU in headless mode
]
```

## Usage in Layout Builder

### For Staff Users

When creating a custom layout:

1. **Enter Reference URL** - Paste the URL of the quote page to match
2. **Add Description** (optional) - Provide context
3. **Click Generate** - The system will:
   - Launch browser
   - Navigate to URL
   - Capture screenshot
   - Send screenshot to AI
   - AI matches the visual layout

**Note**: With browser automation, the description is now optional since the AI can see the actual page.

### Supported URLs

✅ **Supported:**
- Public URLs
- URLs with query parameters (tokens, etc.)
- URLs behind basic authentication (with env vars)
- JavaScript-rendered pages
- Dynamic content

❌ **Not Supported:**
- URLs requiring interactive login (2FA, captcha)
- Localhost URLs (from server perspective)
- IP-restricted URLs

## Troubleshooting

### Error: "Browser failed to launch"

**Check system dependencies:**
```bash
sudo npx playwright install-deps chromium
```

**Check available memory:**
```bash
free -h
# If low, restart services or increase server RAM
```

### Error: "Timeout waiting for page"

The page is taking too long to load.

**Solutions:**
1. Increase timeout in `browser-service.ts`
2. Check if URL requires authentication
3. Verify URL is accessible from server

### Error: "Navigation failed"

The URL might be unreachable or require authentication.

**Check:**
```bash
# Test URL accessibility from server
curl -I https://the-url.com
```

**Add authentication if needed** (future feature):
```typescript
// In browser-service.ts
await page.setExtraHTTPHeaders({
  'Authorization': 'Bearer token',
});
```

### Browser Process Not Closing

If browser processes accumulate:

```bash
# Find and kill browser processes
ps aux | grep chromium
sudo kill <pid>

# Or restart the application
pm2 restart online-docs
```

The browser service includes cleanup handlers, but manual cleanup may be needed if the process crashes.

### High Memory Usage

Each browser instance uses ~100-200MB RAM.

**Monitor:**
```bash
# Watch memory usage
watch -n 2 'free -h; echo; pm2 list'
```

**Solutions:**
- Ensure browser closes after each capture
- Restart app if memory leaks: `pm2 restart online-docs`
- Increase server RAM if needed

## Performance Considerations

### Speed

- **First capture**: 5-10 seconds (browser launch + navigation)
- **Subsequent captures**: 2-5 seconds (reuses browser)

### Resource Usage

Per URL capture:
- **CPU**: Brief spike during rendering
- **RAM**: ~100-200MB during capture
- **Network**: Downloads page + assets

### Scaling

For high-volume usage:
- Consider implementing a browser pool
- Add request queuing
- Set capture timeouts appropriately

## Security Considerations

### Sandbox Mode

The browser runs with `--no-sandbox` flag for server compatibility. This is necessary but reduces isolation.

**Mitigation:**
- Only capture trusted/whitelisted URLs
- Run as non-root user (moveware-ai)
- Keep Playwright updated

### Data Privacy

Screenshots and HTML are:
- ✅ Stored temporarily in memory
- ✅ Sent to Claude API (follows their data policies)
- ✅ Not saved to disk
- ✅ Not cached long-term

### URL Access

The server can access:
- Any publicly accessible URL
- URLs with tokens in query strings
- Internal network URLs (if server has access)

**Recommendation**: Validate URLs before capture.

## Monitoring

### Check Browser Service Logs

```bash
# Watch application logs
pm2 logs online-docs --lines 100

# Look for browser service logs
pm2 logs online-docs | grep "\[Browser\]"
```

### Metrics to Monitor

- Browser launch time
- Page load time
- Screenshot size
- Success/failure rate
- Memory usage trends

## Maintenance

### Update Playwright

Keep Playwright updated for security and compatibility:

```bash
cd /srv/ai/repos/online-docs
sudo -u moveware-ai npm update playwright
sudo -u moveware-ai npx playwright install chromium
```

### Clean Up Old Browsers

If multiple Playwright versions accumulate:

```bash
# Remove old browser binaries
rm -rf ~/.cache/ms-playwright/

# Reinstall current version
npx playwright install chromium
```

## Future Enhancements

Potential improvements:

1. **Authentication Support** - Handle login flows
2. **Browser Pool** - Reuse multiple browser instances
3. **Caching** - Cache screenshots for same URLs
4. **Multiple Viewports** - Capture mobile/tablet/desktop
5. **Selective Capture** - Capture specific page elements
6. **Video Recording** - Record page loading for debugging

## Support

If issues persist:

1. Check logs: `pm2 logs online-docs`
2. Verify Playwright installation: `npx playwright --version`
3. Test browser launch: `node -e "require('playwright').chromium.launch().then(b => b.close())"`
4. Review system resources: `free -h && df -h`
