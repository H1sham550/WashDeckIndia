import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireStationUser } from "@/lib/auth";
import * as serviceService from "@/services/service-service";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().trim().min(2, "Template name must be at least 2 characters"),
  description: z.string().trim().nullable().optional(),
  serviceIds: z.array(z.string()).min(1, "Select at least one service for the template"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireStationUser();
    if (session.role !== "OWNER") {
      return NextResponse.json({ ok: false, error: "Unauthorized access." }, { status: 403 });
    }
    const body = await request.json();

    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const template = await serviceService.createTemplate(session.stationId, parsed.data);
    return NextResponse.json({ ok: true, template });
  } catch (error: any) {
    console.error("POST templates error:", error);
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
      return NextResponse.json({ ok: false, error: "Missing template ID." }, { status: 400 });
    }

    await serviceService.deleteTemplate(session.stationId, id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE templates error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
