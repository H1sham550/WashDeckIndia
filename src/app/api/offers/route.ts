import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OfferType } from "@prisma/client";
import { requireFeature } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  try {
    const stationId = await requireFeature("offers");
    const offers = await prisma.offer.findMany({
      where: {
        stationId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, offers });
  } catch (error: any) {
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const stationId = await requireFeature("offers");
    const session = await requireStationUser(); // Needed for actor user ID and role check
    if (session.role !== "OWNER") {
      return NextResponse.json({ ok: false, error: "Unauthorized access." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, targetCount, rewardDescription, type, rulesJson, selectedVehicleIds } = body;

    if (!name || !targetCount || !rewardDescription || !type) {
      return NextResponse.json({ ok: false, error: "Name, target count, reward, and type are required." }, { status: 400 });
    }

    const offer = await prisma.$transaction(async (tx) => {
      const createdOffer = await tx.offer.create({
        data: {
          stationId: session.stationId,
          name,
          description: description || null,
          type,
          targetCount: parseInt(targetCount, 10),
          rewardDescription,
          rulesJson: rulesJson || null,
          isActive: true,
        },
      });

      if (type === "SELECTED_VEHICLES" && Array.isArray(selectedVehicleIds) && selectedVehicleIds.length > 0) {
        await tx.offerVehicle.createMany({
          data: selectedVehicleIds.map((vId: string) => ({
            offerId: createdOffer.id,
            vehicleId: vId,
          })),
        });
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          stationId: session.stationId,
          action: "Offer Created",
          entityType: "Offer",
          entityId: createdOffer.id,
          newValue: { name: createdOffer.name, type: createdOffer.type },
        },
      });

      return createdOffer;
    });

    return NextResponse.json({ ok: true, offer });
  } catch (error: any) {
    console.error("POST offer error:", error);
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
