import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import * as vehicleService from "@/services/vehicle-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    const { id } = await params;

    const passport = await vehicleService.getVehiclePassport(id);

    // Enforce station isolation
    if (passport.vehicle.stationId !== session.stationId) {
      return NextResponse.json({ ok: false, error: "Unauthorized access to station data." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, passport });
  } catch (error: any) {
    console.error("GET passport error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
