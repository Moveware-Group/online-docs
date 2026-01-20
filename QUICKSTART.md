# Quick Start Guide

Get the OnlineAccess Next.js application running in minutes.

## Prerequisites

- Node.js 18.17.0 or higher
- npm, yarn, or pnpm

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Copy environment file**
   ```bash
   # Create .env.local from example (if .env.local.example exists)
   # Or manually create .env.local with these variables:
   ```

3. **Create .env.local** with the following:
   ```env
   NEXT_PUBLIC_APP_ENV=development
   NEXT_PUBLIC_VERSION=1.0.0
   NEXT_PUBLIC_FETCH_ASSETS=https://static.moveware-test.app
   NEXT_PUBLIC_FETCH_API_ROOT=https://rest.moveconnect.com/malcolm-test/v1
   NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY=your-license-key-here
   NEXT_PUBLIC_APP_INSIGHTS_KEY=your-insights-key-here
   NEXT_PUBLIC_ENABLE_MONITORING=false
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Testing the Application

### Test URLs

Try accessing these routes:

1. **Home Page**
   ```
   http://localhost:3000
   ```

2. **RMS Page** (requires valid company/page data)
   ```
   http://localhost:3000/rms/[companyId]/[pageType]?token=your-token
   ```

3. **404 Page**
   ```
   http://localhost:3000/nonexistent-page
   ```

### Example URL Structure

```
http://localhost:3000/rms/100899/quote?token=abc123&brand=default
```

Where:
- `100899` = Company ID
- `quote` = Page Type
- `token=abc123` = Authentication token
- `brand=default` = Brand identifier (optional)

## Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## Project Structure Overview

```
src/
├── app/              # Next.js pages and layouts
│   ├── rms/         # Main RMS routes
│   ├── form/        # Legacy form route
│   └── globals.css  # Global styles
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and services
└── types/           # TypeScript types
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check for type errors
npm run type-check

# If persistent, try
rm -rf .next
npm run dev
```

### API Connection Issues

1. Check `NEXT_PUBLIC_FETCH_API_ROOT` in `.env.local`
2. Verify backend API is accessible
3. Check browser console for CORS errors
4. Verify query parameters (token, companyId, etc.)

## Next Steps

- Review the [README.md](README.md) for detailed documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for design details
- Read [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

## Getting Help

- Check the documentation files
- Review console logs for errors
- Open an issue on GitHub
- Contact the development team

## Quick Reference

### Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FETCH_API_ROOT` | Backend API URL |
| `NEXT_PUBLIC_FETCH_ASSETS` | Static assets CDN URL |
| `NEXT_PUBLIC_APP_INSIGHTS_KEY` | Azure App Insights key |

### Important Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript settings |
| `.env.local` | Local environment vars |

Happy coding! 🚀
