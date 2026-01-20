# Architecture Documentation

## Overview

This document describes the architecture of the OnlineAccess Next.js application, including design decisions, patterns used, and best practices implemented.

## Technology Stack

- **Framework**: Next.js 16.1.3 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5.7
- **Styling**: CSS with CSS Variables
- **SDK Integration**: @moveconnect/sdk 1.0.79

## Architectural Patterns

### 1. Component Architecture

#### Server Components (Default)
- Page components (`page.tsx`)
- Layout components (`layout.tsx`)
- Static content components

**Benefits:**
- Zero JavaScript to client by default
- Improved performance and SEO
- Direct database/API access

#### Client Components ('use client')
- Interactive components requiring hooks
- Components with event handlers
- Components using browser APIs

**Examples:**
- `RMSClient.tsx` - Handles data fetching and state
- `DynamicContainer.tsx` - Interactive form container
- All components in `/components` directory

### 2. Routing Strategy

#### File-Based Routing (App Router)
```
/rms/[companyId]/[pageType]           → Dynamic RMS page
/rms/[companyId]/[pageType]/[mdVersion] → With metadata version
/form                                  → Legacy route handler
/                                      → Home/welcome page
```

**Dynamic Route Parameters:**
- `[companyId]` - Company identifier
- `[pageType]` - Page type (quote, invoice, etc.)
- `[mdVersion]` - Optional metadata version

#### Query Parameter Handling
- Modern params: Direct pass-through
- Legacy params: Automatic conversion via `parseLegacyQueryParams()`

### 3. Data Fetching Pattern

#### Custom Hook Pattern (`useRMSData`)

```typescript
const { metadata, data, error, isLoading } = useRMSData(apiConfig);
```

**Features:**
- Automatic metadata and data fetching
- Sequential loading (metadata → data)
- Error state management
- Refetch capabilities

**Flow:**
1. Component renders with API config
2. Hook fetches metadata from backend
3. On success, automatically fetches data
4. Updates state and triggers re-render

### 4. State Management

#### Local State (useState)
Used for:
- Component-specific UI state
- Loading indicators
- Error messages

#### Ref-Based State (useRef)
Used for:
- API service instances
- Preventing duplicate fetches
- Storing non-render values

**No Global State Library Required:**
- Route params provide context
- API responses are fetched fresh
- No need for Redux/Zustand/etc.

### 5. API Service Layer

#### Separation of Concerns

```
Component (UI)
    ↓
Hook (State Management)
    ↓
API Service (HTTP Calls)
    ↓
Backend API
```

**`BackendAPIService` Class:**
- Encapsulates all API calls
- Handles request/response formatting
- Error handling and retries
- Maintains API configuration

**`ApiConfigBuilder` Class:**
- Constructs API URLs from route params
- Separates metadata/data query params
- Handles environment-specific URLs

### 6. Error Handling Strategy

#### Multi-Level Error Handling

1. **API Level**: Catch network errors, format responses
2. **Hook Level**: Transform errors, update state
3. **Component Level**: Display error UI
4. **App Level**: Error boundary catches unhandled errors

#### Error Types
- Network errors (status 0)
- HTTP errors (4xx, 5xx)
- Parsing errors
- Validation errors

### 7. Type Safety

#### Comprehensive Type Definitions
- `ApiConfig` - API configuration
- `MetadataResponse` - Backend metadata
- `DataResponse` - Backend data
- `ActionData` - Form submissions
- `ErrorResponse` - Error formatting

#### Benefits
- IDE autocomplete
- Compile-time error checking
- Self-documenting code
- Refactoring safety

### 8. Styling Architecture

#### CSS Variables for Theming
```css
:root {
  --color-sf-primary: rgb(20, 50, 200);
  --color-sf-secondary: rgb(200, 50, 50);
  /* ... */
}
```

**Dynamic Theme Updates:**
- Backend provides theme colors
- JavaScript updates CSS variables
- Instant re-theming without reload

#### Utility-First Classes
- Flexbox utilities (`.flex-col`, `.flex-items-center`)
- Spacing utilities (`.pad-lg`, `.mar-sm`)
- Color utilities (`.color-primary`, `.bg-white`)

**Benefits:**
- Consistent spacing/colors
- Reduced CSS duplication
- Easy maintenance

### 9. Monitoring and Analytics

#### Hook-Based Monitoring (`useMonitoring`)
```typescript
const { logPageView, logEvent, logException } = useMonitoring();
```

**Tracked Events:**
- Page views
- Form submissions
- Errors/exceptions
- Custom events

