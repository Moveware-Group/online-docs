# Companies API & Database Audit Report

**Task:** OD-777  
**Date:** 2024-01-XX  
**Status:** Audit Complete

## Executive Summary

The companies functionality **exists but uses a different architectural pattern** than specified in the requirements. The current implementation uses a **normalized database design** with separate tables for different settings (Branding, Hero, Copy) and **distributed API endpoints** across `/api/companies` and `/api/settings/companies`.

### Verdict: ⚠️ PARTIAL IMPLEMENTATION - REQUIRES ALIGNMENT

The backend functionality is **operational** but the API structure differs from requirements. Remaining subtasks should be **adjusted** rather than skipped to align with the existing architecture.

---

## Database Schema Analysis

### ✅ Company Table Exists

Location: `prisma/schema.prisma` - `Company` model

### Column Comparison

| Required Column | Exists? | Actual Column Name | Notes |
|----------------|---------|-------------------|-------|
| `id` | ✅ | `id` | String @id @default(cuid()) |
| `company_name` | ⚠️ | `name` | Different naming convention |
| `brand_code` | ❌ | N/A | Missing - no brand_code field |
| `primary_color` | ✅ | `primaryColor` | String @default("#2563eb") @db.VarChar(7) |
| `secondary_color` | ✅ | `secondaryColor` | String @default("#1e40af") @db.VarChar(7) |
| `tertiary_color` | ✅ | `tertiaryColor` | String @default("#60a5fa") @db.VarChar(7) |
| `logo_url` | ✅ | `logoUrl` | String? @db.VarChar(500) |
| `hero_content` | ⚠️ | N/A | Separate `HeroSettings` table (normalized) |
| `copy_content` | ⚠️ | N/A | Separate `CopySettings` table (normalized) |
| `tenant_id` / `user_id` | ⚠️ | `apiKey` / `updatedBy` | Different approach for scoping |
| `created_at` | ✅ | `createdAt` | DateTime @default(now()) |
| `updated_at` | ✅ | `updatedAt` | DateTime @updatedAt |

### Additional Fields (Not in Requirements)

- `apiKey` - String @unique - Used for API authentication
- `isActive` - Boolean @default(true) - Soft delete flag
- `updatedBy` - String? - Audit trail for updates

### Related Tables (Normalized Design)

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
}
```

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
}
```

### Architecture Notes

**Design Pattern:** The current implementation uses **database normalization** with separate tables for different concerns:
- `Company` - Core company data and colors
- `BrandingSettings` - Logo and visual branding
- `HeroSettings` - Hero section content
- `CopySettings` - Page copy/text content

**Benefits:**
- Cleaner separation of concerns
- Easier to extend individual settings
- Better performance for queries that don't need all data
- Follows single responsibility principle

**Trade-offs:**
- Requires joins to get complete company data
- More complex queries for full company profile
- More tables to maintain

---

## API Endpoints Analysis

### ✅ Existing Endpoints

#### 1. Company Logo Management
**Location:** `app/api/companies/[id]/logo/route.ts`

- ✅ `GET /api/companies/[id]/logo` - Retrieve company logo URL
- ✅ `POST /api/companies/[id]/logo` - Upload new logo (Azure Blob Storage)
- ✅ `DELETE /api/companies/[id]/logo` - Delete company logo

**Features:**
- Azure Blob Storage integration
- File validation (MIME type, size)
- Automatic old logo cleanup

#### 2. Company Settings Management
**Location:** `app/api/companies/[id]/settings/route.ts`

- ✅ `GET /api/companies/[id]/settings` - Fetch branding settings
- ✅ `PUT /api/companies/[id]/settings` - Update color settings

**Features:**
- Admin authentication required (via `requireAdmin` middleware)
- Hex color validation
- Upsert pattern (creates if not exists)

#### 3. Company Management (Settings Path)
**Location:** `app/api/settings/companies/route.ts`

- ✅ `GET /api/settings/companies` - Get all companies with settings
- ✅ `POST /api/settings/companies` - Update company and settings

**Features:**
- Fetches companies with related branding, hero, and copy settings
- Updates multiple related tables in single request
- Transaction-like behavior

