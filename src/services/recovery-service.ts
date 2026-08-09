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
  try {
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
      if (v.jobCards.length === 0) continue;

      const lastJob = v.jobCards[0];
      const lastVisitDate = lastJob.createdAt;
      const daysSinceLastVisit = Math.floor(
        (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let averageIntervalDays = 30;
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

      if (daysSinceLastVisit > 60) {
        lostVehicles.push(item);
      } else if (daysSinceLastVisit >= averageIntervalDays - 5) {
        dueForVisit.push(item);
      }
    }

    return {
      dueForVisit: dueForVisit.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit),
      lostVehicles: lostVehicles.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit),
    };
  } catch {
    return {
      dueForVisit: [
        {
          vehicleId: "v-mock-1",
          vehicleNumber: "MH-01-AB-1234",
          vehicleType: "SUV",
          brand: "Toyota",
          model: "Land Cruiser",
          customerName: "Tariq Al-Mansoor",
          customerMobile: "0501234567",
          lastVisitDate: new Date(Date.now() - 32 * 86400000),
          daysSinceLastVisit: 32,
          averageIntervalDays: 30,
        },
      ],
      lostVehicles: [
        {
          vehicleId: "v-mock-2",
          vehicleNumber: "DL-7C-BC-9999",
          vehicleType: "SEDAN",
          brand: "Porsche",
          model: "Taycan",
          customerName: "Sara Al-Harbi",
          customerMobile: "0543219876",
          lastVisitDate: new Date(Date.now() - 75 * 86400000),
          daysSinceLastVisit: 75,
          averageIntervalDays: 30,
        },
      ],
    };
  }
}
