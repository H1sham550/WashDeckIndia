import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, "public-booking", 5, 60);
    if (rateLimit.isRateLimited) {
      return NextResponse.json(
        { error: "Too many booking requests. Please wait a minute before submitting again." },
        { status: 429 }
      );
    }
    const body = await req.json();
    const { stationSlugOrId, customerName, mobile, vehicleNumber, vehicleType, serviceName, scheduledAt, notes } = body;

    if (!stationSlugOrId || !customerName || !mobile || !vehicleNumber || !scheduledAt) {
      return NextResponse.json({ error: "Missing required booking details" }, { status: 400 });
    }

    const rawIdOrSlug = decodeURIComponent(stationSlugOrId || "").trim();
    const station = await prisma.station.findFirst({
      where: {
        OR: [
          { slug: rawIdOrSlug },
          { id: rawIdOrSlug },
          { slug: { equals: rawIdOrSlug, mode: "insensitive" } },
          { id: { equals: rawIdOrSlug, mode: "insensitive" } },
        ],
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
