/**
 * Database Seeding Script
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Seed a default company
  const company = await prisma.company.upsert({
    where: { apiKey: "demo-api-key-crown" },
    update: {
      name: "Crown Worldwide",
      tenantId: "tenant-crown",
      brandCode: "CROWN",
    },
    create: {
      name: "Crown Worldwide",
      tenantId: "tenant-crown",
      brandCode: "CROWN",
      apiKey: "demo-api-key-crown",
      isActive: true,
      primaryColor: "#c00000",
      secondaryColor: "#ffffff",
      tertiaryColor: "#5a5a5a",
      logoUrl: "/images/crown_logo.svg",
    },
  });

  console.log("✅ Created/updated company:", company.name);

  // 2. Seed branding settings
  const branding = await prisma.brandingSettings.upsert({
    where: { companyId: company.id },
    update: {
      logoUrl: "/images/crown_logo.svg",
      primaryColor: "#c00000",
      secondaryColor: "#ffffff",
      fontFamily: "Inter",
    },
    create: {
      companyId: company.id,
      logoUrl: "/images/crown_logo.svg",
      primaryColor: "#c00000",
      secondaryColor: "#ffffff",
      fontFamily: "Inter",
    },
  });

  console.log("✅ Created/updated branding settings");

  // 3. Seed hero settings
  const hero = await prisma.heroSettings.upsert({
    where: { companyId: company.id },
    update: {
      title: "Professional Moving Services",
      subtitle: "Moving you forward with care and expertise",
      backgroundColor: "#c00000",
      textColor: "#ffffff",
    },
    create: {
      companyId: company.id,
      title: "Professional Moving Services",
      subtitle: "Moving you forward with care and expertise",
      backgroundColor: "#c00000",
      textColor: "#ffffff",
      showLogo: true,
      alignment: "center",
    },
  });

  console.log("✅ Created/updated hero settings");

  // 4. Seed copy settings
  const copy = await prisma.copySettings.upsert({
    where: { companyId: company.id },
    update: {
      welcomeMessage: "Welcome to Crown Worldwide",
      introText: "Your trusted partner for professional moving services worldwide",
      footerText: "© 2026 Crown Worldwide. All rights reserved.",
    },
    create: {
      companyId: company.id,
      welcomeMessage: "Welcome to Crown Worldwide",
      introText: "Your trusted partner for professional moving services worldwide",
      footerText: "© 2026 Crown Worldwide. All rights reserved.",
      submitButtonText: "Get Your Quote",
    },
  });

  console.log("✅ Created/updated copy settings");

  // 5. Seed a sample quote
  const quote = await prisma.quote.upsert({
    where: { quoteNumber: "Q-2026-001" },
    update: {},
    create: {
      quoteNumber: "Q-2026-001",
      companyId: company.id,
      customerName: "John Doe",
      customerEmail: "john.doe@example.com",
      customerPhone: "+1-555-0123",
      status: "pending",
      totalAmount: 2500.00,
      validUntil: new Date("2026-03-15"),
      data: JSON.stringify({
        items: [
          { description: "3-bedroom house move", quantity: 1, price: 2000 },
          { description: "Packing materials", quantity: 1, price: 300 },
          { description: "Insurance", quantity: 1, price: 200 },
        ],
        origin: "123 Main St, Melbourne VIC 3000",
        destination: "456 Oak Ave, Sydney NSW 2000",
        moveDate: "2026-03-01",
      }),
    },
  });

  console.log("✅ Created/updated sample quote");

  // 6. Seed a sample review submission
  const review = await prisma.reviewSubmission.upsert({
    where: { id: "review-sample-001" },
    update: {},
    create: {
      id: "review-sample-001",
      quoteId: quote.id,
      token: "token-" + Math.random().toString(36).substring(7),
      companyId: company.id,
      answers: JSON.stringify({
        rating: 5,
        feedback: "Excellent service! Very professional and careful with our belongings.",
        wouldRecommend: true,
      }),
      submittedAt: new Date(),
    },
  });

  console.log("✅ Created/updated sample review");

  console.log("\n📊 Seed Summary:");
  console.log("- Companies: 1 (Crown Worldwide)");
  console.log("- Branding Settings: 1");
  console.log("- Hero Settings: 1");
  console.log("- Copy Settings: 1");
  console.log("- Quotes: 1");
  console.log("- Reviews: 1");
  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
