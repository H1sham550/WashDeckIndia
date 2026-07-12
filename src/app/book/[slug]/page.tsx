import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicBookingWizard } from "@/components/public/public-booking-wizard";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const station = await prisma.station.findFirst({
    where: { OR: [{ slug }, { id: slug }], isDeleted: false },
    select: { name: true, address: true },
  });
  return {
    title: station
      ? `Book Appointment | ${station.name}`
      : "Book Appointment | WashDeck",
    description: station
      ? `Schedule a car wash or detailing appointment at ${station.name}.`
      : "Book your service appointment online.",
  };
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { slug } = await params;

  const station = await prisma.station.findFirst({
    where: { OR: [{ slug }, { id: slug }], isDeleted: false },
    select: { id: true, name: true, slug: true, logoUrl: true, phone: true, address: true, primaryColor: true },
  });

  if (!station) return notFound();

  const rawServices = await prisma.service.findMany({
    where: { stationId: station.id, isDeleted: false },
    include: { prices: true },
    orderBy: { createdAt: "asc" },
  });

  const services = rawServices.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    prices: s.prices.map((p) => ({
      vehicleType: p.vehicleType,
      price: Number(p.price),
    })),
  }));

  return (
    <div style={{ minHeight: "100dvh", background: "white" }}>
      <PublicBookingWizard station={station} services={services} />
    </div>
  );
}
