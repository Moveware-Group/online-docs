# PUT /api/companies/:id - Update Company

## Overview

Update a company's details, settings, and logo. Supports both JSON and multipart/form-data requests for maximum flexibility.

**Endpoint:** `PUT /api/companies/:id`

**Content Types Supported:**
- `application/json` - For updating text fields and settings
- `multipart/form-data` - For uploading logos along with other updates

**Features:**
- ✅ Partial updates (only provided fields are updated)
- ✅ Logo upload with automatic replacement
- ✅ Logo removal support
- ✅ Update company name, colors, and all settings
- ✅ Automatic cleanup of old logos when replaced

---

## Request Formats

### JSON Request (for settings and text updates)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Updated Company Name",
  "primaryColor": "#3b82f6",
  "secondaryColor": "#1e40af",
  "tertiaryColor": "#60a5fa",
  "heroTitle": "Welcome to Our Platform",
  "heroSubtitle": "Your journey starts here",
  "heroBackgroundColor": "#3b82f6",
  "heroTextColor": "#ffffff",
  "welcomeMessage": "Hello and welcome!",
  "introText": "We're glad you're here",
  "footerText": "© 2024 Company Name"
}
```

**All fields are optional** - only include the fields you want to update.

---

### Multipart/Form-Data Request (for logo uploads)

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Fields:**

| Field Name | Type | Description |
|------------|------|-------------|
| `logo` | File | Logo image file (PNG, JPEG, WebP) |
| `name` | String | Company name |
| `primaryColor` | String | Primary brand color (hex) |
| `secondaryColor` | String | Secondary brand color (hex) |
| `tertiaryColor` | String | Tertiary brand color (hex) |
| `heroTitle` | String | Hero section title |
| `heroSubtitle` | String | Hero section subtitle |
| `heroBackgroundColor` | String | Hero background color (hex) |
| `heroTextColor` | String | Hero text color (hex) |
| `welcomeMessage` | String | Welcome message text |
| `introText` | String | Introduction text |
| `footerText` | String | Footer text |
| `removeLogo` | String | Set to "true" to remove logo |

**Example using JavaScript Fetch API:**
```javascript
const formData = new FormData();
formData.append('logo', logoFile);
formData.append('name', 'Updated Company Name');
formData.append('primaryColor', '#3b82f6');

const response = await fetch('/api/companies/company-id', {
  method: 'PUT',
  body: formData,
});
```

**Example using cURL:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/company-id' \
  -F 'logo=@/path/to/logo.png' \
  -F 'name=Updated Company Name' \
  -F 'primaryColor=#3b82f6'
```

---

## Logo Management

### Uploading a New Logo

**Multipart/Form-Data:**
```javascript
const formData = new FormData();
formData.append('logo', logoFile);

fetch('/api/companies/company-id', {
  method: 'PUT',
  body: formData,
});
```

**Behavior:**
- Validates file type (PNG, JPEG, WebP only)
- Validates file size (max 2MB)
- Uses MIME sniffing to prevent type spoofing
- Uploads to Azure Blob Storage
- **Automatically deletes the old logo** from storage
- Updates company record with new logo URL

### Removing a Logo

**Option 1: Using JSON (set logoUrl to null)**
```json
{
  "logoUrl": null
}
```

**Option 2: Using JSON (set removeLogo flag)**
```json
{
  "removeLogo": true
}
```

**Option 3: Using multipart/form-data**
```javascript
const formData = new FormData();
formData.append('removeLogo', 'true');

fetch('/api/companies/company-id', {
  method: 'PUT',
  body: formData,
});
```

**Behavior:**
- Deletes logo file from Azure Blob Storage
- Sets `logoUrl` to `null` in database
- Sets `logoUrl` to `null` in BrandingSettings table

### Replacing a Logo

Simply upload a new logo file - the old one is **automatically deleted**.

```javascript
const formData = new FormData();
formData.append('logo', newLogoFile);

fetch('/api/companies/company-id', {
  method: 'PUT',
  body: formData,
});
```

---

## Partial Updates

**Only the fields you provide will be updated.** Omitted fields remain unchanged.

**Example: Update only company name**
```json
{
  "name": "New Company Name"
}
```

**Example: Update only colors**
```json
{
  "primaryColor": "#3b82f6",
  "secondaryColor": "#1e40af"
}
```

