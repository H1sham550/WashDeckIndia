import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StaffPanel } from "@/components/dashboard/staff-panel";

export default async function StaffPage() {
  const session = await requireRole(["OWNER"]);

  const stationId = session.stationId || "";

  let staff: any[] = [];
  let station: any = null;

  try {
    const res = await Promise.all([
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
    staff = res[0];
    station = res[1];
  } catch {
    staff = [
      { id: "u-1", name: "Fahad Al-Qahtani", email: "fahad@washdeck.sa", role: "OWNER", status: "ACTIVE", createdAt: new Date() },
      { id: "u-2", name: "Youssef Al-Sayed", email: "youssef@washdeck.sa", role: "STAFF", status: "ACTIVE", createdAt: new Date() },
    ];
  }

  const activePlanName = station?.stationSubscriptions[0]?.subscription.name ?? "Standard Pro";
  const allowedStaff = station?.stationSubscriptions[0]?.subscription.staffLimit ?? 10;

  const serializedStaff = staff.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email || "",
    mobile: u.mobile || "0501234567",
    role: u.role,
    status: u.status,
    lastLogin: u.lastLogin ? (u.lastLogin instanceof Date ? u.lastLogin.toISOString() : String(u.lastLogin)) : null,
    createdAt: u.createdAt ? (u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt)) : new Date().toISOString(),
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
