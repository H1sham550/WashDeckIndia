import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Elevating all stations to Enterprise Pro Subscriptions...");

  // 1. Get or Create Enterprise Plan
  let enterprisePlan = await prisma.subscriptionPlan.findFirst({
    where: { name: "Enterprise" },
  });

  if (!enterprisePlan) {
    enterprisePlan = await prisma.subscriptionPlan.create({
      data: {
        name: "Enterprise",
        description: "Full feature enterprise subscription",
        price: 3999.00,
        durationDays: 365,
        trialDays: 30,
        staffLimit: 50,
        reportLimit: 5000,
        isRecommended: true,
        isActive: true,
      },
    });
  }

  // 2. Enable ALL Plan Features for Enterprise Plan
  const featureKeys = [
    "STAFF_MANAGEMENT",
    "LOYALTY_PROGRAMS",
    "ANALYTICS",
    "REVENUE_RECOVERY",
    "SERVICE_REPORTS",
    "CUSTOM_BRANDING",
    "FINANCE",
    "OFFERS",
    "RECOVERY",
    "STAFF",
    "BRANDING"
  ];

  for (const key of featureKeys) {
    await prisma.planFeature.upsert({
      where: {
        planId_featureKey: {
          planId: enterprisePlan.id,
          featureKey: key,
        },
      },
      update: { enabled: true },
      create: {
        planId: enterprisePlan.id,
        featureKey: key,
        enabled: true,
      },
    });
  }

  // Also enable for Professional plan if it exists
  const proPlan = await prisma.subscriptionPlan.findFirst({ where: { name: "Professional" } });
  if (proPlan) {
    for (const key of featureKeys) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureKey: {
            planId: proPlan.id,
            featureKey: key,
          },
        },
        update: { enabled: true },
        create: {
          planId: proPlan.id,
          featureKey: key,
          enabled: true,
        },
      });
    }
  }

  // 3. Elevate All Stations in Database
  const stations = await prisma.station.findMany();
  console.log(`Found ${stations.length} stations in database.`);

  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 2);

  for (const st of stations) {
    // Update station status to ACTIVE
    await prisma.station.update({
      where: { id: st.id },
      data: {
        status: "ACTIVE",
        isDeleted: false,
      },
    });

    // Delete any expired subscriptions and create a fresh Enterprise subscription
    await prisma.stationSubscription.deleteMany({
      where: { stationId: st.id },
    });

    await prisma.stationSubscription.create({
      data: {
        stationId: st.id,
        subscriptionId: enterprisePlan.id,
        startDate: now,
        endDate: nextYear,
        status: "ACTIVE",
      },
    });

    console.log(`✅ Station "${st.name}" (${st.id}) elevated to Enterprise Plan until ${nextYear.toISOString().split("T")[0]}`);
  }

  console.log("🎉 All stations successfully elevated to Enterprise Pro Plan!");
}

main()
  .catch((err) => {
    console.error("Error elevating stations:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
