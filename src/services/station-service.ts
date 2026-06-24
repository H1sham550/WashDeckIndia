import * as stationRepository from "@/repositories/station-repository";

export async function getStationBranding(id: string) {
  const station = await stationRepository.getStationById(id);
  if (!station) {
    throw new Error("Station not found.");
  }
  return {
    id: station.id,
    name: station.name,
    slug: station.slug,
    logoUrl: station.logoUrl,
    bannerUrl: station.bannerUrl,
    primaryColor: station.primaryColor || "#0f766e", // Default teal
    phone: station.phone,
    email: station.email,
    address: station.address,
    upiId: station.upiId,
    gstNumber: station.gstNumber,
    status: station.status,
    vipSpendThreshold: Number(station.vipSpendThreshold),
    vipVisitThreshold: station.vipVisitThreshold,
    defaultEta: station.defaultEta,
    reportExpiryDays: station.reportExpiryDays,
    lostCustomerThresholdDays: station.lostCustomerThresholdDays,
    dueForVisitThreshold: station.dueForVisitThreshold,
    serviceCompletedTemplate: station.serviceCompletedTemplate || "",
    paymentReminderTemplate: station.paymentReminderTemplate || "",
    dueForVisitReminderTemplate: station.dueForVisitReminderTemplate || "",
    rewardEligibleTemplate: station.rewardEligibleTemplate || "",
  };
}

export async function updateStationBranding(id: string, data: stationRepository.UpdateStationInput) {
  // Validate basic constraints if necessary, e.g. checking color hex code
  if (data.primaryColor && !/^#[0-9A-F]{6}$/i.test(data.primaryColor)) {
    throw new Error("Invalid color format. Hex format #RRGGBB required.");
  }
  return stationRepository.updateStationBranding(id, data);
}
