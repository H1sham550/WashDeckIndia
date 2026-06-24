import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import * as vehicleService from "@/services/vehicle-service";
import { z } from "zod";
import { VehicleType } from "@prisma/client";
import { checkStationStatus } from "@/lib/subscription-guard";

const registerVehicleSchema = z.object({
  vehicleNumber: z.string().trim().min(3, "Vehicle number must be at least 3 characters"),
  vehicleType: z.nativeEnum(VehicleType),
  brand: z.string().trim().nullable().optional(),
  model: z.string().trim().nullable().optional(),
  color: z.string().trim().nullable().optional(),
  customerName: z.string().trim().min(2, "Customer name must be at least 2 characters"),
  customerMobile: z.string().trim().min(10, "Mobile number must be at least 10 digits"),
  customerEmail: z
    .string()
    .trim()
    .email("Invalid email address")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireStationUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const vehicles = await vehicleService.search(session.stationId, query);
    return NextResponse.json({ ok: true, vehicles });
  } catch (error: any) {
    console.error("GET vehicles error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStationUser();
    await checkStationStatus(session.stationId);
    const body = await request.json();

    const parsed = registerVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await vehicleService.registerVehicleAndCustomer(session.stationId, parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("POST vehicles error:", error);
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
