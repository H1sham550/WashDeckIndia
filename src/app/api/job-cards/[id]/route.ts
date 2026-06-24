import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import * as jobCardService from "@/services/job-card-service";
import { z } from "zod";
import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const updateJobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
  cancellationReason: z.string().trim().optional(),
  cancellationNotes: z.string().trim().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    const { id } = await params;
    const body = await request.json();

    const parsed = updateJobStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const jobCard = await jobCardService.updateStatus(
      session.stationId,
      session.id,
      id,
      parsed.data.status,
      parsed.data.status === "CANCELLED"
        ? {
            reason: parsed.data.cancellationReason || "Other",
            notes: parsed.data.cancellationNotes,
          }
        : undefined
    );

    return NextResponse.json({ ok: true, jobCard });
  } catch (error: any) {
    console.error("PATCH job-card status error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    const { id } = await params;

    const jobCard = await prisma.jobCard.findUnique({
      where: { id },
      include: {
        vehicle: true,
        customer: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        services: true,
        inspection: true,
        photos: true,
        invoice: true,
        report: true,
      },
    });

    if (!jobCard || jobCard.stationId !== session.stationId) {
      return NextResponse.json({ ok: false, error: "Job card not found." }, { status: 404 });
    }

    const timeline = await prisma.auditLog.findMany({
      where: {
        entityType: "JobCard",
        entityId: id,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ ok: true, jobCard, timeline });
  } catch (error: any) {
    console.error("GET job-card details error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
