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
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* 1. 5-Second Operational Strip (Item 2) */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Today's Revenue Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-lg shadow-emerald-900/10 flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-black uppercase tracking-wider">Today's Revenue</span>
            <TrendingUp size={18} />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">₹{revenueToday}</span>
            <p className="text-[10px] opacity-80 mt-0.5 font-medium">Cash & Digital Collections</p>
          </div>
        </div>

        {/* Vehicles Waiting */}
        <Link href="/dashboard/queue?tab=RECEIVED" className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waiting</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{waitingCount}</span>
            <span className="text-[10px] text-blue-600 font-bold group-hover:underline flex items-center">Open <ChevronRight size={12} /></span>
          </div>
        </Link>

        {/* Vehicles In Progress */}
        <Link href="/dashboard/queue?tab=IN_PROGRESS" className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gauge size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{inProgressCount}</span>
            <span className="text-[10px] text-amber-600 font-bold group-hover:underline flex items-center">Bays <ChevronRight size={12} /></span>
          </div>
        </Link>

        {/* Completed Today */}
        <Link href="/dashboard/queue?tab=SERVICE_COMPLETED" className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{serviceCompletedCount}</span>
            <span className="text-[10px] text-purple-600 font-bold group-hover:underline flex items-center">Ready <ChevronRight size={12} /></span>
          </div>
        </Link>

        {/* Pending Payments */}
        <Link href="/dashboard/queue?tab=PAYMENT_PENDING" className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pay Pending</span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{pendingPaymentCount}</span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">₹{outstandingPayments} due</span>
          </div>
        </Link>
      </section>

      {/* 2. Quick Action Command Bar */}
      <QuickActionBar canManageStaff={session.role === "OWNER"} />

      {/* 3. Instant Vehicle Intake & Search */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Car size={18} className="text-[var(--primary-color)]" />
              <span>Instant Vehicle Intake & Passport Search</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter Registration Number, Mobile, or Customer Name to open passport or start job.</p>
          </div>
          <Link 
            href="/dashboard/jobs/new" 
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary-color)] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
          >
            <span>+ New Intake Wizard</span>
          </Link>
        </div>
        <VehicleSearch />
      </section>

      {/* 4. Today's Active Queue Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Today's Queue Preview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live bay tracking, vehicle inspections, and before/after reporting.</p>
          </div>
          <Link 
            href="/dashboard/queue" 
            className="text-xs font-extrabold text-[var(--primary-color)] bg-[var(--primary-color)]/10 hover:bg-[var(--primary-color)]/15 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>Open Kanban Queue</span>
            <ChevronRight size={14} />
          </Link>
        </div>
        <OperationsBoard initialBoardData={serializedBoardData} />
      </section>
    </div>
  );
}
