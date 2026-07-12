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
    const { customerName, mobile, vehicleNumber, vehicleType, serviceName, scheduledAt, notes } = body;

    if (!customerName || !mobile || !vehicleNumber || !scheduledAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        stationId: session.stationId,
        customerName,
        mobile,
        vehicleNumber,
        vehicleType: vehicleType || "Sedan",
        serviceName: serviceName || "Full Body Foam Wash",
        scheduledAt: new Date(scheduledAt),
        notes: notes || null,
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({
      id: booking.id,
      customerName: booking.customerName,
      mobile: booking.mobile,
      vehicleNumber: booking.vehicleNumber,
      vehicleType: booking.vehicleType,
      serviceName: booking.serviceName,
      scheduledAt: booking.scheduledAt.toISOString(),
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
