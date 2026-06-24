import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await requireRole(["OWNER"]);

  const station = await prisma.station.findUnique({
    where: { id: session.stationId || "" },
  });

  if (!station) {
    redirect("/login");
  }

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
          logoUrl: station.logoUrl || "",
          bannerUrl: station.bannerUrl || "",
          primaryColor: station.primaryColor || "#0f766e",
          phone: station.phone || "",
          email: station.email || "",
          address: station.address || "",
          upiId: station.upiId || "",
          gstNumber: station.gstNumber || "",
          vipSpendThreshold: Number(station.vipSpendThreshold),
          vipVisitThreshold: station.vipVisitThreshold,
          defaultEta: station.defaultEta ?? 120,
          reportExpiryDays: station.reportExpiryDays ?? 30,
          lostCustomerThresholdDays: station.lostCustomerThresholdDays ?? 60,
          dueForVisitThreshold: station.dueForVisitThreshold ?? 30,
          serviceCompletedTemplate: station.serviceCompletedTemplate || "Hi {customerName}, your vehicle {vehicleNumber} has been serviced successfully. Invoice & report: {reportUrl}",
          paymentReminderTemplate: station.paymentReminderTemplate || "Hi {customerName}, friendly reminder that payment of {amount} is pending for vehicle {vehicleNumber}. UPI ID: {upiId}",
          dueForVisitReminderTemplate: station.dueForVisitReminderTemplate || "Hi {customerName}, your vehicle {vehicleNumber} is due for its next service visit at WashDeck. We hope to see you soon!",
          rewardEligibleTemplate: station.rewardEligibleTemplate || "Congratulations {customerName}! Your vehicle {vehicleNumber} has unlocked a loyalty reward. Redeem it on your next visit!",
        }}
      />
    </div>
  );
}
