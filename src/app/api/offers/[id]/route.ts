import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireFeature } from "@/lib/feature-flags";
import { checkStationStatus } from "@/lib/subscription-guard";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stationId = await requireFeature("offers");
    await checkStationStatus(stationId);

    const session = await requireStationUser();
    if (session.role !== "OWNER") {
      return NextResponse.json({ ok: false, error: "Unauthorized access." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, targetCount, rewardDescription, isActive } = body;

    const existing = await prisma.offer.findFirst({
      where: {
        id,
        stationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Offer not found." }, { status: 404 });
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        targetCount: targetCount !== undefined ? parseInt(targetCount, 10) : undefined,
        rewardDescription: rewardDescription !== undefined ? rewardDescription : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json({ ok: true, offer });
  } catch (error: any) {
    console.error("PATCH offer error:", error);
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stationId = await requireFeature("offers");
    await checkStationStatus(stationId);

    const session = await requireStationUser();
    if (session.role !== "OWNER") {
      return NextResponse.json({ ok: false, error: "Unauthorized access." }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.offer.findFirst({
      where: {
        id,
        stationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Offer not found." }, { status: 404 });
    }

    await prisma.offer.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE offer error:", error);
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
