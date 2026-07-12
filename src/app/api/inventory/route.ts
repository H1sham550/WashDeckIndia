import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.stationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, sku, category, quantity, unit, minThreshold, costPerUnit, supplier } = body;

    if (!name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        stationId: session.stationId,
        name,
        sku: sku || null,
        category: category || "Supplies",
        quantity: quantity !== undefined ? Number(quantity) : 0,
        unit: unit || "Liters",
        minThreshold: minThreshold !== undefined ? Number(minThreshold) : 5,
        costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : 0,
        supplier: supplier || null,
        lastRestocked: new Date(),
      },
    });

    return NextResponse.json({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: Number(item.quantity),
      unit: item.unit,
      minThreshold: Number(item.minThreshold),
      costPerUnit: Number(item.costPerUnit),
      supplier: item.supplier,
      lastRestocked: item.lastRestocked ? item.lastRestocked.toISOString() : null,
    });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
