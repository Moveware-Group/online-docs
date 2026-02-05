# Database Setup Guide

This document explains how to set up and manage the database for the Moveware application.

## Prerequisites

- PostgreSQL 14+ installed locally or access to a PostgreSQL instance
- Node.js and npm installed

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database Connection

Copy `.env.example` to `.env` and update the `DATABASE_URL`:

```bash
cp .env.example .env
```

For local PostgreSQL:
```
DATABASE_URL="postgresql://username:password@localhost:5432/moveware_db?schema=public"
```

For SQLite (development only):
```
DATABASE_URL="file:./dev.db"
```

**Note:** If using SQLite, update `prisma/schema.prisma` to change the provider from `postgresql` to `sqlite`.

### 3. Run Migrations

Apply the database schema:

```bash
npm run db:migrate
```

This will:
- Create the database if it doesn't exist
- Apply all pending migrations
- Generate the Prisma Client

### 4. Generate Prisma Client

If you need to regenerate the Prisma Client:

```bash
npm run db:generate
```

## Database Schema

The schema includes four main tables:

### Companies Table
- Stores client/company information
- Fields: id, name, slug, domain, active, timestamps
- Primary entity for branding customization

### Branding Table
- One-to-one relationship with Company
- Stores color scheme (primary, secondary, accent, text, background)
- Logo URLs (standard, light, dark versions)
- Favicon URL
- Font family preference

### Hero Table
- One-to-one relationship with Company
- Hero image/video URLs (desktop and mobile)
- Layout configuration (centered, split, full-width, minimal)
- Content (heading, subheading)
- CTA buttons (primary and secondary)
- Display options (height, alignment, overlay opacity)

### Copy Table
- One-to-one relationship with Company
- Company information (tagline, description, meta tags)
- Page content (about, services, testimonials)
- Contact information (email, phone, address, hours)
- Footer content (footer text, privacy policy, terms)
- Social media links (JSON format)

## Development Workflow

### Creating New Migrations

When you modify the Prisma schema:

```bash
npm run db:migrate
```

Prisma will prompt you to name the migration.

### Pushing Schema Changes (Development)

For quick prototyping without creating migrations:

```bash
npm run db:push
```

**Warning:** This bypasses migration history and should only be used in development.

### Viewing Database

Launch Prisma Studio to view and edit data:

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555`.

### Resetting Database

To reset the database and reapply all migrations:

```bash
prisma migrate reset
```

**Warning:** This will delete all data!

## Production Deployment

### Running Migrations in Production

```bash
prisma migrate deploy
```

This applies pending migrations without prompting.

### Environment Variables

Ensure your production environment has:
- `DATABASE_URL` set to your production database
- `NODE_ENV=production`

## Troubleshooting

### Migration Conflicts

If migrations are out of sync:

```bash
prisma migrate resolve --rolled-back "migration_name"
```

### Prisma Client Out of Sync

If you see "Prisma Client is out of sync" errors:

```bash
npm run db:generate
```

### Connection Issues

Verify your DATABASE_URL format and database connectivity:

```bash
prisma db pull
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
