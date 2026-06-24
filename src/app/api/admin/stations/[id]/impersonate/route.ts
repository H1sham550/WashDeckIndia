import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate original user as SUPER_ADMIN
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: stationId } = await params;

    // 2. Fetch the station
    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return NextResponse.json({ ok: false, error: "Station not found." }, { status: 404 });
    }

    // 3. Find the primary owner of this station
    const owner = await prisma.user.findFirst({
      where: {
        stationId: station.id,
        role: UserRole.OWNER,
        status: "ACTIVE",
        isDeleted: false,
      },
    });

    if (!owner) {
      return NextResponse.json(
        { ok: false, error: "No active owner user found for this station. Cannot impersonate." },
        { status: 400 }
      );
    }

    // 4. Create impersonation session cookie
    await createSession({
      id: owner.id,
      stationId: owner.stationId,
      role: owner.role,
      name: owner.name,
      email: owner.email,
      impersonatorId: session.id, // Store the admin's ID for switching back
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Impersonation error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
