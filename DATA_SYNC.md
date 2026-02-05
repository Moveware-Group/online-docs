# Data Synchronization Guide

This document explains how data flows between the Moveware API and your PostgreSQL database.

## Overview

The system uses a **lazy-loading approach** where data is automatically fetched from the Moveware API only when needed, and then cached in your local PostgreSQL database for faster subsequent access.

## Data Flow

### 1. First Access (Automatic Sync)

When a user visits a quote page (e.g., `/jobs/111505`):

1. **Check Database**: The system first checks if the job exists in the local PostgreSQL database
2. **Fetch from API**: If not found, it automatically fetches data from the Moveware API
3. **Transform & Save**: The API data is transformed and saved to the database
4. **Display**: The page displays the data from the database

```
User Request → Database Check → [Not Found] → Moveware API → Transform → Save to DB → Display
                              ↓ [Found]
                              └→ Display from DB
```

### 2. Subsequent Access (Fast Loading)

On subsequent visits to the same job:
- Data is loaded directly from the local database (fast)
- No API call is made unless manually triggered

### 3. Manual Refresh

Users can click the "Refresh" button to:
- Force sync the latest data from Moveware API
- Update the local database with fresh data
- Useful for getting the most recent changes

## API Endpoints

### GET `/api/jobs/[jobId]`

Fetches job details:
- **Tries database first** → Returns cached data if available
- **Falls back to Moveware API** → Fetches and saves if not in database
- Automatically syncs on first access

**Example:**
```bash
curl http://localhost:3000/api/jobs/111505
```

### GET `/api/jobs/[jobId]/inventory`

Fetches inventory items:
- **Tries database first** → Returns cached inventory if available
- **Falls back to Moveware API** → Fetches and saves if not in database
- Automatically syncs on first access

**Example:**
```bash
curl http://localhost:3000/api/jobs/111505/inventory
```

### POST `/api/jobs/[jobId]/sync`

Force synchronization from Moveware API:
- **Always fetches fresh data** from Moveware API
- Overwrites existing database data
- Returns sync status and results

**Example:**
```bash
curl -X POST http://localhost:3000/api/jobs/111505/sync
```

**Response:**
```json
{
  "success": true,
  "message": "Data synced successfully",
  "synced": {
    "job": true,
    "inventory": true,
    "inventoryCount": 20,
    "errors": []
  }
}
```

## Benefits

### ✅ Performance
- **Fast loading**: Subsequent visits load from local database
- **No API delays**: After initial sync, no API calls needed
- **Reduced API load**: Fewer calls to Moveware API

### ✅ Reliability
- **Works offline**: Once synced, data available even if Moveware API is down
- **Graceful fallback**: If API fails, uses cached data
- **Error handling**: Clear error messages if sync fails

### ✅ Data Freshness
- **Auto-sync on first access**: New jobs automatically pulled
- **Manual refresh**: Users can force update anytime
- **Configurable**: Can add scheduled sync jobs if needed

## Configuration

### Environment Variables

Ensure these are set in your `.env` file:

```env
# Moveware API Configuration
MOVEWARE_API_URL=https://api.moveware.com
MOVEWARE_USERNAME=your_username
MOVEWARE_PASSWORD=your_password
MOVEWARE_COMPANY_ID=your_company_id

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/moveware_db
```

## Scheduled Sync (Optional)

If you want to sync data on a schedule instead of on-demand, you can:

### Option 1: Cron Job (Linux/Mac)

Add to crontab to sync every hour:
```bash
0 * * * * curl -X POST http://localhost:3000/api/jobs/111505/sync
```

### Option 2: Node Scheduler

Install `node-cron`:
```bash
npm install node-cron
```

Create a scheduled sync script:
```javascript
// lib/scheduler/sync-jobs.ts
import cron from 'node-cron';

// Sync all active jobs every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Starting scheduled job sync...');
  // Fetch list of active jobs and sync each
});
```

### Option 3: Next.js API Route with Vercel Cron

Create `/api/cron/sync-jobs/route.ts`:
```typescript
export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Sync logic here
  return Response.json({ success: true });
}
```

Configure in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-jobs",
    "schedule": "0 */6 * * *"
  }]
}
```

## Data Transformation

The system transforms Moveware API data to match your database schema:

### Job Transformation
- Extracts nested address data (Uplift, Delivery)
- Flattens measures (volume, weight) into individual fields
- Converts date strings to Date objects
- Stores full raw data for reference

### Inventory Transformation
- Maps inventory items to database structure
- Links items to job via `jobId`
- Preserves all original data in `rawData` field

See `lib/types/job.ts` for transformation functions.

## Troubleshooting

### Job Not Loading

**Problem**: Quote page shows "Job not found"

**Solutions**:
1. Check Moveware API credentials in `.env`
2. Verify job exists in Moveware API
3. Check server logs for API errors
4. Try manual sync: `POST /api/jobs/[jobId]/sync`

### Stale Data

**Problem**: Changes in Moveware not reflected in quote

**Solutions**:
1. Click the "Refresh" button on the quote page
2. Call sync API: `POST /api/jobs/[jobId]/sync`
3. Clear database and let it re-sync

### API Rate Limiting

**Problem**: Too many API calls to Moveware

**Solutions**:
1. System already caches data - should be minimal calls
2. Only first access triggers API call
3. Consider scheduled sync instead of on-demand

## Monitoring

### Check Sync Status

View server logs to monitor sync activity:
```bash
# Production logs
pm2 logs

# Development logs
npm run dev
```

Look for:
- `✓ Job [id] saved to database`
- `✓ Saved [n] inventory items`
- `Job [id] not found in database. Fetching from Moveware API...`

### Database Queries

Check what's in your database:

```sql
-- Count jobs
SELECT COUNT(*) FROM "Job";

-- Count inventory items
SELECT COUNT(*) FROM "InventoryItem";

-- Recent syncs (by dateModified)
SELECT id, "firstName", "lastName", "dateModified" 
FROM "Job" 
ORDER BY "dateModified" DESC 
LIMIT 10;

-- Jobs with inventory counts
SELECT j.id, j."firstName", j."lastName", COUNT(i.id) as inventory_count
FROM "Job" j
LEFT JOIN "InventoryItem" i ON j.id = i."jobId"
GROUP BY j.id, j."firstName", j."lastName";
```

## Best Practices

1. **Let it auto-sync**: The system handles data fetching automatically
2. **Use refresh sparingly**: Only when you need the latest data
3. **Monitor logs**: Keep an eye on sync activity
4. **Handle errors gracefully**: System continues working even if API fails
5. **Test with seed data**: Use `npm run db:seed` for development

## Summary

Your quote system now:
- ✅ Automatically fetches data from Moveware API when needed
- ✅ Caches data locally for fast loading
- ✅ Allows manual refresh for latest updates
- ✅ Works even if Moveware API is temporarily unavailable
- ✅ Reduces API load and improves performance

No manual database seeding required - just visit a quote page and the data will be automatically fetched and saved!
