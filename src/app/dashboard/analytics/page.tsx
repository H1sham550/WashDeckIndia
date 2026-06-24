import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TrendingUp, BarChart2, Award, CreditCard, Sparkles, Car } from "lucide-react";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { UpgradeLock } from "@/components/dashboard/upgrade-lock";

export default async function AnalyticsPage() {
  const session = await requireRole(["OWNER"]);

  if (!session.stationId) {
    redirect("/login");
  }

  const enabled = await isFeatureEnabled(session.stationId, "analytics");
  if (!enabled) {
    const allPlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
      include: { planFeatures: true },
    });

    const upgradePlans = allPlans
      .filter(p => p.planFeatures.some(pf => pf.featureKey === "ANALYTICS" && pf.enabled))
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
        featureName="Business Analytics & Advanced Insights"
        currentPlanName={currentPlanName}
        availablePlans={upgradePlans}
        stationId={session.stationId}
      />
    );
  }

  // 1. Fetch paid invoices for station
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      jobCard: {
        stationId: session.stationId,
        isDeleted: false,
      },
      paymentStatus: "PAID",
    },
    include: {
      jobCard: {
        include: {
          services: true,
        },
      },
    },
  });

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount), 0);
  const totalPaidCount = paidInvoices.length;
  const averageTicket = totalPaidCount > 0 ? Math.round(totalRevenue / totalPaidCount) : 0;

  // 2. Payment Method distribution
  const paymentMethods: Record<string, number> = {
    CASH: 0,
    UPI: 0,
    CARD: 0,
    BANK: 0,
  };
  paidInvoices.forEach((inv) => {
    if (inv.paymentMethod) {
      paymentMethods[inv.paymentMethod] = (paymentMethods[inv.paymentMethod] || 0) + Number(inv.finalAmount);
    }
  });

  // 3. Top Services
  const servicesCount: Record<string, { count: number; revenue: number }> = {};
  paidInvoices.forEach((inv) => {
    inv.jobCard.services.forEach((s) => {
      if (!servicesCount[s.serviceNameSnapshot]) {
        servicesCount[s.serviceNameSnapshot] = { count: 0, revenue: 0 };
      }
      servicesCount[s.serviceNameSnapshot].count += 1;
      servicesCount[s.serviceNameSnapshot].revenue += Number(s.priceSnapshot);
    });
  });

  const topServices = Object.entries(servicesCount)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Top Vehicles by wash volume
  const vehiclesCount: Record<string, number> = {};
  const jobCards = await prisma.jobCard.findMany({
    where: {
      stationId: session.stationId,
      status: "DELIVERED",
      isDeleted: false,
    },
    include: {
      vehicle: true,
    },
  });

  jobCards.forEach((j) => {
    const type = j.vehicle.vehicleType;
    vehiclesCount[type] = (vehiclesCount[type] || 0) + 1;
  });

  const topVehicles = Object.entries(vehiclesCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Business Analytics</h1>
        <p className="text-sm text-slate-500">
          Track revenue collections, average ticket values, service popularity, and vehicle type distribution.
        </p>
      </div>

      {/* Financial overview strip */}
      <section className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Revenue (Paid)</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">₹{totalRevenue}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Average Ticket Size</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">₹{averageTicket}</p>
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
        {/* Left Side: Services & Payment split */}
        <div className="space-y-6">
          {/* Top Services */}
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
                      <span>{s.count} washes • ₹{s.revenue}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary-color)] rounded-full"
                        style={{ width: `${Math.min((s.count / totalPaidCount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-4">No services recorded yet.</p>
              )}
            </div>
          </div>

          {/* Payment Methods split */}
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
                      <span className="font-extrabold text-slate-800 w-20 text-right">₹{amount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Vehicle volume split */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Car size={16} className="text-teal-600" />
              Volume by Vehicle Type
            </h3>
            <div className="space-y-3">
              {topVehicles.length > 0 ? (
                topVehicles.map((v, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="capitalize">{v.type.toLowerCase()}</span>
                      <span>{v.count} jobs</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 rounded-full"
                        style={{ width: `${Math.min((v.count / totalPaidCount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-4">No vehicle wash volume logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