**Data Sanitization:**
- Automatic token hiding
- Signature redaction
- Configurable display lengths

### 10. Environment Management

#### Multi-Environment Support
- `.env.development` - Development settings
- `.env.production` - Production settings
- `.env.local` - Local overrides (gitignored)

#### Environment Variables
All public vars prefixed with `NEXT_PUBLIC_`:
- `NEXT_PUBLIC_FETCH_API_ROOT`
- `NEXT_PUBLIC_FETCH_ASSETS`
- `NEXT_PUBLIC_APP_INSIGHTS_KEY`

## Design Decisions

### Why Next.js App Router?

**Advantages:**
- Built-in SSR/SSG capabilities
- File-based routing
- Server components reduce bundle size
- Streaming and suspense support
- Better SEO out of the box

### Why No State Management Library?

**Reasons:**
1. Route params provide necessary context
2. Data is fetched per-page (no global cache needed)
3. Form state managed by SDK
4. Reduces bundle size and complexity

### Why Custom Hooks Over Context?

**Benefits:**
- More flexible and composable
- Easier to test
- No provider wrapper needed
- Better TypeScript inference

### Why Class-Based Services?

**Rationale:**
- Encapsulation of related methods
- Instance-based configuration
- Familiar pattern from Angular
- Easier to mock in tests

## Performance Optimizations

### 1. Server Components by Default
- Reduces client-side JavaScript
- Faster initial page loads

### 2. Dynamic Imports
- Code splitting for large components
- Lazy loading non-critical features

### 3. Caching Strategy
- `cache: 'no-store'` for API calls (always fresh data)
- Static assets cached by CDN
- Dynamic routes pre-rendered where possible

### 4. Image Optimization
- Next.js Image component
- Remote pattern allowlist
- Automatic format selection (WebP)

## Security Considerations

### 1. Input Validation
- Type checking on all inputs
- Query parameter sanitization
- XSS prevention via React

### 2. Sensitive Data
- Token hiding in logs
- Signature redaction
- Configurable display lengths

### 3. API Security
- CORS configuration
- Rate limiting (backend)
- Authentication via tokens

### 4. Environment Variables
- Public vars only sent to client
- Secrets stay server-side
- No hardcoded credentials

## Testing Strategy

### Unit Tests
- Utility functions
- Hooks (with React Testing Library)
- API service methods

### Integration Tests
- Component interactions
- Data fetching flows
- Error handling

### E2E Tests
- Playwright for full user flows
- Critical path testing
- Cross-browser compatibility

## Deployment Architecture

### Production Setup

```
[CDN] → [Next.js Server] → [Backend API]
         ↓
    [Static Assets]
```

### Scaling Considerations
- Horizontal scaling via containers
- CDN for static assets
- API caching layer
- Database connection pooling

## Migration Path from Angular

### Component Mapping
| Angular | Next.js |
|---------|---------|
| Module | Layout/Page |
| Component | React Component |
| Service | Class/Hook |
| Pipe | Utility Function |
| Directive | Component/Prop |

### RxJS to Promises
- `Observable` → `Promise`
- `subscribe()` → `await`/`.then()`
- `pipe()` → async/await chain

## Future Architecture Improvements

1. **API Route Handlers**
   - Move API calls to Next.js API routes
   - Better error handling
   - Request caching

2. **React Server Actions**
   - Form submissions via server actions
   - Progressive enhancement
   - No client-side JavaScript needed

3. **Streaming SSR**
   - Stream metadata/data separately
   - Faster time to first byte
   - Better perceived performance

4. **Edge Runtime**
   - Deploy to edge for lower latency
   - Faster response times globally

5. **Partial Prerendering**
   - Static shell with dynamic content
   - Best of both SSG and SSR

## Code Organization Principles

### 1. Single Responsibility
- Each file has one clear purpose
- Functions do one thing well

### 2. DRY (Don't Repeat Yourself)
- Shared utilities in `/lib`
- Reusable components in `/components`
- Common types in `/types`

### 3. KISS (Keep It Simple)
- Prefer simple solutions
- Avoid over-engineering
- Clear over clever

### 4. Separation of Concerns
- UI separate from business logic
- API calls isolated in services
- Types defined separately

## Conclusion

This architecture provides:
- **Maintainability**: Clear structure and patterns
- **Scalability**: Easy to add features
- **Performance**: Optimized bundle and loading
- **Developer Experience**: Modern tooling and TypeScript
- **User Experience**: Fast, responsive application

The design follows Next.js best practices while maintaining compatibility with the MoveConnect SDK and backend systems.
