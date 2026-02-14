/**
 * Database Seeding Script
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Seed a default company
  const company = await prisma.company.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "Moveware Demo Company",
      tenantId: "default-tenant",
      brandCode: "default-brand",
      apiKey: "demo-api-key-" + Math.random().toString(36).substring(7),
      isActive: true,
    },
  });

  console.log("✅ Created/updated company:", company.name);

  // Seed default branding settings
  const branding = await prisma.brandingSettings.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      logoUrl: null,
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      fontFamily: "Inter",
    },
  });

  console.log("✅ Created/updated branding settings");

  // Seed default hero settings
  const hero = await prisma.heroSettings.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      title: "Welcome to Moveware",
      subtitle: "Professional moving services made simple",
      backgroundColor: "#2563eb",
      textColor: "#ffffff",
      showLogo: true,
      alignment: "center",
    },
  });

  console.log("✅ Created/updated hero settings");

  // Seed default copy settings
  const copy = await prisma.copySettings.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      welcomeMessage: "Welcome to Moveware",
      introText: "Your trusted partner for professional moving services",
      footerText: "© 2024 Moveware. All rights reserved.",
      submitButtonText: "Submit",
    },
  });

  console.log("✅ Created/updated copy settings");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
