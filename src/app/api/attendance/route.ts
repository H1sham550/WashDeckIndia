import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculateDistanceMeters } from "@/lib/geo";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.stationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { staffId, staffName, date, status, checkIn, latitude, longitude } = body;

    if (!staffId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isOwner = session.role === "OWNER";
    // If Owner is marking attendance for another staff member or requesting manual override, bypass geofence
    const isOwnerOverride = isOwner && (body.overrideGeofence === true || staffId !== session.id);

    // Check Station GPS Geofence if configured and not overridden by owner
    const settings = await prisma.stationSettings.findUnique({
      where: { stationId: session.stationId },
    });

    let isGeofenced = true;

    if (!isOwnerOverride && settings?.latitude !== null && settings?.longitude !== null && settings?.latitude !== undefined && settings?.longitude !== undefined) {
      const allowedRadius = settings.allowedRadiusMeters || 100;

      if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        return NextResponse.json(
          { error: "GPS location access required. Please enable location permissions on your phone to clock in at the station." },
          { status: 400 }
        );
      }

      const distanceMeters = calculateDistanceMeters(
        latitude,
        longitude,
        settings.latitude,
        settings.longitude
      );

      if (distanceMeters > allowedRadius) {
        return NextResponse.json(
          {
            error: `Clock-in rejected: You are ${distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} meters`} away from the wash station (Max allowed: ${allowedRadius}m). You must be at the station to mark attendance.`,
          },
          { status: 400 }
        );
      }
    } else if (isOwnerOverride) {
      isGeofenced = false;
    }

    const log = await prisma.attendanceLog.create({
      data: {
        stationId: session.stationId,
        staffId,
        staffName: staffName || "Staff Member",
        date: date ? new Date(date) : new Date(),
        status,
        checkIn: checkIn ? new Date(checkIn) : new Date(),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        isGeofenced,
        notes: body.notes || (isOwnerOverride ? "Manual Owner Override" : null),
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
      latitude: log.latitude,
      longitude: log.longitude,
      isGeofenced: log.isGeofenced,
      notes: log.notes,
    });
  } catch (error: any) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
