# Authentication & Authorization Middleware

This directory contains middleware functions for protecting API routes with authentication and authorization checks.

## Overview

The middleware provides:
- **Authentication**: Validates user sessions via authorization tokens
- **Authorization**: Role-based access control (RBAC)
- **CSRF Protection**: Origin/Referer header validation for state-changing requests
- **Audit Logging**: Request logging for security audit trails
- **Multi-tenancy**: Company-level access control

## Usage Patterns

### Protecting Admin-Only Routes

Use `requireAdmin()` to protect routes that require admin privileges:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  // Check authentication and admin role
  const authError = await requireAdmin(request);
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError.error },
      { status: authError.status }
    );
  }

  // Protected route logic here
  return NextResponse.json({ message: 'Admin access granted' });
}

export async function PUT(request: NextRequest) {
  // CSRF protection is automatically applied to PUT/POST/DELETE
  const authError = await requireAdmin(request);
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError.error },
      { status: authError.status }
    );
  }

  // Update logic here
  return NextResponse.json({ success: true });
}
```

### Multi-Tenancy: Company-Specific Routes

For routes that manage company-specific resources, pass the company ID:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  // Verify admin access to this specific company
  const authError = await requireAdmin(request, companyId);
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError.error },
      { status: authError.status }
    );
  }

  // Update company settings
  return NextResponse.json({ success: true });
}
```

### Any Authenticated User

Use `requireAuth()` for routes that need authentication but not admin role:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError.error },
      { status: authError.status }
    );
  }

  // Any authenticated user can access this
  return NextResponse.json({ message: 'Authenticated' });
}
```

### Getting Current User Data

Use `getCurrentUser()` to access user information in your route:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Use user data
  return NextResponse.json({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}
```

## Authentication Flow

1. **Client sends request** with `Authorization` header:
   ```
   Authorization: Bearer <token>
   ```
   Or simply:
   ```
   Authorization: <token>
   ```

2. **Middleware validates**:
   - ✓ CSRF protection (for POST/PUT/DELETE/PATCH)
   - ✓ Token extraction
   - ✓ Session validation
   - ✓ Role verification (if required)
   - ✓ Company access (if required)
   - ✓ Audit logging

3. **Returns**:
   - `null` if authorized (proceed with route handler)
   - `AuthError` object with error message and status code

## CSRF Protection

CSRF protection is automatically applied to state-changing methods (POST, PUT, DELETE, PATCH) by validating:

- **Origin header**: Checks request origin matches application domain
- **Referer header**: Fallback if Origin not present
- **Host header**: Validates against request hostname

### CSRF Requirements

For API requests from client-side code:

```typescript
// ✓ Correct: Browser automatically includes Origin header
fetch('/api/companies/123/settings', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ primaryColor: '#2563eb' }),
});

// ✗ Wrong: Direct API calls without Origin may fail in production
// Use from same domain or configure CORS
```

## Error Responses

### 401 Unauthorized

Returned when:
- No authorization token provided
- Invalid or expired token
- Session not found

```json
{
  "success": false,
  "error": "Authentication required. Please provide a valid authorization token."
}
```

### 403 Forbidden

Returned when:
- User lacks admin role (for `requireAdmin`)
- CSRF validation fails
- No access to specified company

```json
{
  "success": false,
  "error": "Access denied. Admin privileges required."
}
```

## Audit Logging

All authentication attempts are logged with:
- Timestamp
- Request method and path
- Client IP address
- Success/failure status
- User ID (if authenticated)
- Failure reason (if applicable)

**Example log output:**
```
✓ Auth success: {"timestamp":"2024-01-15T10:30:00.000Z","method":"GET","path":"/api/companies/123/settings","ip":"192.168.1.1","success":true,"userId":"1"}

✗ Auth failed: {"timestamp":"2024-01-15T10:31:00.000Z","method":"PUT","path":"/api/companies/123/settings","ip":"192.168.1.2","success":false,"reason":"Insufficient permissions (not admin)"}
```

## Production Considerations

### Current Implementation (Placeholder)

