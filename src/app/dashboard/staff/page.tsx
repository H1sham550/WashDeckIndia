import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StaffPanel } from "@/components/dashboard/staff-panel";
import { getCached } from "@/lib/cache";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function StaffPage() {
  const session = await requireStationUser();

  if (session.role !== "OWNER") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Store Owner Access Required</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
          Staff management and user creation are restricted to Store Owners. You are currently logged in as Staff ({session.name}).
        </p>
        <div>
          <Link href="/dashboard" className="btn btn-primary inline-flex">
            Back to Operations Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stationId = session.stationId || "";

  const { staff, station } = await getCached(`staff_page_${stationId}`, 15, async () => {
    const res = await Promise.all([
      prisma.user.findMany({
        where: { stationId, isDeleted: false },
        orderBy: { createdAt: "desc" },
      }),
      prisma.station.findUnique({
        where: { id: stationId },
        include: {
          stationSubscriptions: { include: { subscription: true } },
        },
      }),
    ]);
    return { staff: res[0], station: res[1] };
  }).catch(() => ({ staff: [], station: null }));

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
