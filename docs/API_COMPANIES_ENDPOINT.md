# GET /api/companies - API Documentation

## Overview

Retrieve a list of all companies with their settings, branding, and hero content. Supports pagination, search filtering, and tenant scoping via headers.

## Endpoint

```
GET /api/companies
```

## Authentication

Currently no authentication required. Future versions will require admin role.

## Request

### Query Parameters

| Parameter | Type    | Required | Default | Description                          |
|-----------|---------|----------|---------|--------------------------------------|
| `page`    | integer | No       | 1       | Page number (minimum: 1)             |
| `limit`   | integer | No       | 20      | Items per page (max: 100, min: 1)    |
| `search`  | string  | No       | -       | Search companies by name (case-insensitive) |

### Headers

| Header         | Type   | Required | Description                                      |
|----------------|--------|----------|--------------------------------------------------|
| `X-Company-Id` | string | No       | Filter results to specific company (tenant scoping) |

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "company-uuid",
      "name": "Moveware Melbourne",
      "brandCode": "MW-MEL",
      "logoUrl": "https://storage.example.com/logos/company-uuid.png",
      "primaryColor": "#2563eb",
      "secondaryColor": "#1e40af",
      "tertiaryColor": null,
      "heroContent": {
        "title": "Welcome to Moveware",
        "subtitle": "Professional moving services",
        "backgroundColor": "#2563eb",
        "textColor": "#ffffff"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to fetch companies",
  "details": "Database connection error"
}
```

## Response Schema

### Company Object

| Field            | Type   | Nullable | Description                                    |
|------------------|--------|----------|------------------------------------------------|
| `id`             | string | No       | Unique company identifier (UUID)               |
| `name`           | string | No       | Company name                                   |
| `brandCode`      | string | Yes      | Optional brand/company code (e.g., "MW-MEL")   |
| `logoUrl`        | string | Yes      | URL to company logo image                      |
| `primaryColor`   | string | Yes      | Primary brand color (hex format)               |
| `secondaryColor` | string | Yes      | Secondary brand color (hex format)             |
| `tertiaryColor`  | string | Yes      | Tertiary brand color (not yet implemented)     |
| `heroContent`    | object | Yes      | Hero section settings (see below)              |
| `createdAt`      | string | No       | ISO 8601 timestamp of company creation         |
| `updatedAt`      | string | No       | ISO 8601 timestamp of last update              |

### HeroContent Object

| Field              | Type   | Nullable | Description                           |
|--------------------|--------|----------|---------------------------------------|
| `title`            | string | Yes      | Hero section title                    |
| `subtitle`         | string | Yes      | Hero section subtitle                 |
| `backgroundColor`  | string | Yes      | Hero background color (hex format)    |
| `textColor`        | string | Yes      | Hero text color (hex format)          |

## Pagination

The API uses offset-based pagination with the following behavior:

- Default page size: 20 items
- Maximum page size: 100 items
- Minimum page size: 1 item
- Page numbers start at 1
- Returns empty array if page exceeds total pages

### Pagination Response Fields

| Field        | Type    | Description                           |
|--------------|---------|---------------------------------------|
| `page`       | integer | Current page number                   |
| `limit`      | integer | Items per page                        |
| `total`      | integer | Total number of companies             |
| `totalPages` | integer | Total number of pages available       |

## Tenant Scoping

The endpoint supports multi-tenant filtering via the `X-Company-Id` header. When provided:

- Only the specified company's data is returned
- Response will contain 0 or 1 companies
- Useful for client applications that need to fetch their own company data

**Example:**
```bash
curl -H "X-Company-Id: company-uuid" http://localhost:3000/api/companies
```

## Testing Examples

### 1. Basic Request (curl)

```bash
curl -X GET http://localhost:3000/api/companies
```

### 2. With Pagination (curl)

```bash
curl -X GET "http://localhost:3000/api/companies?page=2&limit=10"
```

### 3. With Search Filter (curl)

```bash
curl -X GET "http://localhost:3000/api/companies?search=Melbourne"
```

### 4. With Tenant Scoping (curl)

```bash
curl -X GET \
  -H "X-Company-Id: company-uuid" \
  http://localhost:3000/api/companies
```

### 5. Combined Parameters (curl)

```bash
curl -X GET "http://localhost:3000/api/companies?page=1&limit=5&search=Move"
```

### Postman Testing

#### Request Configuration

1. **Method**: GET
2. **URL**: `http://localhost:3000/api/companies`
3. **Query Params** (Params tab):
   - Key: `page`, Value: `1`
   - Key: `limit`, Value: `20`
   - Key: `search`, Value: `Moveware`
4. **Headers** (Headers tab):
   - Key: `X-Company-Id`, Value: `your-company-uuid`

#### Test Scripts (Postman Tests tab)

```javascript
// Validate response structure
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response has data array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});

pm.test("Response has pagination", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.pagination).to.be.an('object');
    pm.expect(jsonData.pagination).to.have.all.keys('page', 'limit', 'total', 'totalPages');
});

pm.test("Company objects have required fields", function () {
    var jsonData = pm.response.json();
    if (jsonData.data.length > 0) {
        var company = jsonData.data[0];
        pm.expect(company).to.have.property('id');
        pm.expect(company).to.have.property('name');
        pm.expect(company).to.have.property('createdAt');
        pm.expect(company).to.have.property('updatedAt');
    }
});
```

## Edge Cases

### 1. Empty Results

When no companies match the search criteria:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### 2. Invalid Pagination Parameters

- Negative page numbers are normalized to 1
- Limit values > 100 are capped at 100
- Limit values < 1 are set to 1
- Non-numeric values default to 1 (page) or 20 (limit)

### 3. Non-Existent Company ID in Header

When `X-Company-Id` doesn't match any company:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Performance Considerations

- Default page size (20) is optimized for most use cases
- Large page sizes (>50) may impact response time
- Search queries use case-insensitive matching (may be slower on large datasets)
- Consider adding database indexes on `name` field for better search performance

## Future Enhancements

- [ ] Add authentication/authorization (admin role required)
- [ ] Implement `tertiaryColor` field in database schema
- [ ] Add sorting options (e.g., `?sort=name&order=desc`)
- [ ] Add filtering by multiple fields (e.g., `?brandCode=MW-MEL`)
- [ ] Implement cursor-based pagination for better performance at scale
- [ ] Add rate limiting to prevent abuse
- [ ] Cache frequently accessed company data

## Notes

- `tertiaryColor` field is included in response schema but not yet implemented in database
- `brandCode` field is optional and may not be present for all companies
- Timestamps are returned in ISO 8601 format (UTC)
- Color fields are expected to be in hex format (e.g., `#2563eb`)
- Hero content is null if no hero settings are configured for the company
