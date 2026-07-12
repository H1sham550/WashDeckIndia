import React from "react";
import { requireStationUser } from "@/lib/auth";
import * as jobCardService from "@/services/job-card-service";
import { OperationsBoard } from "@/components/dashboard/operations-board";
import { Clock, PlusCircle, Car, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const session = await requireStationUser();
  const stationId = session.stationId || "";

  const boardData = await jobCardService.getOperationsBoardData(stationId);

  function serializeJobs(jobs: any[]) {
    return jobs.map((job) => ({
      id: job.id,
      status: job.status,
      expectedCompletionTime: job.expectedCompletionTime ? job.expectedCompletionTime.toISOString() : null,
      createdAt: job.createdAt.toISOString(),
      vehicle: {
        id: job.vehicle.id,
        vehicleNumber: job.vehicle.vehicleNumber,
        vehicleType: job.vehicle.vehicleType,
        brand: job.vehicle.brand,
        model: job.vehicle.model,
      },
      customer: {
        name: job.customer.name,
        mobile: job.customer.mobile,
      },
      services: job.services.map((s: any) => ({
        serviceNameSnapshot: s.serviceNameSnapshot,
        priceSnapshot: Number(s.priceSnapshot),
      })),
    }));
  }

  const serializedBoardData = {
    RECEIVED: serializeJobs(boardData.RECEIVED),
    IN_PROGRESS: serializeJobs(boardData.IN_PROGRESS),
    SERVICE_COMPLETED: serializeJobs(boardData.SERVICE_COMPLETED),
    PAYMENT_PENDING: serializeJobs(boardData.PAYMENT_PENDING),
    DELIVERED: serializeJobs(boardData.DELIVERED),
  };

  const totalActive = 
    boardData.RECEIVED.length + 
    boardData.IN_PROGRESS.length + 
    boardData.SERVICE_COMPLETED.length + 
    boardData.PAYMENT_PENDING.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="text-[var(--primary-color)]" size={24} />
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Active Operations Queue</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track vehicles through detailing bays: Inspection → Before Photos → Service → After Photos → Payment & WhatsApp Report.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{totalActive} Active Bays</span>
          </div>
          <Link 
            href="/dashboard/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary-color)] text-white text-xs font-extrabold shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            <PlusCircle size={16} />
            <span>+ New Job Card</span>
          </Link>
        </div>
      </div>

      {/* Workflow Process Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-900 text-white p-4 rounded-2xl text-[11px] font-bold shadow-md">
        <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl">
          <span className="h-5 w-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">1</span>
          <span>Waiting & Intake</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl">
          <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">2</span>
          <span>Inspection / Photos</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl">
          <span className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">3</span>
          <span>In Detailing Bay</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl">
          <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">4</span>
          <span>Ready & Invoice</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-xl col-span-2 sm:col-span-1">
          <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">5</span>
          <span>Delivered via WhatsApp</span>
        </div>
      </div>

      {/* Main Operations Board / Kanban */}
      <OperationsBoard initialBoardData={serializedBoardData} />
    </div>
  );
}
