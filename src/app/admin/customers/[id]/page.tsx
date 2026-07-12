import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  Package,
  CreditCard,
  Receipt,
  FileText,
  Clock,
  ChevronLeft,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge, PlanBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime, daysRemaining, getDaysRemainingLabel } from "@/lib/currency";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["SUPER_ADMIN"]);
  const { id } = await params;

  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      users: {
        where: { isDeleted: false },
        orderBy: { role: "asc" },
      },
      stationSubscriptions: {
        orderBy: { endDate: "desc" },
        include: {
          subscription: true,
        },
      },
      featureOverrides: true,
      jobCards: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          invoice: true,
          vehicle: { select: { vehicleNumber: true, brand: true, model: true } },
        },
      },
    },
  });

  if (!station || station.isDeleted) {
    notFound();
  }

  const owner = station.users.find((u) => u.role === "OWNER") ?? station.users[0] ?? null;
  const staffMembers = station.users.filter((u) => u.role === "STAFF");
  const activeSub = station.stationSubscriptions.find((sub) => sub.status === "ACTIVE") ?? station.stationSubscriptions[0] ?? null;
  const remDays = daysRemaining(activeSub?.endDate);
  const { label: expiryLabel, colorClass: expiryColor } = getDaysRemainingLabel(remDays);

  // Fetch audit history scoped to this station
  const auditLogs = await prisma.auditLog.findMany({
    where: { stationId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      actor: { select: { name: true, role: true } },
    },
  });

  // Calculate some basic customer metrics
  const totalJobsCount = await prisma.jobCard.count({
    where: { stationId: id, isDeleted: false },
  });

  const totalRevenueResult = await prisma.invoice.aggregate({
    where: {
      jobCard: { stationId: id },
      paymentStatus: "PAID",
    },
    _sum: { finalAmount: true },
  });
  const totalRevenue = Number(totalRevenueResult._sum.finalAmount ?? 0);

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-6xl mx-auto">
      {/* Back button + Title */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {station.name}
              </h1>
              <StatusBadge status={station.status} />
              {activeSub?.subscription && (
                <PlanBadge plan={activeSub.subscription.name} />
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              @{station.slug} · Customer 360° Console
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(totalRevenue, (station as any).currency ?? "INR")}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Jobs</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{totalJobsCount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff Users</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{staffMembers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">License Status</p>
          <p className={`text-sm font-extrabold mt-1.5 ${expiryColor}`}>{expiryLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Business Info, Subscription, Feature Overrides, Recent Jobs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business & Owner Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-wd-teal-700" />
                Business & Tenant Information
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Business Name</p>
                <p className="font-semibold text-slate-800 mt-1">{station.name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Country & Currency</p>
                <p className="font-semibold text-slate-800 mt-1">
                  {(station as any).country ?? "IN"} · {(station as any).currency ?? "INR"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone Number</p>
                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400" />
                  {station.phone ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email Address</p>
                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5 truncate">
                  <Mail size={13} className="text-slate-400" />
                  {station.email ?? "—"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Physical Address</p>
                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                  {station.address ?? "No address registered"}
                </p>
              </div>
            </div>

            {/* Owner Section inside Business card */}
            {owner && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Primary Owner</p>
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-wd-teal-100 text-wd-teal-800 font-bold flex items-center justify-center text-xs">
                      {owner.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{owner.name}</p>
                      <p className="text-[11px] text-slate-500">{owner.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-200/80 text-slate-700 uppercase">
                    Owner
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Subscription details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Package size={18} className="text-wd-teal-700" />
              Active License & Subscription
            </h2>
            {activeSub ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Current Tier</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {activeSub.subscription?.name ?? "Custom Plan"}
                    </p>
                  </div>
                  <StatusBadge status={activeSub.status} size="md" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Start Date</p>
                    <p className="font-bold text-slate-800 mt-1">{formatDate(activeSub.startDate)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Expiry Date</p>
                    <p className="font-bold text-slate-800 mt-1">{formatDate(activeSub.endDate)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Grace Period</p>
                    <p className="font-bold text-slate-800 mt-1">
                      {activeSub.graceUntil ? formatDate(activeSub.graceUntil) : "None"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No active subscription plan attached.</p>
            )}
          </div>

          {/* Recent Jobs Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileText size={18} className="text-wd-teal-700" />
              Recent Job Cards ({station.jobCards.length})
            </h2>
            {station.jobCards.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No jobs created by this station yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {station.jobCards.map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">
                        {job.vehicle?.vehicleNumber ?? "Vehicle"} · {job.vehicle?.brand} {job.vehicle?.model}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Created {formatDateTime(job.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {job.invoice && (
                        <span className="font-bold text-slate-700">
                          {formatCurrency(job.invoice.finalAmount, (station as any).currency ?? "INR")}
                        </span>
                      )}
                      <StatusBadge status={job.status} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Feature Overrides & Audit Timeline */}
        <div className="space-y-6">
          {/* Feature Overrides */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers size={16} className="text-wd-teal-700" />
              Feature Overrides ({station.featureOverrides.length})
            </h3>
            {station.featureOverrides.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No custom overrides (using plan defaults).</p>
            ) : (
              <div className="space-y-2.5">
                {station.featureOverrides.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{flag.featureKey}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      flag.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {flag.isEnabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock size={16} className="text-wd-teal-700" />
              Activity Timeline
            </h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No audit logs recorded for this station.</p>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-wd-teal-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 leading-snug">
                        <span className="text-wd-teal-700 font-bold">{log.actor?.name ?? "System"}</span> · {log.action}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {log.entityType} · {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
