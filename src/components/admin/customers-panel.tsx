"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  LogIn,
  Edit,
  XCircle,
  CheckCircle,
  FileText,
  Car,
  User,
  ChevronRight,
  Plus,
} from "lucide-react";
import { StatusBadge, PlanBadge } from "@/components/ui/badge";
import { formatDate, daysRemaining, getDaysRemainingLabel } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { CreateStationModal } from "./create-station-modal";

export interface CustomerStation {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  country: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string } | null;
  planName: string | null;
  subscriptionEndDate: string | null;
  subscriptionStatus: string | null;
  todayJobCount: number;
}

interface CustomersPanelProps {
  stations: CustomerStation[];
}

const STATUS_OPTIONS = ["ALL", "ACTIVE", "TRIAL", "SUSPENDED", "EXPIRED", "GRACE"];
const PLAN_OPTIONS = ["ALL"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳", AE: "🇦🇪", SA: "🇸🇦", QA: "🇶🇦", KW: "🇰🇼",
  OM: "🇴🇲", BH: "🇧🇭", SG: "🇸🇬", MY: "🇲🇾", US: "🇺🇸", GB: "🇬🇧",
};

export function CustomersPanel({ stations }: CustomersPanelProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, startTransition] = useTransition();

  // Collect unique plan names
  const planNames = ["ALL", ...Array.from(new Set(stations.map((s) => s.planName).filter(Boolean))) as string[]];

  const filtered = stations.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.owner?.email ?? "").toLowerCase().includes(q) ||
      (s.owner?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchPlan = planFilter === "ALL" || s.planName === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  async function handleImpersonate(stationId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/stations/${stationId}/impersonate`, {
        method: "POST",
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Failed to impersonate station owner.");
      }
    });
  }

  async function handleToggleSuspend(station: CustomerStation) {
    const newStatus = station.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    startTransition(async () => {
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to update station status.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <CreateStationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* ── Filters & Create Button ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-wd-teal-300 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-7 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-wd-teal-300 appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All Statuses" : s}
                  </option>
                ))}
              </select>
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-wd-teal-300 appearance-none cursor-pointer"
          >
            {planNames.map((p) => (
              <option key={p} value={p}>
                {p === "ALL" ? "All Plans" : p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-wd-teal-600 hover:bg-wd-teal-700 text-white text-xs font-bold shadow-sm shadow-wd-teal-600/20 transition-all active:scale-[0.98] flex-shrink-0"
      >
        <Plus size={15} />
        <span>Add Station</span>
      </button>
    </div>

      {/* ── Result count ────────────────────────────────────────── */}
      <p className="text-xs text-slate-400 font-medium">
        Showing{" "}
        <span className="font-bold text-slate-600">{filtered.length}</span> of{" "}
        {stations.length} stations
      </p>

      {/* ── Cards ───────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center">
          <p className="text-sm font-bold text-slate-500">No stations found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((station) => {
          const days = daysRemaining(station.subscriptionEndDate);
          const daysLabel = getDaysRemainingLabel(days);
          const flag = COUNTRY_FLAGS[station.country ?? ""] ?? "🌍";
          return (
            <div
              key={station.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              {/* Header row */}
              <div className="flex items-start gap-3">
                {station.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={station.logoUrl}
                    alt={station.name}
                    className="h-10 w-10 rounded-xl object-contain border border-slate-100 flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-wd-teal-50 border border-wd-teal-100 flex items-center justify-center flex-shrink-0 text-sm font-black text-wd-teal-700">
                    {getInitials(station.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {station.name}
                    </p>
                    <span className="text-base leading-none">{flag}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <StatusBadge status={station.status} size="xs" />
                    {station.planName && (
                      <PlanBadge plan={station.planName} size="xs" />
                    )}
                  </div>
                </div>
                <Link
                  href={`/admin/customers/${station.id}`}
                  className="flex-shrink-0 text-slate-300 hover:text-wd-teal-600 transition-colors"
                >
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* Info rows */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <User size={11} className="flex-shrink-0 text-slate-400" />
                  <span className="font-semibold text-slate-700 truncate">
                    {station.owner?.name ?? "—"}
                  </span>
                  <span className="text-slate-400 truncate">
                    {station.owner?.email ?? ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Expires</span>
                  <span className={cn("font-bold", daysLabel.colorClass)}>
                    {station.subscriptionEndDate
                      ? `${formatDate(station.subscriptionEndDate, "DD MMM YYYY")} · ${daysLabel.label}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Car size={11} /> Today&apos;s Jobs
                  </span>
                  <span className="font-bold text-slate-700">
                    {station.todayJobCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Outstanding</span>
                  <span className="font-bold text-slate-400">₹0</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-wrap pt-1 border-t border-slate-50">
                <button
                  onClick={() => handleImpersonate(station.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-wd-teal-700 text-white text-[10px] font-bold hover:bg-wd-teal-800 transition-colors"
                >
                  <LogIn size={11} /> Login as Owner
                </button>
                <Link
                  href={`/admin/customers/${station.id}`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-colors"
                >
                  <Edit size={11} /> Edit
                </Link>
                <button
                  onClick={() => handleToggleSuspend(station)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors",
                    station.status === "SUSPENDED"
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-red-50 text-red-700 hover:bg-red-100"
                  )}
                >
                  {station.status === "SUSPENDED" ? (
                    <>
                      <CheckCircle size={11} /> Unsuspend
                    </>
                  ) : (
                    <>
                      <XCircle size={11} /> Suspend
                    </>
                  )}
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-colors">
                  <FileText size={11} /> Invoice
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Suppress unused import warning for PLAN_OPTIONS
void PLAN_OPTIONS;
