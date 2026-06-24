import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPhotoSchema = z.object({
  url: z.string().min(1, "Invalid photo URL format"),
  type: z.enum(["BEFORE", "AFTER"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    const { id } = await params;

    // Enforce station isolation
    const job = await prisma.jobCard.findUnique({
      where: { id },
    });

    if (!job || job.stationId !== session.stationId) {
      return NextResponse.json({ ok: false, error: "Job card not found." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createPhotoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const photo = await prisma.jobPhoto.create({
      data: {
        jobCardId: id,
        url: parsed.data.url,
        type: parsed.data.type,
      },
    });

    return NextResponse.json({ ok: true, photo });
  } catch (error: any) {
    console.error("POST job-photos error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