#### 4. Company Deletion
**Location:** `app/api/settings/companies/[id]/route.ts`

- ✅ `DELETE /api/settings/companies/[id]` - Delete company

### ❌ Missing Endpoints (From Requirements)

#### 1. Main Companies Endpoint
**Expected:** `/api/companies`

- ❌ `GET /api/companies` - List all companies
- ❌ `POST /api/companies` - Create new company

**Status:** Functionality exists at `/api/settings/companies` but not at `/api/companies`

#### 2. Individual Company CRUD
**Expected:** `/api/companies/[id]`

- ❌ `GET /api/companies/[id]` - Get single company details
- ❌ `PUT /api/companies/[id]` - Update company
- ❌ `DELETE /api/companies/[id]` - Delete company

**Status:** Partial implementation scattered across:
- `/api/companies/[id]/settings` (GET, PUT for branding)
- `/api/settings/companies/[id]` (DELETE)
- `/api/settings/companies` (GET all, POST/PUT)

#### 3. Upload Endpoint
**Expected:** `/api/companies/upload`

- ❌ `POST /api/companies/upload` - Generic upload endpoint

**Status:** Logo upload exists at `/api/companies/[id]/logo` (more RESTful pattern)

### API Architecture Assessment

**Current Pattern:**
- Logo operations: `/api/companies/[id]/logo`
- Settings operations: `/api/companies/[id]/settings`
- Admin operations: `/api/settings/companies`

**Expected Pattern:**
- Main CRUD: `/api/companies` and `/api/companies/[id]`
- Upload: `/api/companies/upload`

**Analysis:**
The current API follows a **resource-oriented RESTful design** with nested routes for sub-resources (logo, settings). This is a **more sophisticated pattern** than the flat structure in requirements, but it differs from specifications.

---

## Security & Middleware

### ✅ Authentication Middleware
**Location:** `lib/middleware/auth.ts`

- `requireAdmin()` function implemented
- Checks admin role and company access
- Used in `/api/companies/[id]/settings` endpoints

### ✅ File Storage Security
**Location:** `lib/services/azureStorage.ts` (referenced in logo upload)

- MIME type validation
- File size limits (2MB max)
- Azure Blob Storage integration

---

## Supporting Infrastructure

### ✅ Database Helper
**Location:** `lib/db/checkReferences.ts`

Utility for checking foreign key references before deletion.

### ✅ Content Sanitization
**Location:** Referenced in recent commits (OD-769)

Utility for sanitizing user-provided content.

