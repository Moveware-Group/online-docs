# Authorization Middleware

Comprehensive authentication and authorization middleware for Next.js API routes.

## Features

✅ **Authentication Validation** - Validates Bearer tokens and session cookies
✅ **Role-Based Access Control** - Enforces admin/staff role requirements
✅ **CSRF Protection** - Validates CSRF tokens for POST/PUT/DELETE/PATCH requests
✅ **Audit Logging** - Logs all authentication attempts for security monitoring
✅ **TypeScript Support** - Full type safety with detailed interfaces
✅ **Flexible Authorization** - Multiple middleware functions for different use cases

## Installation

No installation required - middleware is included in the project.

## Usage

### Protecting Admin Routes

Use `requireAdmin` for routes that require administrator access:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  // Check authorization
  const authError = await requireAdmin(request, companyId);
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError.error },
      { status: authError.status }
    );
  }

  // User is authenticated and has admin role
  const body = await request.json();
  // ... update logic
}
```

### Protecting Any Authenticated Route

Use `requireAuth` for routes that require any authenticated user (admin or staff):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  // Check if user is authenticated
  const authError = await requireAuth(request);
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError.error },
      { status: authError.status }
    );
  }

  // User is authenticated - proceed with logic
  // ...
}
```

### Getting Current User

Use `getAuthenticatedUser` when you need user information:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Use user data
  return NextResponse.json({
    userId: user.id,
    name: user.name,
    role: user.role,
  });
}
```

## Authentication Methods

The middleware supports two authentication methods:

### 1. Bearer Token (Recommended)

Include token in Authorization header:

```typescript
fetch('/api/protected', {
  headers: {
    'Authorization': 'Bearer your-token-here',
  },
});
```

### 2. Cookie-Based Session

Token stored in `auth-token` cookie (automatically sent by browser):

```typescript
// Set cookie after login
document.cookie = `auth-token=${token}; path=/; secure; samesite=strict`;

// Subsequent requests include cookie automatically
fetch('/api/protected');
```

## CSRF Protection

### How It Works

CSRF (Cross-Site Request Forgery) protection is automatically enforced for state-changing requests:

- **Protected Methods**: POST, PUT, DELETE, PATCH
- **Exempt Methods**: GET, HEAD, OPTIONS
- **Validation**: Compares `X-CSRF-Token` header with `csrf-token` cookie

### Implementation

1. **Generate CSRF Token** (on login or app initialization):

```typescript
// Generate random CSRF token
const csrfToken = crypto.randomUUID();

// Store in httpOnly cookie
response.cookies.set('csrf-token', csrfToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
});

// Return token to client (for header inclusion)
return { csrfToken };
```

2. **Include Token in Requests**:

```typescript
fetch('/api/protected', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Include token in header
  },
  body: JSON.stringify(data),
});
```

### Development Mode

In development (`NODE_ENV=development`), CSRF validation is relaxed to avoid blocking requests during testing. **Always enable strict CSRF validation in production.**

## Audit Logging

All authentication attempts are logged for security monitoring:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "action": "auth_success",
  "method": "PUT",
  "url": "http://localhost:3000/api/companies/123/settings",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "userId": "1",
  "userEmail": "admin@moveware.com",
  "userRole": "admin",
  "companyId": "123"
}
```

### Log Actions

- `auth_success` - Successful authentication and authorization
- `auth_failed` - Authentication failed (invalid/missing token)
- `forbidden` - User authenticated but lacks required permissions
- `csrf_failed` - CSRF token validation failed

### Production Logging

In production, send logs to:
- Centralized logging service (CloudWatch, Datadog, Loggly)
- SIEM system for security monitoring
- Audit database for compliance requirements

Keep auth logs for minimum 90 days for compliance.

## Error Responses

### 401 Unauthorized

Returned when authentication is missing or invalid:

```json
{
  "error": "Authentication required. Please log in to continue."
}
```

```json
{
  "error": "Invalid or expired authentication token. Please log in again."
}
```

### 403 Forbidden

