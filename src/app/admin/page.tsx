import {
  Building2,
  TrendingUp,
  Sparkles,
  Clock,
  XCircle,
  Car,
  Users,
  BarChart3,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrencyCompact, formatRelativeTime } from "@/lib/currency";

export default async function AdminPage() {
  // 1. Enforce SUPER_ADMIN validation
  await requireRole(["SUPER_ADMIN"]);

  // 2. Fetch all stations with subscriptions, feature overrides, and owner details
  const stations = await prisma.station.findMany({
    where: { isDeleted: false },
    include: {
      featureOverrides: true,
      users: {
        where: { role: "OWNER", isDeleted: false },
        select: { id: true, name: true, email: true, role: true },
        take: 1,
      },
      stationSubscriptions: {
        orderBy: { endDate: "desc" },
        include: { subscription: { select: { price: true, name: true } } },
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
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      station: { select: { name: true } },
      actor: { select: { name: true, role: true } },
    },
  });

  // 5. Calculate platform-wide metrics
  const activeStations = stations.filter((s) => s.status === "ACTIVE").length;
  const trialStations = stations.filter((s) => s.status === "TRIAL").length;
  const suspendedStations = stations.filter((s) => s.status === "SUSPENDED").length;

  const totalJobsCount = await prisma.jobCard.count({
    where: { isDeleted: false },
  });

  // pendingRenewals: stations with ACTIVE subscription ending within 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pendingRenewals = stations.filter((s) => {
    const activeSub = s.stationSubscriptions.find(
      (sub) => sub.status === "ACTIVE"
    );
    if (!activeSub) return false;
    const endDate = new Date(activeSub.endDate);
    return endDate >= now && endDate <= thirtyDaysFromNow;
  }).length;

  // MRR: sum of plan prices for ACTIVE stations
  let mrr = 0;
  for (const station of stations) {
    if (station.status === "ACTIVE") {
      const activeSub = station.stationSubscriptions.find(
        (sub) => sub.status === "ACTIVE"
      );
      if (activeSub) {
        mrr += Number(activeSub.subscription?.price ?? 0);
      }
    }
  }

  // Current date string
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  void plans; // plans fetched for completeness, used in metrics

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-6xl mx-auto">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Platform Overview
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{today}</p>
      </div>

      {/* ── 6-Metric Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Active Stations */}
        <MetricCard
          label="Active Stations"
          value={activeStations.toString()}
          icon={Building2}
          color="green"
          sub={`of ${stations.length} total`}
        />
        {/* MRR */}
        <MetricCard
          label="MRR"
          value={formatCurrencyCompact(mrr, "INR")}
          icon={TrendingUp}
          color="teal"
          sub="monthly recurring"
        />
        {/* Active Trials */}
        <MetricCard
          label="Active Trials"
          value={trialStations.toString()}
          icon={Sparkles}
          color="blue"
          sub="in trial period"
        />
        {/* Pending Renewals */}
        <MetricCard
          label="Pending Renewals"
          value={pendingRenewals.toString()}
          icon={Clock}
          color="amber"
          sub="expiring in 30d"
        />
        {/* Suspended */}
        <MetricCard
          label="Suspended"
          value={suspendedStations.toString()}
          icon={XCircle}
          color="red"
          sub="access restricted"
        />
        {/* Total Jobs */}
        <MetricCard
          label="Total Jobs"
          value={totalJobsCount.toLocaleString()}
          icon={Car}
          color="slate"
          sub="platform-wide"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ── Recent Audit Activity ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">
              Recent Activity
            </h2>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-wd-teal-700 hover:text-wd-teal-800 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {auditLogs.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">
                No activity yet
              </p>
            )}
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0"
              >
                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-slate-500 uppercase">
                  {(log.actor?.name ?? "SYS").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    <span className="text-wd-teal-700">
                      {log.actor?.name ?? "System"}
                    </span>{" "}
                    · {log.action}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {log.station?.name ?? "Platform"} ·{" "}
                    {log.entityType}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                  {formatRelativeTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Links ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-4">
            Quick Navigate
          </h2>
          <div className="space-y-2">
            <QuickLink
              href="/admin/customers"
              icon={Users}
              label="Customers"
              sub="Manage all tenant stations"
            />
            <QuickLink
              href="/admin/analytics"
              icon={BarChart3}
              label="Analytics"
              sub="MRR, ARR, growth charts"
            />
            <QuickLink
              href="/admin/payments"
              icon={CreditCard}
              label="Payments"
              sub="Manual payment workflow"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

type MetricColor = "green" | "teal" | "blue" | "amber" | "red" | "slate";

const COLOR_MAP: Record<
  MetricColor,
  { icon: string; bg: string; ring: string }
> = {
  green: {
    icon: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "border-emerald-100",
  },
  teal: {
    icon: "text-wd-teal-700",
    bg: "bg-wd-teal-50",
    ring: "border-wd-teal-100",
  },
  blue: { icon: "text-blue-600", bg: "bg-blue-50", ring: "border-blue-100" },
  amber: {
    icon: "text-amber-600",
    bg: "bg-amber-50",
    ring: "border-amber-100",
  },
  red: { icon: "text-red-600", bg: "bg-red-50", ring: "border-red-100" },
  slate: {
    icon: "text-slate-500",
    bg: "bg-slate-100",
    ring: "border-slate-200",
  },
};

import type { LucideIcon } from "lucide-react";

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: MetricColor;
  sub: string;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3">
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.bg} ${c.ring}`}
      >
        <Icon size={16} className={c.icon} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
          {label}
        </p>
        <p className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">
          {value}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  sub,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 group transition-colors"
    >
      <div className="h-9 w-9 rounded-xl bg-wd-teal-50 border border-wd-teal-100 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-wd-teal-700" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
          {label}
        </p>
        <p className="text-[10px] text-slate-400">{sub}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-slate-300 group-hover:text-wd-teal-600 transition-colors"
      />
    </Link>
  );
}
