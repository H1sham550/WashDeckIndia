import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OffersPanel } from "@/components/dashboard/offers-panel";
import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { ShieldAlert } from "lucide-react";

export default async function OffersPage() {
  const session = await requireStationUser();

  const enabled = await isFeatureEnabled(session.stationId, "offers");
  if (!enabled) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4 font-sans">
        <div className="h-14 w-14 bg-amber-50 text-amber-600 flex items-center justify-center rounded-full mx-auto">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Feature Locked</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Loyalty Offers & Campaigns are not enabled under your current subscription plan. Upgrade your plan in settings to unlock customer stamp campaigns.
        </p>
      </div>
    );
  }

  const offers = await prisma.offer.findMany({
    where: {
      stationId: session.stationId,
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });

  const services = await prisma.service.findMany({
    where: {
      stationId: session.stationId,
      isDeleted: false,
    },
    orderBy: { name: "asc" },
  });

  // Serialize date timestamps to ISO strings for hydration safety
  const serializedOffers = offers.map((offer) => ({
    id: offer.id,
    name: offer.name,
    description: offer.description,
    type: offer.type,
    targetCount: offer.targetCount,
    rewardDescription: offer.rewardDescription,
    isActive: offer.isActive,
    rulesJson: offer.rulesJson,
    createdAt: offer.createdAt.toISOString(),
  }));

  const serializedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-sans">Loyalty Offers & Campaigns</h1>
        <p className="text-sm text-slate-500 font-medium">
          Reward your repeat customers with digital stamps that increment automatically upon payment confirmation.
        </p>
      </div>
      <OffersPanel initialOffers={serializedOffers} services={serializedServices} />
    </div>
  );
}
