# Company Detail API Documentation

## GET /api/companies/:id

Fetch complete company details including all settings for edit mode form population.

### Endpoint

```
GET /api/companies/:id
```

### Description

Retrieves comprehensive company information including:
- Basic company details (name, logo URL)
- Branding settings (colors, fonts, logo)
- Hero section settings (title, subtitle, colors)
- Copy/content settings (welcome message, intro, footer)

This endpoint is designed to populate edit forms with all necessary company data.

### URL Parameters

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `id`      | string | Yes      | Company UUID          |

### Request Headers

No special headers required for this endpoint.

### Response Format

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "string (uuid)",
    "name": "string",
    "logoUrl": "string | null",
    "primaryColor": "string | null",
    "secondaryColor": "string | null",
    "tertiaryColor": "string | null",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)",
    "brandingSettings": {
      "id": "string (uuid)",
      "companyId": "string (uuid)",
      "logoUrl": "string | null",
      "primaryColor": "string | null",
      "secondaryColor": "string | null",
      "fontFamily": "string | null",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    },
    "heroSettings": {
      "id": "string (uuid)",
      "companyId": "string (uuid)",
      "title": "string | null",
      "subtitle": "string | null",
      "backgroundColor": "string | null",
      "textColor": "string | null",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    },
    "copySettings": {
      "id": "string (uuid)",
      "companyId": "string (uuid)",
      "welcomeMessage": "string | null",
      "introText": "string | null",
      "footerText": "string | null",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  }
}
```

#### Error Response (404 Not Found)

```json
{
  "success": false,
  "error": "Company not found"
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to fetch company"
}
```

### Example Request

```bash
curl -X GET http://localhost:3000/api/companies/550e8400-e29b-41d4-a716-446655440000
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Moveware Removals",
    "logoUrl": "https://storage.azure.com/company-logos/550e8400-logo.png",
    "primaryColor": "#2563eb",
    "secondaryColor": "#1e40af",
    "tertiaryColor": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-02-20T14:45:00.000Z",
    "brandingSettings": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "companyId": "550e8400-e29b-41d4-a716-446655440000",
      "logoUrl": "https://storage.azure.com/company-logos/550e8400-logo.png",
      "primaryColor": "#2563eb",
      "secondaryColor": "#1e40af",
      "fontFamily": "Inter",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-02-20T14:45:00.000Z"
    },
    "heroSettings": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "companyId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Professional Moving Services",
      "subtitle": "Your trusted partner in relocation",
      "backgroundColor": "#2563eb",
      "textColor": "#ffffff",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-02-20T14:45:00.000Z"
    },
    "copySettings": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "companyId": "550e8400-e29b-41d4-a716-446655440000",
      "welcomeMessage": "Welcome to Moveware Removals",
      "introText": "We make moving easy and stress-free.",
      "footerText": "© 2024 Moveware Removals. All rights reserved.",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-02-20T14:45:00.000Z"
    }
  }
}
```

## Form Population Fields

### ✅ Verified: All Required Fields Present

The endpoint returns all fields necessary for populating company edit forms:

**Company Basic Information:**
- ✅ `name` - Company name
- ✅ `logoUrl` - Logo URL (available in both root and brandingSettings)
- ✅ `id` - Company identifier
- ✅ `createdAt` / `updatedAt` - Audit timestamps

**Branding Settings:**
- ✅ `logoUrl` - Company logo URL (primary source for forms)
- ✅ `primaryColor` - Primary brand color (hex format)
- ✅ `secondaryColor` - Secondary brand color (hex format)
- ✅ `fontFamily` - Font family for branding

**Hero Section Settings:**
- ✅ `title` - Hero section title
- ✅ `subtitle` - Hero section subtitle
- ✅ `backgroundColor` - Hero background color
- ✅ `textColor` - Hero text color

**Copy/Content Settings:**
- ✅ `welcomeMessage` - Welcome message text
- ✅ `introText` - Introduction text
- ✅ `footerText` - Footer text

### Logo URL Availability

The logo URL is available in **two locations**:

1. **Company root level**: `data.logoUrl`
2. **Branding settings**: `data.brandingSettings.logoUrl`

Both fields are synchronized and contain the same value. Forms can use either source, though `data.brandingSettings.logoUrl` is the canonical source for branding-related fields.

## Usage in Edit Forms

### React/Next.js Example

```typescript
import { useState, useEffect } from 'react';

interface CompanyFormData {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  welcomeMessage: string;
  // ... other fields
}

function CompanyEditForm({ companyId }: { companyId: string }) {
  const [formData, setFormData] = useState<CompanyFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompany() {
      try {
        const response = await fetch(`/api/companies/${companyId}`);
        const result = await response.json();

        if (result.success) {
          // Populate form with company data
          setFormData({
            name: result.data.name,
            logoUrl: result.data.brandingSettings?.logoUrl || result.data.logoUrl,
            primaryColor: result.data.brandingSettings?.primaryColor || '#2563eb',
            secondaryColor: result.data.brandingSettings?.secondaryColor || '#1e40af',
            heroTitle: result.data.heroSettings?.title || '',
            heroSubtitle: result.data.heroSettings?.subtitle || '',
            welcomeMessage: result.data.copySettings?.welcomeMessage || '',
          });
        }
      } catch (error) {
        console.error('Failed to load company:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [companyId]);

  if (loading) return <div>Loading...</div>;
  if (!formData) return <div>Company not found</div>;

  // Render form with formData...
  return (
    <form>
      <input value={formData.name} onChange={/* ... */} />
      {/* ... other form fields */}
    </form>
  );
}
```

## Response Field Types

### Color Fields
- Format: Hex color code (e.g., `#2563eb`)
- Nullable: Yes
- Default: Application defaults if null

### Logo URL
- Format: Full URL to Azure Blob Storage or CDN
- Nullable: Yes
- Example: `https://storage.azure.com/company-logos/company-uuid-timestamp.png`

### Text Fields
- Format: String
- Nullable: Yes (most fields)
- Encoding: UTF-8

### Timestamps
- Format: ISO 8601 string
- Timezone: UTC
- Example: `2024-02-20T14:45:00.000Z`

## Related Endpoints

- **PUT /api/companies/:id** - Update company details
- **DELETE /api/companies/:id** - Delete company
- **GET /api/companies** - List all companies
- **POST /api/companies/:id/logo** - Upload company logo
- **GET /api/companies/:id/settings** - Get branding settings only
- **PUT /api/companies/:id/settings** - Update color settings

## Notes

- Settings objects (`brandingSettings`, `heroSettings`, `copySettings`) may be `null` if not yet configured
- Default values should be applied in the frontend when settings are `null`
- Logo URLs point to Azure Blob Storage (configured via `AZURE_STORAGE_CONNECTION_STRING`)
- All color fields use hex format with `#` prefix
- The endpoint includes audit timestamps (`createdAt`, `updatedAt`) for all entities

## Database Schema

This endpoint queries the following Prisma models:
- `Company` - Base company information
- `BrandingSettings` - Logo and color branding
- `HeroSettings` - Hero section configuration
- `CopySettings` - Marketing copy text

See `DATABASE_SCHEMA.md` for complete schema documentation.