**Example: Update only hero settings**
```json
{
  "heroTitle": "Welcome!",
  "heroSubtitle": "We're glad you're here"
}
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "company-id",
    "name": "Updated Company Name",
    "logoUrl": "https://storage.blob.core.windows.net/logos/company-id/logo.png",
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1e40af",
    "tertiaryColor": "#60a5fa",
    "brandingSettings": {
      "id": "branding-id",
      "companyId": "company-id",
      "logoUrl": "https://storage.blob.core.windows.net/logos/company-id/logo.png",
      "primaryColor": "#3b82f6",
      "secondaryColor": "#1e40af",
      "fontFamily": "Inter",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T14:20:00.000Z"
    },
    "heroSettings": {
      "id": "hero-id",
      "companyId": "company-id",
      "title": "Welcome to Our Platform",
      "subtitle": "Your journey starts here",
      "backgroundColor": "#3b82f6",
      "textColor": "#ffffff",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T14:20:00.000Z"
    },
    "copySettings": {
      "id": "copy-id",
      "companyId": "company-id",
      "welcomeMessage": "Hello and welcome!",
      "introText": "We're glad you're here",
      "footerText": "© 2024 Company Name",
      "submitButtonText": "Submit",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T14:20:00.000Z"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  },
  "message": "Company updated successfully"
}
```

### Error Responses

**Company Not Found (404)**
```json
{
  "success": false,
  "error": "Company not found"
}
```

**Invalid Color Format (400)**
```json
{
  "success": false,
  "error": "primaryColor must be a valid hex color (e.g., #2563eb)"
}
```

**Invalid Logo File (400)**
```json
{
  "success": false,
  "error": "Only PNG, JPEG, and WebP images are allowed"
}
```

**File Too Large (400)**
```json
{
  "success": false,
  "error": "File size exceeds 2MB limit"
}
```

**Storage Not Configured (503)**
```json
{
  "success": false,
  "error": "File storage is not configured. Please contact support."
}
```

**Server Error (500)**
```json
{
  "success": false,
  "error": "Failed to update company",
  "details": "Error message details"
}
```

---

## Validation Rules

### Colors
- Must be valid hex color codes
- Format: `#RGB` or `#RRGGBB`
- Examples: `#2563eb`, `#fff`, `#1e40af`
- Validated fields: `primaryColor`, `secondaryColor`, `tertiaryColor`, `heroBackgroundColor`, `heroTextColor`

### Logo Files
- **Allowed types:** PNG, JPEG, WebP
- **Max size:** 2MB
- **MIME validation:** Server performs MIME sniffing to prevent type spoofing
- **Storage:** Uploaded to Azure Blob Storage

### Text Fields
- **Name:** Trimmed of whitespace
- **Other text fields:** Preserved as-is (including whitespace)

---

## Complete Examples

### Example 1: Update Company Name Only

**Request:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/abc123' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Acme Corporation"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Acme Corporation",
    "logoUrl": "https://storage.blob.core.windows.net/logos/abc123/logo.png",
    "primaryColor": "#2563eb",
    "secondaryColor": "#1e40af",
    "tertiaryColor": null,
    "brandingSettings": { /* ... */ },
    "heroSettings": { /* ... */ },
    "copySettings": { /* ... */ },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  },
  "message": "Company updated successfully"
}
```

### Example 2: Upload New Logo

**Request:**
```javascript
const formData = new FormData();
const logoFile = document.getElementById('logoInput').files[0];
formData.append('logo', logoFile);

const response = await fetch('/api/companies/abc123', {
  method: 'PUT',
  body: formData,
});

const result = await response.json();
console.log('New logo URL:', result.data.logoUrl);
```

**Behavior:**
- Old logo at `https://storage.blob.core.windows.net/logos/abc123/old-logo.png` is deleted
- New logo is uploaded
- Database is updated with new logo URL

### Example 3: Remove Logo

**Request:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/abc123' \
  -H 'Content-Type: application/json' \
  -d '{"logoUrl": null}'
