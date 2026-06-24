import { prisma } from "@/lib/prisma";

export async function getStationById(id: string) {
  return prisma.station.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });
}

export async function getStationBySlug(slug: string) {
  return prisma.station.findFirst({
    where: {
      slug,
      isDeleted: false,
    },
  });
}

export type UpdateStationInput = {
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  upiId?: string | null;
  gstNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  vipSpendThreshold?: number;
  vipVisitThreshold?: number;
  defaultEta?: number;
  reportExpiryDays?: number;
  lostCustomerThresholdDays?: number;
  dueForVisitThreshold?: number;
  serviceCompletedTemplate?: string | null;
  paymentReminderTemplate?: string | null;
  dueForVisitReminderTemplate?: string | null;
  rewardEligibleTemplate?: string | null;
};

export async function updateStationBranding(id: string, data: UpdateStationInput) {
  return prisma.station.update({
    where: { id },
    data,
  });
}
