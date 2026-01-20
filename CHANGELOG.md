# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-20

### Added

#### Core Infrastructure
- Next.js 16.1.3 application setup with App Router
- TypeScript 5.7 with strict type checking
- ESLint and Prettier configuration
- Environment variable management for multiple environments

#### Routing
- Dynamic RMS routes: `/rms/[companyId]/[pageType]` and `/rms/[companyId]/[pageType]/[mdVersion]`
- Legacy route support: `/form` with automatic parameter conversion
- Home page with welcome message
- 404 Not Found page
- Global error boundary

#### Components
- `LoadingState` - Animated loading indicator with localization
- `ErrorState` - Localized error display
- `DynamicContainer` - Integration wrapper for MoveConnect SDK
- `Toast` - Notification system placeholder
- `Favicon` - Dynamic favicon updater

#### Data Management
- `useRMSData` hook for metadata and data fetching
- `BackendAPIService` class for API calls
- `ApiConfigBuilder` for dynamic API configuration
- Sequential data loading (metadata → data)
- Error handling with retry capabilities

#### Utilities
- Browser language detection
- Sensitive data hiding for logs
- Popup blocker detection
- Device information gathering
- Query string building
- Deep cloning utilities

#### Styling
- Global CSS with modern CSS variables
- Utility classes for flexbox, spacing, colors
- Loading animations (spinner and bars)
- Responsive design breakpoints
- Print styles

#### Internationalization
- Support for 5 languages: English, French, German, Italian, Dutch
- Localized loading messages
- Localized error messages
- Browser language auto-detection

#### Monitoring
- `useMonitoring` hook for analytics
- Application Insights integration
- Page view tracking
- Event logging
- Exception tracking
- Form submission logging with data sanitization

#### Type Safety
- Comprehensive TypeScript definitions
- `ApiConfig` interface
- `MetadataResponse` and `DataResponse` types
- `ActionData` for form submissions
- `ErrorResponse` for error handling

#### Documentation
- Comprehensive README with setup instructions
- Architecture documentation
- Contributing guidelines
- Changelog

### Changed
- Migrated from Angular 18 to Next.js 16.1.3
- Replaced RxJS Observables with Promises and async/await
- Converted Angular services to React hooks and classes
- Changed SCSS to modern CSS with variables
- Updated routing from Angular Router to Next.js App Router

### Removed
- Angular framework dependencies
- Zone.js
- RxJS (replaced with native Promises)
- SCSS compilation (using CSS)
- Karma/Jasmine testing setup (to be replaced)

### Security
- Automatic token hiding in logs (4 character display)
- Signature redaction in logs (15 character display)
- Environment variable separation (public vs private)

### Performance
- Server components by default (reduced JavaScript bundle)
- Code splitting via dynamic imports
- Image optimization with Next.js Image component
- Static asset caching via CDN

## [Unreleased]

### Planned
- Full MoveConnect SDK component integration
- Comprehensive test suite (unit, integration, E2E)
- Storybook for component documentation
- Progressive Web App (PWA) capabilities
- Enhanced caching strategies
- Performance monitoring dashboard
- Accessibility audit and improvements
- CI/CD pipeline setup
- Docker deployment configuration

---

[1.0.0]: https://github.com/your-org/online-access/releases/tag/v1.0.0
