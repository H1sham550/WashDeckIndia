import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await requireRole(["OWNER"]);

  const station = await prisma.station.findUnique({
    where: { id: session.stationId || "" },
  });

  if (!station) {
    redirect("/login");
  }

  // If onboarding is already completed, they shouldn't be here
  if (station.onboardingStatus === "COMPLETED") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50/50 py-12 px-4 md:px-8">
      <OnboardingWizard
        initialStation={{
          id: station.id,
          name: station.name,
          phone: station.phone || "",
          email: station.email || "",
          address: station.address || "",
          gstNumber: station.gstNumber || "",
          logoUrl: station.logoUrl || "",
          bannerUrl: station.bannerUrl || "",
          primaryColor: station.primaryColor || "#0f766e",
          upiId: station.upiId || "",
          vipSpendThreshold: Number(station.vipSpendThreshold) || 10000,
          vipVisitThreshold: station.vipVisitThreshold || 5,
        }}
      />
    </main>
  );
}
