import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NoteType } from "@prisma/client";
import { checkStationStatus } from "@/lib/subscription-guard";

const createNoteSchema = z.object({
  type: z.nativeEnum(NoteType),
  content: z.string().trim().min(1, "Note content cannot be empty"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    const { id } = await params;

    // Enforce station boundaries
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle || vehicle.stationId !== session.stationId) {
      return NextResponse.json({ ok: false, error: "Vehicle not found." }, { status: 404 });
    }

    await checkStationStatus(session.stationId);

    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const note = await prisma.vehicleNote.create({
      data: {
        vehicleId: id,
        authorId: session.id,
        type: parsed.data.type,
        content: parsed.data.content,
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json({ ok: true, note });
  } catch (error: any) {
    console.error("POST note error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
