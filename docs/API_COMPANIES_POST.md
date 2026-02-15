# POST /api/companies - Create Company

## Overview

Create a new company with branding settings, hero content, and optional logo upload.

**Endpoint:** `POST /api/companies`

**Content-Type:** `multipart/form-data`

**Authentication:** Not required (TODO: Add authentication in production)

## Request Format

### Multipart Form Data Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|-----------|
| `name` | string | **Yes** | Company name | Max 255 characters, must be unique |
| `brandCode` | string | No | Brand identifier (reserved for future use) | Not stored in database |
| `primaryColor` | string | No | Primary brand color | Valid hex color (e.g., `#2563eb` or `#fff`) |
| `secondaryColor` | string | No | Secondary brand color | Valid hex color (e.g., `#1e40af`) |
| `tertiaryColor` | string | No | Tertiary brand color | Valid hex color (e.g., `#10b981`) |
| `heroContent` | string (JSON) | No | Hero section content | Valid JSON object (see structure below) |
| `logo` | file | No | Company logo image | PNG, JPEG, or WebP; max 2MB |

### Hero Content JSON Structure

```json
{
  "title": "Welcome to Our Company",
  "subtitle": "Transform your workflow",
  "backgroundColor": "#2563eb",
  "textColor": "#ffffff"
}
```

All fields within `heroContent` are optional.

### Logo File Validation

**Allowed MIME Types:**
- `image/png`
- `image/jpeg`
- `image/webp`

**Validation Checks:**
1. **File Size:** Maximum 2MB (2,097,152 bytes)
2. **MIME Type:** Checked via Content-Type header
3. **Magic Bytes:** File signature verification (MIME sniffing) to prevent type spoofing
   - PNG: Starts with `89 50 4E 47`
   - JPEG: Starts with `FF D8 FF`
   - WebP: Contains `RIFF` and `WEBP` signatures

**File Upload Process:**
1. File is validated for type and size
2. File is uploaded to Azure Blob Storage
3. Public URL is generated and stored in database
4. File is accessible via HTTPS

## Example Requests

### Minimal Request (Name Only)

```bash
curl -X POST http://localhost:3000/api/companies \
  -F "name=Acme Corporation"
```

### Complete Request with Logo

```bash
curl -X POST http://localhost:3000/api/companies \
  -F "name=Acme Corporation" \
  -F "brandCode=ACME" \
  -F "primaryColor=#2563eb" \
  -F "secondaryColor=#1e40af" \
  -F "tertiaryColor=#10b981" \
  -F 'heroContent={"title":"Welcome to Acme","subtitle":"Excellence in Service","backgroundColor":"#2563eb","textColor":"#ffffff"}' \
  -F "logo=@/path/to/logo.png"
```

### JavaScript/Fetch Example

```javascript
const formData = new FormData();
formData.append('name', 'Acme Corporation');
formData.append('primaryColor', '#2563eb');
formData.append('secondaryColor', '#1e40af');
formData.append('heroContent', JSON.stringify({
  title: 'Welcome to Acme',
  subtitle: 'Excellence in Service',
  backgroundColor: '#2563eb',
  textColor: '#ffffff',
}));

// Add logo file from input element
const logoInput = document.querySelector('#logo-input');
if (logoInput.files[0]) {
  formData.append('logo', logoInput.files[0]);
}

const response = await fetch('/api/companies', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "cm123abc456def789",
    "name": "Acme Corporation",
    "brandCode": "ACME",
    "logoUrl": "https://storage.azure.com/company-logos/cm123abc456def789/logo.png",
    "primaryColor": "#2563eb",
    "secondaryColor": "#1e40af",
    "tertiaryColor": "#10b981",
    "heroContent": {
      "title": "Welcome to Acme",
      "subtitle": "Excellence in Service",
      "backgroundColor": "#2563eb",
      "textColor": "#ffffff"
    },
    "apiKey": "mw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful requests |
| `data.id` | string | Unique company identifier (UUID) |
| `data.name` | string | Company name |
| `data.brandCode` | string \| null | Brand code (echoed from request, not stored) |
| `data.logoUrl` | string \| null | Public URL to uploaded logo |
| `data.primaryColor` | string \| null | Primary brand color |
| `data.secondaryColor` | string \| null | Secondary brand color |
| `data.tertiaryColor` | string \| null | Tertiary brand color |
| `data.heroContent` | object \| null | Hero section configuration |
| `data.apiKey` | string | API key for company (store securely!) |
| `data.createdAt` | string (ISO 8601) | Creation timestamp |
| `data.updatedAt` | string (ISO 8601) | Last update timestamp |

**Important:** The `apiKey` is only returned once during creation. Store it securely.

### Error Responses

#### 400 Bad Request - Missing Required Field

```json
{
  "success": false,
  "error": "Company name is required"
}
```

#### 400 Bad Request - Invalid Color Format

```json
{
  "success": false,
  "error": "Primary color must be a valid hex color (e.g., #2563eb or #fff)"
}
```

#### 400 Bad Request - Invalid Hero Content JSON

```json
{
  "success": false,
  "error": "Invalid heroContent JSON format. Expected {title, subtitle, backgroundColor, textColor}"
}
```

#### 400 Bad Request - Logo Validation Failed

```json
{
  "success": false,
  "error": "Invalid file type. Only PNG, JPEG, and WebP images are allowed.",
  "details": "Logo validation failed. Ensure file is PNG, JPEG, or WebP and under 2MB."
}
```

**Common logo validation errors:**
- "File size exceeds maximum allowed (2MB)"
- "Invalid file type. Only PNG, JPEG, and WebP images are allowed."
- "File type mismatch. Provided type does not match file content (MIME sniffing failed)"

#### 409 Conflict - Duplicate Company Name

```json
{
  "success": false,
  "error": "A company with this name already exists"
}
```

#### 503 Service Unavailable - Storage Not Configured

```json
{
  "success": false,
  "error": "File storage is not configured. Please contact support or omit the logo field."
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to create company",
  "details": "Database connection error"
}
```

## Validation Rules Summary

### Field Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required | "Company name is required" |
| `name` | Max length 255 | "Company name must be 255 characters or less" |
| `name` | Unique | "A company with this name already exists" |
| `primaryColor` | Hex format | "Primary color must be a valid hex color (e.g., #2563eb or #fff)" |
| `secondaryColor` | Hex format | "Secondary color must be a valid hex color (e.g., #1e40af or #000)" |
| `tertiaryColor` | Hex format | "Tertiary color must be a valid hex color (e.g., #10b981 or #0f0)" |
| `heroContent` | Valid JSON | "Invalid heroContent JSON format..." |
| `heroContent.backgroundColor` | Hex format | "Hero background color must be a valid hex color..." |
| `heroContent.textColor` | Hex format | "Hero text color must be a valid hex color..." |
| `logo` | File type | "Invalid file type. Only PNG, JPEG, and WebP images are allowed." |
| `logo` | File size | "File size exceeds maximum allowed (2MB)" |
| `logo` | Magic bytes | "File type mismatch. Provided type does not match file content" |

### Color Format

Valid hex color formats:
- Full hex: `#2563eb` (6 characters)
- Short hex: `#fff` (3 characters)
- Case insensitive: `#2563EB` or `#2563eb`

