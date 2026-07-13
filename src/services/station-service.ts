import * as stationRepository from "@/repositories/station-repository";

export async function getStationBranding(id: string) {
  const station = await stationRepository.getStationById(id);
  if (!station) {
    throw new Error("Station not found.");
  }

  const b = station.branding || ({} as any);
  const s = station.settings || ({} as any);
  const c = station.country || ({} as any);

  return {
    id: station.id,
    name: station.name,
    slug: station.slug,
    branchCode: station.branchCode,
    logoUrl: b.squareLogoUrl || null,
    bannerUrl: b.bookingCoverUrl || null,
    primaryColor: b.primaryColor || "#0F172A",
    phone: b.businessPhone || null,
    email: b.businessEmail || null,
    address: b.businessAddress || null,
    upiId: null,
    gstNumber: null,
    status: station.status,
    vipSpendThreshold: s.vipSpendThreshold || 10000,
    vipVisitThreshold: s.vipVisitThreshold || 5,
    defaultEta: s.bookingLeadTime || 120,
    reportExpiryDays: 30,
    lostCustomerThresholdDays: 60,
    dueForVisitThreshold: 30,
    serviceCompletedTemplate: "",
    paymentReminderTemplate: "",
    dueForVisitReminderTemplate: "",
    rewardEligibleTemplate: "",
    currency: c.currencyCode || "SAR",
    locale: c.defaultLocale || "ar-SA"
  };
}

export async function updateStationBranding(id: string, data: stationRepository.UpdateStationInput) {
  if (data.primaryColor && !/^#[0-9A-F]{6}$/i.test(data.primaryColor)) {
    throw new Error("Invalid color format. Hex format #RRGGBB required.");
  }
  return stationRepository.updateStationBranding(id, data);
}
