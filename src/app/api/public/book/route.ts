import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stationSlugOrId, customerName, mobile, vehicleNumber, vehicleType, serviceName, scheduledAt, notes } = body;

    if (!stationSlugOrId || !customerName || !mobile || !vehicleNumber || !scheduledAt) {
      return NextResponse.json({ error: "Missing required booking details" }, { status: 400 });
    }

    // Find the station by slug or id
    const station = await prisma.station.findFirst({
      where: {
        OR: [
          { slug: stationSlugOrId },
          { id: stationSlugOrId }
        ],
        isDeleted: false,
      },
      select: { id: true, name: true, slug: true },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found or unavailable for online bookings" }, { status: 404 });
    }

    const booking = await prisma.booking.create({
      data: {
        stationId: station.id,
        customerName: customerName.trim(),
        mobile: mobile.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType: vehicleType || "SEDAN",
        serviceName: serviceName || "Full Body Foam Wash",
        scheduledAt: new Date(scheduledAt),
        notes: notes || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      ok: true,
      booking: {
        id: booking.id,
        stationName: station.name,
        customerName: booking.customerName,
        mobile: booking.mobile,
        vehicleNumber: booking.vehicleNumber,
        vehicleType: booking.vehicleType,
        serviceName: booking.serviceName,
        scheduledAt: booking.scheduledAt.toISOString(),
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("POST /api/public/book error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
