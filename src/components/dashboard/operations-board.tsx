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
      className="block p-3 hover:bg-slate-50 transition-colors"
      style={{
        borderBottom: "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="plate">{job.vehicle.vehicleNumber}</span>
            <span className="wd-caption">{job.vehicle.vehicleType}</span>
          </div>
          <p className="text-xs mt-1 truncate" style={{ color: "hsl(var(--text-primary))", fontWeight: 500 }}>
            {job.customer.name}
          </p>
          <p className="wd-caption truncate mt-0.5">
            {job.services.map((s) => s.serviceNameSnapshot).join(", ")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: "hsl(var(--text-primary))" }}>
            ₹{totalPrice.toLocaleString("en-IN")}
          </span>
          {eta ? (
            <span className="wd-caption">ETA {eta}</span>
          ) : (
            <span className="wd-caption">{formatElapsed(job.createdAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function OperationsBoard({ initialBoardData }: OperationsBoardProps) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
    >
      {COLUMNS.map((col) => {
        const jobs = initialBoardData[col.key] || [];
        return (
          <div
            key={col.key}
            className="wd-card overflow-hidden flex flex-col"
            style={{ minHeight: 200 }}
          >
            {/* Column header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 border-b"
              style={{ background: "hsl(var(--bg-subtle))" }}
            >
              <div className={col.dotClass} />
              <span className="wd-label flex-1">{col.label}</span>
              <span
                className="badge badge-neutral"
                style={{ fontSize: 10, minWidth: 20, justifyContent: "center" }}
              >
                {jobs.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="wd-caption">No vehicles</p>
                </div>
              ) : (
                jobs.map((job) => <JobCardItem key={job.id} job={job} />)
              )}
            </div>

            {/* Footer */}
            {col.key !== "DELIVERED" && (
              <div className="border-t">
                <Link
                  href={`/dashboard/queue?tab=${col.key}`}
                  className="flex items-center justify-center gap-1 py-2 text-xs hover:bg-slate-50 transition-colors w-full"
                  style={{ color: "hsl(var(--text-secondary))" }}
                >
                  <span>See all</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
