import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StaffPanel } from "@/components/dashboard/staff-panel";

export default async function StaffPage() {
  const session = await requireRole(["OWNER"]);

  const stationId = session.stationId || "";

  const [staff, station] = await Promise.all([
    prisma.user.findMany({
      where: {
        stationId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.station.findUnique({
      where: { id: stationId },
      include: {
        stationSubscriptions: {
          include: {
            subscription: true,
          },
        },
      },
    }),
  ]);

  const activePlanName = station?.stationSubscriptions[0]?.subscription.name ?? "Standard";
  const allowedStaff = station?.stationSubscriptions[0]?.subscription.staffLimit ?? 5;

  const serializedStaff = staff.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email || "",
    mobile: (u as any).mobile || "",
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
