import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.stationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checkOut } = await req.json();

    const updated = await prisma.attendanceLog.updateMany({
      where: { id: params.id, stationId: session.stationId },
      data: { checkOut: checkOut ? new Date(checkOut) : new Date() },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("PUT /api/attendance/[id]/checkout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
