import { prisma } from "@/lib/prisma";
import { clearStationEntitlementCache } from "@/lib/entitlement";

export async function getStationById(id: string) {
  return prisma.station.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      branding: true,
      settings: true,
      country: true,
      region: true
    }
  });
}

export async function getStationBySlug(slug: string) {
  return prisma.station.findFirst({
    where: {
      slug,
      isDeleted: false,
    },
    include: {
      branding: true,
      settings: true,
      country: true,
      region: true
    }
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
  locale?: string;
  currency?: string;
};

export async function updateStationBranding(id: string, data: UpdateStationInput) {
  const st = await prisma.station.findUnique({ where: { id }, select: { countryId: true } });
  await prisma.station.update({
    where: { id },
    data: { name: data.name }
  });

  if (st?.countryId && (data.locale || data.currency)) {
    await prisma.country.update({
      where: { id: st.countryId },
      data: {
        ...(data.locale
          ? {
              defaultLocale: data.locale,
              isRTL: data.locale.startsWith("ar"),
            }
          : {}),
        ...(data.currency ? { currencyCode: data.currency } : {}),
      },
    });
  }

  await prisma.stationBranding.upsert({
    where: { stationId: id },
    create: {
      stationId: id,
      squareLogoUrl: data.logoUrl || null,
      bookingCoverUrl: data.bannerUrl || null,
      primaryColor: data.primaryColor || "#0F172A",
      businessPhone: data.phone || null,
      businessEmail: data.email || null,
      businessAddress: data.address || null
    },
    update: {
      squareLogoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
      bookingCoverUrl: data.bannerUrl !== undefined ? data.bannerUrl : undefined,
      primaryColor: data.primaryColor !== undefined ? (data.primaryColor || "#0F172A") : undefined,
      businessPhone: data.phone !== undefined ? data.phone : undefined,
      businessEmail: data.email !== undefined ? data.email : undefined,
      businessAddress: data.address !== undefined ? data.address : undefined
    }
  });

  if (data.defaultEta !== undefined || data.vipSpendThreshold !== undefined || data.vipVisitThreshold !== undefined) {
    await prisma.stationSettings.upsert({
      where: { stationId: id },
      create: {
        stationId: id,
        bookingLeadTime: data.defaultEta,
      },
      update: {
        bookingLeadTime: data.defaultEta !== undefined ? data.defaultEta : undefined,
      },
    });
  }

  clearStationEntitlementCache(id);

  return getStationById(id);
}
