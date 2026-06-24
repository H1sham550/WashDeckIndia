import { prisma } from "@/lib/prisma";
import type { JobStatus } from "@prisma/client";

export type CreateJobCardServiceInput = {
  serviceId: string;
  serviceNameSnapshot: string;
  priceSnapshot: number;
};

export type CreateJobCardInput = {
  stationId: string;
  vehicleId: string;
  customerId: string;
  creatorId: string;
  expectedCompletionTime?: Date | null;
  services: CreateJobCardServiceInput[];
  inspectionNotes?: string | null;
  beforePhotos?: string[];
};

export async function createJobCard(data: CreateJobCardInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Create Job Card
    const jobCard = await tx.jobCard.create({
      data: {
        stationId: data.stationId,
        vehicleId: data.vehicleId,
        customerId: data.customerId,
        creatorId: data.creatorId,
        status: "RECEIVED",
        expectedCompletionTime: data.expectedCompletionTime,
      },
    });

    // 2. Add Services snapshots
    if (data.services && data.services.length > 0) {
      await tx.jobCardService.createMany({
        data: data.services.map((s) => ({
          jobCardId: jobCard.id,
          serviceId: s.serviceId,
          serviceNameSnapshot: s.serviceNameSnapshot,
          priceSnapshot: s.priceSnapshot,
        })),
      });
    }

    // 3. Add Inspection
    if (data.inspectionNotes) {
      await tx.inspection.create({
        data: {
          jobCardId: jobCard.id,
          notes: data.inspectionNotes,
        },
      });
    }

    // 4. Add Before Photos
    if (data.beforePhotos && data.beforePhotos.length > 0) {
      await tx.jobPhoto.createMany({
        data: data.beforePhotos.map((url) => ({
          jobCardId: jobCard.id,
          url,
          type: "BEFORE",
        })),
      });
    }

    return jobCard;
  });
}

export async function getJobCardById(id: string) {
  return prisma.jobCard.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      vehicle: {
        include: {
          contacts: {
            include: {
              customer: true,
            },
          },
        },
      },
      customer: true,
      creator: true,
      services: true,
      inspection: true,
      photos: true,
      invoice: true,
      report: true,
    },
  });
}

export async function getActiveJobCardsByStation(stationId: string) {
  return prisma.jobCard.findMany({
    where: {
      stationId,
      isDeleted: false,
      NOT: {
        status: {
          in: ["DELIVERED", "CANCELLED"],
        },
      },
    },
    include: {
      vehicle: true,
      customer: true,
      services: true,
      invoice: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getDeliveredJobCardsByStationToday(stationId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return prisma.jobCard.findMany({
    where: {
      stationId,
      status: "DELIVERED",
      isDeleted: false,
      updatedAt: {
        gte: startOfDay,
      },
    },
    include: {
      vehicle: true,
      customer: true,
      services: true,
      invoice: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function updateJobCardStatus(
  id: string,
  status: JobStatus,
  cancellationData?: { reason: string; notes?: string }
) {
  return prisma.jobCard.update({
    where: { id },
    data: {
      status,
      cancellationReason: cancellationData?.reason || null,
      cancellationNotes: cancellationData?.notes || null,
      deletedAt: status === "CANCELLED" ? new Date() : null, // Soft delete logic is optional for cancel but timeline preserves it
    },
  });
}
