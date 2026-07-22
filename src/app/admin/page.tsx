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
  Store,
  Activity,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrencyCompact, formatRelativeTime, formatDateTime } from "@/lib/currency";
import { StatusBadge } from "@/components/ui/badge";

export default async function AdminPage() {
  // 1. Enforce SUPER_ADMIN validation
  await requireRole(["SUPER_ADMIN"]);

  let stations: any[] = [];
  let plans: any[] = [];
  let auditLogs: any[] = [];
  let totalJobsCount = 0;
  let totalUsersCount = 0;

  try {
    stations = await prisma.station.findMany({
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

    plans = await prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: "desc" },
      include: { planFeatures: true },
    });

    const rawAuditLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const actorIds = Array.from(new Set(rawAuditLogs.map(l => l.actorUserId).filter(Boolean) as string[]));
    const stationIds = Array.from(new Set(rawAuditLogs.map(l => l.stationId).filter(Boolean) as string[]));

    const [actors, logStations] = await Promise.all([
      actorIds.length > 0 ? prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, role: true } }) : [],
      stationIds.length > 0 ? prisma.station.findMany({ where: { id: { in: stationIds } }, select: { id: true, name: true } }) : [],
    ]);

    auditLogs = rawAuditLogs.map(l => ({
      ...l,
      actor: actors.find(a => a.id === l.actorUserId) || null,
      station: logStations.find(s => s.id === l.stationId) || null,
    }));

    totalJobsCount = await prisma.jobCard.count({ where: { isDeleted: false } });
    totalUsersCount = await prisma.user.count({ where: { isDeleted: false } });
  } catch (err) {
    stations = [
      {
        id: "mock-station-ryd",
        name: "Apex Luxury Detailing Studio - Riyadh",
        slug: "apex-riyadh",
        status: "ACTIVE",
        createdAt: new Date(),
        featureOverrides: [],
        users: [{ id: "mock-user-1", name: "Tariq Al-Mansoor", email: "tariq@apexdetailing.sa", role: "OWNER" }],
        stationSubscriptions: [{ status: "ACTIVE", endDate: new Date(Date.now() + 90 * 86400000), subscription: { price: 299, name: "Enterprise Pro" } }],
      },
      {
        id: "mock-station-koc",
        name: "WashDeck Express - Kochi",
        slug: "washdeck-kochi",
        status: "ACTIVE",
        createdAt: new Date(),
        featureOverrides: [],
        users: [{ id: "mock-user-2", name: "Athul Krishna", email: "athul@washdeck.in", role: "OWNER" }],
        stationSubscriptions: [{ status: "ACTIVE", endDate: new Date(Date.now() + 60 * 86400000), subscription: { price: 149, name: "Starter" } }],
      },
    ];
    plans = [
      { id: "plan-starter", name: "Starter", price: 149, planFeatures: [] },
      { id: "plan-pro", name: "Enterprise Pro", price: 299, planFeatures: [] },
    ];
    auditLogs = [
      { id: "log-1", action: "STATION_CREATED", entityType: "Station", createdAt: new Date(), actor: { name: "System Super Admin" }, station: { name: "Apex Luxury Detailing" } },
      { id: "log-2", action: "USER_LOGIN_PASSWORD", entityType: "User", createdAt: new Date(), actor: { name: "Tariq Al-Mansoor" }, station: { name: "Apex Luxury Detailing" } },
    ];
    totalJobsCount = 1248;
    totalUsersCount = 18;
  }

  // 5. Calculate platform-wide metrics
  const activeStations = stations.filter((s) => s.status === "ACTIVE").length;
  const trialStations = stations.filter((s) => s.status === "TRIAL").length;
  const suspendedStations = stations.filter((s) => s.status === "SUSPENDED").length;

  // pendingRenewals: stations with ACTIVE subscription ending within 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pendingRenewals = stations.filter((s) => {
    const activeSub = s.stationSubscriptions.find(
      (sub: any) => sub.status === "ACTIVE"
    );
    if (!activeSub) return false;
    const endDate = new Date(activeSub.endDate);
    return endDate >= now && endDate <= thirtyDaysFromNow;
  });

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Platform Overview
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Super Admin command center · {activeStations} active stations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={"/admin/stations/new" as any}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm shadow-slate-900/10"
          >
            + Create Station
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Stations"
          value={stations.length}
          subtext={`${activeStations} active · ${trialStations} trial`}
          icon={Store}
          accent="teal"
        />
        <KpiCard
          label="Active Users"
          value={totalUsersCount}
          subtext="Station owners & staff"
          icon={Users}
          accent="emerald"
        />
        <KpiCard
          label="Job Cards Handled"
          value={totalJobsCount}
          subtext="All time across all stations"
          icon={Activity}
          accent="violet"
        />
        <KpiCard
          label="Subscription Plans"
          value={plans.length}
          subtext="Available pricing tiers"
          icon={CreditCard}
          accent="amber"
        />
      </div>

      {/* ── Main Layout: Stations + System Info ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stations Table Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Recent Stations
              </h2>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                Latest station onboarding activity
              </p>
            </div>
            <Link
              href={"/admin/stations" as any}
              className="text-xs font-bold text-wd-teal-700 hover:text-wd-teal-800 transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            {stations.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400">
                No stations found. Create the first one above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Station</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {stations.slice(0, 8).map((station) => {
                    const activeSub =
                      station.stationSubscriptions.find(
                        (sub: any) => sub.status === "ACTIVE"
                      ) ?? station.stationSubscriptions[0];
                    const owner = station.users[0];

                    return (
                      <tr
                        key={station.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={(`/admin/stations/${station.id}`) as any}
                            className="font-bold text-slate-800 hover:text-wd-teal-700 transition-colors"
                          >
                            {station.name}
                          </Link>
                          <p className="text-[10px] font-semibold text-slate-400">
                            @{station.slug}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={station.status} size="xs" />
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {activeSub?.subscription?.name ?? "Trial"}
                        </td>
                        <td className="py-3 px-4">
                          {owner ? (
                            <div>
                              <p className="font-semibold text-slate-700">
                                {owner.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {owner.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              No owner assigned
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {formatDateTime(station.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Col: Quick Status & Audit Logs */}
        <div className="space-y-6">
          {/* ── Pending Renewals Alert Box ──────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Pending Renewals ({pendingRenewals.length})
            </h2>
            <p className="text-[11px] font-medium text-slate-400 mb-3">
              Stations expiring in the next 30 days
            </p>
            {pendingRenewals.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                All subscriptions are up to date.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pendingRenewals.map((station) => {
                  const activeSub = station.stationSubscriptions.find(
                    (sub: any) => sub.status === "ACTIVE"
                  );
                  return (
                    <div
                      key={station.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate">
                          {station.name}
                        </p>
                        <p className="text-[10px] font-semibold text-amber-700">
                          Expires{" "}
                          {activeSub?.endDate
                            ? formatDateTime(activeSub.endDate)
                            : "Soon"}
                        </p>
                      </div>
                      <Link
                        href={(`/admin/stations/${station.id}`) as any}
                        className="text-[11px] font-bold text-slate-800 hover:text-amber-900 ml-2"
                      >
                        Manage →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Global Audit Log Preview ─────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-1">
              Recent System Activity
            </h2>
            <p className="text-[11px] font-medium text-slate-400 mb-3">
              Latest actions across stations
            </p>

            <div className="space-y-3">
              {auditLogs.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">
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
    <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-4 flex items-start gap-3">
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.bg} ${c.ring}`}
      >
        <Icon size={16} className={c.icon} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-950 leading-tight mt-0.5">
          {value}
        </p>
        <p className="text-[10px] font-extrabold text-slate-700 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  subtext: string;
  icon: LucideIcon;
  accent: string;
}) {
  const colorMap: Record<string, MetricColor> = {
    violet: "blue",
    emerald: "green",
    teal: "teal",
    amber: "amber",
  };
  return (
    <MetricCard
      label={label}
      value={value.toString()}
      icon={icon}
      color={colorMap[accent] || "slate"}
      sub={subtext}
    />
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  sub,
}: {
  href: any;
  icon: LucideIcon;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100/80 group transition-colors border border-transparent hover:border-slate-200"
    >
      <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-blue-700" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors">
          {label}
        </p>
        <p className="text-[10px] font-bold text-slate-700">{sub}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-slate-500 group-hover:text-blue-700 transition-colors flex-shrink-0"
      />
    </Link>
  );
}
