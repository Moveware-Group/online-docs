# PostgreSQL Setup Guide for Multi-Tenant Application

## For Your Linux Server (moveware-ai-runner-01)

### Step 1: Check if PostgreSQL is Installed

```bash
# Check PostgreSQL version
psql --version

# Check if PostgreSQL service is running
sudo systemctl status postgresql
```

### Step 2: Install PostgreSQL (if not installed)

**For Ubuntu/Debian:**
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**For CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib -y
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 3: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt, run these commands:
```

```sql
-- Create a database for the application
CREATE DATABASE moveware_online_docs;

-- Create a user with a strong password
CREATE USER moveware_user WITH PASSWORD 'your_strong_password_here';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE moveware_online_docs TO moveware_user;

-- Grant schema privileges (PostgreSQL 15+)
\c moveware_online_docs
GRANT ALL ON SCHEMA public TO moveware_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO moveware_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO moveware_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO moveware_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO moveware_user;

-- Exit PostgreSQL
\q
```

### Step 4: Configure PostgreSQL Authentication

Edit the PostgreSQL configuration to allow password authentication:

```bash
# Find your pg_hba.conf file
sudo find /etc/postgresql -name pg_hba.conf

# Edit the file (example path - yours may differ)
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Find the line that looks like:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
```

Change `peer` to `md5` for local connections:
```
local   all             all                                     md5
```

Also ensure there's a line for IPv4 connections:
```
host    all             all             127.0.0.1/32            md5
```

Save and restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Step 5: Test the Connection

```bash
# Test connection with the new user
psql -U moveware_user -d moveware_online_docs -h localhost

# If prompted for password, enter the password you created
# If successful, you'll see: moveware_online_docs=>

# Exit with:
\q
```

### Step 6: Update Your .env File

On your server at `/srv/ai/repos/online-docs/.env`:

```bash
# Create or edit .env file
nano /srv/ai/repos/online-docs/.env
```

Add this content:
```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://moveware_user:your_strong_password_here@localhost:5432/moveware_online_docs?schema=public"

# Moveware API Configuration (if you have these)
MOVEWARE_API_URL=https://api.moveware.example.com
MOVEWARE_API_VERSION=v1
MOVEWARE_COMPANY_ID=your_company_id_here
MOVEWARE_USERNAME=your_username_here
MOVEWARE_PASSWORD=your_password_here

# Application Configuration
NEXT_PUBLIC_APP_NAME=Moveware Online Docs
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000

# Environment
NODE_ENV=production
```

### Step 7: Run Prisma Migrations

```bash
cd /srv/ai/repos/online-docs

# Generate Prisma Client
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

## Security Recommendations for Production

### 1. Use a Strong Password
Generate a secure password:
```bash
openssl rand -base64 32
```

### 2. Configure Firewall
```bash
# Only allow local connections to PostgreSQL
sudo ufw allow from 127.0.0.1 to any port 5432
```

### 3. Regular Backups
```bash
# Create a backup script
sudo nano /usr/local/bin/backup-moveware-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U moveware_user -h localhost moveware_online_docs | gzip > $BACKUP_DIR/moveware_backup_$DATE.sql.gz
# Keep only last 7 days of backups
find $BACKUP_DIR -name "moveware_backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-moveware-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-moveware-db.sh
```

## Multi-Tenant Architecture Notes

### Option 1: Schema-per-Tenant (Recommended for your use case)
Each tenant gets their own schema within the same database:
```sql
-- Create schema for a tenant
CREATE SCHEMA tenant_company_slug;
GRANT ALL ON SCHEMA tenant_company_slug TO moveware_user;
```

Update DATABASE_URL per request:
```
postgresql://moveware_user:password@localhost:5432/moveware_online_docs?schema=tenant_company_slug
```

### Option 2: Database-per-Tenant
Each tenant gets their own database (more isolation, more overhead):
```sql
CREATE DATABASE tenant_company_name;
GRANT ALL PRIVILEGES ON DATABASE tenant_company_name TO moveware_user;
```

### Option 3: Shared Schema with Tenant ID
All tenants share tables with a `tenantId` column (your current setup).
- Simpler to manage
- Use Row Level Security (RLS) for data isolation
- Requires careful query filtering

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if listening on the right port
sudo netstat -plnt | grep 5432
```

### Permission Denied
```bash
# Reconnect as postgres user and grant privileges again
sudo -u postgres psql
\c moveware_online_docs
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO moveware_user;
```

### Prisma Migration Fails
```bash
# Reset and rerun
npx prisma migrate reset
npm run db:migrate
```

## Quick Commands Reference

```bash
# Access PostgreSQL as postgres user
sudo -u postgres psql

# Access specific database
psql -U moveware_user -d moveware_online_docs -h localhost

# List all databases
\l

# List all tables
\dt

# Describe a table
\d table_name

# Exit
\q
```
