import * as jobCardRepository from "@/repositories/job-card-repository";
import * as vehicleRepository from "@/repositories/vehicle-repository";
import * as customerRepository from "@/repositories/customer-repository";
import { prisma } from "@/lib/prisma";
import type { JobStatus } from "@prisma/client";
import { checkStationStatus } from "@/lib/subscription-guard";

export type CreateJobCardPayload = {
  vehicleId: string;
  serviceIds: string[];
  inspectionNotes?: string;
  expectedCompletionTime?: string; // ISO string
  beforePhotos?: string[];
};

export async function createJobCard(
  stationId: string,
  creatorId: string,
  payload: CreateJobCardPayload
) {
  await checkStationStatus(stationId);

  const vehicle = await vehicleRepository.getVehicleById(payload.vehicleId);
  if (!vehicle || vehicle.stationId !== stationId) {
    throw new Error("Vehicle not found or unauthorized.");
  }

  const primaryContact = vehicle.contacts.find((c: any) => c.isPrimary) || vehicle.contacts[0];
  if (!primaryContact) {
    throw new Error("Vehicle is not linked to any customer contact.");
  }
  const customerId = primaryContact.customerId;

  const services = await prisma.service.findMany({
    where: {
      id: { in: payload.serviceIds },
      stationId,
      isDeleted: false,
    },
    include: {
      prices: {
        where: { vehicleType: vehicle.vehicleType },
      },
    },
  });

  if (services.length !== payload.serviceIds.length) {
    throw new Error("Some selected services were not found or belong to another station.");
  }

  const serviceSnapshots = await Promise.all(
    services.map(async (s) => {
      let priceObj = s.prices[0];
      if (!priceObj) {
        const fallback = await prisma.servicePrice.findFirst({
          where: { serviceId: s.id },
        });
        return {
          serviceId: s.id,
          serviceNameSnapshot: s.name,
          priceSnapshot: fallback ? Number(fallback.price) : 0,
        };
      }
      return {
        serviceId: s.id,
        serviceNameSnapshot: s.name,
        priceSnapshot: Number(priceObj.price),
      };
    })
  );

  const jobCard = await jobCardRepository.createJobCard({
    stationId,
    vehicleId: vehicle.id,
    customerId,
    creatorId,
    expectedCompletionTime: payload.expectedCompletionTime ? new Date(payload.expectedCompletionTime) : null,
    services: serviceSnapshots,
    inspectionNotes: payload.inspectionNotes,
    beforePhotos: payload.beforePhotos,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: creatorId,
      stationId,
      action: "Job Created",
      entityType: "JobCard",
      entityId: jobCard.id,
      newValue: { vehicleNumber: vehicle.vehicleNumber },
    },
  });

  return jobCard;
}

export async function getJobCardDetails(stationId: string, id: string) {
  const job = await jobCardRepository.getJobCardById(id);
  if (!job || job.stationId !== stationId) {
    throw new Error("Job card not found or unauthorized.");
  }
  return job;
}

export async function updateStatus(
  stationId: string,
  userId: string,
  id: string,
  status: JobStatus,
  cancellationData?: { reason: string; notes?: string }
) {
  await checkStationStatus(stationId);

  const job = await jobCardRepository.getJobCardById(id);
  if (!job || job.stationId !== stationId) {
    throw new Error("Job card not found or unauthorized.");
  }

  if (job.status === "DELIVERED" || job.status === "CANCELLED") {
    throw new Error("Delivered and cancelled job cards are archived and read-only.");
  }

  const updatedJob = await jobCardRepository.updateJobCardStatus(id, status, cancellationData);

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      stationId,
      action: `Job Status Updated to ${status}`,
      entityType: "JobCard",
      entityId: id,
    },
  });

  return updatedJob;
}

import { cache } from "react";
import { unstable_cache } from "next/cache";

// Per-instance in-memory fallback (sub-ms for same-instance hits)
const operationsBoardLocalCache = new Map<string, { data: any; expiresAt: number }>();
const dashboardSummaryLocalCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 60000; // 60s local fallback

export function invalidateDashboardCache(stationId?: string) {
  if (stationId) {
    dashboardSummaryLocalCache.delete(stationId);
    operationsBoardLocalCache.delete(stationId);
  } else {
    dashboardSummaryLocalCache.clear();
    operationsBoardLocalCache.clear();
  }
}

// Fetches operations board data - wrapped in unstable_cache for cross-instance persistence
async function fetchOperationsBoardData(stationId: string) {
  const [activeJobs, deliveredToday] = await Promise.all([
    jobCardRepository.getActiveJobCardsByStation(stationId),
    jobCardRepository.getDeliveredJobCardsByStationToday(stationId),
  ]);
  return {
    RECEIVED: activeJobs.filter((j: any) => j.status === "RECEIVED"),
    IN_PROGRESS: activeJobs.filter((j: any) => j.status === "IN_PROGRESS"),
    SERVICE_COMPLETED: activeJobs.filter((j: any) => j.status === "SERVICE_COMPLETED"),
    PAYMENT_PENDING: activeJobs.filter((j: any) => j.status === "PAYMENT_PENDING"),
    DELIVERED: deliveredToday,
  };
}

export const getOperationsBoardData = cache(async (stationId: string) => {
  // L1: Same-instance memory
  const now = Date.now();
  const local = operationsBoardLocalCache.get(stationId);
  if (local && local.expiresAt > now) return local.data;

  try {
    // L2: Next.js Data Cache (shared across all Lambda instances)
    const cachedFetch = unstable_cache(
      () => fetchOperationsBoardData(stationId),
      [`operations_board_${stationId}`],
      { revalidate: 30, tags: [`operations_board_${stationId}`] }
    );
    const result = await cachedFetch();
    operationsBoardLocalCache.set(stationId, { data: result, expiresAt: now + CACHE_TTL_MS });
    return result;
  } catch {
    return {
      RECEIVED: [] as any,
      IN_PROGRESS: [] as any,
      SERVICE_COMPLETED: [],
      PAYMENT_PENDING: [],
      DELIVERED: [],
    };
  }
});

export const getDashboardSummary = cache(async (stationId: string) => {
  // L1: Same-instance memory
  const now = Date.now();
  const local = dashboardSummaryLocalCache.get(stationId);
  if (local && local.expiresAt > now) return local.data;

  // L2: Next.js Data Cache (shared across all Lambda instances)
  const cachedFetch = unstable_cache(
    () => jobCardRepository.getDashboardSummaryRepository(stationId),
    [`dashboard_summary_${stationId}`],
    { revalidate: 30, tags: [`dashboard_summary_${stationId}`] }
  );
  const summary = await cachedFetch();
  dashboardSummaryLocalCache.set(stationId, { data: summary, expiresAt: now + CACHE_TTL_MS });
  return summary;
});

