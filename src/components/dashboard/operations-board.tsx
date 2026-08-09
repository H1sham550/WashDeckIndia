"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Clock, ArrowRight, ChevronDown } from "lucide-react";

type JobCard = {
  id: string;
  vehicle: {
    id: string;
    vehicleNumber: string;
    vehicleType: string;
    brand: string | null;
    model: string | null;
  };
  customer: {
    name: string;
    mobile: string;
  };
  services: Array<{
    serviceNameSnapshot: string;
    priceSnapshot: number;
  }>;
  expectedCompletionTime: string | null;
  createdAt: string | Date;
  status: string;
};

type OperationsBoardProps = {
  initialBoardData: {
    RECEIVED: JobCard[];
    IN_PROGRESS: JobCard[];
    SERVICE_COMPLETED: JobCard[];
    PAYMENT_PENDING: JobCard[];
    DELIVERED: JobCard[];
  };
};

const COLUMNS = [
  {
    key: "RECEIVED" as const,
    label: "Waiting",
    dotClass: "status-dot status-dot-received",
    headerClass: "text-blue-600",
  },
  {
    key: "IN_PROGRESS" as const,
    label: "In Progress",
    dotClass: "status-dot status-dot-progress",
    headerClass: "text-amber-600",
  },
  {
    key: "SERVICE_COMPLETED" as const,
    label: "Ready",
    dotClass: "status-dot status-dot-completed",
    headerClass: "text-violet-600",
  },
  {
    key: "PAYMENT_PENDING" as const,
    label: "Pay Pending",
    dotClass: "status-dot status-dot-payment",
    headerClass: "text-red-600",
  },
  {
    key: "DELIVERED" as const,
    label: "Delivered",
    dotClass: "status-dot status-dot-delivered",
    headerClass: "text-emerald-600",
  },
];

function formatElapsed(iso: string | Date) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function JobCardItem({ job }: { job: JobCard }) {
  const totalPrice = job.services.reduce((s, svc) => s + svc.priceSnapshot, 0);
  const eta = formatTime(job.expectedCompletionTime);

  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className="block p-3.5 bg-white hover:bg-slate-50 transition-colors border-b border-slate-200 last:border-b-0 active-tap"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="plate bg-slate-900 text-white font-black px-2 py-0.5 rounded text-[11px] tracking-wide">
              {job.vehicle.vehicleNumber}
            </span>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {job.vehicle.vehicleType}
            </span>
          </div>
          <p className="text-xs font-extrabold text-slate-900 truncate">
            {job.customer.name}
          </p>
          <p className="text-[11px] font-semibold text-slate-700 truncate">
            {job.services.map((s) => s.serviceNameSnapshot).join(", ")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            ₹{totalPrice.toLocaleString("en-IN")}
          </span>
          {eta ? (
            <span className="text-[10px] font-bold text-slate-600">ETA {eta}</span>
          ) : (
            <span className="text-[10px] font-bold text-slate-600">{formatElapsed(job.createdAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function OperationsBoard({ initialBoardData }: OperationsBoardProps) {
  return (
    <div>
      {/* ── Desktop View (5-Column Kanban Grid) ───────────────────── */}
      <div className="hidden md:grid grid-cols-5 gap-3.5">
        {COLUMNS.map((col) => {
          const jobs = initialBoardData[col.key] || [];
          return (
            <div
              key={col.key}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[260px]"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className={col.dotClass} />
                  <span className={`text-xs font-black ${col.headerClass}`}>{col.label}</span>
                </div>
                <span className="bg-slate-200 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {jobs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {jobs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-bold">
                    No vehicles
                  </div>
                ) : (
                  jobs.map((job) => <JobCardItem key={job.id} job={job} />)
                )}
              </div>

              {/* Footer */}
              {col.key !== "DELIVERED" && (
                <div className="border-t border-slate-200 bg-slate-50/50">
                  <Link
                    href={`/dashboard/queue?tab=${col.key}`}
                    className="flex items-center justify-center gap-1 py-2 text-xs font-extrabold text-slate-700 hover:text-slate-900 transition-colors w-full"
                  >
                    <span>View All ({jobs.length})</span>
                    <ArrowRight size={12} className="rtl:rotate-180" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile View (Vertical Section Tiles Stacked) ─────────── */}
      <div className="md:hidden flex flex-col space-y-4">
        {COLUMNS.map((col) => {
          const jobs = initialBoardData[col.key] || [];
          return (
            <div
              key={col.key}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className={col.dotClass} />
                  <h3 className={`text-xs font-black uppercase tracking-wider ${col.headerClass}`}>
                    {col.label}
                  </h3>
                </div>
                <span className="bg-slate-900 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                  {jobs.length} {jobs.length === 1 ? "vehicle" : "vehicles"}
                </span>
              </div>

              {/* Section Body */}
              <div className="divide-y divide-slate-200">
                {jobs.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                    No vehicles in {col.label.toLowerCase()} stage
                  </div>
                ) : (
                  jobs.map((job) => <JobCardItem key={job.id} job={job} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
