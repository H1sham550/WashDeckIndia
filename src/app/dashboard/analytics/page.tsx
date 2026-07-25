import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/entitlement";
import { getStationEntitlements, getCachedSubscriptionPlans } from "@/lib/entitlement";
import { UpgradeLock } from "@/components/dashboard/upgrade-lock";
import { TrendingUp, Award, BarChart2, Sparkles, CreditCard, Car, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
  const session = await requireStationUser();
  const stationId = session.stationId || "";

  if (session.role !== "OWNER") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Store Owner Access Required</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
          Analytics and revenue intelligence dashboards are restricted to Store Owners. You are currently logged in as Staff ({session.name}).
        </p>
        <div>
          <Link href="/dashboard" className="btn btn-primary inline-flex">
            Back to Operations Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const [enabled, entitlements, allPlans] = await Promise.all([
    isFeatureEnabled(stationId, "analytics"),
    getStationEntitlements(stationId),
    getCachedSubscriptionPlans(),
  ]);

  if (!enabled) {
    const upgradePlans = allPlans
      .filter(p => p.planFeatures.some((pf: any) => pf.featureKey === "ADVANCED_ANALYTICS" && pf.enabled))
      .map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.description,
        staffLimit: p.staffLimit,
        reportLimit: p.reportLimit,
        features: p.planFeatures.map((pf: any) => pf.featureKey),
      }));

    return (
      <UpgradeLock
        featureName="Business Analytics"
        currentPlanName={entitlements.currentPlanName}
        availablePlans={upgradePlans}
        stationId={stationId}
      />
    );
  }

  const [paidInvoices, jobCards] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        stationId,
        status: "PAID",
        jobCard: {
          isDeleted: false,
        },
      },
      include: {
        jobCard: {
          include: {
            services: true,
          },
        },
        payments: true,
      },
    }),
    prisma.jobCard.findMany({
      where: {
        stationId,
        status: "DELIVERED",
        isDeleted: false,
      },
      select: {
        vehicle: {
          select: { vehicleType: true },
        },
      },
    }),
  ]);

  const vehiclesCount: Record<string, number> = {};
  jobCards.forEach((j) => {
    const type = j.vehicle.vehicleType || "SEDAN";
    vehiclesCount[type] = (vehiclesCount[type] || 0) + 1;
  });

  const topVehicles = Object.entries(vehiclesCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  let totalRevenue = 0;
  const serviceStats: Record<string, { count: number; revenue: number }> = {};
  const paymentMethods: Record<string, number> = {};

  paidInvoices.forEach((inv) => {
    const amt = Number(inv.finalAmount);
    totalRevenue += amt;

    const method = inv.payments[0]?.method || "CASH";
    paymentMethods[method] = (paymentMethods[method] || 0) + amt;

    inv.jobCard.services.forEach((s) => {
      const srvAmt = Number(s.priceSnapshot);
      if (!serviceStats[s.serviceNameSnapshot]) {
        serviceStats[s.serviceNameSnapshot] = { count: 0, revenue: 0 };
      }
      serviceStats[s.serviceNameSnapshot].count += 1;
      serviceStats[s.serviceNameSnapshot].revenue += srvAmt;
    });
  });

  const totalPaidCount = paidInvoices.length;
  const averageTicket = totalPaidCount > 0 ? Math.round(totalRevenue / totalPaidCount) : 0;

  const topServices = Object.entries(serviceStats)
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Business Analytics</h1>
        <p className="text-sm text-slate-500">
          Track revenue collections, average ticket values, service popularity, and vehicle type distribution.
        </p>
      </div>

      <section className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Revenue (Paid)</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Average Ticket Size</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">₹{averageTicket.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
            <BarChart2 size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Delivered Orders</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalPaidCount}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              Most Popular Services
            </h3>
            <div className="space-y-3">
              {topServices.length > 0 ? (
                topServices.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{s.name}</span>
                      <span>{s.count} washes • ₹{s.revenue.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min((s.count / (totalPaidCount || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-4">No services recorded yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <CreditCard size={16} className="text-blue-500" />
              Revenue by Payment Method
            </h3>
            <div className="space-y-3.5">
              {Object.entries(paymentMethods).map(([method, amount]) => {
                const percentage = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
                return (
                  <div key={method} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">{method}</span>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-medium text-slate-400">{percentage}%</span>
                      <span className="font-extrabold text-slate-800 w-20 text-right">₹{amount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
            <Car size={16} className="text-emerald-500" />
            Vehicle Type Distribution
          </h3>
          <div className="space-y-3">
            {topVehicles.length > 0 ? (
              topVehicles.map((v, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{v.type}</span>
                    <span>{v.count} vehicles ({Math.round((v.count / (jobCards.length || 1)) * 100)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min((v.count / (jobCards.length || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-4">No delivered vehicles recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
