import React from "react";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InventoryPanel } from "@/components/dashboard/inventory-panel";

export const metadata = {
  title: "Station Inventory & Supplies | WashDeck",
};

export default async function InventoryPage() {
  const session = await requireStationUser();
  const stationId = session.stationId || "";

  const items = await prisma.inventoryItem.findMany({
    where: { stationId, isDeleted: false },
    orderBy: { name: "asc" },
  });

  const serialized = items.map((i) => ({
    id: i.id,
    name: i.name,
    sku: i.sku,
    category: i.category,
    quantity: Number(i.quantity),
    unit: i.unit,
    minThreshold: Number(i.minThreshold),
    costPerUnit: Number(i.costPerUnit),
    supplier: i.supplier,
    lastRestocked: i.lastRestocked ? i.lastRestocked.toISOString() : null,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <InventoryPanel initialItems={serialized} stationId={stationId} />
    </div>
  );
}
