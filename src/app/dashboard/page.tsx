import { 
  Car, 
  Clock, 
  CreditCard, 
  Gauge, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Award, 
  Calendar, 
  ChevronRight,
  TrendingDown
} from "lucide-react";
import Link from "next/link";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as jobCardService from "@/services/job-card-service";
import { getStationEntitlements } from "@/lib/entitlement";
import { VehicleSearch } from "@/components/dashboard/vehicle-search";
import { OperationsBoard } from "@/components/dashboard/operations-board";
import { QuickActionBar } from "@/components/dashboard/quick-action-bar";

export default async function DashboardPage() {
  const session = await requireStationUser();
  const stationId = session.stationId || "";

  // Calculate start of day for today's revenue filtering
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // High-performance concurrent query execution (0 sequential waterfall stalls)
  const [
    entitlements,
    boardData,
    paidInvoicesSum,
    pendingInvoices,
    nearRewardRecords,
    allStationVehicles,
    topServicesGroup,
  ] = await Promise.all([
    getStationEntitlements(stationId),
    jobCardService.getOperationsBoardData(stationId),
    prisma.invoice.aggregate({
      _sum: { finalAmount: true },
      where: {
        jobCard: { stationId },
        paymentStatus: "PAID",
        updatedAt: { gte: startOfDay },
      },
    }),
    prisma.invoice.findMany({
      where: {
        jobCard: { stationId, isDeleted: false },
        paymentStatus: "PENDING",
      },
      select: {
        finalAmount: true,
        jobCard: { select: { vehicleId: true } },
      },
    }),
    prisma.vehicleOfferProgress.findMany({
      where: {
        offer: { stationId, isActive: true, isDeleted: false },
        rewardEarned: false,
      },
      include: {
        vehicle: true,
        offer: true,
      },
    }),
    // Lightweight subquery for dueForVisit without fetching thousands of full job cards
    prisma.vehicle.findMany({
      where: { stationId, isDeleted: false },
      select: {
        id: true,
        jobCards: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { status: true, createdAt: true },
        },
      },
    }),
    prisma.jobCardService.groupBy({
      where: { jobCard: { stationId } },
      by: ["serviceNameSnapshot"],
      _count: { serviceNameSnapshot: true },
      orderBy: { _count: { serviceNameSnapshot: "desc" } },
      take: 4,
    }),
  ]);

  const revenueToday = Number(paidInvoicesSum._sum.finalAmount || 0);
  const outstandingPayments = pendingInvoices.reduce((sum, inv) => sum + Number(inv.finalAmount), 0);
  const pendingVehiclesCount = new Set(pendingInvoices.map((inv) => inv.jobCard.vehicleId)).size;

  // Group metrics counts
  const waitingCount = boardData.RECEIVED.length;
  const inProgressCount = boardData.IN_PROGRESS.length;
  const serviceCompletedCount = boardData.SERVICE_COMPLETED.length;
  const pendingPaymentCount = boardData.PAYMENT_PENDING.length;

  const vehiclesNearReward = nearRewardRecords.filter(
    (rec) => rec.currentCount === rec.offer.targetCount - 1
  );
  const vehiclesNearRewardCount = vehiclesNearReward.length;

  // Calculate due for visit threshold based on station settings
  const dueForVisitThresholdDays = entitlements.stationMetadata?.dueForVisitThreshold ?? 30;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - dueForVisitThresholdDays);

  const dueForVisitVehicles = allStationVehicles.filter((v) => {
    // If there is any active job card in progress, they are not due for visit
    const hasActiveJob = v.jobCards.some(
      (job) => job.status !== "DELIVERED" && job.status !== "CANCELLED"
    );
    if (hasActiveJob) return false;

    // Find the most recent DELIVERED job card
    const deliveredJobs = v.jobCards.filter((job) => job.status === "DELIVERED");
    if (deliveredJobs.length === 0) return false;

    const lastDeliveredJob = deliveredJobs[0];
    return lastDeliveredJob.createdAt < thresholdDate;
  });

  const dueForVisitCount = dueForVisitVehicles.length;

  function serializeJobs(jobs: any[]) {
    return jobs.map((job) => ({
      id: job.id,
      status: job.status,
      expectedCompletionTime: job.expectedCompletionTime ? job.expectedCompletionTime.toISOString() : null,
      createdAt: job.createdAt.toISOString(),
      vehicle: {
        id: job.vehicle.id,
        vehicleNumber: job.vehicle.vehicleNumber,
        vehicleType: job.vehicle.vehicleType,
        brand: job.vehicle.brand,
        model: job.vehicle.model,
      },
      customer: {
        name: job.customer.name,
        mobile: job.customer.mobile,
      },
      services: job.services.map((s: any) => ({
        serviceNameSnapshot: s.serviceNameSnapshot,
        priceSnapshot: Number(s.priceSnapshot),
      })),
    }));
  }

  const serializedBoardData = {
    RECEIVED: serializeJobs(boardData.RECEIVED),
    IN_PROGRESS: serializeJobs(boardData.IN_PROGRESS),
    SERVICE_COMPLETED: serializeJobs(boardData.SERVICE_COMPLETED),
    PAYMENT_PENDING: serializeJobs(boardData.PAYMENT_PENDING),
    DELIVERED: serializeJobs(boardData.DELIVERED),
  };

  const primaryColor = entitlements.stationMetadata?.primaryColor || "#0f766e";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <QuickActionBar canManageStaff={session.role === "OWNER"} />

      {/* 1. Operations Overview (Metrics Strip) */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          ["Waiting", waitingCount, Clock, "text-blue-500", "bg-blue-50"],
          ["In Progress", inProgressCount, Gauge, "text-amber-500", "bg-amber-50"],
          ["Completed", serviceCompletedCount, Sparkles, "text-purple-500", "bg-purple-50"],
          ["Pay Pending", pendingPaymentCount, CreditCard, "text-rose-500", "bg-rose-50"],
        ].map(([label, value, IconComponent, textColor, bgColor]) => {
          const Icon = IconComponent as any;
          return (
            <div key={label as string} className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${bgColor} ${textColor}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label as string}</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1">{value as string}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 2. Vehicle Intake & Search Module */}
      <section className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Vehicle Intake & Search</h2>
          <p className="text-xs text-slate-400 mt-0.5">Search for a returning vehicle to open its passport, or register a new one to begin service.</p>
        </div>
        <VehicleSearch />
      </section>

      {/* 3. Today's Queue (OperationsBoard list-based view) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Today's Queue</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track and manage vehicle statuses inside detailing bays in real-time.</p>
        </div>
        <OperationsBoard initialBoardData={serializedBoardData} />
      </section>

      {/* 4. Financial, Loyalty & Engagement Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Outstanding Payments Widget */}
        <Link href="/dashboard/payments" className="bg-white border rounded-xl p-5 shadow-sm hover:border-rose-200 transition group flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-rose-50 text-rose-600 flex items-center justify-center rounded-lg shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Outstanding Invoices</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">₹{outstandingPayments}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{pendingVehiclesCount} {pendingVehiclesCount === 1 ? "vehicle" : "vehicles"} pending</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform pt-2 border-t border-slate-50">
            <span>Settle Payments</span>
            <ChevronRight size={14} />
          </div>
        </Link>

        {/* Revenue Today Widget */}
        <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Revenue Today</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">₹{revenueToday}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Collected since midnight</p>
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-400 italic pt-2 border-t border-slate-50">
            Live business cashflow
          </div>
        </div>

        {/* Vehicles Near Reward Widget */}
        <Link href="/dashboard/offers" className="bg-white border rounded-xl p-5 shadow-sm hover:border-amber-200 transition group flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded-lg shrink-0">
              <Award size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Near Loyalty Reward</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{vehiclesNearRewardCount}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">1 stamp away from reward</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform pt-2 border-t border-slate-50">
            <span>View Active Campaigns</span>
            <ChevronRight size={14} />
          </div>
        </Link>

        {/* Due For Visit Widget */}
        <Link href="/dashboard/vehicles" className="bg-white border rounded-xl p-5 shadow-sm hover:border-blue-200 transition group flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Due For Visit</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{dueForVisitCount}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">No visit in last {dueForVisitThresholdDays} days</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform pt-2 border-t border-slate-50">
            <span>Re-engage Customers</span>
            <ChevronRight size={14} />
          </div>
        </Link>
      </section>

      {/* 5. Business Analytics (Popular Services) */}
      <section className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sparkles size={18} style={{ color: primaryColor }} />
          <h3 className="text-sm font-bold text-slate-800">Popular Detailing Services</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topServicesGroup.length > 0 ? (
            topServicesGroup.map((srv, idx) => (
              <div key={idx} className="bg-slate-50/50 p-4 border rounded-lg flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block truncate">
                  {srv.serviceNameSnapshot}
                </span>
                <span className="text-xl font-extrabold text-slate-800 mt-2 block">
                  {srv._count.serviceNameSnapshot} <span className="text-xs font-semibold text-slate-400">washes</span>
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2 col-span-full">No services completed today yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
