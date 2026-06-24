import { PrismaClient, StationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting safe production seeding...");

  // Seeding Subscription Plans
  console.log("Seeding Subscription Plans...");
  const plans = [
    {
      name: "Trial",
      description: "14-day free trial to test WashDeck's core features",
      price: 0,
      durationDays: 14,
      trialDays: 14,
      staffLimit: 3,
      reportLimit: 30,
      isRecommended: false,
      isActive: true,
      features: ["LOYALTY_PROGRAMS", "SERVICE_REPORTS", "WHATSAPP_SHARING", "PHOTO_DOCUMENTATION"]
    },
    {
      name: "Starter",
      description: "Perfect for small single-owner car washes",
      price: 999,
      durationDays: 30,
      trialDays: 0,
      staffLimit: 1,
      reportLimit: 50,
      isRecommended: false,
      isActive: true,
      features: ["SERVICE_REPORTS", "WHATSAPP_SHARING"]
    },
    {
      name: "Growth",
      description: "For growing car washes with multiple staff members",
      price: 2999,
      durationDays: 30,
      trialDays: 0,
      staffLimit: 5,
      reportLimit: 200,
      isRecommended: true,
      isActive: true,
      features: ["SERVICE_REPORTS", "WHATSAPP_SHARING", "LOYALTY_PROGRAMS", "PHOTO_DOCUMENTATION", "STAFF_MANAGEMENT", "CUSTOM_BRANDING"]
    },
    {
      name: "Professional",
      description: "For high-volume washes requiring advanced analytics and tools",
      price: 5999,
      durationDays: 30,
      trialDays: 0,
      staffLimit: 20,
      reportLimit: 1000,
      isRecommended: false,
      isActive: true,
      features: ["SERVICE_REPORTS", "WHATSAPP_SHARING", "LOYALTY_PROGRAMS", "PHOTO_DOCUMENTATION", "STAFF_MANAGEMENT", "CUSTOM_BRANDING", "ANALYTICS", "REVENUE_RECOVERY"]
    },
    {
      name: "Enterprise",
      description: "Unlimited capacity and premium custom integrations",
      price: 14999,
      durationDays: 30,
      trialDays: 0,
      staffLimit: 9999,
      reportLimit: 99999,
      isRecommended: false,
      isActive: true,
      features: ["SERVICE_REPORTS", "WHATSAPP_SHARING", "LOYALTY_PROGRAMS", "PHOTO_DOCUMENTATION", "STAFF_MANAGEMENT", "CUSTOM_BRANDING", "ANALYTICS", "REVENUE_RECOVERY", "MULTI_BRANCH", "API_ACCESS"]
    }
  ];

  const dbPlans = {};
  for (const p of plans) {
    // Upsert the subscription plan to avoid duplicates if run multiple times
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: p.name }
    });

    let plan;
    if (existingPlan) {
      console.log(`Plan ${p.name} already exists. Updating...`);
      plan = await prisma.subscriptionPlan.update({
        where: { id: existingPlan.id },
        data: {
          description: p.description,
          price: p.price,
          durationDays: p.durationDays,
          trialDays: p.trialDays,
          staffLimit: p.staffLimit,
          reportLimit: p.reportLimit,
          isRecommended: p.isRecommended,
          isActive: p.isActive,
        }
      });
    } else {
      console.log(`Creating Plan ${p.name}...`);
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          durationDays: p.durationDays,
          trialDays: p.trialDays,
          staffLimit: p.staffLimit,
          reportLimit: p.reportLimit,
          isRecommended: p.isRecommended,
          isActive: p.isActive,
        }
      });
    }
    dbPlans[p.name.toUpperCase()] = plan;

    // Seed plan features
    for (const fKey of p.features) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureKey: {
            planId: plan.id,
            featureKey: fKey
          }
        },
        update: { enabled: true },
        create: {
          planId: plan.id,
          featureKey: fKey,
          enabled: true
        }
      });
    }
  }

  // Ensure all existing stations have an active subscription
  console.log("Checking existing stations...");
  const stations = await prisma.station.findMany();
  const trialPlan = dbPlans["TRIAL"];

  if (stations.length === 0) {
    console.log("No existing stations found to process.");
  } else {
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    for (const station of stations) {
      const activeSubscription = await prisma.stationSubscription.findFirst({
        where: {
          stationId: station.id,
          status: "TRIAL"
        }
      });

      if (!activeSubscription) {
        console.log(`Station ${station.name} (${station.slug}) has no active subscription. Creating Trial subscription...`);
        await prisma.stationSubscription.create({
          data: {
            stationId: station.id,
            subscriptionId: trialPlan.id,
            startDate: now,
            endDate: trialEndDate,
            status: "TRIAL",
          }
        });

        // Ensure station status is TRIAL
        if (station.status !== StationStatus.TRIAL) {
          await prisma.station.update({
            where: { id: station.id },
            data: { status: StationStatus.TRIAL }
          });
        }
      } else {
        console.log(`Station ${station.name} already has a subscription.`);
      }
    }
  }

  console.log("Safe production seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during safe production seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
