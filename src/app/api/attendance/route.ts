import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.stationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { staffId, staffName, date, status, checkIn } = body;

    if (!staffId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await prisma.attendanceLog.create({
      data: {
        stationId: session.stationId,
        staffId,
        staffName: staffName || "Staff Member",
        date: date ? new Date(date) : new Date(),
        status,
        checkIn: checkIn ? new Date(checkIn) : null,
      },
    });

    return NextResponse.json({
      id: log.id,
      staffId: log.staffId,
      staffName: log.staffName,
      date: log.date.toISOString(),
      status: log.status,
      checkIn: log.checkIn ? log.checkIn.toISOString() : null,
      checkOut: log.checkOut ? log.checkOut.toISOString() : null,
      notes: log.notes,
    });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
