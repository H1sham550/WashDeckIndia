import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getSession, type SessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireUser();

  if (!roles.includes(session.role)) {
    redirect(session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  }

  return session;
}

type StationSessionUser = SessionUser & {
  stationId: string;
};

export async function requireStationUser(): Promise<StationSessionUser> {
  const session = await requireRole(["OWNER", "STAFF"]);

  if (!session.stationId) {
    redirect("/login");
  }

  // Enforce SUSPENDED station lockout
  const station = await prisma.station.findUnique({
    where: { id: session.stationId },
    select: { status: true },
  });

  if (station?.status === "SUSPENDED") {
    redirect("/login?error=suspended");
  }

  return {
    ...session,
    stationId: session.stationId,
  };
}
