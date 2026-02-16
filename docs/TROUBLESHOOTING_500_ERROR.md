# Troubleshooting AI Layout Builder 500 Error

## Quick Summary

The 500 error you're seeing when generating layouts is a server-side error. This usually means:
1. **Playwright is not installed** (for URL screenshot capture)
2. **Anthropic API key is missing** (for Claude LLM)
3. **Server-side dependency issue**

## Immediate Steps to Diagnose

### 1. Visit the Diagnostics Page

I've created a diagnostics page to quickly identify the issue:

**Visit:** `https://your-server.com/settings/layout-builder-diagnostics`

This page will show you exactly what's missing and provide setup instructions.

### 2. Check Server Logs

SSH into your server and run:

```bash
# If using pm2
pm2 logs online-docs --lines 100

# Or check system logs
journalctl -u online-docs.service -n 100 --no-pager
```

Look for errors related to:
- `Playwright`
- `Anthropic`
- `ANTHROPIC_API_KEY`
- `Cannot find module`

## Most Likely Cause: Playwright Not Installed

The most common cause is that Playwright browser automation isn't installed on the server.

### Fix for Ubuntu/Debian:

```bash
cd /srv/online-docs  # or your app directory

# Install Playwright
npm install

# Install Chromium browser
npx playwright install chromium

# Install system dependencies
sudo npx playwright install-deps chromium

# Restart your app
pm2 restart online-docs
# OR
sudo systemctl restart online-docs.service
```

**Note for Ubuntu 24.04:** You may see errors about missing packages like `libasound2`. These packages now have `t64` suffixes. The `npx playwright install-deps chromium` command handles this automatically.

See `docs/BROWSER_AUTOMATION_SETUP.md` for detailed Playwright setup instructions.

## Second Most Likely: Missing Anthropic API Key

If you see errors like "authentication failed" or "API key", you need to set up your Claude API key.

### Fix:

1. Get an API key from https://console.anthropic.com/
2. Add it to your `.env` file:

```bash
cd /srv/online-docs
nano .env  # or use vim/vi
```

3. Add this line:

```
ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here...
```

4. Restart your app:

```bash
pm2 restart online-docs
# OR
sudo systemctl restart online-docs.service
```

## What I Changed (Technical Details)

### 1. Comprehensive Error Handling

I added detailed error handling throughout the layout generation pipeline:

- **`app/api/layouts/generate/route.ts`** - Catches and logs all errors with detailed messages
- **`lib/services/llm-service.ts`** - Gracefully handles Playwright not being installed
- **`lib/services/llm-service.ts`** - Provides helpful error messages for API key issues

### 2. Health Check Endpoint

Created **`/api/layouts/health`** that checks:
- Anthropic API key status
- OpenAI API key status
- Playwright installation status

### 3. Diagnostics Page

Created **`/settings/layout-builder-diagnostics`** with:
- Visual dependency status
- Setup instructions for missing dependencies
- Links to documentation

### 4. Moved Chat to Floating Widget

As requested:
- Removed chat from left sidebar
- Created new `LayoutBuilderChatWidget` component
- Chat now appears as floating widget in bottom-right corner
- Auto-opens when AI generates layout with success message
- Includes minimize/close functionality

## Testing After Fix

Once you've installed the missing dependencies:

1. Visit `/settings/layout-builder-diagnostics` to verify all checks pass
2. Try generating a layout again
3. The chat widget should pop open with "Layout generated successfully. Review the preview and provide feedback to refine it."

## Getting More Help

If you're still seeing the 500 error after fixing dependencies, send me:

1. Output from `/settings/layout-builder-diagnostics`
2. Server logs (last 100 lines): `pm2 logs online-docs --lines 100`
3. Browser console errors (F12 → Console tab)

## Documentation References

- **Setup Guide:** `docs/LAYOUT_BUILDER_SETUP.md`
- **Browser Automation:** `docs/BROWSER_AUTOMATION_SETUP.md`
- **User Guide:** Visit `/docs/ai-layout-guide` or see `docs/AI_LAYOUT_BUILDER_GUIDE.md`

---

## Quick Command Reference

```bash
# Check status
pm2 status
pm2 logs online-docs --lines 50

# Install Playwright (if missing)
cd /srv/online-docs
npm install
npx playwright install chromium
sudo npx playwright install-deps chromium

# Restart app
pm2 restart online-docs

# Check it's working
curl http://localhost:3000/api/layouts/health
```
