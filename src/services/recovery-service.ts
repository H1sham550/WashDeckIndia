import { prisma } from "@/lib/prisma";

export type RecoveryItem = {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  brand: string | null;
  model: string | null;
  customerName: string;
  customerMobile: string;
  lastVisitDate: Date;
  daysSinceLastVisit: number;
  averageIntervalDays: number;
};

export async function getRecoveryDashboardData(stationId: string) {
  // Fetch all vehicles at the station along with their primary customer contacts and completed job cards
  const vehicles = await prisma.vehicle.findMany({
    where: {
      stationId,
      isDeleted: false,
    },
    include: {
      contacts: {
        include: {
          customer: true,
        },
      },
      jobCards: {
        where: {
          status: "DELIVERED",
          isDeleted: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const dueForVisit: RecoveryItem[] = [];
  const lostVehicles: RecoveryItem[] = [];

  const now = new Date();

  for (const v of vehicles) {
    if (v.jobCards.length === 0) continue; // No history to track

    const lastJob = v.jobCards[0];
    const lastVisitDate = lastJob.createdAt;
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate average interval
    let averageIntervalDays = 30; // default 30 days
    if (v.jobCards.length > 1) {
      const dates = v.jobCards.map((j) => j.createdAt.getTime()).reverse();
      let totalDays = 0;
      for (let i = 1; i < dates.length; i++) {
        totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      }
      averageIntervalDays = Math.round(totalDays / (dates.length - 1)) || 30;
    }

    const primaryContact = v.contacts.find((c) => c.isPrimary)?.customer || v.contacts[0]?.customer;
    if (!primaryContact) continue;

    const item: RecoveryItem = {
      vehicleId: v.id,
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
      brand: v.brand,
      model: v.model,
      customerName: primaryContact.name,
      customerMobile: primaryContact.mobile,
      lastVisitDate,
      daysSinceLastVisit,
      averageIntervalDays,
    };

    // lost if no visit in over 60 days
    if (daysSinceLastVisit > 60) {
      lostVehicles.push(item);
    }
    // due for visit if days since last visit is greater than average interval (or within 5 days of it)
    else if (daysSinceLastVisit >= averageIntervalDays - 5) {
      dueForVisit.push(item);
    }
  }

  return {
    dueForVisit: dueForVisit.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit),
    lostVehicles: lostVehicles.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit),
  };
}
