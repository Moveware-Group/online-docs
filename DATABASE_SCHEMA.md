# Database Schema Documentation

This document describes the PostgreSQL database schema for the Moveware application.

## Tables

### companies
Stores company/client information.

```sql
CREATE TABLE companies (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  api_key VARCHAR UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `api_key`

### jobs
Stores job information synced from Moveware.

```sql
CREATE TABLE jobs (
  id VARCHAR PRIMARY KEY,
  moveware_job_id VARCHAR UNIQUE NOT NULL,
  company_id VARCHAR NOT NULL,
  customer_id VARCHAR,
  customer_name VARCHAR,
  status VARCHAR NOT NULL,
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  origin_address VARCHAR,
  destination_address VARCHAR,
  data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `moveware_job_id`
- Index on `company_id`

### quotes
Stores quote information and acceptance data.

```sql
CREATE TABLE quotes (
  id VARCHAR PRIMARY KEY,
  quote_number VARCHAR UNIQUE NOT NULL,
  job_id VARCHAR,
  company_id VARCHAR NOT NULL,
  customer_name VARCHAR NOT NULL,
  customer_email VARCHAR,
  customer_phone VARCHAR,
  status VARCHAR DEFAULT 'pending',
  total_amount FLOAT NOT NULL,
  valid_until TIMESTAMP,
  terms_accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMP,
  accepted_by VARCHAR,
  signature_data TEXT,
  data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `quote_number`
- Index on `company_id`
- Index on `job_id`

### costings
Stores costing items/templates for quotes.

```sql
CREATE TABLE costings (
  id VARCHAR PRIMARY KEY,
  company_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description VARCHAR,
  category VARCHAR NOT NULL,
  unit_price FLOAT NOT NULL,
  unit VARCHAR DEFAULT 'unit',
  is_active BOOLEAN DEFAULT true,
  data TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Index on `company_id`
- Index on `category`

### activities
Stores activity records for jobs.

```sql
CREATE TABLE activities (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  company_id VARCHAR NOT NULL,
  moveware_id VARCHAR,
  activity_type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR NOT NULL,
  assigned_to VARCHAR,
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  notes TEXT,
  data TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Index on `job_id`
- Index on `company_id`

### inventory
Stores inventory items for jobs.

```sql
CREATE TABLE inventory (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  company_id VARCHAR NOT NULL,
  moveware_id VARCHAR,
  item_name VARCHAR NOT NULL,
  category VARCHAR,
  quantity INT DEFAULT 1,
  volume FLOAT,
  weight FLOAT,
  fragile BOOLEAN DEFAULT false,
  notes TEXT,
  room VARCHAR,
  data TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Index on `job_id`
- Index on `company_id`

### hero_settings
Stores hero section configuration per company.

```sql
CREATE TABLE hero_settings (
  id VARCHAR PRIMARY KEY,
  company_id VARCHAR UNIQUE NOT NULL,
  title VARCHAR NOT NULL,
  subtitle VARCHAR,
  background_image VARCHAR,
  background_color VARCHAR DEFAULT '#2563eb',
  text_color VARCHAR DEFAULT '#ffffff',
  show_logo BOOLEAN DEFAULT true,
  alignment VARCHAR DEFAULT 'left',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `company_id`

### branding_settings
Stores branding configuration per company.

```sql
CREATE TABLE branding_settings (
  id VARCHAR PRIMARY KEY,
  company_id VARCHAR UNIQUE NOT NULL,
  logo_url VARCHAR,
  primary_color VARCHAR DEFAULT '#2563eb',
  secondary_color VARCHAR DEFAULT '#1e40af',
  font_family VARCHAR DEFAULT 'Inter',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `company_id`

### copy_settings
Stores copy/text content configuration per company.

```sql
CREATE TABLE copy_settings (
  id VARCHAR PRIMARY KEY,
  company_id VARCHAR UNIQUE NOT NULL,
  welcome_message VARCHAR NOT NULL,
  intro_text TEXT NOT NULL,
  footer_text VARCHAR,
  submit_button_text VARCHAR DEFAULT 'Submit',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `company_id`

### review_submissions
Stores customer performance review submissions.

```sql
CREATE TABLE review_submissions (
  id VARCHAR PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  token VARCHAR NOT NULL,
  brand VARCHAR,
  company_id VARCHAR,
  answers TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Index on `job_id`
- Index on `company_id`

**Fields:**
- `id`: Unique identifier
- `job_id`: Moveware job ID
- `token`: Authentication token from review URL
- `brand`: Brand identifier (e.g., 'nzvll')
- `company_id`: Company identifier
- `answers`: JSON string containing question IDs and answers
- `submitted_at`: Timestamp when review was submitted
- `created_at`: Record creation timestamp

## Relationships

### Company → Settings (One-to-One)
- Each company has one set of hero_settings
- Each company has one set of branding_settings
- Each company has one set of copy_settings

### Company → Jobs (One-to-Many)
- Each company can have multiple jobs
- Jobs reference company via `company_id`

### Company → Quotes (One-to-Many)
- Each company can have multiple quotes
- Quotes reference company via `company_id`

### Company → Costings (One-to-Many)
- Each company can have multiple costing items
- Costings reference company via `company_id`

### Job → Activities (One-to-Many)
- Each job can have multiple activities
- Activities reference job via `job_id`

### Job → Inventory (One-to-Many)
- Each job can have multiple inventory items
- Inventory references job via `job_id`

### Job → Review Submissions (One-to-Many)
- Each job can have multiple review submissions
- Review submissions reference job via `job_id`

## Data Types

- **VARCHAR**: Variable-length strings (default PostgreSQL)
- **TEXT**: Long-form text content
- **FLOAT**: Decimal numbers
- **INT**: Integers
- **BOOLEAN**: True/false values
- **TIMESTAMP**: Date and time values

## Conventions

1. **Primary Keys**: All tables use `id` as the primary key with CUID format
2. **Timestamps**: All tables include `created_at` and `updated_at` (except review_submissions uses `submitted_at`)
3. **JSON Storage**: Complex data is stored in `data` or `answers` fields as TEXT (JSON stringified)
4. **Foreign Keys**: Referenced by `*_id` columns (e.g., `company_id`, `job_id`)
5. **Soft Deletes**: Not implemented; use `is_active` flag where needed

## Migration Notes

When running migrations:

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Or create and run migration
npm run db:migrate
```

## Seeding

Sample data can be seeded using:

```bash
npm run db:seed
```

See `prisma/seed.ts` for seed data configuration.