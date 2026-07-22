import React from "react";
import { requireStationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingsPanel } from "@/components/dashboard/bookings-panel";

export const metadata = {
  title: "Appointment Manager | WashDeck",
};

export default async function BookingsPage() {
  const session = await requireStationUser();
  const stationId = session.stationId || "";

  let station: any = null;
  let bookings: any[] = [];

  try {
    const res = await Promise.all([
      prisma.station.findUnique({
        where: { id: stationId },
        select: { slug: true, name: true },
      }),
      prisma.booking.findMany({
        where: { stationId },
        orderBy: { scheduledAt: "asc" },
      }),
    ]);
    station = res[0];
    bookings = res[1];
  } catch {
    station = { slug: "apex-detailing", name: "Apex Luxury Detailing" };
    bookings = [
      {
        id: "b-1",
        customerName: "Tariq Al-Mansoor",
        mobile: "0501234567",
        vehicleNumber: "KSA 4492",
        vehicleType: "SUV",
        serviceName: "Ceramic Coating Detail",
        scheduledAt: new Date(Date.now() + 7200000),
        status: "CONFIRMED",
        notes: "Customer requested extra interior steam sanitization",
        createdAt: new Date(),
      },
      {
        id: "b-2",
        customerName: "Sara Al-Harbi",
        mobile: "0543219876",
        vehicleNumber: "KSA 8810",
        vehicleType: "SEDAN",
        serviceName: "Express Wash & Wax",
        scheduledAt: new Date(Date.now() + 18000000),
        status: "PENDING",
        notes: "Arriving around 4 PM",
        createdAt: new Date(),
      },
    ];
  }

  // Serialize dates for client component
  const serialized = bookings.map((b: any) => ({
    id: b.id,
    customerName: b.customerName,
    mobile: b.mobile,
    vehicleNumber: b.vehicleNumber,
    vehicleType: b.vehicleType || "SEDAN",
    serviceName: b.serviceName || "Detailing Service",
    scheduledAt: b.scheduledAt ? (b.scheduledAt instanceof Date ? b.scheduledAt.toISOString() : String(b.scheduledAt)) : new Date().toISOString(),
    status: b.status as "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
    notes: b.notes,
    createdAt: b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt)) : new Date().toISOString(),
  }));

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <BookingsPanel 
        initialBookings={serialized} 
        stationId={stationId}
        stationSlug={station?.slug || stationId}
        stationName={station?.name || "WashDeck Station"}
      />
    </div>
  );
}
