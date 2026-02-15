# Cache Revalidation Strategy

## Overview

This document describes the cache revalidation strategy implemented for the Moveware application, specifically for the Companies management feature.

## Strategy: Server Actions with revalidatePath

### Why Server Actions?

1. **Server-Side Revalidation**: Cache invalidation happens on the server, ensuring consistency
2. **No Manual Refresh**: Components automatically re-render with fresh data
3. **Type Safety**: Full TypeScript support for actions and their return types
4. **Progressive Enhancement**: Works even when JavaScript is disabled (for form submissions)
5. **Optimistic UI**: Easy integration with React's `useTransition` hook

### Implementation

#### Server Actions File: `lib/actions/companies.ts`

All mutation operations (create, update, delete) are implemented as Server Actions that:

1. Perform the database operation
2. Call `revalidatePath('/settings/companies')` on success
3. Return structured results: `{ success: true }` or `{ success: false, error: string }`

```typescript
export async function deleteCompany(companyId: string): Promise<ActionResult> {
  // ... perform deletion
  
  // Invalidate cache for the companies list
  revalidatePath('/settings/companies')
  
  return { success: true }
}
```

#### Client Component: `lib/components/settings/CompaniesListView.tsx`

The client component uses these actions with React's `useTransition` hook:

```typescript
const [isPending, startTransition] = useTransition()

startTransition(async () => {
  const result = await deleteCompany(companyId)
  if (result.success) {
    // Next.js automatically re-renders with fresh data
  }
})
```

## Benefits

### 1. Automatic Cache Invalidation
- No need for manual `router.refresh()` calls
- Server Components re-fetch data automatically
- Consistent state across the application

### 2. Better Performance
- Invalidation happens server-side
- Only affected routes are revalidated
- Selective revalidation using paths or tags

### 3. Developer Experience
- Clear separation: mutations = Server Actions, queries = Server Components
- TypeScript support throughout
- Error handling is centralized
- Easy to test and debug

## Alternative: Client-Side Mutations

If you need to use API routes (e.g., for file uploads or complex workflows):

```typescript
'use client'
import { useRouter } from 'next/navigation'

export default function Component() {
  const router = useRouter()
  
  async function handleMutation() {
    await fetch('/api/companies', { method: 'POST', ... })
    
    // Manually trigger cache revalidation
    router.refresh()
  }
}
```

**When to use:**
- File uploads with multipart/form-data
- Streaming responses
- WebSocket connections
- Third-party API proxying

## revalidatePath vs revalidateTag

### revalidatePath

**Use when:**
- Invalidating a specific page or route
- Simple, single-page applications
- Path-based cache invalidation is sufficient

**Example:**
```typescript
revalidatePath('/settings/companies')           // Exact path
revalidatePath('/settings/companies', 'page')   // Just this page
revalidatePath('/settings/companies', 'layout') // Page + layout
```

### revalidateTag

**Use when:**
- Multiple pages share the same data
- Need granular control over cache invalidation
- Want to invalidate specific data across routes

**Example:**
```typescript
// In fetch call:
fetch('/api/data', { next: { tags: ['companies'] } })

// In Server Action:
revalidateTag('companies')
```

## Current Implementation

We use **revalidatePath** because:

1. The companies list is primarily on one route: `/settings/companies`
2. Simpler to understand and maintain
3. Sufficient for current requirements
4. Easy to migrate to tags if needed

## Migration Path

If you need to switch to tags:

1. Add tags to data fetching:
   ```typescript
   // In Server Component
   const companies = await fetch('/api/companies', {
     next: { tags: ['companies'] }
   })
   ```

2. Update Server Actions:
   ```typescript
   import { revalidateTag } from 'next/cache'
   
   revalidateTag('companies')  // Instead of revalidatePath
   ```

3. Benefits:
   - Invalidate companies across multiple routes
   - More granular control
   - Better for complex applications

## Testing

### Manual Testing

1. Navigate to `/settings/companies`
2. Delete a company
3. Verify the list updates without refresh
4. Check Network tab - should see no full page reload

### Automated Testing

```typescript
import { deleteCompany } from '@/lib/actions/companies'

test('deleteCompany revalidates cache', async () => {
  const result = await deleteCompany('test-id')
  
  expect(result.success).toBe(true)
  // Verify revalidatePath was called (mock Next.js functions)
})
```

## Best Practices

1. **Always revalidate after mutations**: Don't forget to call revalidatePath/revalidateTag
2. **Use specific paths**: Revalidate only what changed, not the entire app
3. **Handle errors gracefully**: Return error messages from Server Actions
4. **Use useTransition**: For loading states and optimistic updates
5. **Document your strategy**: Keep this file updated as patterns change

## Troubleshooting

### Cache not invalidating?

1. Check if `revalidatePath` is called after successful mutation
2. Verify the path matches exactly: `/settings/companies`
3. Ensure Server Action has `'use server'` directive
4. Check for errors in server logs

### Data still stale?

1. Clear browser cache and try again
2. Check if using `cache: 'force-cache'` in fetch calls
3. Verify Server Component is actually re-fetching
4. Use React DevTools to check component re-renders

### Performance issues?

1. Don't revalidate entire app: use specific paths
2. Consider using tags for granular control
3. Batch multiple mutations before revalidating
4. Use ISR (Incremental Static Regeneration) for less critical data

## Resources

- [Next.js: Revalidating Data](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
- [Next.js: Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React: useTransition](https://react.dev/reference/react/useTransition)
