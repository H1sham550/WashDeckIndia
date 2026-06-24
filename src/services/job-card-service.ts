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
  // Check subscription status guard
  await checkStationStatus(stationId);

  // 1. Fetch vehicle and verify station bounds
  const vehicle = await vehicleRepository.getVehicleById(payload.vehicleId);
  if (!vehicle || vehicle.stationId !== stationId) {
    throw new Error("Vehicle not found or unauthorized.");
  }

  // 2. Determine primary customer
  const primaryContact = vehicle.contacts.find((c) => c.isPrimary) || vehicle.contacts[0];
  if (!primaryContact) {
    throw new Error("Vehicle is not linked to any customer contact.");
  }
  const customerId = primaryContact.customerId;

  // 3. Resolve service pricing snapshots for the vehicle's type
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

  const serviceSnapshots = services.map((s) => {
    const priceObj = s.prices[0];
    if (!priceObj) {
      throw new Error(`Pricing not configured for service "${s.name}" and vehicle type ${vehicle.vehicleType}`);
    }
    return {
      serviceId: s.id,
      serviceNameSnapshot: s.name,
      priceSnapshot: Number(priceObj.price),
    };
  });

  // 4. Create Job Card in database
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

  // 5. Log audit trail
  await prisma.auditLog.create({
    data: {
      actorUserId: creatorId,
      stationId,
      action: "Job Created",
      entityType: "JobCard",
      entityId: jobCard.id,
      metadataJson: { vehicleNumber: vehicle.vehicleNumber },
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
  // Check subscription status guard
  await checkStationStatus(stationId);

  const job = await jobCardRepository.getJobCardById(id);
  if (!job || job.stationId !== stationId) {
    throw new Error("Job card not found or unauthorized.");
  }

  if (job.status === "DELIVERED" || job.status === "CANCELLED") {
    throw new Error("Delivered and cancelled job cards are archived and read-only.");
  }

  const updatedJob = await jobCardRepository.updateJobCardStatus(id, status, cancellationData);

  // Log audit trail
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

export async function getOperationsBoardData(stationId: string) {
  const activeJobs = await jobCardRepository.getActiveJobCardsByStation(stationId);
  const deliveredToday = await jobCardRepository.getDeliveredJobCardsByStationToday(stationId);

  // Group by Kanban columns
  return {
    RECEIVED: activeJobs.filter((j) => j.status === "RECEIVED"),
    IN_PROGRESS: activeJobs.filter((j) => j.status === "IN_PROGRESS"),
    SERVICE_COMPLETED: activeJobs.filter((j) => j.status === "SERVICE_COMPLETED"),
    PAYMENT_PENDING: activeJobs.filter((j) => j.status === "PAYMENT_PENDING"),
    DELIVERED: deliveredToday,
  };
}
