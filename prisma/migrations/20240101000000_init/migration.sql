-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branding" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "textColor" TEXT,
    "backgroundColor" TEXT,
    "logoUrl" TEXT,
    "logoLightUrl" TEXT,
    "logoDarkUrl" TEXT,
    "faviconUrl" TEXT,
    "fontFamily" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageMobileUrl" TEXT,
    "videoUrl" TEXT,
    "layout" TEXT NOT NULL DEFAULT 'centered',
    "overlayOpacity" DOUBLE PRECISION DEFAULT 0.3,
    "heading" TEXT,
    "subheading" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "ctaSecondaryText" TEXT,
    "ctaSecondaryUrl" TEXT,
    "showCta" BOOLEAN NOT NULL DEFAULT true,
    "height" TEXT DEFAULT 'large',
    "alignment" TEXT DEFAULT 'center',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "aboutUs" TEXT,
    "services" TEXT,
    "whyChooseUs" TEXT,
    "testimonials" TEXT,
    "contactInfo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "supportHours" TEXT,
    "footerText" TEXT,
    "privacyPolicy" TEXT,
    "termsOfService" TEXT,
    "socialLinks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "companies_domain_key" ON "companies"("domain");

-- CreateIndex
CREATE INDEX "companies_slug_idx" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_domain_idx" ON "companies"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "branding_companyId_key" ON "branding"("companyId");

-- CreateIndex
CREATE INDEX "branding_companyId_idx" ON "branding"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "hero_companyId_key" ON "hero"("companyId");

-- CreateIndex
CREATE INDEX "hero_companyId_idx" ON "hero"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "copy_companyId_key" ON "copy"("companyId");

-- CreateIndex
CREATE INDEX "copy_companyId_idx" ON "copy"("companyId");

-- AddForeignKey
ALTER TABLE "branding" ADD CONSTRAINT "branding_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero" ADD CONSTRAINT "hero_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy" ADD CONSTRAINT "copy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