Returned when authenticated but lacking required permissions:

```json
{
  "error": "Access denied. Administrator privileges required."
}
```

```json
{
  "error": "Invalid CSRF token. Please refresh the page and try again."
}
```

### 500 Internal Server Error

Returned when middleware encounters an unexpected error:

```json
{
  "error": "Internal authentication error. Please try again."
}
```

## API Reference

### `requireAdmin(request, companyId?)`

Requires authenticated user with admin role.

**Parameters:**
- `request: NextRequest` - Next.js request object
- `companyId?: string` - Optional company ID for company-specific access control

**Returns:** `Promise<AuthError | null>`
- `null` if authorized
- `AuthError` object with `error` message and `status` code if unauthorized

### `requireAuth(request)`

Requires any authenticated user (admin or staff).

**Parameters:**
- `request: NextRequest` - Next.js request object

**Returns:** `Promise<AuthError | null>`
- `null` if authenticated
- `AuthError` object if not authenticated

### `getAuthenticatedUser(request)`

Returns current authenticated user without enforcing authorization.

**Parameters:**
- `request: NextRequest` - Next.js request object

**Returns:** `Promise<AuthUser | null>`
- `AuthUser` object if authenticated
- `null` if not authenticated

## Security Best Practices

### Token Storage

✅ **DO:**
- Store tokens in httpOnly cookies for web apps
- Use secure flag (HTTPS only)
- Set SameSite=Strict or Lax
- Implement token rotation
- Set reasonable expiration times

❌ **DON'T:**
- Store tokens in localStorage (XSS vulnerable)
- Use long-lived tokens without rotation
- Expose tokens in URLs or logs

### CSRF Protection

✅ **DO:**
- Always validate CSRF tokens in production
- Rotate tokens on sensitive operations
- Use SameSite cookies as additional layer
- Validate token matches for state-changing requests

❌ **DON'T:**
- Disable CSRF protection in production
- Use GET requests for state-changing operations
- Trust Origin/Referer headers alone

### Audit Logging

✅ **DO:**
- Log all authentication attempts
- Include IP, user agent, and timestamp
- Monitor for suspicious patterns
- Keep logs for 90+ days
- Send alerts for repeated failures

❌ **DON'T:**
- Log sensitive data (passwords, full tokens)
- Ignore failed authentication attempts
- Delete logs prematurely

## Production Deployment

### Before Going to Production

1. **Replace Mock Authentication**
   - Implement proper JWT validation or session lookup
   - Integrate with identity provider (Azure AD, Auth0, etc.)
   - Set up secure token generation

2. **Enable Strict CSRF Validation**
   - Remove development mode bypass
   - Implement token generation on login
   - Configure client to send tokens

3. **Configure Audit Logging**
   - Set up centralized logging service
   - Configure log retention policies
   - Implement security alerts

4. **Security Headers**
   - Enable HSTS
   - Set CSP headers
   - Configure CORS properly

5. **Rate Limiting**
   - Implement rate limiting on auth endpoints
   - Add IP-based blocking for repeated failures
   - Set up account lockout policies

## Troubleshooting

### "Authentication required" error

**Cause:** No token found in request

**Solution:**
- Verify token is being sent in Authorization header or cookie
- Check token format: `Bearer <token>`
- Ensure cookie name is exactly `auth-token`

### "Invalid or expired token" error

**Cause:** Token validation failed

**Solution:**
- User needs to log in again
- Check token hasn't been revoked
- Verify token hasn't expired

### "Administrator privileges required" error

**Cause:** User has staff role but admin required

**Solution:**
- User needs admin role for this operation
- Contact administrator for role upgrade
- Use `requireAuth` instead if any authenticated user is acceptable

### "Invalid CSRF token" error

**Cause:** CSRF validation failed

**Solution:**
- Ensure `X-CSRF-Token` header is included in request
- Verify token matches csrf-token cookie
- Refresh page to get new CSRF token

## Support

For questions or issues:
1. Check this documentation
2. Review example implementations in existing API routes
3. Contact the development team
