import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.stationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { delta } = await req.json();
    const numDelta = Number(delta);
    if (isNaN(numDelta)) {
      return NextResponse.json({ error: "Invalid stock delta" }, { status: 400 });
    }

    // Fetch existing quantity
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, stationId: session.stationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const newQty = Math.max(0, Number(existing.quantity) + numDelta);
    const updated = await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: {
        quantity: newQty,
        lastRestocked: numDelta > 0 ? new Date() : existing.lastRestocked,
      },
    });

    return NextResponse.json({ success: true, quantity: Number(updated.quantity) });
  } catch (error) {
    console.error("PUT /api/inventory/[id]/stock error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
