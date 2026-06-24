import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireStationUser } from "@/lib/auth";
import * as serviceService from "@/services/service-service";
import { z } from "zod";
import { VehicleType } from "@prisma/client";

const serviceSchema = z.object({
  id: z.string().optional(), // For optional updates
  name: z.string().trim().min(2, "Service name must be at least 2 characters"),
  description: z.string().trim().nullable().optional(),
  prices: z.record(
    z.nativeEnum(VehicleType),
    z.number().min(0, "Price cannot be negative")
  ),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireStationUser();
    const services = await serviceService.getStationServices(session.stationId);
    const templates = await serviceService.getStationTemplates(session.stationId);

    return NextResponse.json({ ok: true, services, templates });
  } catch (error: any) {
    console.error("GET services error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStationUser();
    if (session.role !== "OWNER") {
      return NextResponse.json({ ok: false, error: "Unauthorized access." }, { status: 403 });
    }
    const body = await request.json();

    const parsed = serviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let service;
    if (parsed.data.id) {
      service = await serviceService.updateServiceWithPrices(
        session.stationId,
        parsed.data.id,
        parsed.data
      );
    } else {
      service = await serviceService.createServiceWithPrices(session.stationId, parsed.data);
    }

    return NextResponse.json({ ok: true, service });
  } catch (error: any) {
    console.error("POST services error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireStationUser();
    if (session.role !== "OWNER") {
      return NextResponse.json({ ok: false, error: "Unauthorized access." }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing service ID." }, { status: 400 });
    }

    await serviceService.deleteService(session.stationId, id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE services error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
