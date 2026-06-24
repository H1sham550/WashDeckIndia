import { requireRole } from "@/lib/auth";
import * as recoveryService from "@/services/recovery-service";
import { RecoveryDashboard } from "@/components/dashboard/recovery-dashboard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { UpgradeLock } from "@/components/dashboard/upgrade-lock";

export default async function RecoveryPage() {
  const session = await requireRole(["OWNER"]);

  if (!session.stationId) {
    redirect("/login");
  }

  const enabled = await isFeatureEnabled(session.stationId, "recovery");
  if (!enabled) {
    const allPlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
      include: { planFeatures: true },
    });

    const upgradePlans = allPlans
      .filter(p => p.planFeatures.some(pf => pf.featureKey === "REVENUE_RECOVERY" && pf.enabled))
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
        featureName="Revenue Recovery & Customer Re-engagement"
        currentPlanName={currentPlanName}
        availablePlans={upgradePlans}
        stationId={session.stationId}
      />
    );
  }

  // Fetch the current station name
  const station = await prisma.station.findUnique({
    where: { id: session.stationId },
    select: { name: true },
  });

  const stationName = station?.name || "our station";

  const data = await recoveryService.getRecoveryDashboardData(session.stationId);

  // Serialize date timestamps to ISO strings for hydration safety
  const serializedDue = data.dueForVisit.map((item) => ({
    ...item,
    lastVisitDate: item.lastVisitDate.toISOString(),
  }));

  const serializedLost = data.lostVehicles.map((item) => ({
    ...item,
    lastVisitDate: item.lastVisitDate.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Revenue Recovery Control</h1>
        <p className="text-sm text-slate-500">
          Proactively identify at-risk customers who are due for their next visit or are categorized as lost.
        </p>
      </div>
      <RecoveryDashboard
        dueForVisit={serializedDue}
        lostVehicles={serializedLost}
        stationName={stationName}
      />
    </div>
  );
}
