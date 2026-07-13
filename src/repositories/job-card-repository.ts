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

const LIGHTWEIGHT_JOBCARD_SELECT = {
  id: true,
  status: true,
  expectedCompletionTime: true,
  createdAt: true,
  updatedAt: true,
  vehicle: {
    select: {
      id: true,
      vehicleNumber: true,
      vehicleType: true,
      brand: true,
      model: true,
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
      mobile: true,
    },
  },
  services: {
    select: {
      id: true,
      serviceNameSnapshot: true,
      priceSnapshot: true,
    },
  },
  invoice: {
    select: {
      id: true,
      finalAmount: true,
      status: true,
    },
  },
};

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
    select: LIGHTWEIGHT_JOBCARD_SELECT,
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
    select: LIGHTWEIGHT_JOBCARD_SELECT,
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getDashboardSummaryRepository(stationId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    activeJobsList,
    paidInvoicesSum,
    pendingInvoicesSum,
    todayBookings,
    recentDeliveredJobs,
  ] = await Promise.all([
    prisma.jobCard.findMany({
      where: {
        stationId,
        isDeleted: false,
        NOT: { status: { in: ["DELIVERED", "CANCELLED"] } },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        vehicle: { select: { vehicleNumber: true, vehicleType: true } },
        customer: { select: { name: true, mobile: true } },
        services: { select: { serviceNameSnapshot: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.aggregate({
      _sum: { finalAmount: true },
      where: {
        jobCard: { stationId },
        status: "PAID",
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.invoice.aggregate({
      _sum: { finalAmount: true },
      where: {
        jobCard: { stationId, isDeleted: false },
        status: "ISSUED",
      },
    }),
    prisma.booking.findMany({
      where: {
        stationId,
        scheduledAt: { gte: startOfDay },
        status: { not: "CANCELLED" },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      select: {
        id: true,
        customerName: true,
        vehicleNumber: true,
        scheduledAt: true,
        serviceName: true,
        status: true,
      },
    }),
    prisma.jobCard.findMany({
      where: { stationId, isDeleted: false, status: "DELIVERED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        updatedAt: true,
        vehicle: { select: { vehicleNumber: true } },
        customer: { select: { name: true } },
        invoice: { select: { finalAmount: true, status: true } },
      },
    }),
  ]);

  const waitingCount = activeJobsList.filter((j) => j.status === "RECEIVED").length;
  const inProgressCount = activeJobsList.filter((j) => j.status === "IN_PROGRESS").length;
  const completedCount = activeJobsList.filter((j) => j.status === "SERVICE_COMPLETED").length;
  const paymentPendingCount = activeJobsList.filter((j) => j.status === "PAYMENT_PENDING").length;

  return {
    revenueToday: Number(paidInvoicesSum._sum?.finalAmount || 0),
    outstandingAmount: Number(pendingInvoicesSum._sum?.finalAmount || 0),
    counts: {
      waiting: waitingCount,
      inProgress: inProgressCount,
      completed: completedCount,
      paymentPending: paymentPendingCount,
      totalActive: activeJobsList.length,
    },
    activeJobs: activeJobsList.slice(0, 10),
    todayBookings,
    recentDeliveredJobs,
  };
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
