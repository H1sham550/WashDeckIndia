import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.impersonatorId) {
      return NextResponse.json({ ok: false, error: "No active impersonation session found." }, { status: 400 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.impersonatorId },
    });

    if (!adminUser || adminUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ ok: false, error: "Invalid admin impersonator session." }, { status: 403 });
    }

    await createSession({
      id: adminUser.id,
      stationId: "",
      role: adminUser.role,
      name: adminUser.name,
      email: adminUser.email || "",
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (session && session.impersonatorId) {
    const adminUser = await prisma.user.findUnique({
      where: { id: session.impersonatorId },
    });

    if (adminUser && adminUser.role === "SUPER_ADMIN") {
      await createSession({
        id: adminUser.id,
        stationId: "",
        role: adminUser.role,
        name: adminUser.name,
        email: adminUser.email || "",
      });
    }
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}

