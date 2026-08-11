"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Play, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

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

type BoardData = {
  RECEIVED: JobCard[];
  IN_PROGRESS: JobCard[];
  SERVICE_COMPLETED: JobCard[];
  PAYMENT_PENDING: JobCard[];
  DELIVERED: JobCard[];
};

type OperationsBoardProps = {
  initialBoardData: BoardData;
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

function JobCardItem({
  job,
  onUpdateStatus,
  updatingId,
}: {
  job: JobCard;
  onUpdateStatus: (jobId: string, nextStatus: string) => void;
  updatingId: string | null;
}) {
  const totalPrice = job.services.reduce((s, svc) => s + svc.priceSnapshot, 0);
  const eta = formatTime(job.expectedCompletionTime);
  const isUpdating = updatingId === job.id;

  return (
    <div className="p-3.5 bg-white hover:bg-slate-50/60 transition border-b border-slate-200 last:border-b-0 space-y-2.5">
      <Link href={`/dashboard/jobs/${job.id}`} className="block group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="plate bg-slate-900 text-white font-black px-2 py-0.5 rounded text-[11px] tracking-wide group-hover:bg-teal-900 transition">
                {job.vehicle.vehicleNumber}
              </span>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {job.vehicle.vehicleType}
              </span>
            </div>
            <p className="text-xs font-extrabold text-slate-900 truncate group-hover:text-teal-700 transition">
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

      {/* 1-Tap Quick Action Buttons */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
        {job.status === "RECEIVED" && (
          <>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(job.id, "IN_PROGRESS")}
              className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              Start Wash
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(job.id, "SERVICE_COMPLETED")}
              className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition flex items-center justify-center gap-1 shrink-0 active:scale-95 disabled:opacity-50"
              title="Mark Service Completed"
            >
              <CheckCircle2 size={12} /> Mark Ready
            </button>
          </>
        )}

        {job.status === "IN_PROGRESS" && (
          <>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(job.id, "SERVICE_COMPLETED")}
              className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Mark Ready / Completed
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(job.id, "RECEIVED")}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg border transition shrink-0 disabled:opacity-50"
            >
              ↩ Waiting
            </button>
          </>
        )}

        {job.status === "SERVICE_COMPLETED" && (
          <>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(job.id, "DELIVERED")}
              className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Mark Delivered
            </button>
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-200 transition shrink-0"
            >
              Pay / Details
            </Link>
          </>
        )}

        {job.status === "PAYMENT_PENDING" && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(job.id, "DELIVERED")}
            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Mark Paid & Delivered
          </button>
        )}

        {job.status === "DELIVERED" && (
          <div className="w-full text-center py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded border border-emerald-100">
            ✓ Delivered
          </div>
        )}
      </div>
    </div>
  );
}

export function OperationsBoard({ initialBoardData }: OperationsBoardProps) {
  const toast = useToast();
  const [boardData, setBoardData] = useState<BoardData>(initialBoardData);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (jobId: string, nextStatus: string) => {
    setUpdatingId(jobId);

    // Find the target job card across all columns
    const cols = Object.keys(boardData) as Array<keyof BoardData>;
    let foundJob: JobCard | undefined;
    let oldColumnKey: keyof BoardData | null = null;

    for (const colKey of cols) {
      const match = boardData[colKey].find((j) => j.id === jobId);
      if (match) {
        foundJob = match;
        oldColumnKey = colKey;
        break;
      }
    }

    if (!foundJob || !oldColumnKey) return;
    const targetJob: JobCard = { ...foundJob, status: nextStatus };

    // Optimistic UI state update: remove from old column, insert at beginning of new column
    setBoardData((prev) => {
      const nextBoard = { ...prev };

      // Remove from old column
      nextBoard[oldColumnKey!] = nextBoard[oldColumnKey!].filter((j) => j.id !== jobId);

      // Add to new column
      const targetColKey = nextStatus as keyof BoardData;
      if (nextBoard[targetColKey]) {
        nextBoard[targetColKey] = [targetJob!, ...nextBoard[targetColKey]];
      }

      return nextBoard;
    });

    try {
      const res = await fetch(`/api/job-cards/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      toast.success(
        "Status Updated!",
        `Vehicle ${targetJob.vehicle.vehicleNumber} updated.`
      );
    } catch (err: any) {
      // Revert to initial board data on error
      setBoardData(initialBoardData);
      toast.error("Update Failed", err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* ── Desktop View (5-Column Kanban Grid) ───────────────────── */}
      <div className="hidden md:grid grid-cols-5 gap-3.5">
        {COLUMNS.map((col) => {
          const jobs = boardData[col.key] || [];
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
                  jobs.map((job) => (
                    <JobCardItem
                      key={job.id}
                      job={job}
                      onUpdateStatus={handleUpdateStatus}
                      updatingId={updatingId}
                    />
                  ))
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
          const jobs = boardData[col.key] || [];
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
                  jobs.map((job) => (
                    <JobCardItem
                      key={job.id}
                      job={job}
                      onUpdateStatus={handleUpdateStatus}
                      updatingId={updatingId}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
