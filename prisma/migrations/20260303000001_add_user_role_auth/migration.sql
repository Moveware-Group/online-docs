-- Migration: add_user_role_auth
--
-- 1. Create roles table
-- 2. Create users table
-- 3. Create user_companies junction table
-- 4. Create user_sessions table
-- 5. Seed default system roles (admin, client)

-- 1. roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id"          TEXT         NOT NULL,
    "name"        VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "permissions" TEXT         NOT NULL DEFAULT '[]',
    "is_system"   BOOLEAN      NOT NULL DEFAULT false,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key"  ON "roles"("name");
CREATE        INDEX IF NOT EXISTS "roles_name_idx"  ON "roles"("name");

-- 2. users
CREATE TABLE IF NOT EXISTS "users" (
    "id"            TEXT         NOT NULL,
    "username"      VARCHAR(100) NOT NULL,
    "email"         VARCHAR(255),
    "name"          VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(500) NOT NULL,
    "role_id"       TEXT         NOT NULL,
    "is_active"     BOOLEAN      NOT NULL DEFAULT true,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key"    ON "users"("email") WHERE "email" IS NOT NULL;
CREATE        INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");
CREATE        INDEX IF NOT EXISTS "users_email_idx"    ON "users"("email");
CREATE        INDEX IF NOT EXISTS "users_role_id_idx"  ON "users"("role_id");

-- 3. user_companies
CREATE TABLE IF NOT EXISTS "user_companies" (
    "user_id"    TEXT         NOT NULL,
    "company_id" TEXT         NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_companies_pkey" PRIMARY KEY ("user_id", "company_id")
);

CREATE INDEX IF NOT EXISTS "user_companies_user_id_idx"    ON "user_companies"("user_id");
CREATE INDEX IF NOT EXISTS "user_companies_company_id_idx" ON "user_companies"("company_id");

-- 4. user_sessions
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id"         TEXT         NOT NULL,
    "user_id"    TEXT         NOT NULL,
    "token"      VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_token_key"      ON "user_sessions"("token");
CREATE        INDEX IF NOT EXISTS "user_sessions_token_idx"      ON "user_sessions"("token");
CREATE        INDEX IF NOT EXISTS "user_sessions_user_id_idx"    ON "user_sessions"("user_id");

-- Foreign keys (guarded so re-runs are safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_role_id_fkey'
    ) THEN
        ALTER TABLE "users"
            ADD CONSTRAINT "users_role_id_fkey"
            FOREIGN KEY ("role_id") REFERENCES "roles"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_companies_user_id_fkey'
    ) THEN
        ALTER TABLE "user_companies"
            ADD CONSTRAINT "user_companies_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_companies_company_id_fkey'
    ) THEN
        ALTER TABLE "user_companies"
            ADD CONSTRAINT "user_companies_company_id_fkey"
            FOREIGN KEY ("company_id") REFERENCES "companies"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_sessions_user_id_fkey'
    ) THEN
        ALTER TABLE "user_sessions"
            ADD CONSTRAINT "user_sessions_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Seed default system roles
INSERT INTO "roles" ("id", "name", "description", "permissions", "is_system", "created_at", "updated_at")
VALUES
  (
    'role_admin',
    'Admin',
    'Full access to all settings, companies, users, and roles',
    '["all"]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'role_client',
    'Client',
    'Access limited to assigned companies only',
    '[]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("name") DO NOTHING;
