import {
  Clock,
  CreditCard,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Users,
  Plus,
  Car,
  ArrowRight,
  Calendar,
  Search,
} from "lucide-react";
import Link from "next/link";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as jobCardService from "@/services/job-card-service";
import { getStationEntitlements } from "@/lib/entitlement";
import { VehicleSearch } from "@/components/dashboard/vehicle-search";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireStationUser();
  const stationId = session.stationId || "";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    entitlements,
    boardData,
    paidInvoicesSum,
    pendingInvoices,
    todayBookings,
    recentJobs,
  ] = await Promise.all([
    getStationEntitlements(stationId),
    jobCardService.getOperationsBoardData(stationId),
    prisma.invoice.aggregate({
      _sum: { finalAmount: true },
      where: {
        jobCard: { stationId },
        status: "PAID",
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.invoice.findMany({
      where: {
        jobCard: { stationId, isDeleted: false },
        status: "ISSUED",
      },
      select: { finalAmount: true },
    }),
    prisma.booking.findMany({
      where: {
        stationId,
        scheduledAt: { gte: startOfDay },
        status: { not: "CANCELLED" },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      select: {
        id: true,
        customerName: true,
        vehicleNumber: true,
        scheduledAt: true,
        serviceName: true,
        status: true,
      },
    }),
    prisma.jobCard.findMany({
      where: { stationId, isDeleted: false, status: "DELIVERED" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        updatedAt: true,
        vehicle: { select: { vehicleNumber: true } },
        customer: { select: { name: true } },
        services: { select: { serviceNameSnapshot: true, priceSnapshot: true } },
        invoice: { select: { finalAmount: true, status: true } },
      },
    }),
  ]);

  const revenueToday = Number(paidInvoicesSum._sum?.finalAmount || 0);
  const outstandingAmount = pendingInvoices.reduce(
    (sum, inv) => sum + Number(inv.finalAmount),
    0
  );

  const waitingCount = boardData.RECEIVED.length;
  const inProgressCount = boardData.IN_PROGRESS.length;
  const completedCount = boardData.SERVICE_COMPLETED.length;
  const paymentPendingCount = boardData.PAYMENT_PENDING.length;
  const totalActive = waitingCount + inProgressCount + completedCount + paymentPendingCount;

  const currency = entitlements.stationMetadata?.currency === "USD" ? "$" : "₹";

  function formatTime(iso: Date) {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatCurrency(n: number) {
    return `${currency}${n.toLocaleString("en-IN")}`;
  }

  const STATUS_BADGE: Record<string, string> = {
    RECEIVED: "badge badge-info",
    IN_PROGRESS: "badge badge-warning",
    SERVICE_COMPLETED: "badge badge-blue",
    PAYMENT_PENDING: "badge badge-danger",
    DELIVERED: "badge badge-success",
  };

  const STATUS_LABEL: Record<string, string> = {
    RECEIVED: "Waiting",
    IN_PROGRESS: "In Progress",
    SERVICE_COMPLETED: "Ready",
    PAYMENT_PENDING: "Pay Pending",
    DELIVERED: "Delivered",
  };

  // Flatten active jobs sorted by time
  const activeJobs = [
    ...boardData.RECEIVED,
    ...boardData.IN_PROGRESS,
    ...boardData.SERVICE_COMPLETED,
    ...boardData.PAYMENT_PENDING,
  ].slice(0, 10);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="wd-page-title">Operations Dashboard</h1>
          <p className="wd-body mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link href="/dashboard/jobs/new" className="btn btn-primary">
          <Plus size={15} strokeWidth={2} />
          New Job
        </Link>
      </div>

      {/* ── KPI Strip ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Revenue Today */}
        <div className="wd-card p-4 col-span-2 md:col-span-1">
          <div className="flex items-start justify-between">
            <span className="wd-label">Revenue Today</span>
            <TrendingUp size={14} strokeWidth={1.75} style={{ color: "hsl(var(--success))" }} />
          </div>
          <p className="text-xl font-600 mt-2 tracking-tight" style={{ fontWeight: 600 }}>
            {formatCurrency(revenueToday)}
          </p>
        </div>

        {/* Waiting */}
        <Link href="/dashboard/queue?tab=RECEIVED" className="wd-card p-4 hover:border-blue-300 transition-colors block">
          <div className="flex items-start justify-between">
            <span className="wd-label">Waiting</span>
            <Clock size={14} strokeWidth={1.75} style={{ color: "hsl(var(--info))" }} />
          </div>
          <p className="text-xl mt-2 tracking-tight" style={{ fontWeight: 600 }}>{waitingCount}</p>
        </Link>

        {/* In Progress */}
        <Link href="/dashboard/queue?tab=IN_PROGRESS" className="wd-card p-4 hover:border-amber-300 transition-colors block">
          <div className="flex items-start justify-between">
            <span className="wd-label">In Progress</span>
            <span className="status-dot status-dot-progress mt-0.5" />
          </div>
          <p className="text-xl mt-2 tracking-tight" style={{ fontWeight: 600 }}>{inProgressCount}</p>
        </Link>

        {/* Ready */}
        <Link href="/dashboard/queue?tab=SERVICE_COMPLETED" className="wd-card p-4 hover:border-violet-300 transition-colors block">
          <div className="flex items-start justify-between">
            <span className="wd-label">Ready</span>
            <CheckCircle size={14} strokeWidth={1.75} style={{ color: "#8B5CF6" }} />
          </div>
          <p className="text-xl mt-2 tracking-tight" style={{ fontWeight: 600 }}>{completedCount}</p>
        </Link>

        {/* Pay Pending */}
        <Link href="/dashboard/queue?tab=PAYMENT_PENDING" className="wd-card p-4 hover:border-red-300 transition-colors block">
          <div className="flex items-start justify-between">
            <span className="wd-label">Pay Pending</span>
            <CreditCard size={14} strokeWidth={1.75} style={{ color: "hsl(var(--danger))" }} />
          </div>
          <p className="text-xl mt-2 tracking-tight" style={{ fontWeight: 600 }}>{paymentPendingCount}</p>
          {outstandingAmount > 0 && (
            <p className="text-xs mt-1" style={{ color: "hsl(var(--danger))" }}>
              {formatCurrency(outstandingAmount)} due
            </p>
          )}
        </Link>

        {/* Today's Bookings */}
        <Link href="/dashboard/bookings" className="wd-card p-4 hover:border-blue-300 transition-colors block">
          <div className="flex items-start justify-between">
            <span className="wd-label">Bookings</span>
            <Calendar size={14} strokeWidth={1.75} style={{ color: "hsl(var(--brand-blue))" }} />
          </div>
          <p className="text-xl mt-2 tracking-tight" style={{ fontWeight: 600 }}>{todayBookings.length}</p>
        </Link>
      </div>

      {/* ── Main Content Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Active Queue */}
        <div className="lg:col-span-2 space-y-3">
          {/* Vehicle Search */}
          <div className="wd-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="wd-section-title">Quick Search</h2>
              <Link href="/dashboard/vehicles" className="btn btn-ghost btn-sm gap-1.5">
                <span>All Customers</span>
                <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-3">
              <VehicleSearch />
            </div>
          </div>

          {/* Active Queue Table */}
          <div className="wd-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <h2 className="wd-section-title">Active Queue</h2>
                {totalActive > 0 && (
                  <span className="badge badge-neutral">{totalActive}</span>
                )}
              </div>
              <Link href="/dashboard/queue" className="btn btn-ghost btn-sm gap-1.5">
                <span>Full Queue</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {activeJobs.length === 0 ? (
              <div className="py-10 text-center">
                <Clock size={28} strokeWidth={1} style={{ color: "hsl(var(--text-tertiary))", margin: "0 auto 8px" }} />
                <p className="wd-body">No active jobs right now</p>
                <Link href="/dashboard/jobs/new" className="btn btn-primary btn-sm mt-3">
                  Start New Job
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="wd-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJobs.map((job: any) => (
                      <tr key={job.id}>
                        <td>
                          <span className="plate">{job.vehicle.vehicleNumber}</span>
                          <span className="wd-caption block mt-0.5">{job.vehicle.vehicleType}</span>
                        </td>
                        <td>
                          <span className="text-sm" style={{ fontWeight: 500 }}>
                            {job.customer.name}
                          </span>
                          <span className="wd-caption block">{job.customer.mobile}</span>
                        </td>
                        <td>
                          <span className="wd-body truncate max-w-[160px] block">
                            {job.services.map((s: any) => s.serviceNameSnapshot).join(", ")}
                          </span>
                        </td>
                        <td>
                          <span className={STATUS_BADGE[job.status] || "badge badge-neutral"}>
                            {STATUS_LABEL[job.status] || job.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Today's Bookings + Recent Activity */}
        <div className="space-y-3">
          {/* Quick Actions */}
          <div className="wd-card p-3">
            <h2 className="wd-section-title px-1 mb-2">Quick Actions</h2>
            <div className="space-y-1">
              {[
                { href: "/dashboard/jobs/new", label: "New Job Card", icon: Plus, primary: true },
                { href: "/dashboard/queue", label: "View Queue", icon: Clock },
                { href: "/dashboard/bookings", label: "Appointments", icon: Calendar },
                { href: "/dashboard/vehicles", label: "Customer Search", icon: Search },
                { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
              ].map(({ href, label, icon: Icon, primary }) => (
                <Link
                  key={href}
                  href={href as any}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors ${
                    primary
                      ? "bg-blue-600 text-white hover:bg-blue-700 font-medium"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <Icon size={14} strokeWidth={1.75} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Today's Bookings */}
          {todayBookings.length > 0 && (
            <div className="wd-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="wd-section-title">Today's Bookings</h2>
                <span className="badge badge-blue">{todayBookings.length}</span>
              </div>
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{booking.customerName}</p>
                        <p className="wd-caption truncate">{booking.serviceName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="wd-caption">
                          {formatTime(booking.scheduledAt)}
                        </span>
                        <span className="plate">{booking.vehicleNumber}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t">
                <Link href="/dashboard/bookings" className="btn btn-ghost btn-sm w-full justify-center">
                  View All Bookings
                </Link>
              </div>
            </div>
          )}

          {/* Recent Completed */}
          {recentJobs.length > 0 && (
            <div className="wd-card overflow-hidden">
              <div className="px-4 py-3 border-b">
                <h2 className="wd-section-title">Recently Delivered</h2>
              </div>
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {recentJobs.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="plate">{job.vehicle.vehicleNumber}</span>
                      </div>
                      <p className="wd-caption mt-0.5 truncate">{job.customer.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {job.invoice && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: job.invoice.status === "PAID" ? "hsl(var(--success))" : "hsl(var(--danger))" }}
                        >
                          {formatCurrency(Number(job.invoice.finalAmount))}
                        </span>
                      )}
                      <span className="badge badge-success" style={{ fontSize: 9 }}>Delivered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
