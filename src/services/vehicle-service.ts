import { prisma } from "@/lib/prisma";
import type { VehicleType } from "@prisma/client";
import * as vehicleRepository from "@/repositories/vehicle-repository";

export async function createVehicle(data: {
  stationId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
}) {
  const normalized = data.vehicleNumber.toUpperCase().replace(/\s/g, "");
  const existing = await vehicleRepository.getVehicleByNumber(data.stationId, normalized);

  if (existing) {
    throw new Error("Vehicle with this registration number already exists.");
  }

  return vehicleRepository.createVehicle({
    ...data,
    vehicleNumber: normalized,
  });
}

export async function getVehicleById(id: string) {
  return vehicleRepository.getVehicleById(id);
}

export async function getVehicleByNumber(stationId: string, vehicleNumber: string) {
  return vehicleRepository.getVehicleByNumber(stationId, vehicleNumber);
}

export async function linkVehicleToCustomer(data: {
  vehicleId: string;
  customerId: string;
  isPrimary?: boolean;
}) {
  const vehicle = await vehicleRepository.getVehicleById(data.vehicleId);
  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const existingContact = vehicle.contacts.find((c) => c.customerId === data.customerId);
  if (existingContact) {
    return existingContact;
  }

  return vehicleRepository.linkVehicleToCustomer(data);
}

export async function searchVehicles(stationId: string, query: string) {
  return vehicleRepository.searchVehicles(stationId, query);
}

export async function getVehiclePassportDetails(id: string) {
  return vehicleRepository.getVehicleById(id);
}

