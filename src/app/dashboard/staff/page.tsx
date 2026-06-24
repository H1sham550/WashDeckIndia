import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StaffPanel } from "@/components/dashboard/staff-panel";
import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { UpgradeLock } from "@/components/dashboard/upgrade-lock";

export default async function StaffPage() {
  const session = await requireRole(["OWNER"]);

  if (!session.stationId) {
    redirect("/login");
  }

  const enabled = await isFeatureEnabled(session.stationId, "staff");
  if (!enabled) {
    const allPlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
      include: { planFeatures: true },
    });

    const upgradePlans = allPlans
      .filter(p => p.planFeatures.some(pf => pf.featureKey === "STAFF_MANAGEMENT" && pf.enabled))
      .map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.description,
        staffLimit: p.staffLimit,
        reportLimit: p.reportLimit,
        features: p.planFeatures.map(pf => pf.featureKey),
      }));

    const station = await prisma.station.findUnique({
      where: { id: session.stationId || "" },
      include: {
        stationSubscriptions: {
          where: { status: { in: ["ACTIVE", "GRACE", "TRIAL"] } },
          include: { subscription: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });
    const currentPlanName = station?.stationSubscriptions[0]?.subscription.name || "Trial Plan";

    return (
      <UpgradeLock
        featureName="Staff Account Management & Control"
        currentPlanName={currentPlanName}
        availablePlans={upgradePlans}
        stationId={session.stationId || ""}
      />
    );
  }

  const staff = await prisma.user.findMany({
    where: {
      stationId: session.stationId || "",
      isDeleted: false,
      role: { in: ["OWNER", "STAFF"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const station = await prisma.station.findUnique({
    where: { id: session.stationId || "" },
    include: {
      stationSubscriptions: {
        where: { status: { in: ["ACTIVE", "GRACE", "TRIAL"] } },
        include: { subscription: true },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });

  const activePlanName = station?.stationSubscriptions[0]?.subscription.name || "Trial Plan";
  const allowedStaff = station?.stationSubscriptions[0]?.subscription.staffLimit ?? 5;

  const serializedStaff = staff.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    mobile: u.mobile || "",
    role: u.role,
    status: u.status,
    lastLogin: u.lastLogin ? u.lastLogin.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Staff Management</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage your wash station operators and sub-owners, configure roles, and monitor their login logs.
        </p>
      </div>
      <StaffPanel
        initialStaff={serializedStaff}
        limits={{
          planName: activePlanName,
          allowedStaff,
          usedStaff: serializedStaff.length,
        }}
      />
    </div>
  );
}
