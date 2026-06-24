import { NextRequest, NextResponse } from "next/server";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkStationStatus } from "@/lib/subscription-guard";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStationUser();
    await checkStationStatus(session.stationId);

    if (session.role !== "OWNER") {
      return NextResponse.json({ ok: false, error: "Only station owners can manage vehicle tags." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { tag } = body;

    if (!tag || typeof tag !== "string") {
      return NextResponse.json({ ok: false, error: "Tag is required." }, { status: 400 });
    }

    const trimmedTag = tag.trim();

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, stationId: session.stationId },
    });

    if (!vehicle) {
      return NextResponse.json({ ok: false, error: "Vehicle not found." }, { status: 404 });
    }

    // Add tag if it doesn't already exist
    const nextTags = vehicle.tags.includes(trimmedTag)
      ? vehicle.tags
      : [...vehicle.tags, trimmedTag];

    const updated = await prisma.vehicle.update({
      where: { id },
      data: { tags: nextTags },
    });

    return NextResponse.json({ ok: true, tags: updated.tags });
  } catch (error: any) {
    console.error("POST tag error:", error);
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
    const session = await requireStationUser();
    await checkStationStatus(session.stationId);

    if (session.role !== "OWNER") {
      return NextResponse.json({ ok: false, error: "Only station owners can manage vehicle tags." }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    if (!tag) {
      return NextResponse.json({ ok: false, error: "Tag parameter is required." }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, stationId: session.stationId },
    });

    if (!vehicle) {
      return NextResponse.json({ ok: false, error: "Vehicle not found." }, { status: 404 });
    }

    // Remove tag
    const nextTags = vehicle.tags.filter((t) => t !== tag);

    const updated = await prisma.vehicle.update({
      where: { id },
      data: { tags: nextTags },
    });

    return NextResponse.json({ ok: true, tags: updated.tags });
  } catch (error: any) {
    console.error("DELETE tag error:", error);
    if (error.statusCode === 403) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
