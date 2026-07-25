import { requireStationUser } from "@/lib/auth";
import * as recoveryService from "@/services/recovery-service";
import { RecoveryDashboard } from "@/components/dashboard/recovery-dashboard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { UpgradeLock } from "@/components/dashboard/upgrade-lock";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function RecoveryPage() {
  const session = await requireStationUser();

  if (session.role !== "OWNER") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Store Owner Access Required</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
          Revenue recovery and automated churn reduction campaigns are restricted to Store Owners. You are currently logged in as Staff ({session.name}).
        </p>
        <div>
          <Link href="/dashboard" className="btn btn-primary inline-flex">
            Back to Operations Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
