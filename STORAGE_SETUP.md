# Storage Setup Guide

This guide covers the setup and configuration of file storage for logo uploads in both local/VPS environments and Azure production environments.

## Overview

The application supports two storage backends:

1. **Local File Storage** - For development and VPS deployments
2. **Azure Blob Storage** - For production cloud deployments

This document focuses on local file storage setup, nginx configuration, and Azure equivalents.

## Local/VPS File Storage Setup

### 1. Create Storage Directory

Create the uploads directory with appropriate permissions:

```bash
# Create the directory
sudo mkdir -p /srv/uploads/logos

# Set ownership to the appropriate user
# Option A: For nginx/www-data user
sudo chown -R www-data:www-data /srv/uploads/logos

# Option B: For Node.js/PM2 user
sudo chown -R $USER:$USER /srv/uploads/logos
# Or for a specific node user:
sudo chown -R node:node /srv/uploads/logos

# Set appropriate permissions (read/write for owner, read for others)
sudo chmod -R 755 /srv/uploads/logos
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Local file storage path (default: /srv/uploads/logos)
LOCAL_STORAGE_PATH=/srv/uploads/logos
```

### 3. Configure Nginx

Include the nginx configuration from `nginx/logos-storage.conf` in your site configuration:

```bash
# Copy the configuration
sudo cp nginx/logos-storage.conf /etc/nginx/snippets/logos-storage.conf

# Edit your site configuration
sudo nano /etc/nginx/sites-available/your-site
```

Add this line inside your `server` block:

```nginx
include snippets/logos-storage.conf;
```

Example complete site configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Include logo storage configuration
    include snippets/logos-storage.conf;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 5. Verify Storage Setup

Run the storage verification script:

```bash
npm run storage:check
```

This will verify that:
- The directory exists
- The directory is readable
- The directory is writable

## Azure Production Setup

### Azure Blob Storage Configuration

For production deployments on Azure, use Azure Blob Storage instead of local file storage.

#### 1. Create Storage Account

```bash
# Using Azure CLI
az storage account create \
  --name yourstorageaccount \
  --resource-group your-resource-group \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Create container for logos
az storage container create \
  --name company-logos \
  --account-name yourstorageaccount \
  --public-access blob
```

#### 2. Get Connection String

```bash
az storage account show-connection-string \
  --name yourstorageaccount \
  --resource-group your-resource-group
```

#### 3. Configure Environment Variables

Add to your Azure App Service configuration or `.env`:

```bash
# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME=company-logos

# Optional: Use Azure CDN for serving files
AZURE_CDN_ENDPOINT=https://your-cdn.azureedge.net
```

#### 4. Azure App Service Configuration

No nginx configuration needed - Azure App Service automatically serves uploaded blobs from the configured storage account.

**File Serving URL Pattern:**
```
https://{storage-account}.blob.core.windows.net/{container-name}/{blob-name}
```

With CDN:
```
https://{cdn-endpoint}.azureedge.net/{container-name}/{blob-name}
```

#### 5. CORS Configuration (if needed)

Configure CORS on the storage account:

```bash
az storage cors add \
  --services b \
  --methods GET POST PUT DELETE \
  --origins "https://your-domain.com" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name yourstorageaccount
```

### Azure Equivalents to Local Setup

| Local Setup | Azure Equivalent |
|-------------|------------------|
| `/srv/uploads/logos/` directory | Azure Blob Storage Container |
| `nginx` file serving | Azure Blob Storage public access / CDN |
| `client_max_body_size 5M` | Azure App Service max request size (default 30MB) |
| File permissions (755) | Storage account access policies / SAS tokens |
| Disk backup | Azure Storage redundancy (LRS/GRS/RA-GRS) |

## Backup Strategy

### Local/VPS Backup Strategy

#### 1. Daily Automated Backups

Create a backup script (`scripts/backup-storage.sh`):

```bash
#!/bin/bash
# Storage backup script

BACKUP_DIR="/srv/backups/logos"
STORAGE_DIR="/srv/uploads/logos"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/logos_backup_$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create compressed backup
tar -czf $BACKUP_FILE -C $STORAGE_DIR .

# Keep only last 30 days of backups
find $BACKUP_DIR -name "logos_backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

#### 2. Cron Job Setup

Add to crontab (`crontab -e`):

```cron
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-storage.sh >> /var/log/storage-backup.log 2>&1
```

#### 3. Off-site Backup

Sync backups to remote storage:

```bash
# Rsync to remote server
rsync -avz /srv/backups/logos/ user@remote-server:/backups/logos/

