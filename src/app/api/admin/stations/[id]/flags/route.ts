import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorize super admin session
    const session = await requireRole(["SUPER_ADMIN"]);
    const { id: stationId } = await params;

    const body = await request.json();
    const { featureKey, isEnabled } = body;

    if (!featureKey || typeof isEnabled !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "featureKey and isEnabled (boolean) are required." },
        { status: 400 }
      );
    }

    // 2. Fetch the old value of the feature override for auditing
    const existingOverride = await prisma.stationFeatureOverride.findUnique({
      where: {
        stationId_featureKey: {
          stationId,
          featureKey,
        },
      },
    });
    const oldValue = existingOverride ? String(existingOverride.isEnabled) : "not_set";

    // 3. Upsert the feature override and write the audit logs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const override = await tx.stationFeatureOverride.upsert({
        where: {
          stationId_featureKey: {
            stationId,
            featureKey,
          },
        },
        update: {
          isEnabled,
        },
        create: {
          stationId,
          featureKey,
          isEnabled,
        },
      });

      // Standard operational audit log
      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId,
          action: "FEATURE_OVERRIDE_UPDATED",
          entityType: "StationFeatureOverride",
          entityId: override.id,
          newValue: {
            station_id: stationId,
            feature_key: featureKey,
            old_value: oldValue,
            new_value: String(isEnabled),
            updated_by: session.name,
          },
        },
      });

      return override;
    });

    return NextResponse.json({ ok: true, flag: result });
  } catch (error: any) {
    console.error("POST admin feature flags error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
