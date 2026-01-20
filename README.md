# OnlineAccess - Next.js Implementation

A modern, performant reimplementation of the OnlineAccess application built with Next.js 16.1.3, following best practices and clean code principles.

## 🚀 Overview

OnlineAccess is a dynamic form and document rendering application that fetches metadata and data from backend APIs to display company-specific content. This Next.js implementation replaces the original Angular application with improved performance, better developer experience, and modern React patterns.

## ✨ Features

- **Dynamic Content Rendering**: Fetches and renders company-specific forms and documents based on URL parameters
- **Multi-language Support**: Built-in internationalization for English, French, German, Italian, and Dutch
- **Dynamic Theming**: Company-specific theming and branding support
- **Error Handling**: Comprehensive error states with localized messages
- **Loading States**: Smooth loading experiences with animated indicators
- **Monitoring**: Application Insights integration for logging and analytics
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Responsive Design**: Mobile-first approach with modern CSS
- **Legacy Route Support**: Backward compatibility with old query parameter formats

## 📋 Prerequisites

- Node.js >= 18.17.0
- npm, yarn, or pnpm

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd online-docs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   - `NEXT_PUBLIC_FETCH_ASSETS`: URL for static assets
   - `NEXT_PUBLIC_FETCH_API_ROOT`: Backend API root URL
   - `NEXT_PUBLIC_APP_INSIGHTS_KEY`: Application Insights instrumentation key

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
# or
yarn build
yarn start
# or
pnpm build
pnpm start
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 📁 Project Structure

```
online-access-nextjs/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── rms/                  # RMS dynamic routes
│   │   │   └── [companyId]/
│   │   │       └── [pageType]/
│   │   │           ├── page.tsx
│   │   │           ├── RMSClient.tsx
│   │   │           └── [mdVersion]/
│   │   │               └── page.tsx
│   │   ├── form/                 # Legacy form route
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── not-found.tsx         # 404 page
│   │   ├── error.tsx             # Error boundary
│   │   └── globals.css           # Global styles
│   ├── components/               # React components
│   │   ├── DynamicContainer.tsx  # Main dynamic content renderer
│   │   ├── ErrorState.tsx        # Error display component
│   │   ├── LoadingState.tsx      # Loading animation component
│   │   ├── Toast.tsx             # Toast notifications
│   │   └── Favicon.tsx           # Dynamic favicon updater
│   ├── hooks/                    # Custom React hooks
│   │   ├── useRMSData.ts         # Data fetching hook
│   │   └── useMonitoring.ts      # Analytics/monitoring hook
│   ├── lib/                      # Library code and utilities
│   │   ├── api-config.ts         # API configuration builder
│   │   ├── backend-api-service.ts # API service
│   │   ├── constants.ts          # Application constants
│   │   ├── environment.ts        # Environment configuration
│   │   └── utils.ts              # Utility functions
│   └── types/                    # TypeScript type definitions
│       └── index.ts
├── public/                       # Static assets
│   └── favicon.ico
├── .env.local.example            # Environment variables template
├── .env.development              # Development environment
├── .env.production               # Production environment
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
└── package.json                  # Project dependencies
```

## 🔗 Routes

### Main Routes

- `/` - Home page (welcome message)
- `/rms/[companyId]/[pageType]` - Main RMS page
- `/rms/[companyId]/[pageType]/[mdVersion]` - RMS page with metadata version
- `/form` - Legacy route (redirects to proper RMS route)

### Query Parameters

**Standard Parameters:**
- `token` - Authentication token
- `brand` - Brand identifier (affects theming/assets)
- `dataVersion` - Specific data version to fetch

**Legacy Parameters (automatically converted):**
- `e` → `companyId`
- `f` → `pageType`
- `t` → `token`
- `j` → `jobId`
- `cu` → `customerId`
- `in` → `invoiceId`
- `p` → `gatewayId` / `configId`

## 🎨 Theming