```

**Behavior:**
- Logo file is deleted from Azure Blob Storage
- `logoUrl` is set to `null` in database

### Example 4: Update Multiple Settings

**Request:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/abc123' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Acme Corporation",
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1e40af",
    "heroTitle": "Welcome to Acme",
    "heroSubtitle": "Building the future",
    "welcomeMessage": "Hello, valued customer!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Acme Corporation",
    "logoUrl": "https://storage.blob.core.windows.net/logos/abc123/logo.png",
    "primaryColor": "#3b82f6",
    "secondaryColor": "#1e40af",
    "tertiaryColor": null,
    "brandingSettings": {
      "primaryColor": "#3b82f6",
      "secondaryColor": "#1e40af",
      /* ... */
    },
    "heroSettings": {
      "title": "Welcome to Acme",
      "subtitle": "Building the future",
      /* ... */
    },
    "copySettings": {
      "welcomeMessage": "Hello, valued customer!",
      /* ... */
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  },
  "message": "Company updated successfully"
}
```

### Example 5: Upload Logo and Update Settings

**Request:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/abc123' \
  -F 'logo=@/path/to/new-logo.png' \
  -F 'name=Acme Corporation' \
  -F 'primaryColor=#3b82f6' \
  -F 'heroTitle=Welcome to Acme'
```

**Behavior:**
- Uploads new logo (deletes old one)
- Updates company name
- Updates primary color
- Updates hero title
- All other settings remain unchanged

---

## Implementation Notes

### Logo Replacement Flow

1. Client uploads new logo file via multipart/form-data
2. Server validates file type and size
3. Server uploads new logo to Azure Blob Storage
4. Server updates database with new logo URL
5. **Server automatically deletes old logo from storage** (async, non-blocking)
6. Server returns updated company data

### Logo Removal Flow

1. Client sends `logoUrl: null` or `removeLogo: true`
2. Server extracts blob name from existing logo URL
3. Server deletes logo file from Azure Blob Storage
4. Server sets `logoUrl` to `null` in Company table
5. Server sets `logoUrl` to `null` in BrandingSettings table
6. Server returns updated company data

### Partial Update Strategy

- Only fields present in request body are updated
- Omitted fields are **not** changed in database
- Settings tables (Branding, Hero, Copy) are only updated if relevant fields are provided
- If a settings table doesn't exist, it's created with provided values + defaults

### Database Updates

**Company Table:**
- `name` - Direct update if provided
- `logoUrl` - Updated when logo uploaded or removed
- `primaryColor`, `secondaryColor`, `tertiaryColor` - Direct updates if provided
- `updatedAt` - Always updated to current timestamp

**BrandingSettings Table:**
- Updated via `upsert` if any branding fields provided
- Creates record if doesn't exist

**HeroSettings Table:**
- Updated via `upsert` if any hero fields provided
- Creates record if doesn't exist

**CopySettings Table:**
- Updated via `upsert` if any copy fields provided
- Creates record if doesn't exist

---

## Related Endpoints

- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create new company
- `DELETE /api/companies/:id` - Delete company
- `POST /api/companies/:id/logo` - Upload logo (alternative endpoint)
- `DELETE /api/companies/:id/logo` - Delete logo (alternative endpoint)

---

## Testing

### Test Cases

1. ✅ Update company name only
2. ✅ Upload new logo (replaces old)
3. ✅ Remove logo
4. ✅ Update colors only
5. ✅ Update hero settings only
6. ✅ Update copy settings only
7. ✅ Update multiple fields at once
8. ✅ Upload logo with settings updates
9. ✅ Partial update (some fields)
10. ✅ Invalid color format rejection
11. ✅ Invalid file type rejection
12. ✅ File too large rejection
13. ✅ Company not found error

### Manual Testing with cURL

**Update name:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/your-company-id' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Test Company"}'
```

**Upload logo:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/your-company-id' \
  -F 'logo=@/path/to/logo.png'
```

**Remove logo:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/your-company-id' \
  -H 'Content-Type: application/json' \
  -d '{"logoUrl": null}'
```

**Update colors:**
```bash
curl -X PUT 'http://localhost:3000/api/companies/your-company-id' \
  -H 'Content-Type: application/json' \
  -d '{"primaryColor": "#3b82f6", "secondaryColor": "#1e40af"}'
```

---

## Summary

✅ **Supports both JSON and multipart/form-data**
✅ **Partial updates** - only provided fields are updated
✅ **Logo upload** with automatic old logo deletion
✅ **Logo removal** via multiple methods
✅ **Comprehensive validation** for colors and file types
✅ **Updates all related settings tables** (Branding, Hero, Copy)
✅ **Clear error messages** with appropriate HTTP status codes
