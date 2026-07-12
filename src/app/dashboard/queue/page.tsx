import React from "react";
import { requireStationUser } from "@/lib/auth";
import * as jobCardService from "@/services/job-card-service";
import { OperationsBoard } from "@/components/dashboard/operations-board";
import { Clock, Plus } from "lucide-react";
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
      expectedCompletionTime: job.expectedCompletionTime
        ? job.expectedCompletionTime.toISOString()
        : null,
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
    <div className="space-y-4 max-w-[1600px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="wd-page-title">Operations Queue</h1>
          <p className="wd-body mt-0.5">
            {totalActive} active &middot;{" "}
            {boardData.DELIVERED.length} delivered today
          </p>
        </div>
        <Link href="/dashboard/jobs/new" className="btn btn-primary">
          <Plus size={15} strokeWidth={2} />
          New Job
        </Link>
      </div>

      {/* Kanban board */}
      <OperationsBoard initialBoardData={serializedBoardData} />
    </div>
  );
}