export async function getVehiclePassport(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      contacts: {
        include: {
          customer: true,
        },
      },
      notes: {
        include: {
          author: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      jobCards: {
        where: { isDeleted: false },
        include: {
          services: true,
          invoice: {
            include: {
              payments: true
            }
          },
          report: true,
          creator: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      offerProgress: {
        include: {
          offer: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const deliveredJobs = vehicle.jobCards.filter((j) => j.status === "DELIVERED");
  const totalVisits = deliveredJobs.length;

  let totalSpend = 0;
  deliveredJobs.forEach((j) => {
    if (j.invoice && j.invoice.status === "PAID") {
      totalSpend += Number(j.invoice.finalAmount);
    }
  });

  const lastVisitDate = deliveredJobs.length > 0 ? deliveredJobs[0].createdAt : null;
  const lastVisit = lastVisitDate
    ? lastVisitDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "No visits yet";

  let averageVisitFrequency = "N/A";
  let daysInterval = 30;
  if (deliveredJobs.length > 1) {
    const dates = deliveredJobs.map((j) => j.createdAt.getTime()).reverse();
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    }
    daysInterval = totalDays / (dates.length - 1);
    averageVisitFrequency = `${Math.round(daysInterval)} days`;
  } else if (deliveredJobs.length === 1) {
    averageVisitFrequency = "First Visit";
  }

  let expectedNextVisit = "Standard (30 days)";
  if (lastVisitDate) {
    const nextDate = new Date(lastVisitDate.getTime() + daysInterval * 24 * 60 * 60 * 1000);
    expectedNextVisit = nextDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const serviceCounts: Record<string, number> = {};
  vehicle.jobCards.forEach((j) => {
    j.services.forEach((s) => {
      serviceCounts[s.serviceNameSnapshot] = (serviceCounts[s.serviceNameSnapshot] || 0) + 1;
    });
  });
  let favouriteService = "N/A";
  let maxCount = 0;
  for (const [serviceName, count] of Object.entries(serviceCounts)) {
    if (count > maxCount) {
      maxCount = count;
      favouriteService = serviceName;
    }
  }

  const { getStationEntitlements } = await import("@/lib/entitlement");
  const entitlements = await getStationEntitlements(vehicle.stationId);
  const stationMeta = entitlements.stationMetadata;

  const vipSpendLimit = stationMeta?.vipSpendThreshold ? Number(stationMeta.vipSpendThreshold) : 10000;
  const vipVisitLimit = stationMeta?.vipVisitThreshold ? Number(stationMeta.vipVisitThreshold) : 5;
  const isVip = totalSpend >= vipSpendLimit || totalVisits >= vipVisitLimit;
  const vipStatus = isVip ? "VIP" : "Regular";

  let dueStatus = "Active";
  if (lastVisitDate) {
    const now = new Date();
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit > daysInterval) {
      dueStatus = "Overdue";
    } else if (daysSinceLastVisit >= daysInterval - 5) {
      dueStatus = "Due Soon";
    } else {
      dueStatus = "Active";
    }
  } else {
    dueStatus = "Active";
  }

  const timeline: any[] = [];
  vehicle.jobCards.forEach((j) => {
    const jobDescription = j.status === "CANCELLED"
      ? `Job card CANCELLED. Reason: ${j.cancellationReason || "Other"}${j.cancellationNotes ? ` (${j.cancellationNotes})` : ""}`
      : `Job card created for ${j.services.map((s) => s.serviceNameSnapshot).join(", ") || "No services"}`;

    const paymentMethod = j.invoice?.payments?.[0]?.method || "CASH";
    const paymentDate = j.invoice?.payments?.[0]?.createdAt || j.invoice?.createdAt || j.updatedAt;

    timeline.push({
      id: j.id,
      type: "job",
      status: j.status,
      date: j.createdAt.toISOString(),
      description: jobDescription,
      meta: {
        services: j.services.map((s) => ({ name: s.serviceNameSnapshot, price: s.priceSnapshot })),
        invoice: j.invoice ? { amount: j.invoice.finalAmount, status: j.invoice.status } : null,
        report: j.report ? { secureSlug: j.report.secureSlug, createdAt: j.report.createdAt.toISOString() } : null,
      },
    });

    if (j.invoice && j.invoice.status === "PAID") {
      timeline.push({
        id: j.invoice.id,
        type: "payment",
        date: paymentDate.toISOString(),
        description: `Payment of ₹${j.invoice.finalAmount} received via ${paymentMethod}`,
      });
    }

    if (j.report) {
      timeline.push({
        id: j.report.id,
        type: "report",
        date: j.report.createdAt.toISOString(),
        description: `Service report generated.`,
        meta: {
          secureSlug: j.report.secureSlug,
        },
      });
    }
  });

  vehicle.notes.forEach((n) => {
    timeline.push({
      id: n.id,
      type: "note",
      noteType: n.type,
      date: n.createdAt.toISOString(),
      description: n.content,
      meta: {
        author: n.author.name,
      },
    });
  });

  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    vehicle: {
      id: vehicle.id,
      stationId: vehicle.stationId,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      tags: vehicle.tags,
      contacts: vehicle.contacts.map((c) => ({
        isPrimary: c.isPrimary,
        customer: {
          name: c.customer.name,
          mobile: c.customer.mobile,
          email: c.customer.email || null,
        },
      })),
      notes: vehicle.notes.map((n) => ({
        id: n.id,
        type: n.type,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
        author: {
          name: n.author.name,
        },
      })),
      offerProgress: vehicle.offerProgress.map((op) => ({
        id: op.id,
        currentCount: op.currentCount,
        rewardEarned: op.rewardEarned,
        rewardRedeemed: op.rewardRedeemed,
        offer: {
          id: op.offer.id,
          name: op.offer.name,
          targetCount: op.offer.targetCount,
          rewardDescription: op.offer.rewardDescription,
        },
      })),
    },
    metrics: {
      totalVisits,
      totalSpend,
      lastVisit,
      averageVisitFrequency,
      expectedNextVisit,
      favouriteService,
      vipStatus,
      dueStatus,
    },
    timeline,
  };
}

export const search = searchVehicles;

export async function registerNewVehicleAndCustomer(stationId: string, data: {
  vehicleNumber: string;
  vehicleType: VehicleType;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  customerName: string;
  customerMobile: string;
  customerEmail?: string | null;
}) {
  const customer = await prisma.customer.upsert({
    where: {
      stationId_mobile: {
        stationId,
        mobile: data.customerMobile,
      },
    },
    create: {
      stationId,
      name: data.customerName,
      mobile: data.customerMobile,
      email: data.customerEmail || null,
    },
    update: {
      name: data.customerName,
      email: data.customerEmail || null,
    },
  });

  const vehicle = await createVehicle({
    stationId,
    vehicleNumber: data.vehicleNumber,
    vehicleType: data.vehicleType,
    brand: data.brand,
    model: data.model,
    color: data.color,
  });

  await linkVehicleToCustomer({
    vehicleId: vehicle.id,
    customerId: customer.id,
    isPrimary: true,
  });

  return { vehicle, customer };
}

export const registerVehicleAndCustomer = registerNewVehicleAndCustomer;
