# AI Layout Builder - Server Setup Guide

## Overview

The AI Layout Builder allows uploading reference PDFs and images up to 10MB. This requires proper server configuration.

## 1. Nginx Configuration

### Update Upload Size Limit

The nginx configuration needs to allow uploads up to 10MB.

**File:** `/etc/nginx/sites-available/your-site.conf` (or your nginx config)

Add or update this line in the `server` block:

```nginx
server {
    # ... other config ...
    
    # Allow uploads up to 10MB for layout builder PDFs
    client_max_body_size 10M;
    
    # ... other config ...
}
```

### Include Layout Uploads Configuration

Copy the nginx config files from the repo:

```bash
# From the repo root
sudo cp nginx/logos-storage.conf /etc/nginx/snippets/
sudo cp nginx/layout-uploads.conf /etc/nginx/snippets/
```

Then include them in your main site config:

```nginx
server {
    # ... other config ...
    
    include /etc/nginx/snippets/logos-storage.conf;
    include /etc/nginx/snippets/layout-uploads.conf;
    
    # ... other config ...
}
```

### Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## 2. Create Upload Directories

Ensure the upload directories exist with proper permissions:

```bash
# Create directories
sudo mkdir -p /srv/uploads/layouts
sudo mkdir -p public/uploads/layouts

# Set ownership (adjust user/group as needed)
sudo chown -R www-data:www-data /srv/uploads/
sudo chown -R moveware-ai:moveware-ai public/uploads/

# Set permissions
sudo chmod -R 755 /srv/uploads/
sudo chmod -R 755 public/uploads/
```

## 3. Browser Automation Setup (NEW!)

The AI Layout Builder now uses **Playwright** to capture screenshots of reference URLs for much better accuracy.

### Install Playwright

```bash
cd /srv/ai/repos/online-docs

# Install dependencies
sudo -u moveware-ai npm install

# Install browser binaries
sudo -u moveware-ai npx playwright install chromium
sudo npx playwright install-deps chromium
```

See `docs/BROWSER_AUTOMATION_SETUP.md` for full details.

## 4. Environment Variables

No additional environment variables are required for file uploads. However, ensure your `.env` file has:

```bash
# LLM API Keys (for layout generation)
ANTHROPIC_API_KEY=your_key_here
# OR
OPENAI_API_KEY=your_key_here

# Primary LLM provider (anthropic or openai)
LLM_PRIMARY_PROVIDER=anthropic
```

## 4. Verify Setup

### Test File Upload Size

You can test the upload limit with curl:

```bash
# Create a test file (9MB)
dd if=/dev/zero of=test-9mb.pdf bs=1M count=9

# Try uploading it
curl -X POST \
  -F "file=@test-9mb.pdf" \
  https://your-domain.com/api/layouts/upload

# Should return success with file URL
```

### Check Nginx Logs

If uploads are still failing:

```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check layout uploads error log
sudo tail -f /var/log/nginx/layout_uploads_error.log
```

## 5. Troubleshooting

### Error: "Upload failed: Server returned 413"

**Cause:** Nginx is rejecting the upload because it exceeds `client_max_body_size`

**Solution:**
1. Check nginx config has `client_max_body_size 10M;`
2. Reload nginx: `sudo systemctl reload nginx`
3. Clear browser cache and try again

### Error: "Failed to save file"

**Cause:** Permission issues or directory doesn't exist

**Solution:**
```bash
# Check directory exists
ls -la public/uploads/layouts/

# Fix permissions
sudo chown -R moveware-ai:moveware-ai public/uploads/
sudo chmod -R 755 public/uploads/
```

### Error: "File not found" after upload

**Cause:** The file upload API route might not be serving files correctly

**Solution:**
1. Check the file was actually saved: `ls -la public/uploads/layouts/`
2. Check Next.js is serving the API route: `curl http://localhost:3000/api/uploads/layouts/test.pdf`
3. Rebuild the application: `npm run build && pm2 restart online-docs`

## 6. Production Checklist

Before deploying to production:

- [ ] Nginx `client_max_body_size` set to at least 10M
- [ ] Upload directories created with proper permissions
- [ ] Nginx configuration tested and reloaded
- [ ] Test file upload with 5-10MB PDF
- [ ] LLM API keys configured in `.env`
- [ ] Application rebuilt and restarted
- [ ] Check nginx logs for any errors
- [ ] Verify files are being saved to correct location
- [ ] Test accessing uploaded files via API route

## 7. Security Considerations

The upload route includes several security measures:

1. **File type validation** - Only allows PDF, PNG, JPEG, WebP
2. **File size limit** - Maximum 10MB
3. **Filename sanitization** - Removes dangerous characters
4. **Unique filenames** - Uses UUID to prevent overwrites
5. **No script execution** - Nginx blocks execution of uploaded files

## 8. Storage Considerations

### Disk Space

Layout reference files are stored in `public/uploads/layouts/`. Monitor disk usage:

```bash
# Check disk usage
du -sh public/uploads/layouts/

# List large files
find public/uploads/layouts/ -size +5M -ls
```

### Cleanup Old Files

Consider implementing a cleanup policy for old reference files:

```bash
# Delete files older than 90 days
find public/uploads/layouts/ -type f -mtime +90 -delete
```

## Support

If you encounter issues not covered in this guide, check:

1. Next.js logs: `pm2 logs online-docs`
2. Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Application console in browser dev tools
