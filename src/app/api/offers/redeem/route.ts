import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redeemOfferReward } from "@/services/loyalty-service";
import { requireFeature } from "@/lib/feature-flags";
import { checkStationStatus } from "@/lib/subscription-guard";

export async function POST(request: NextRequest) {
  try {
    const stationId = await requireFeature("offers");
    await checkStationStatus(stationId);

    const session = await requireStationUser();
    const body = await request.json();
    const { progressId } = body;

    if (!progressId) {
      return NextResponse.json({ ok: false, error: "progressId is required." }, { status: 400 });
    }

    const progress = await prisma.vehicleOfferProgress.findUnique({
      where: { id: progressId },
      include: {
        vehicle: true,
        offer: true,
      },
    });

    if (!progress || progress.vehicle.stationId !== stationId) {
      return NextResponse.json({ ok: false, error: "Offer progress not found or unauthorized." }, { status: 404 });
    }

    if (!progress.rewardEarned || progress.rewardRedeemed) {
      return NextResponse.json({ ok: false, error: "No reward available to redeem." }, { status: 400 });
    }

    // Execute redemption in transaction
    await prisma.$transaction(async (tx) => {
      await redeemOfferReward(tx, progressId);

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId: stationId,
          action: "Loyalty Reward Redeemed",
          entityType: "VehicleOfferProgress",
          entityId: progressId,
          newValue: {
            vehicleNumber: progress.vehicle.vehicleNumber,
            offerName: progress.offer.name,
          },
        },
      });

      // Create a notification for the redemption
      await tx.notification.create({
        data: {
          stationId: stationId,
          title: "Loyalty Reward Redeemed",
          message: `Reward "${progress.offer.rewardDescription}" redeemed for vehicle ${progress.vehicle.vehicleNumber}.`,
          priority: "MEDIUM",
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("POST redeem reward error:", error);
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
