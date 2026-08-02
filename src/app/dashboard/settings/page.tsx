import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await requireStationUser();

  if (session.role !== "OWNER") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Store Owner Access Required</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
          Station branding, operational parameters, and messaging template configurations are restricted to Store Owners. You are currently logged in as Staff ({session.name}).
        </p>
        <div>
          <Link href="/dashboard" className="btn btn-primary inline-flex">
            Back to Operations Dashboard
          </Link>
        </div>
      </div>
    );
  }

  let station: any = null;
  try {
    station = await prisma.station.findUnique({
      where: { id: session.stationId || "" },
      include: {
        branding: true,
        settings: true,
        country: true,
      },
    });
  } catch (err) {
    console.error("Failed to fetch station settings:", err);
    station = null;
  }

  const b = station?.branding || ({} as any);
  const s = station?.settings || ({} as any);

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
          name: station?.name || "",
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
          locale: station?.country?.defaultLocale || "en-SA",
          currency: station?.country?.currencyCode || "SAR",
        }}
      />
    </div>
  );
}
