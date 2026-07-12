import React from "react";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingsPanel } from "@/components/dashboard/bookings-panel";

export const metadata = {
  title: "Advance Appointments | WashDeck",
};

export default async function BookingsPage() {
  const session = await requireStationUser();
  const stationId = session.stationId || "";

  const bookings = await prisma.booking.findMany({
    where: { stationId },
    orderBy: { scheduledAt: "asc" },
  });

  // Serialize dates for client component
  const serialized = bookings.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    mobile: b.mobile,
    vehicleNumber: b.vehicleNumber,
    vehicleType: b.vehicleType,
    serviceName: b.serviceName,
    scheduledAt: b.scheduledAt.toISOString(),
    status: b.status as "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <BookingsPanel initialBookings={serialized} stationId={stationId} />
    </div>
  );
}
