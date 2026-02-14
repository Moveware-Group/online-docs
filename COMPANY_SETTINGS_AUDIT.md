# Company Settings Backend Audit - OD-759

**Audit Date:** 2024-01-XX
**Task:** OD-759 - Audit existing backend for company settings endpoints

## Executive Summary

This audit reviews the existing backend API endpoints for company settings, database schema, and file storage configuration. The current implementation uses a distributed approach with settings split across multiple tables and endpoints, rather than a unified company settings endpoint.

---

## 1. API Endpoints Analysis

### 1.1 Required Endpoints (NOT FOUND)

The following endpoints specified in the requirements **DO NOT EXIST**:

❌ **GET /api/companies/:id/settings**
- Status: Does not exist
- Purpose: Retrieve all settings for a specific company
- Need: Must be created

❌ **PUT /api/companies/:id/settings**
- Status: Does not exist
- Purpose: Update settings for a specific company
- Need: Must be created

❌ **POST /api/companies/:id/logo**
- Status: Does not exist
- Purpose: Upload logo file for a specific company
- Need: Must be created (requires file storage implementation)

### 1.2 Existing Related Endpoints

The codebase has alternative endpoints that provide similar functionality:

✅ **GET/POST /api/settings/branding**
- File: `app/api/settings/branding/route.ts`
- Purpose: Get/update branding settings (logoUrl, primaryColor, secondaryColor)
- Limitation: Works with `DEFAULT_COMPANY_ID = 'default'` (hardcoded)
- Fields: logoUrl, primaryColor, secondaryColor, fontFamily

✅ **GET/POST /api/settings/hero**
- File: `app/api/settings/hero/route.ts`
- Purpose: Get/update hero section settings
- Limitation: Works with `DEFAULT_COMPANY_ID = 'default'` (hardcoded)
- Fields: backgroundImage, title, subtitle, backgroundColor, textColor, showLogo, alignment

✅ **GET/POST /api/settings/copy**
- File: `app/api/settings/copy/route.ts`
- Purpose: Get/update copy/text settings
- Limitation: Works with `DEFAULT_COMPANY_ID = 'default'` (hardcoded)
- Fields: welcomeMessage, introText, footerText, submitButtonText

✅ **GET/POST /api/settings/companies**
- File: `app/api/settings/companies/route.ts`
- GET: Retrieves all companies with their complete settings (branding, hero, copy)
- POST: Creates or updates a company and all associated settings
- Note: Company creation is partially restricted (requires API key generation)

✅ **DELETE /api/settings/companies/[id]**
- File: `app/api/settings/companies/[id]/route.ts`
- Purpose: Delete a specific company
- Note: Only DELETE method exists, no GET/PUT for individual company

### 1.3 Git History Review

**Recent Commits Analysis:**
- No commits found removing company settings endpoints
- Recent work focused on bot/AI features (OD-535, OD-537, OD-538, OD-539, OD-540)
- No evidence of previous `/api/companies/:id/settings` implementation

**Conclusion:** The required endpoints were never implemented, not removed.

---

## 2. Database Schema Analysis

### 2.1 Companies Table

**Model:** `Company` (from `prisma/schema.prisma`)

```prisma
model Company {
  id        String   @id @default(cuid())
  name      String
  apiKey    String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  botConversations BotConversation[]

  @@map("companies")
}
```

**Findings:**
- ✅ Table exists
- ❌ NO `primary_color` column
- ❌ NO `secondary_color` column
- ❌ NO `tertiary_color` column
- ❌ NO `logo_url` column
- Has: id, name, apiKey, isActive, createdAt, updatedAt

### 2.2 Settings Tables (Separate from Company)

Settings are stored in **separate tables** linked by `companyId`:

#### BrandingSettings Table

```prisma
model BrandingSettings {
  id             String   @id @default(cuid())
  companyId      String   @unique
  logoUrl        String?
  primaryColor   String   @default("#2563eb")
  secondaryColor String   @default("#1e40af")
  fontFamily     String   @default("Inter")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([companyId])
  @@map("branding_settings")
}
```

**Findings:**
- ✅ `logoUrl` exists (String, nullable)
- ✅ `primaryColor` exists (String, default: "#2563eb")
- ✅ `secondaryColor` exists (String, default: "#1e40af")
- ❌ `tertiary_color` does NOT exist
- Additional: `fontFamily` field

#### HeroSettings Table

```prisma
model HeroSettings {
  id              String   @id @default(cuid())
  companyId       String   @unique
  title           String
  subtitle        String?
  backgroundImage String?
  backgroundColor String   @default("#2563eb")
  textColor       String   @default("#ffffff")
  showLogo        Boolean  @default(true)
  alignment       String   @default("left")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([companyId])
  @@map("hero_settings")
}
```

#### CopySettings Table

```prisma
model CopySettings {
  id               String   @id @default(cuid())
  companyId        String   @unique
  welcomeMessage   String
  introText        String   @db.Text
  footerText       String?
  submitButtonText String   @default("Submit")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([companyId])
  @@map("copy_settings")
}
```

