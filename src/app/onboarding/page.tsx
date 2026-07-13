import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await requireRole(["OWNER"]);

  const station = await prisma.station.findUnique({
    where: { id: session.stationId || "" },
    include: {
      branding: true,
      settings: true,
    },
  });

  if (!station) {
    redirect("/login");
  }

  if (station.status === "ACTIVE") {
    redirect("/dashboard");
  }

  const b = station.branding || ({} as any);
  const s = station.settings || ({} as any);

  return (
    <main className="min-h-screen bg-slate-50/50 py-12 px-4 md:px-8">
      <OnboardingWizard
        initialStation={{
          id: station.id,
          name: station.name,
          phone: b.businessPhone || "",
          email: b.businessEmail || "",
          address: b.businessAddress || "",
          gstNumber: "",
          logoUrl: b.squareLogoUrl || "",
          bannerUrl: b.bookingCoverUrl || "",
          primaryColor: b.primaryColor || "#0f766e",
          upiId: "",
          vipSpendThreshold: Number(s.vipSpendThreshold) || 10000,
          vipVisitThreshold: s.vipVisitThreshold || 5,
        }}
      />
    </main>
  );
}
