import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run prisma seed");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@veloce.io" },
    update: {},
    create: {
      email: "admin@veloce.io",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin:", admin.email);

  // Create reviewer user
  const reviewerPassword = await bcrypt.hash("reviewer123", 12);
  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@veloce.io" },
    update: {},
    create: {
      email: "reviewer@veloce.io",
      name: "Jane Reviewer",
      password: reviewerPassword,
      role: "REVIEWER",
    },
  });
  console.log("✅ Reviewer:", reviewer.email);

  // Seed sample briefs
  const sampleBriefs = [
    {
      title: "SaaS Analytics Dashboard for Retail Chain",
      description: "We need a real-time analytics platform for our 50-store retail chain. The system should aggregate sales data from our POS systems (Square), display inventory levels, track customer purchase patterns, and generate daily/weekly/monthly reports. We need role-based access for store managers vs headquarters. Mobile-friendly is essential. Integration with our existing Shopify stores and ability to export to Excel/CSV.",
      budgetRange: "50k-100k",
      urgency: "1-3-months",
      contactName: "Marcus Chen",
      contactEmail: "m.chen@retailgroup.com",
      stage: "UNDER_REVIEW" as const,
    },
    {
      title: "AI-Powered Customer Support Chatbot",
      description: "Looking to build an AI chatbot for our e-commerce site that can handle tier-1 customer support. It should answer questions about orders, returns, shipping, and product details by pulling from our Shopify store data and FAQ knowledge base. Should escalate to human agents via Intercom when it can't help. Need conversation history, analytics on common issues, and ability to train it on our specific products.",
      budgetRange: "15k-50k",
      urgency: "asap",
      contactName: "Sarah Mitchell",
      contactEmail: "sarah@shopbrand.co",
      stage: "NEW" as const,
    },
    {
      title: "Mobile Fitness Tracking App",
      description: "We want to build a cross-platform mobile app for personal trainers and their clients. Trainers can create custom workout programs, track client progress with charts, and send push notifications for scheduled workouts. Clients can log workouts, track personal records, and connect wearables like Apple Watch and Fitbit. Subscription model: $15/month per trainer, unlimited clients.",
      budgetRange: "50k-100k",
      urgency: "3-6-months",
      contactName: "Alex Torres",
      contactEmail: "alex@fitnesshq.io",
      stage: "PROPOSAL_SENT" as const,
    },
    {
      title: "Automated Invoice Processing Pipeline",
      description: "Our accounts payable team manually processes 500+ invoices per month. We need an automation system that: extracts data from PDFs/images using OCR, validates against our ERP (NetSuite), routes for approval based on amount thresholds, and posts approved invoices automatically. Must integrate with Gmail for email-based invoice receipt. Audit trail required for SOX compliance.",
      budgetRange: "15k-50k",
      urgency: "1-3-months",
      contactName: "Diana Park",
      contactEmail: "d.park@enterprise.com",
      stage: "WON" as const,
    },
    {
      title: "Real Estate Listing Portal",
      description: "Need a property listing website for our brokerage. Features: searchable listings with filters (price, beds, baths, location radius), photo galleries, virtual tour embeds, mortgage calculator, lead capture forms, agent profiles, and blog/news section. Admin panel to manage listings. Should sync with MLS data via RESO API. SEO optimized. Spanish language support.",
      budgetRange: "5k-15k",
      urgency: "flexible",
      contactName: "Robert Kim",
      contactEmail: "rob@premierhomes.com",
      stage: "NEW" as const,
    },
  ];

  for (const briefData of sampleBriefs) {
    const { stage, ...data } = briefData;
    const existing = await prisma.brief.findFirst({ where: { title: briefData.title } });
    if (existing) continue;

    const brief = await prisma.brief.create({
      data: { ...data, stage },
    });

    // Create realistic AI analysis
    const analysisMap: Record<string, {
      features: string[];
      category: "WEB_APP" | "MOBILE" | "AI_ML" | "AUTOMATION" | "INTEGRATION";
      minHours: number;
      maxHours: number;
      complexity: number;
      stack: string[];
    }> = {
      "SaaS Analytics Dashboard for Retail Chain": {
        features: ["POS data aggregation", "Real-time inventory tracking", "Role-based access control", "Shopify integration", "Square POS integration", "Mobile-responsive UI", "Excel/CSV export", "Automated reporting (daily/weekly/monthly)", "Customer purchase pattern analysis"],
        category: "WEB_APP", minHours: 320, maxHours: 480, complexity: 4,
        stack: ["Next.js", "PostgreSQL", "Prisma", "Recharts", "Shopify API", "Square API", "NextAuth"],
      },
      "AI-Powered Customer Support Chatbot": {
        features: ["AI conversation engine", "Shopify order lookup", "FAQ knowledge base", "Intercom escalation", "Conversation history", "Analytics dashboard", "Product training pipeline"],
        category: "AI_ML", minHours: 160, maxHours: 240, complexity: 3,
        stack: ["Next.js", "OpenAI API", "Langchain", "Pinecone", "Shopify API", "Intercom API"],
      },
      "Mobile Fitness Tracking App": {
        features: ["Custom workout program builder", "Progress tracking with charts", "Push notifications", "Apple Watch integration", "Fitbit integration", "Personal record tracking", "Trainer-client relationship system", "Subscription billing"],
        category: "MOBILE", minHours: 480, maxHours: 720, complexity: 5,
        stack: ["React Native", "Expo", "Node.js", "PostgreSQL", "Stripe", "HealthKit API", "Fitbit API", "OneSignal"],
      },
      "Automated Invoice Processing Pipeline": {
        features: ["PDF/image OCR extraction", "NetSuite ERP integration", "Approval routing workflows", "Gmail integration", "Threshold-based approvals", "Audit trail logging", "SOX compliance reporting"],
        category: "AUTOMATION", minHours: 200, maxHours: 320, complexity: 4,
        stack: ["Python", "Google Cloud Vision", "NetSuite API", "Gmail API", "PostgreSQL", "Celery", "Redis"],
      },
      "Real Estate Listing Portal": {
        features: ["Property search with filters", "Photo galleries", "Virtual tour embed", "Mortgage calculator", "Lead capture forms", "Agent profiles", "MLS/RESO API sync", "Blog/news section", "Spanish localization", "SEO optimization"],
        category: "WEB_APP", minHours: 120, maxHours: 200, complexity: 3,
        stack: ["Next.js", "PostgreSQL", "Prisma", "RESO API", "Cloudinary", "Algolia", "i18next"],
      },
    };

    const aData = analysisMap[briefData.title];
    if (aData) {
      await prisma.aiAnalysis.create({
        data: {
          briefId: brief.id,
          features: aData.features,
          category: aData.category,
          minHours: aData.minHours,
          maxHours: aData.maxHours,
          stack: aData.stack,
          complexity: aData.complexity,
          status: "ok",
        },
      });
    }

    // Add stage events for non-new briefs
    if (stage !== "NEW") {
      await prisma.stageEvent.create({
        data: { briefId: brief.id, fromStage: "NEW", toStage: "UNDER_REVIEW", actorId: admin.id },
      });
    }
    if (stage === "PROPOSAL_SENT" || stage === "WON") {
      await prisma.stageEvent.create({
        data: { briefId: brief.id, fromStage: "UNDER_REVIEW", toStage: "PROPOSAL_SENT", actorId: admin.id },
      });
    }
    if (stage === "WON") {
      await prisma.stageEvent.create({
        data: { briefId: brief.id, fromStage: "PROPOSAL_SENT", toStage: "WON", actorId: admin.id },
      });
    }

    console.log("✅ Brief:", brief.title);
  }

  console.log("\n🎉 Seed complete!");
  console.log("Admin:    admin@veloce.io / admin123");
  console.log("Reviewer: reviewer@veloce.io / reviewer123");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