### 2.3 Schema Summary

**Architecture:**
- Settings are **NOT** stored in the Company table
- Settings are distributed across 3 separate tables:
  - `BrandingSettings` (logo, colors, font)
  - `HeroSettings` (hero section configuration)
  - `CopySettings` (text/copy configuration)
- Each settings table links to Company via `companyId` (unique constraint)

**Missing Fields:**
- ❌ `tertiary_color` - does not exist in any table
- Note: Only primary and secondary colors are supported

---

## 3. File Storage Configuration

### 3.1 Environment Variables Analysis

**File:** `.env.example`

**Findings:**
- ❌ NO Azure Blob Storage connection string
- ❌ NO Azure Storage account configuration
- ❌ NO file storage configuration of any kind

**Current Environment Variables:**
```env
# Database
DATABASE_URL=...

# Moveware API
MOVEWARE_API_URL=...
MOVEWARE_USERNAME=...
MOVEWARE_PASSWORD=...

# Application
NEXT_PUBLIC_APP_NAME=...
NEXT_PUBLIC_APP_URL=...
NODE_ENV=...
```

### 3.2 Logo Upload Implementation

**Current Approach:**
- Logo is stored as `logoUrl` (String) in `BrandingSettings` table
- Expects a URL string (e.g., external URL or path)
- NO file upload handling code exists
- NO Azure Blob Storage integration

**POST /api/settings/branding endpoint:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { logoUrl, primaryColor, secondaryColor } = body;
  
  // logoUrl is expected as a string, not a file upload
  const branding = await brandingService.upsertBranding(DEFAULT_COMPANY_ID, {
    logoUrl,
    primaryColor,
    secondaryColor,
  });
  
  return NextResponse.json(branding);
}
```

### 3.3 File Storage Requirements

To implement `POST /api/companies/:id/logo`, the following is needed:

1. **Azure Blob Storage Setup:**
   - Azure Storage Account
   - Container for logo files
   - Connection string in environment variables
   - Example: `AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...`

2. **File Upload Dependencies:**
   - Multipart form data parsing (Next.js supports this natively)
   - Azure Storage Blob SDK: `@azure/storage-blob`
   - File validation (size, type)

3. **Upload Logic:**
   - Accept multipart/form-data POST request
   - Validate file (image type, size limits)
   - Upload to Azure Blob Storage
   - Get public URL from blob
   - Save URL to `BrandingSettings.logoUrl`

---

## 4. Architecture Review

### 4.1 Current Design Pattern

**Distributed Settings Approach:**
- Settings are split across multiple tables (BrandingSettings, HeroSettings, CopySettings)
- Each table has a unique `companyId` foreign key
- Endpoints are organized by setting type, not by company
- Pattern: `/api/settings/{settingType}` vs `/api/companies/:id/settings`

**Pros:**
- Clear separation of concerns
- Each settings type has its own model
- Easy to add new settings types

**Cons:**
- No unified company settings endpoint
- Client must make multiple API calls to get all settings
- Harder to update multiple settings atomically

### 4.2 Recommended Architecture for New Endpoints

**Proposed:** Unified company settings endpoint

Create `/api/companies/:id/settings` that:
- GET: Returns all settings (branding + hero + copy) in one response
- PUT: Updates multiple settings types in a single transaction
- Internally uses existing service layer (brandingService, heroService, copyService)

**Benefits:**
- Single API call for all settings
- Atomic updates across settings types
- Better client-side developer experience
- Maintains existing database schema

---

## 5. Implementation Roadmap

### 5.1 Required New Endpoints

#### Priority 1: GET /api/companies/:id/settings

**Purpose:** Retrieve all settings for a specific company

**Response Format:**
```json
{
  "success": true,
  "companyId": "clu...",
  "settings": {
    "branding": {
      "logoUrl": "https://...",
      "primaryColor": "#2563eb",
      "secondaryColor": "#1e40af",
      "fontFamily": "Inter"
    },
    "hero": {
      "title": "Welcome",
      "subtitle": "...",
      "backgroundColor": "#2563eb",
      "textColor": "#ffffff"
    },
    "copy": {
      "welcomeMessage": "Welcome",
      "introText": "...",
      "footerText": null
    }
  }
}
```

**Implementation:**
- File: `app/api/companies/[id]/settings/route.ts`
- Fetch company by ID (validate exists)
- Query BrandingSettings, HeroSettings, CopySettings by companyId
- Combine into single response

#### Priority 2: PUT /api/companies/:id/settings

**Purpose:** Update settings for a specific company

**Request Format:**
```json
{
  "branding": {
    "primaryColor": "#ff0000",
    "secondaryColor": "#00ff00"
  },
  "hero": {
    "title": "New Title"
  }
}
```

**Implementation:**
- File: `app/api/companies/[id]/settings/route.ts` (PUT method)
- Validate company exists
- Use transaction to update multiple settings tables
- Use existing service layer (brandingService.upsertBranding, etc.)

#### Priority 3: POST /api/companies/:id/logo

**Purpose:** Upload logo file for a specific company

**Prerequisites:**
- Azure Blob Storage setup
- Install `@azure/storage-blob` package
- Add environment variables:
  - `AZURE_STORAGE_CONNECTION_STRING`
  - `AZURE_STORAGE_CONTAINER_NAME` (e.g., "company-logos")

**Request Format:**
- Content-Type: multipart/form-data
- Field: logo (file)

**Implementation:**
- File: `app/api/companies/[id]/logo/route.ts`
- Parse multipart form data
- Validate file (type: image/*, size: < 5MB)
- Upload to Azure Blob Storage
- Generate unique filename: `${companyId}-${timestamp}.${ext}`
- Get public blob URL
- Update BrandingSettings.logoUrl
- Return new logoUrl

### 5.2 Database Schema Changes

**Option 1: Add tertiary_color to BrandingSettings**

If tertiary color is needed:

```prisma
model BrandingSettings {
  // ... existing fields
  tertiaryColor  String   @default("#64748b") // gray-500
  // ... rest
}
```

Migration:
```bash
npx prisma migrate dev --name add_tertiary_color
```

**Option 2: Keep current schema**

If tertiary color is not required, document that only primary and secondary colors are supported.

### 5.3 File Storage Setup

**Step 1: Azure Blob Storage Account**
1. Create Azure Storage Account (or use existing)
2. Create container: `company-logos`
3. Set public access level (Blob or Container)
4. Get connection string from Azure Portal

**Step 2: Environment Variables**

Add to `.env` and `.env.example`:
```env
# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;"
AZURE_STORAGE_CONTAINER_NAME="company-logos"
```

**Step 3: Install Dependencies**

```bash
npm install @azure/storage-blob
```

**Step 4: Create Upload Service**

File: `lib/services/fileStorageService.ts`
```typescript
import { BlobServiceClient } from '@azure/storage-blob';

