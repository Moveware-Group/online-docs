# Moveware Online Documentation Platform

A Next.js-based platform for managing company documentation, quotes, and performance reviews.

## Features

- Company settings management with branding customization
- Logo upload with Azure Blob Storage integration
- Quote generation and acceptance
- Performance review system
- AI-powered chatbot assistant
- Multi-company support with authorization

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or SQLite for development)
- Azure Blob Storage account (for logo uploads)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

### Development

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

The application uses PM2 for process management. Configuration is in `ecosystem.config.js`.

## Testing

The project includes comprehensive test coverage:

- **Authentication Tests**: Verify 401 responses for unauthenticated requests
- **Authorization Tests**: Verify 403 responses for unauthorized access
- **Validation Tests**: Test input validation and error messages
- **File Upload Security**: Test file size limits, MIME types, and SVG rejection
- **Concurrent Updates**: Test race conditions and conflict detection

Run tests with:

```bash
npm test
```

## API Documentation

### Company Settings

- `GET /api/companies/[id]/settings` - Get company branding settings (admin only)
- `PUT /api/companies/[id]/settings` - Update company colors (admin only)

### Logo Management

- `GET /api/companies/[id]/logo` - Get company logo URL
- `POST /api/companies/[id]/logo` - Upload company logo (admin only, max 2MB, PNG/JPEG/WebP only)
- `DELETE /api/companies/[id]/logo` - Delete company logo (admin only)

### Security Features

- Role-based access control (admin/staff)
- Company-level data isolation
- File upload validation (size, MIME type, content sniffing)
- SVG rejection for XSS prevention
- Input validation with clear error messages

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL or SQLite connection string
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Blob Storage connection
- `AZURE_STORAGE_CONTAINER_NAME` - Container for logo uploads
- `MOVEWARE_API_URL` - External API endpoint
- `MOVEWARE_USERNAME` / `MOVEWARE_PASSWORD` - API credentials

## Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── companies/     # Company management APIs
│   │   ├── quotes/        # Quote management APIs
│   │   └── jobs/          # Job management APIs
├── lib/                   # Shared libraries and utilities
│   ├── components/        # React components
│   ├── services/          # Business logic services
│   ├── middleware/        # Authentication middleware
│   └── types/             # TypeScript type definitions
├── __tests__/             # Test files
│   ├── api/              # API endpoint tests
│   └── helpers/          # Test utilities
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## License

Private - Moveware Group