# Or sync to cloud storage (S3/Azure/GCS)
aws s3 sync /srv/backups/logos/ s3://your-bucket/logos-backups/
```

#### 4. Backup Verification

Periodically test backup restoration:

```bash
# Test restoration to temporary directory
mkdir -p /tmp/test-restore
tar -xzf /srv/backups/logos/logos_backup_YYYYMMDD_HHMMSS.tar.gz -C /tmp/test-restore
ls -la /tmp/test-restore
rm -rf /tmp/test-restore
```

### Azure Backup Strategy

Azure Blob Storage provides built-in redundancy and backup features:

#### 1. Storage Redundancy

Choose appropriate redundancy level:

- **LRS** (Locally Redundant Storage) - 3 copies in one datacenter
- **GRS** (Geo-Redundant Storage) - 6 copies across two regions
- **RA-GRS** (Read-Access Geo-Redundant) - GRS with read access to secondary

```bash
az storage account update \
  --name yourstorageaccount \
  --resource-group your-resource-group \
  --sku Standard_GRS
```

#### 2. Soft Delete

Enable soft delete for blob recovery:

```bash
az storage blob service-properties delete-policy update \
  --days-retained 30 \
  --account-name yourstorageaccount \
  --enable true
```

#### 3. Versioning

Enable blob versioning:

```bash
az storage account blob-service-properties update \
  --account-name yourstorageaccount \
  --enable-versioning true
```

#### 4. Point-in-Time Restore

Enable point-in-time restore (requires versioning):

```bash
az storage account blob-service-properties update \
  --account-name yourstorageaccount \
  --enable-restore-policy true \
  --restore-days 7
```

#### 5. Backup to Secondary Storage

For additional protection, periodically copy to another storage account:

```bash
# Using AzCopy
azcopy copy \
  "https://source.blob.core.windows.net/company-logos?[SAS]" \
  "https://backup.blob.core.windows.net/company-logos-backup?[SAS]" \
  --recursive
```

## Monitoring and Alerts

### Local/VPS Monitoring

```bash
# Check disk usage
df -h /srv/uploads/logos

# Monitor directory size
du -sh /srv/uploads/logos

# Check file count
find /srv/uploads/logos -type f | wc -l
```

Set up alerts for disk space:

```bash
# Add to monitoring script
USAGE=$(df -h /srv/uploads/logos | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
  echo "Warning: Storage usage at $USAGE%" | mail -s "Storage Alert" admin@example.com
fi
```

### Azure Monitoring

1. Enable Azure Monitor for Storage Account
2. Set up alerts for:
   - Storage capacity threshold
   - Transaction rate
   - Availability
   - Error rate

```bash
# Create metric alert
az monitor metrics alert create \
  --name high-storage-usage \
  --resource-group your-resource-group \
  --scopes /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{name} \
  --condition "total UsedCapacity > 80" \
  --description "Alert when storage exceeds 80GB"
```

## Security Considerations

### Local/VPS Security

1. **File Permissions**
   - Owner: www-data or node user
   - Permissions: 755 (rwxr-xr-x)
   - No execute permissions on uploaded files

2. **Nginx Security**
   - Deny execution of PHP/script files
   - Set proper MIME types
   - Add security headers (X-Content-Type-Options, X-Frame-Options)

3. **File Type Validation**
   - Validate file extensions
   - Verify MIME types on upload
   - Scan for malware if handling user uploads

### Azure Security

1. **Access Control**
   - Use Azure AD authentication
   - Generate SAS tokens for temporary access
   - Implement role-based access control (RBAC)

2. **Network Security**
   - Configure firewall rules
   - Use private endpoints if needed
   - Enable Azure Private Link

3. **Encryption**
   - Enable encryption at rest (enabled by default)
   - Use HTTPS for all transfers
   - Consider customer-managed keys for additional security

## Troubleshooting

### Common Issues

#### Permission Denied

```bash
# Check directory ownership
ls -la /srv/uploads/logos

# Fix ownership
sudo chown -R www-data:www-data /srv/uploads/logos

# Fix permissions
sudo chmod -R 755 /srv/uploads/logos
```

#### Nginx 404 for Uploaded Files

```bash
# Check nginx configuration
sudo nginx -t

# Check nginx error log
sudo tail -f /var/log/nginx/uploads_error.log

# Verify alias path
sudo ls -la /srv/uploads/logos
```

#### Storage Health Check Fails

```bash
# Run with verbose output
DEBUG=* npm run storage:check

# Check directory manually
touch /srv/uploads/logos/test.txt
rm /srv/uploads/logos/test.txt
```

#### Azure Blob Upload Fails

```bash
# Verify connection string
az storage account show-connection-string --name yourstorageaccount

# Test connection
az storage container list --connection-string "your-connection-string"

# Check CORS configuration
az storage cors list --services b --connection-string "your-connection-string"
```

## Migration Between Storage Backends

### Local to Azure

```bash
# Sync local files to Azure Blob Storage
azcopy sync \
  /srv/uploads/logos \
  "https://yourstorageaccount.blob.core.windows.net/company-logos?[SAS]" \
  --recursive
```

### Azure to Local

```bash
# Download from Azure to local
azcopy sync \
  "https://yourstorageaccount.blob.core.windows.net/company-logos?[SAS]" \
  /srv/uploads/logos \
  --recursive
```

## References

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Next.js Static File Serving](https://nextjs.org/docs/basic-features/static-file-serving)
