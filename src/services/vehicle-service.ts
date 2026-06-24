import { prisma } from "@/lib/prisma";
import * as vehicleRepository from "@/repositories/vehicle-repository";
import * as customerRepository from "@/repositories/customer-repository";
import type { VehicleType } from "@prisma/client";
import { checkStationStatus } from "@/lib/subscription-guard";

export type RegisterVehicleInput = {
  vehicleNumber: string;
  vehicleType: VehicleType;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  customerName: string;
  customerMobile: string;
  customerEmail?: string | null;
};

export async function registerVehicleAndCustomer(
  stationId: string,
  input: RegisterVehicleInput
) {
  await checkStationStatus(stationId);

  const normalizedNumber = input.vehicleNumber.toUpperCase().replace(/\s/g, "");

  // 1. Check if vehicle is already registered
  const existingVehicle = await vehicleRepository.getVehicleByNumber(stationId, normalizedNumber);
  if (existingVehicle) {
    throw new Error(`Vehicle ${input.vehicleNumber} is already registered at this station.`);
  }

  // 2. Find or create the customer by mobile number
  let customer = await customerRepository.getCustomerByMobile(stationId, input.customerMobile);
  if (!customer) {
    customer = await customerRepository.createCustomer({
      stationId,
      name: input.customerName,
      mobile: input.customerMobile,
      email: input.customerEmail || null,
    });
  }

  // 3. Create the vehicle
  const vehicle = await vehicleRepository.createVehicle({
    stationId,
    vehicleNumber: normalizedNumber,
    vehicleType: input.vehicleType,
    brand: input.brand || null,
    model: input.model || null,
    color: input.color || null,
  });

  // 4. Link vehicle and customer contacts (marked as primary)
  await vehicleRepository.linkVehicleToCustomer({
    vehicleId: vehicle.id,
    customerId: customer.id,
    isPrimary: true,
  });

  return { vehicle, customer };
}

export async function search(stationId: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }
  return vehicleRepository.searchVehicles(stationId, trimmed);
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
          invoice: true,
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
    if (j.invoice && j.invoice.paymentStatus === "PAID") {
      totalSpend += Number(j.invoice.finalAmount);
    }
  });

  const lastVisit = deliveredJobs.length > 0 ? deliveredJobs[0].createdAt : null;

  // Calculate Average Visit Frequency (in days)
  let averageVisitFrequency = "N/A";
  let daysInterval = 30; // default expected interval
  if (deliveredJobs.length > 1) {
    const dates = deliveredJobs.map((j) => j.createdAt.getTime()).reverse(); // oldest to newest
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    }
    daysInterval = totalDays / (dates.length - 1);
    averageVisitFrequency = `${Math.round(daysInterval)} days`;
  } else if (deliveredJobs.length === 1) {
    averageVisitFrequency = "First Visit";
  }

  // Calculate Expected Next Visit
  let expectedNextVisit = "Standard (30 days)";
  if (lastVisit) {
    const nextDate = new Date(lastVisit.getTime() + daysInterval * 24 * 60 * 60 * 1000);
    expectedNextVisit = nextDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Calculate Favourite Service
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

  // Calculate VIP Status using station-specific rules
  const station = await prisma.station.findUnique({
    where: { id: vehicle.stationId },
  });

  const vipSpendLimit = station ? Number(station.vipSpendThreshold) : 10000;
  const vipVisitLimit = station ? station.vipVisitThreshold : 5;
  const isVip = totalSpend >= vipSpendLimit || totalVisits >= vipVisitLimit;
  const vipStatus = isVip ? "VIP" : "Regular";

  // Calculate Due For Visit Status
  let dueStatus = "Active";
  if (lastVisit) {
    const now = new Date();
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit > daysInterval) {
      dueStatus = "Overdue";
    } else if (daysSinceLastVisit >= daysInterval - 5) {
      dueStatus = "Due Soon";
    } else {
      dueStatus = "Active";
    }
  } else {
    dueStatus = "Active"; // No history yet
  }

  // Build Service Timeline
  const timeline: any[] = [];
  vehicle.jobCards.forEach((j) => {
    const jobDescription = j.status === "CANCELLED"
      ? `Job card CANCELLED. Reason: ${j.cancellationReason || "Other"}${j.cancellationNotes ? ` (${j.cancellationNotes})` : ""}`
      : `Job card created for ${j.services.map((s) => s.serviceNameSnapshot).join(", ") || "No services"}`;

    timeline.push({
      id: j.id,
      type: "job",
      status: j.status,
      date: j.createdAt,
      description: jobDescription,
      meta: {
        services: j.services.map((s) => ({ name: s.serviceNameSnapshot, price: s.priceSnapshot })),
        invoice: j.invoice ? { amount: j.invoice.finalAmount, status: j.invoice.paymentStatus } : null,
        report: j.report ? { secureSlug: j.report.secureSlug, createdAt: j.report.createdAt } : null,
      },
    });

    if (j.invoice && j.invoice.paymentStatus === "PAID") {
      timeline.push({
        id: j.invoice.id,
        type: "payment",
        date: j.invoice.updatedAt,
        description: `Payment of ₹${j.invoice.finalAmount} received via ${j.invoice.paymentMethod || "CASH"}`,
      });
    }

    if (j.report) {
      timeline.push({
        id: j.report.id,
        type: "report",
        date: j.report.createdAt,
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
      date: n.createdAt,
      description: `Note added by ${n.author.name}: "${n.content}"`,
    });
  });

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first

  return {
    vehicle,
    metrics: {
      totalVisits,
      totalSpend,
      lastVisit: lastVisit ? lastVisit.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) : "Never",
      averageVisitFrequency,
      expectedNextVisit,
      favouriteService,
      vipStatus,
      dueStatus,
    },
    timeline,
  };
}
