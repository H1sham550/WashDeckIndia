import { redirect } from "next/navigation";
import { cache } from "react";
import type { UserRole } from "@prisma/client";
import { getSession, type SessionUser } from "@/lib/session";
import { getStationEntitlements } from "@/lib/entitlement";

export const requireUser = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
});

export const requireRole = cache(async (roles: UserRole[]) => {
  const session = await requireUser();

  if (!roles.includes(session.role)) {
    redirect(session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  }

  return session;
});

type StationSessionUser = SessionUser & {
  stationId: string;
};

export const requireStationUser = cache(async (): Promise<StationSessionUser> => {
  const session = await requireRole(["OWNER", "STAFF"]);

  if (!session.stationId) {
    redirect("/login");
  }

  // Enforce SUSPENDED station lockout using 60s in-memory cached entitlement resolver (0 DB trips)
  const entitlements = await getStationEntitlements(session.stationId);

  if (entitlements.lifecycle === "SUSPENDED") {
    redirect("/login?error=suspended");
  }

  return {
    ...session,
    stationId: session.stationId,
  };
});