### ✅ PM2 Configuration
**Location:** `ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'online-docs',
    script: 'npm',
    args: 'start',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

**Status:** ✅ Already configured correctly for port 3000

---

## Gap Analysis

### Critical Gaps

1. **Missing Standard REST Endpoints**
   - No `/api/companies` (GET, POST)
   - No `/api/companies/[id]` (GET, PUT, DELETE)
   - Functionality scattered across different paths

2. **Missing `brand_code` Field**
   - Not present in Company model
   - May be required for external integrations

3. **API Route Inconsistency**
   - Some operations at `/api/companies/[id]/*`
   - Some operations at `/api/settings/companies/*`
   - Confusing for API consumers

### Design Differences (Not Necessarily Gaps)

1. **Normalized Database Design**
   - Current: Separate tables for Branding, Hero, Copy
   - Required: Single table with all fields
   - Assessment: Current design is **more maintainable**

2. **Naming Convention**
   - Current: camelCase (name, logoUrl, createdAt)
   - Required: snake_case (company_name, logo_url, created_at)
   - Assessment: camelCase is **standard for JavaScript/TypeScript**

3. **Authentication Approach**
   - Current: `apiKey` for company authentication, `updatedBy` for tracking
   - Required: `tenant_id` or `user_id` for scoping
   - Assessment: Both approaches valid, current may be more flexible

---

## Recommendations

### Option 1: Create Unified API Endpoints (Recommended)

**Create:** `/api/companies/route.ts`
- Implement GET (list all) and POST (create)
- Aggregate data from Company + related settings tables
- Maintain backward compatibility with existing endpoints

**Create:** `/api/companies/[id]/route.ts`
- Implement GET (single), PUT (update), DELETE
- Aggregate data from all related tables
- Redirect to specialized endpoints for logo/settings if needed

**Benefits:**
- Meets requirements for standard endpoints
- Maintains existing specialized endpoints
- Provides unified interface for frontend

### Option 2: Add Database Migrations (Optional)

**Add `brand_code` field:**
```prisma
model Company {
  // ... existing fields
  brandCode String? @map("brand_code")
}
```

**Benefits:**
- Supports external integrations requiring brand codes
- Minimal impact on existing code

**Note:** Only add if brand_code is actually needed by the business

### Option 3: API Documentation

**Create:** API documentation mapping current endpoints to requirements
- Document the normalized design pattern
- Explain architectural decisions
- Provide migration guide for consumers expecting flat structure

---

## Remaining Subtask Status

### Backend Subtasks Assessment

**Should remaining backend subtasks be skipped?** ❌ **NO**

**Reason:** While the database schema and core functionality exist, the API structure differs from requirements. The following should be completed:

1. ✅ **Skip:** Database migration for companies table - Already exists (different structure)
2. ✅ **Skip:** Authorization middleware - Already implemented
3. ✅ **Skip:** Content sanitization utility - Already implemented
4. ✅ **Skip:** Foreign key reference checking - Already implemented
5. ❌ **Do NOT Skip:** Create unified `/api/companies` endpoints - Missing
6. ❌ **Do NOT Skip:** Create `/api/companies/[id]` endpoints - Missing
7. ⚠️ **Optional:** Add `brand_code` field if business requires it

### Frontend Subtasks Assessment

Frontend tasks can proceed but should be aware of:
- Current API structure uses `/api/settings/companies` for management
- Logo upload at `/api/companies/[id]/logo`
- Settings update at `/api/companies/[id]/settings`

---

## Testing Verification

### Manual Testing Checklist

**Database:**
- [ ] Connect to PostgreSQL and verify Company table exists
- [ ] Verify BrandingSettings, HeroSettings, CopySettings tables exist
- [ ] Check foreign key relationships (companyId)
- [ ] Verify indexes on companyId columns

**API Endpoints:**
- [ ] GET /api/settings/companies - List all companies
- [ ] POST /api/settings/companies - Update company
- [ ] DELETE /api/settings/companies/[id] - Delete company
- [ ] GET /api/companies/[id]/logo - Get logo URL
- [ ] POST /api/companies/[id]/logo - Upload logo (multipart/form-data)
- [ ] DELETE /api/companies/[id]/logo - Remove logo
- [ ] GET /api/companies/[id]/settings - Get branding settings
- [ ] PUT /api/companies/[id]/settings - Update colors

**Authentication:**
- [ ] Verify admin middleware blocks unauthorized access
- [ ] Test with valid admin credentials
- [ ] Test with invalid/missing credentials

---

## Conclusion

### Summary

The companies functionality is **operational but architecturally different** from requirements:

✅ **What Works:**
- Database schema with normalized design
- Logo upload with Azure Blob Storage
- Settings management with validation
- Admin authentication
- Comprehensive error handling

⚠️ **What's Different:**
- API routes at `/api/settings/companies` instead of `/api/companies`
- Normalized tables vs. single table with JSON fields
- No `brand_code` field
- camelCase naming instead of snake_case

❌ **What's Missing:**
- Standard REST endpoints at `/api/companies` and `/api/companies/[id]`
- Unified API for complete company data access

### Next Steps

1. **Create unified API endpoints** at `/api/companies` to meet requirements
2. **Decide on `brand_code`** - add if business needs it
3. **Update API documentation** to reflect actual implementation
4. **Adjust remaining subtasks** based on this audit
5. **Consider frontend impact** - ensure compatibility with existing API structure

### Final Recommendation

**Do NOT skip remaining backend subtasks.** Instead, **adjust them** to:
1. Create standard REST endpoints that aggregate data from normalized tables
2. Maintain backward compatibility with existing specialized endpoints
3. Document the architectural pattern for future developers

The current implementation is **well-designed and secure**, but needs **API standardization** to fully meet requirements.
