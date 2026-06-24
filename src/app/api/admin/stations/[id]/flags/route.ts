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

    // 2. Fetch the old value of the feature flag for auditing (default to true)
    const existingFlag = await prisma.featureFlag.findUnique({
      where: {
        stationId_featureKey: {
          stationId,
          featureKey,
        },
      },
    });
    const oldValue = existingFlag ? existingFlag.isEnabled : true;

    // 3. Upsert the feature flag and write the audit log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const flag = await tx.featureFlag.upsert({
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

      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId,
          action: "FEATURE_FLAG_UPDATED",
          entityType: "FeatureFlag",
          entityId: flag.id,
          metadataJson: {
            station_id: stationId,
            feature_key: featureKey,
            old_value: oldValue,
            new_value: isEnabled,
            updated_by: session.name,
          },
        },
      });

      return flag;
    });

    return NextResponse.json({ ok: true, flag: result });
  } catch (error: any) {
    console.error("POST admin feature flags error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
