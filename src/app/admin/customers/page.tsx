import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomersPanel, type CustomerStation } from "@/components/admin/customers-panel";

export default async function CustomersPage() {
  await requireRole(["SUPER_ADMIN"]);

  const stationsRaw = await prisma.station.findMany({
    where: { isDeleted: false },
    include: {
      branding: true,
      users: {
        where: { role: "OWNER", isDeleted: false },
        select: { id: true, name: true, email: true },
        take: 1,
      },
      stationSubscriptions: {
        orderBy: { endDate: "desc" },
        include: { subscription: { select: { name: true } } },
      },
      jobCards: {
        where: {
          isDeleted: false,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stations: CustomerStation[] = stationsRaw.map((s) => {
    const owner = s.users[0] ?? null;
    const activeSub = s.stationSubscriptions.find((sub) => sub.status === "ACTIVE") ?? s.stationSubscriptions[0] ?? null;

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      logoUrl: s.branding?.squareLogoUrl || null,
      status: s.status,
      phone: s.branding?.businessPhone || null,
      email: s.branding?.businessEmail || null,
      address: s.branding?.businessAddress || null,
      country: (s as any).country ?? "IN",
      createdAt: s.createdAt.toISOString(),
      owner: owner ? { id: owner.id, name: owner.name, email: owner.email ?? "" } : null,
      planName: activeSub?.subscription?.name ?? null,
      subscriptionEndDate: activeSub?.endDate ? activeSub.endDate.toISOString() : null,
      subscriptionStatus: activeSub?.status ?? null,
      todayJobCount: s.jobCards.length,
    };
  });

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Customer Stations ({stations.length})
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Manage tenant business accounts, billing lifecycles, and access status.
        </p>
      </div>

      <CustomersPanel stations={stations} />
    </div>
  );
}