The application supports dynamic theming through CSS variables. Themes are fetched from the backend metadata and applied at runtime.

### Theme Variables

```css
--color-sf-primary
--color-sf-secondary
--color-sf-tertiary
--color-sf-grey
--color-sf-light-grey
--color-sf-on-light-grey
--color-sf-on-grey
--color-sf-on-white
--color-sf-error
```

## 🌍 Internationalization

Supported languages:
- English (en)
- French (fr)
- German (de)
- Italian (it)
- Dutch (nl)

The application automatically detects the browser's language and displays appropriate messages for loading and error states.

## 🔌 API Integration

### Endpoints

The application integrates with the following backend endpoints:

- **Metadata**: `GET /company/{companyId}/page/{pageType}/{mdVersion?}`
- **Data**: `GET /company/{companyId}/page/{pageType}/data`
- **Submit**: `POST/PUT/PATCH /company/{companyId}/page/{pageType}/data`
- **Files**: Various file upload/download endpoints

### API Configuration

API configuration is built dynamically based on route parameters and environment variables. See `src/lib/api-config.ts` for details.

## 🧪 Testing

The old codebase includes Playwright tests in the `old_codebase/pw-tests/` directory. These can be adapted for the Next.js implementation.

## 📊 Monitoring

The application supports Azure Application Insights for:
- Page view tracking
- Event logging
- Exception tracking
- Form submission analytics

Configure monitoring by setting `NEXT_PUBLIC_APP_INSIGHTS_KEY` and `NEXT_PUBLIC_ENABLE_MONITORING` environment variables.

## 🔒 Security

- Sensitive values (tokens, signatures) are hidden in logs
- CORS and security headers should be configured in production
- Authentication tokens are passed via query parameters (consider migrating to headers)

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel
```

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t online-access .
docker run -p 3000:3000 online-access
```

### Environment-Specific Builds

```bash
# Development
npm run build

# Production
NODE_ENV=production npm run build
```

## 🔄 Migration from Angular

Key differences from the original Angular implementation:

1. **Server Components**: Uses Next.js App Router with server/client component split
2. **Hooks over Services**: React hooks replace Angular services
3. **Built-in Routing**: Next.js file-based routing instead of Angular Router
4. **No RxJS**: Uses native Promises and async/await instead of Observables
5. **CSS over SCSS**: Modern CSS with variables instead of SCSS
6. **Environment Variables**: Next.js env vars instead of Angular environments

## 📝 MoveConnect SDK Integration

The application is designed to work with the `@moveconnect/sdk` package. The SDK provides:

- Dynamic component rendering
- Form handling and validation
- Theming services
- Utility functions

**Note**: The current implementation includes placeholder components for the SDK. To fully integrate:

1. Ensure `@moveconnect/sdk` is properly installed
2. Uncomment SDK component imports in `DynamicContainer.tsx` and `Toast.tsx`
3. Configure any SDK-specific settings

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check `NEXT_PUBLIC_FETCH_API_ROOT` environment variable
   - Verify CORS settings on backend
   - Check network connectivity

2. **Missing Metadata**
   - Verify company ID and page type are correct
   - Check backend metadata endpoint is accessible
   - Review query parameters

3. **Styling Issues**
   - Ensure global CSS is imported in layout
   - Check theme variables are loaded
   - Verify CSS module imports

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing code style
3. Run type checking and linting
4. Test your changes thoroughly
5. Submit a pull request

## 📄 License

[Your License Here]

## 👥 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Review the documentation

## 🔮 Future Enhancements

- [ ] Full SDK integration with real components
- [ ] Enhanced error boundary with retry logic
- [ ] Progressive Web App (PWA) support
- [ ] Improved caching strategies
- [ ] E2E testing with Playwright
- [ ] Storybook for component documentation
- [ ] Performance monitoring dashboard
- [ ] Accessibility improvements (WCAG 2.1 AA)

---

Built with ❤️ using Next.js 16.1.3 and React 19
