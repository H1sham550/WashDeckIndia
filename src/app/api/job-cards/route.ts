import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import * as jobCardService from "@/services/job-card-service";
import { z } from "zod";
import { checkStationStatus } from "@/lib/subscription-guard";

const createJobCardSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  serviceIds: z
    .array(z.string().uuid("Invalid service ID format"))
    .min(1, "Select at least one service"),
  inspectionNotes: z.string().trim().optional(),
  expectedCompletionTime: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.literal("")),
  beforePhotos: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireStationUser();
    const boardData = await jobCardService.getOperationsBoardData(session.stationId);
    return NextResponse.json({ ok: true, boardData });
  } catch (error: any) {
    console.error("GET job-cards error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStationUser();
    await checkStationStatus(session.stationId);
    const body = await request.json();

    const parsed = createJobCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const jobCard = await jobCardService.createJobCard(session.stationId, session.id, {
      vehicleId: parsed.data.vehicleId,
      serviceIds: parsed.data.serviceIds,
      inspectionNotes: parsed.data.inspectionNotes || undefined,
      expectedCompletionTime: parsed.data.expectedCompletionTime || undefined,
      beforePhotos: parsed.data.beforePhotos || [],
    });

    return NextResponse.json({ ok: true, jobCard });
  } catch (error: any) {
    console.error("POST job-cards error:", error);
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
