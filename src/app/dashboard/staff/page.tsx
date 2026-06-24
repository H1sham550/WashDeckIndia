import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StaffPanel } from "@/components/dashboard/staff-panel";
import { redirect } from "next/navigation";

export default async function StaffPage() {
  const session = await requireRole(["OWNER"]);

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
        where: { status: { in: ["ACTIVE", "GRACE"] } },
        include: { subscription: true },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });

  const activePlanName = station?.stationSubscriptions[0]?.subscription.name || "Trial Plan";
  const allowedStaff = station?.stationSubscriptions[0]?.subscription.maxStaff ?? 5;

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