The current implementation uses placeholder authentication for development:
- Accepts `placeholder-token` from login endpoint
- Mock user validation
- Basic session management

### Production Requirements

**Replace placeholder authentication with:**

1. **JWT Token Validation**:
   ```typescript
   import jwt from 'jsonwebtoken';
   
   async function validateSession(token: string): Promise<User | null> {
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const user = await db.user.findUnique({ where: { id: decoded.sub } });
       return user;
     } catch (error) {
       return null;
     }
   }
   ```

2. **Database Session Store**:
   ```typescript
   // Check session in database
   const session = await prisma.session.findUnique({
     where: { token },
     include: { user: true },
   });
   
   if (!session || session.expiresAt < new Date()) {
     return null;
   }
   ```

3. **Microsoft SSO Integration** (as per project requirements):
   ```typescript
   import { validateAzureADToken } from '@/lib/auth/azure';
   
   async function validateSession(token: string): Promise<User | null> {
     const azureUser = await validateAzureADToken(token);
     // Map Azure AD user to application user
   }
   ```

4. **Enhanced Audit Logging**:
   ```typescript
   // Send to external logging service
   import { CloudWatchLogs } from 'aws-sdk';
   
   await cloudwatch.putLogEvents({
     logGroupName: '/app/auth',
     logStreamName: 'authentication',
     logEvents: [{ timestamp, message: JSON.stringify(logEntry) }],
   });
   ```

5. **Company Access Control**:
   ```typescript
   async function verifyCompanyAccess(
     userId: string,
     companyId: string
   ): Promise<boolean> {
     const userCompany = await prisma.userCompany.findFirst({
       where: { userId, companyId },
     });
     return !!userCompany;
   }
   ```

## Security Best Practices

### Token Security
- Always use HTTPS in production
- Set secure HttpOnly cookies for tokens
- Implement token rotation and refresh tokens
- Use short expiration times (e.g., 15 minutes)

### Rate Limiting
Implement rate limiting for auth endpoints:
```typescript
import rateLimit from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  await rateLimit(request, { maxRequests: 5, windowMs: 60000 });
  // Auth logic...
}
```

### Input Validation
Always validate and sanitize inputs:
```typescript
import { z } from 'zod';

const schema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const validated = schema.parse(body);
```

## Testing

### Unit Tests

```typescript
import { requireAdmin } from '@/lib/middleware/auth';
import { NextRequest } from 'next/server';

describe('requireAdmin', () => {
  it('should return 401 for missing token', async () => {
    const request = new NextRequest('http://localhost/api/test');
    const result = await requireAdmin(request);
    expect(result?.status).toBe(401);
  });

  it('should return 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'staff-token' },
    });
    const result = await requireAdmin(request);
    expect(result?.status).toBe(403);
  });

  it('should return null for valid admin', async () => {
    const request = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer admin-token' },
    });
    const result = await requireAdmin(request);
    expect(result).toBeNull();
  });
});
```

## Troubleshooting

### "CSRF validation failed"
- Ensure requests include Origin or Referer header
- Verify request comes from same domain
- Check for proxy configuration issues

### "Invalid or expired token"
- Verify token format (Bearer token or plain)
- Check token hasn't expired
- Ensure login endpoint returned valid token

### "Access denied. Admin privileges required"
- Verify user has admin role in database
- Check role assignment in login response
- Ensure token includes role information

## API Reference

### `requireAdmin(request, companyId?)`

Requires admin role and optionally company access.

**Parameters:**
- `request: NextRequest` - The incoming request
- `companyId?: string` - Optional company ID for multi-tenancy

**Returns:**
- `Promise<AuthError | null>` - Error object or null if authorized

---

### `requireAuth(request)`

Requires any authenticated user (not necessarily admin).

**Parameters:**
- `request: NextRequest` - The incoming request

**Returns:**
- `Promise<AuthError | null>` - Error object or null if authenticated

---

### `getCurrentUser(request)`

Returns current authenticated user or null.

**Parameters:**
- `request: NextRequest` - The incoming request

**Returns:**
- `Promise<User | null>` - User object or null

---

## Related Documentation

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Authentication Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