export async function uploadLogo(
  companyId: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
  
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  const uniqueFileName = `${companyId}-${Date.now()}-${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);
  
  await blockBlobClient.uploadData(fileBuffer);
  
  return blockBlobClient.url;
}
```

---

## 6. Current Limitations

### 6.1 Hardcoded Default Company ID

Many existing endpoints use:
```typescript
const DEFAULT_COMPANY_ID = 'default';
```

This means they don't support multi-company operations properly. The new endpoints should use the actual company ID from the URL parameter.

### 6.2 No Company Validation

Current endpoints don't validate if a company exists before operating on its settings. New endpoints should:
```typescript
const company = await prisma.company.findUnique({ where: { id: companyId } });
if (!company) {
  return NextResponse.json({ error: 'Company not found' }, { status: 404 });
}
```

### 6.3 No Authentication/Authorization

Endpoints don't check:
- If user is authenticated
- If user has permission to modify company settings

This should be added in production.

---

## 7. Testing Checklist

Once endpoints are implemented, test:

- [ ] GET /api/companies/:id/settings returns 404 for non-existent company
- [ ] GET /api/companies/:id/settings returns all settings for valid company
- [ ] PUT /api/companies/:id/settings updates only provided fields
- [ ] PUT /api/companies/:id/settings validates color format
- [ ] POST /api/companies/:id/logo rejects non-image files
- [ ] POST /api/companies/:id/logo enforces file size limit
- [ ] POST /api/companies/:id/logo uploads to Azure Blob
- [ ] POST /api/companies/:id/logo updates BrandingSettings.logoUrl
- [ ] Logo files are publicly accessible via returned URL

---

## 8. Summary and Recommendations

### What Exists:
- ✅ Database schema for companies and settings (3 separate tables)
- ✅ Service layer for branding, hero, and copy settings
- ✅ Alternative endpoints: `/api/settings/branding`, `/api/settings/companies`
- ✅ Primary and secondary color fields
- ✅ Logo URL field (string)

### What's Missing:
- ❌ GET /api/companies/:id/settings
- ❌ PUT /api/companies/:id/settings
- ❌ POST /api/companies/:id/logo
- ❌ Tertiary color field
- ❌ Azure Blob Storage configuration
- ❌ File upload functionality

### Priority Actions:

**High Priority:**
1. Implement GET /api/companies/:id/settings (quick win, uses existing data)
2. Implement PUT /api/companies/:id/settings (consolidates existing update endpoints)

**Medium Priority:**
3. Set up Azure Blob Storage account and configuration
4. Implement POST /api/companies/:id/logo

**Low Priority (Optional):**
5. Add tertiary_color field if business requires it
6. Add authentication/authorization to endpoints
7. Migrate existing endpoints to use dynamic company ID instead of "default"

### Estimated Effort:
- GET /api/companies/:id/settings: 2-3 hours
- PUT /api/companies/:id/settings: 3-4 hours
- Azure Blob Storage setup: 2-3 hours
- POST /api/companies/:id/logo: 4-5 hours
- Total: ~11-15 hours

---

**End of Audit Report**
