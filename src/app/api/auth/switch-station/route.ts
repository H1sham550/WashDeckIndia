import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OWNER") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const targetStationId = searchParams.get("stationId");

    if (!targetStationId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Verify user membership in the target station
    const membership = await prisma.user.findFirst({
      where: {
        email: session.email,
        role: "OWNER",
        stationId: targetStationId,
        isDeleted: false,
      },
      select: { id: true, stationId: true },
    });

    if (!membership || !membership.stationId) {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized_station", request.url));
    }

    await createSession({
      id: membership.id,
      stationId: membership.stationId,
      role: session.role,
      name: session.name,
      email: session.email,
      isTempPassword: session.isTempPassword,
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Error switching station:", error);
    return NextResponse.redirect(new URL("/dashboard?error=switch_failed", request.url));
  }
}
