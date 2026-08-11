"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, CheckCircle2, Loader2, Clock } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type JobCard = {
  id: string;
  vehicle: {
    id: string;
    vehicleNumber: string;
    vehicleType: string;
  };
  customer: {
    name: string;
    mobile: string;
  };
  services: Array<{
    serviceNameSnapshot: string;
    priceSnapshot: number;
  }>;
  status: string;
};

const STATUS_BADGE: Record<string, string> = {
  RECEIVED: "badge badge-info",
  IN_PROGRESS: "badge badge-warning",
  SERVICE_COMPLETED: "badge badge-primary",
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

export function ActiveQueueTable({ initialJobs }: { initialJobs: JobCard[] }) {
  const toast = useToast();
  const [jobs, setJobs] = useState<JobCard[]>(initialJobs);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (jobId: string, nextStatus: string) => {
    setUpdatingId(jobId);
    const targetJob = jobs.find((j) => j.id === jobId);

    // Optimistic UI update
    setJobs((prev) =>
      prev
        .map((j) => (j.id === jobId ? { ...j, status: nextStatus } : j))
        .filter((j) => nextStatus !== "DELIVERED" && nextStatus !== "CANCELLED")
    );

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
        "Job Status Updated!",
        `Vehicle ${targetJob?.vehicle.vehicleNumber || ""} marked as ${STATUS_LABEL[nextStatus] || nextStatus}.`
      );
    } catch (err: any) {
      setJobs(initialJobs);
      toast.error("Status Update Failed", err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="py-10 text-center">
        <Clock size={28} strokeWidth={1} style={{ color: "hsl(var(--text-tertiary))", margin: "0 auto 8px" }} />
        <p className="wd-body">No active jobs right now</p>
        <Link href="/dashboard/jobs/new" className="btn btn-primary btn-sm mt-3">
          Start New Job
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="wd-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Customer</th>
            <th>Services</th>
            <th>Status</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const isUpdating = updatingId === job.id;
            return (
              <tr key={job.id} className="hover:bg-slate-50 transition">
                <td>
                  <Link href={`/dashboard/jobs/${job.id}`} className="font-bold text-slate-900 hover:text-teal-700">
                    <span className="plate">{job.vehicle.vehicleNumber}</span>
                    <span className="wd-caption block mt-0.5">{job.vehicle.vehicleType}</span>
                  </Link>
                </td>
                <td>
                  <span className="text-sm font-semibold text-slate-800 block">
                    {job.customer.name}
                  </span>
                  <span className="wd-caption block">{job.customer.mobile}</span>
                </td>
                <td>
                  <span className="wd-body truncate max-w-[160px] block font-medium">
                    {job.services.map((s) => s.serviceNameSnapshot).join(", ")}
                  </span>
                </td>
                <td>
                  <span className={STATUS_BADGE[job.status] || "badge badge-neutral"}>
                    {STATUS_LABEL[job.status] || job.status}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {job.status === "RECEIVED" && (
                      <>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(job.id, "IN_PROGRESS")}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                          Start
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(job.id, "SERVICE_COMPLETED")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle2 size={12} /> Complete
                        </button>
                      </>
                    )}

                    {job.status === "IN_PROGRESS" && (
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(job.id, "SERVICE_COMPLETED")}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Mark Completed
                      </button>
                    )}

                    {job.status === "SERVICE_COMPLETED" && (
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(job.id, "DELIVERED")}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Deliver
                      </button>
                    )}

                    {job.status === "PAYMENT_PENDING" && (
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(job.id, "DELIVERED")}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Deliver
                      </button>
                    )}

                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-lg border transition"
                    >
                      Open
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
