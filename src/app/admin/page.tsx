import { Shield } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LogoutButton } from "@/components/layout/logout-button";

export default async function AdminPage() {
  // 1. Enforce SUPER_ADMIN validation
  const session = await requireRole(["SUPER_ADMIN"]);

  // 2. Fetch all stations with subscriptions, feature overrides, and owner details
  const stations = await prisma.station.findMany({
    where: { isDeleted: false },
    include: {
      featureOverrides: true,
      users: {
        where: { role: "OWNER", isDeleted: false },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        take: 1,
      },
      stationSubscriptions: {
        orderBy: { endDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch all subscription plan products
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { planFeatures: true },
  });

  // 4. Fetch the global audit logs
  const auditLogs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      station: {
        select: { name: true },
      },
      actor: {
        select: { name: true, role: true },
      },
    },
  });

  // 5. Calculate platform-wide metrics
  const totalStations = stations.length;
  const activeStations = stations.filter((s) => s.status === "ACTIVE").length;
  const trialStations = stations.filter((s) => s.status === "TRIAL").length;
  const suspendedStations = stations.filter((s) => s.status === "SUSPENDED").length;

  // Sum of all paid invoices finalAmount across all stations
  const invoicesAgg = await prisma.invoice.aggregate({
    where: {
      paymentStatus: "PAID",
      jobCard: { isDeleted: false },
    },
    _sum: {
      finalAmount: true,
    },
  });
  const totalRevenue = Number(invoicesAgg._sum.finalAmount || 0);

  const totalJobsCount = await prisma.jobCard.count({
    where: { isDeleted: false },
  });

  const totalVehiclesCount = await prisma.vehicle.count({
    where: { isDeleted: false },
  });

  // 6. Serialize everything for client hydration safety
  const serializedStations = stations.map((station) => ({
    id: station.id,
    name: station.name,
    slug: station.slug,
    logoUrl: station.logoUrl,
    status: station.status,
    createdAt: station.createdAt.toISOString(),
    phone: station.phone,
    email: station.email,
    address: station.address,
    upiId: station.upiId,
    gstNumber: station.gstNumber,
    users: station.users,
    featureFlags: station.featureOverrides.map((fo) => ({
      featureKey: fo.featureKey,
      isEnabled: fo.isEnabled,
    })),
    stationSubscriptions: station.stationSubscriptions.map((sub) => ({
      id: sub.id,
      subscriptionId: sub.subscriptionId,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      graceUntil: sub.graceUntil ? sub.graceUntil.toISOString() : null,
      status: sub.status,
    })),
  }));

  const serializedPlans = plans.map((plan) => {
    const featuresObj: Record<string, boolean> = {};
    plan.planFeatures.forEach((pf) => {
      featuresObj[pf.featureKey] = pf.enabled;
      featuresObj[pf.featureKey.toLowerCase()] = pf.enabled;
    });

    return {
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      durationDays: plan.durationDays,
      maxStaff: plan.staffLimit,
      maxReports: plan.reportLimit,
      description: plan.description,
      trialDays: plan.trialDays,
      features: featuresObj,
      isRecommended: plan.isRecommended,
      isActive: plan.isActive,
      createdAt: plan.createdAt.toISOString(),
    };
  });

  const serializedAuditLogs = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    createdAt: log.createdAt.toISOString(),
    metadataJson: log.metadataJson,
    station: log.station,
    actor: log.actor,
  }));

  return (
    <main className="min-h-screen bg-slate-50/50">
      <header className="border-b bg-white shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 tracking-wide uppercase">WashDeck platform</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-tight">SUPER ADMINISTRATOR PORTAL</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Logged in as {session.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Banner Card */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-slate-800/35 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl font-extrabold tracking-wide">Platform Tenancy & Licensing Control</h2>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              Create and manage tenant stations, configure pricing plans, track system audit trails, and manage operational limits across the WashDeck SaaS ecosystem.
            </p>
          </div>
        </section>

        {/* Global Admin panel Tabs and Lists */}
        <AdminPanel
          initialStations={serializedStations}
          initialPlans={serializedPlans}
          initialAuditLogs={serializedAuditLogs}
          metrics={{
            totalStations,
            activeStations,
            trialStations,
            suspendedStations,
            totalRevenue,
            totalJobsCount,
            totalVehiclesCount,
          }}
        />
      </div>
    </main>
  );
}
