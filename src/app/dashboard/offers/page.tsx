import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OffersPanel } from "@/components/dashboard/offers-panel";
import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { UpgradeLock } from "@/components/dashboard/upgrade-lock";

export default async function OffersPage() {
  const session = await requireStationUser();

  const enabled = await isFeatureEnabled(session.stationId, "offers");
  if (!enabled) {
    const allPlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
      include: { planFeatures: true },
    });

    const upgradePlans = allPlans
      .filter(p => p.planFeatures.some(pf => pf.featureKey === "LOYALTY_PROGRAMS" && pf.enabled))
      .map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.description,
        staffLimit: p.staffLimit,
        reportLimit: p.reportLimit,
        features: p.planFeatures.map(pf => pf.featureKey),
      }));

    const station = await prisma.station.findUnique({
      where: { id: session.stationId },
      include: {
        stationSubscriptions: {
          where: { status: { in: ["ACTIVE", "GRACE", "TRIAL"] } },
          include: { subscription: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });
    const currentPlanName = station?.stationSubscriptions[0]?.subscription.name || "Trial Plan";

    return (
      <UpgradeLock
        featureName="Loyalty Programs & Campaigns"
        currentPlanName={currentPlanName}
        availablePlans={upgradePlans}
        stationId={session.stationId}
      />
    );
  }

  const offers = await prisma.offer.findMany({
    where: {
      stationId: session.stationId,
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });

  const services = await prisma.service.findMany({
    where: {
      stationId: session.stationId,
      isDeleted: false,
    },
    orderBy: { name: "asc" },
  });

  // Serialize date timestamps to ISO strings for hydration safety
  const serializedOffers = offers.map((offer) => ({
    id: offer.id,
    name: offer.name,
    description: offer.description,
    type: offer.type,
    targetCount: offer.targetCount,
    rewardDescription: offer.rewardDescription,
    isActive: offer.isActive,
    rulesJson: offer.rulesJson,
    createdAt: offer.createdAt.toISOString(),
  }));

  const serializedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-sans">Loyalty Offers & Campaigns</h1>
        <p className="text-sm text-slate-500 font-medium">
          Reward your repeat customers with digital stamps that increment automatically upon payment confirmation.
        </p>
      </div>
      <OffersPanel initialOffers={serializedOffers} services={serializedServices} />
    </div>
  );
}
