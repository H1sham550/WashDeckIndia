import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await requireRole(["OWNER"]);

  const station = await prisma.station.findUnique({
    where: { id: session.stationId || "" },
    include: {
      branding: true,
      settings: true,
      country: true,
    },
  });

  if (!station) {
    redirect("/login");
  }

  const b = station.branding || ({} as any);
  const s = station.settings || ({} as any);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Station Settings</h1>
        <p className="text-sm text-slate-500">
          Configure branding, detailing operations parameters, and custom WhatsApp messaging templates.
        </p>
      </div>
      <SettingsForm
        station={{
          name: station.name,
          logoUrl: b.squareLogoUrl || "",
          bannerUrl: b.bookingCoverUrl || "",
          primaryColor: b.primaryColor || "#0f766e",
          phone: b.businessPhone || "",
          email: b.businessEmail || "",
          address: b.businessAddress || "",
          upiId: "",
          gstNumber: "",
          vipSpendThreshold: Number(s.vipSpendThreshold || 10000),
          vipVisitThreshold: Number(s.vipVisitThreshold || 5),
          defaultEta: s.bookingLeadTime ?? 120,
          reportExpiryDays: 30,
          lostCustomerThresholdDays: 60,
          dueForVisitThreshold: 30,
          serviceCompletedTemplate: "Hi {customerName}, your vehicle {vehicleNumber} has been serviced successfully. Invoice & report: {reportUrl}",
          paymentReminderTemplate: "Hi {customerName}, friendly reminder that payment of {amount} is pending for vehicle {vehicleNumber}.",
          dueForVisitReminderTemplate: "Hi {customerName}, your vehicle {vehicleNumber} is due for its next service visit. We hope to see you soon!",
          rewardEligibleTemplate: "Congratulations {customerName}! Your vehicle {vehicleNumber} has unlocked a loyalty reward. Redeem it on your next visit!",
          locale: station.country?.defaultLocale || "en-SA",
          currency: station.country?.currencyCode || "SAR",
        }}
      />
    </div>
  );
}
