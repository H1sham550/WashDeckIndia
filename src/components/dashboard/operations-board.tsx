"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, ArrowRight, User, Filter, AlertCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";

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

export function OperationsBoard({ initialBoardData }: OperationsBoardProps) {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "RECEIVED" | "IN_PROGRESS" | "SERVICE_COMPLETED" | "PAYMENT_PENDING" | "DELIVERED">("ACTIVE");

  // Combine lists based on tabs
  const allActive = [
    ...initialBoardData.RECEIVED,
    ...initialBoardData.IN_PROGRESS,
    ...initialBoardData.SERVICE_COMPLETED,
    ...initialBoardData.PAYMENT_PENDING,
  ];

  const getFilteredJobs = () => {
    switch (activeTab) {
      case "RECEIVED":
        return initialBoardData.RECEIVED;
      case "IN_PROGRESS":
        return initialBoardData.IN_PROGRESS;
      case "SERVICE_COMPLETED":
        return initialBoardData.SERVICE_COMPLETED;
      case "PAYMENT_PENDING":
        return initialBoardData.PAYMENT_PENDING;
      case "DELIVERED":
        return initialBoardData.DELIVERED;
      default:
        return allActive;
    }
  };

  const filteredJobs = getFilteredJobs();

  function formatTime(isoString: string | null) {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SERVICE_COMPLETED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "PAYMENT_PENDING":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return "Waiting";
      case "IN_PROGRESS":
        return "In Progress";
      case "SERVICE_COMPLETED":
        return "Completed";
      case "PAYMENT_PENDING":
        return "Pay Pending";
      case "DELIVERED":
        return "Delivered";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Touch-Friendly Tabs Filter */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {[
          { key: "ACTIVE", label: `Active Queue (${allActive.length})` },
          { key: "RECEIVED", label: `Waiting (${initialBoardData.RECEIVED.length})` },
          { key: "IN_PROGRESS", label: `In Bay (${initialBoardData.IN_PROGRESS.length})` },
          { key: "SERVICE_COMPLETED", label: `Completed (${initialBoardData.SERVICE_COMPLETED.length})` },
          { key: "PAYMENT_PENDING", label: `Pay Pending (${initialBoardData.PAYMENT_PENDING.length})` },
          { key: "DELIVERED", label: `Delivered (${initialBoardData.DELIVERED.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap active:scale-[0.98] ${
              activeTab === tab.key
                ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredJobs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {/* Header row (Visible on desktop) */}
            <div className="hidden md:grid grid-cols-[160px_130px_1fr_130px_50px] gap-4 px-6 py-3 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              <span>Vehicle Number</span>
              <span>Status</span>
              <span>Services</span>
              <span>ETA / Started</span>
              <span className="text-right">Action</span>
            </div>

            {/* Job Rows */}
            {filteredJobs.map((job) => {
              const servicesText = job.services.map((s) => s.serviceNameSnapshot).join(", ");
              return (
                <Link
                  key={job.id}
                  href={`/dashboard/job-cards/${job.id}`}
                  className="grid grid-cols-1 md:grid-cols-[160px_130px_1fr_130px_50px] gap-2 md:gap-4 px-5 py-4 md:px-6 md:py-3.5 items-center hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Column 1: Vehicle Number */}
                  <div className="flex justify-between md:block items-center">
                    <span className="font-extrabold text-sm text-slate-800 tracking-wide uppercase group-hover:text-[var(--primary-color)] transition-colors">
                      {job.vehicle.vehicleNumber.replace(/(.{2})(.{2})(.{2})(.{4})/, "$1-$2-$3-$4")}
                    </span>
                    <span className="md:hidden text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-slate-100 text-slate-500 uppercase">
                      {job.vehicle.vehicleType.toLowerCase()}
                    </span>
                  </div>

                  {/* Column 2: Status Badge */}
                  <div className="flex items-center justify-between md:block">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                    <span className="hidden md:inline-block ml-2 text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-slate-100 text-slate-500 uppercase">
                      {job.vehicle.vehicleType.toLowerCase()}
                    </span>
                  </div>

                  {/* Column 3: Services */}
                  <div className="text-xs font-semibold text-slate-600 truncate md:pr-4">
                    <span className="md:hidden text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Services:</span>
                    {servicesText || <span className="italic text-slate-400">No services selected</span>}
                  </div>

                  {/* Column 4: ETA / Time */}
                  <div className="text-xs text-slate-400 font-semibold flex items-center justify-between md:block">
                    <span className="md:hidden text-[10px] font-extrabold uppercase text-slate-400">Time:</span>
                    <div className="flex items-center gap-1.5">
                      {job.status === "DELIVERED" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5 text-[10px]">
                          <CheckCircle2 size={12} />
                          Delivered
                        </span>
                      ) : job.expectedCompletionTime ? (
                        <span className="flex items-center gap-1 font-bold text-slate-600">
                          <Clock size={12} className="text-slate-400" />
                          {formatTime(job.expectedCompletionTime)}
                        </span>
                      ) : (
                        <span>{formatTime(job.createdAt.toString())}</span>
                      )}
                    </div>
                  </div>

                  {/* Column 5: Arrow */}
                  <div className="hidden md:flex justify-end">
                    <ArrowRight
                      size={16}
                      className="text-slate-300 group-hover:text-[var(--primary-color)] group-hover:translate-x-1 transition-all duration-200"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-4 text-center space-y-2">
            <Filter className="mx-auto text-slate-300" size={32} />
            <p className="text-sm font-bold text-slate-500">No vehicles in this queue status.</p>
            <p className="text-xs text-slate-400">All detailing jobs for this status will show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