### Logo File Constraints

- **Maximum size:** 2MB (2,097,152 bytes)
- **Allowed types:** PNG, JPEG, WebP
- **Validation method:** MIME type check + magic bytes verification
- **Storage:** Azure Blob Storage (requires `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER_NAME` environment variables)

## Database Schema

The endpoint creates records in three tables:

1. **Company** table:
   - `id` (UUID, auto-generated)
   - `name` (unique)
   - `logoUrl` (nullable)
   - `primaryColor` (nullable)
   - `secondaryColor` (nullable)
   - `tertiaryColor` (nullable)
   - `apiKey` (unique, auto-generated)
   - `createdAt` (auto-generated)
   - `updatedAt` (auto-generated)

2. **BrandingSettings** table:
   - `companyId` (references Company.id)
   - `logoUrl` (nullable)
   - `primaryColor` (default: "#2563eb")
   - `secondaryColor` (default: "#1e40af")
   - `fontFamily` (default: "Inter")

3. **HeroSettings** table (created only if `heroContent` provided):
   - `companyId` (references Company.id)
   - `title` (default: "Welcome")
   - `subtitle` (nullable)
   - `backgroundColor` (default: "#2563eb")
   - `textColor` (default: "#ffffff")

## Security Considerations

1. **API Key Protection:** The returned `apiKey` should be stored securely and never exposed in client-side code.

2. **File Upload Security:**
   - MIME type validation prevents incorrect file types
   - Magic bytes verification prevents file type spoofing
   - File size limit prevents DoS attacks
   - Azure Blob Storage provides secure, scalable file hosting

3. **Input Validation:**
   - All fields are sanitized (trimmed)
   - Color formats strictly validated
   - JSON parsing errors are caught and returned
   - SQL injection prevented via Prisma ORM parameterized queries

4. **TODO - Authentication:**
   - Currently no authentication required (development mode)
   - Production should require admin authentication

## Error Handling

The endpoint implements comprehensive error handling:

1. **Validation Errors (400):** Client errors with clear messages
2. **Conflict Errors (409):** Duplicate company name
3. **Service Errors (503):** Azure Storage not configured
4. **Server Errors (500):** Unexpected errors with details

All errors follow consistent format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Optional additional context"
}
```

## Testing

### Manual Testing with cURL

```bash
# Test with minimal data
curl -X POST http://localhost:3000/api/companies \
  -F "name=Test Company"

# Test with complete data
curl -X POST http://localhost:3000/api/companies \
  -F "name=Test Company" \
  -F "primaryColor=#ff0000" \
  -F "secondaryColor=#00ff00" \
  -F 'heroContent={"title":"Test"}' \
  -F "logo=@test-logo.png"

# Test validation errors
curl -X POST http://localhost:3000/api/companies \
  -F "name=" # Should fail: name required

curl -X POST http://localhost:3000/api/companies \
  -F "name=Test" \
  -F "primaryColor=invalid" # Should fail: invalid color
```

### Automated Testing

See `__tests__/api/companies/post.test.ts` for comprehensive test suite.

## Related Endpoints

- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `POST /api/companies/:id/logo` - Update company logo
- `GET /api/companies/:id/settings` - Get company settings

## Notes

- **brandCode field:** Currently accepted but not stored in database. Reserved for future use.
- **API Key:** Generated automatically using secure random bytes. Format: `mw_{64 hex characters}`
- **Logo Storage:** Uses Azure Blob Storage. Requires environment variables to be configured.
- **Default Values:** If colors not provided, defaults are used (#2563eb, #1e40af)
