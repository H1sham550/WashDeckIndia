import { requireRole } from "@/lib/auth";
import * as recoveryService from "@/services/recovery-service";
import { RecoveryDashboard } from "@/components/dashboard/recovery-dashboard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { ShieldAlert } from "lucide-react";

export default async function RecoveryPage() {
  const session = await requireRole(["OWNER"]);

  if (!session.stationId) {
    redirect("/login");
  }

  const enabled = await isFeatureEnabled(session.stationId, "recovery");
  if (!enabled) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4 font-sans">
        <div className="h-14 w-14 bg-amber-50 text-amber-600 flex items-center justify-center rounded-full mx-auto">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Feature Locked</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Revenue Recovery is not enabled under your current subscription plan. Upgrade your plan in settings to unlock re-engagement campaigns.
        </p>
      </div>
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
